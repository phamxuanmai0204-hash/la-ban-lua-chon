import type {
  AuthSession,
  AuthUser,
  LinkedChild,
  LoginAccountInput,
  RegisterAccountInput,
  Role,
} from "../types";
import {
  formatFullNameError,
  formatPasswordError,
  formatPinError,
  formatUsernameError,
  normalizePassword,
  normalizeUsername,
  usernameKey,
  validateLoginInput,
  validateRegisterInput,
  type AuthField,
} from "./authValidation";
import {
  DEFAULT_CLASS_ID,
  MAX_CHILDREN_PER_PARENT,
  SCHOOL_CLASSES,
  normalizeClassId,
  type RosterClass,
  type SchoolRoster,
} from "../data/schoolClasses";

const AUTH_SESSION_KEY = "la_ban_v2:auth_session";
const AUTH_ACCOUNTS_KEY = "la_ban_v2:auth_accounts";
const API_BASE = "/api/auth";
const SCHOOL_API_BASE = "/api/school";
const STUDENT_ACCOUNTS_API_BASE = "/api/school/student-accounts";
const REQUEST_TIMEOUT_MS = 8000;
const PBKDF2_ITERATIONS = 150000;
const PIN_PATTERN = /^\d{4}$/;

interface LocalAccountRecord {
  id: string;
  fullName: string;
  role: Role;
  username: string;
  usernameKey: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  className?: string;
  parentPin?: string;
  linkedChildren?: LinkedChild[];
}

export class AuthError extends Error {
  readonly code: string;
  readonly field?: AuthField;
  readonly status?: number;

  constructor(
    message: string,
    options: { code?: string; field?: AuthField; status?: number } = {}
  ) {
    super(message);
    this.name = "AuthError";
    this.code = options.code || "AUTH_ERROR";
    this.field = options.field;
    this.status = options.status;
  }
}

class AuthNetworkError extends Error {}

export interface AuthResult {
  session: AuthSession;
  /** true when the account could not be stored on the server and is kept on this device only */
  savedOffline: boolean;
}

export interface StudentAccountLinkedParent {
  id: string;
  fullName: string;
  username: string;
}

export interface StudentAccountSummary {
  id: string;
  fullName: string;
  username: string;
  className: string;
  parentPin: string;
  createdAt: string;
  linkedParents: StudentAccountLinkedParent[];
}

export interface CreateStudentAccountInput {
  fullName: string;
  username: string;
  password: string;
  parentPin?: string;
}

export interface UpdateStudentAccountInput {
  fullName: string;
  username: string;
  parentPin?: string;
  newPassword?: string;
}

export interface StudentAccountResult {
  account: StudentAccountSummary;
  savedOffline: boolean;
}

function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateParentPin(): string {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return String(1000 + (value[0] % 9000));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  if (!crypto?.subtle) {
    throw new AuthError(
      "Trình duyệt này không hỗ trợ mã hóa mật khẩu. Vui lòng dùng Chrome, Edge, Firefox hoặc Safari bản mới.",
      { code: "CRYPTO_UNAVAILABLE" }
    );
  }
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

function readLocalAccounts(): LocalAccountRecord[] {
  try {
    const raw = localStorage.getItem(AUTH_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalAccountRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalAccounts(accounts: LocalAccountRecord[]): void {
  try {
    localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Offline mirror is best-effort only
  }
}

function updateLocalAccountExtras(user: AuthUser): void {
  const accounts = readLocalAccounts();
  if (accounts.length === 0) return;
  let changed = false;
  const next = accounts.map((account) => {
    if (account.id !== user.id && account.usernameKey !== usernameKey(user.username)) {
      return account;
    }
    changed = true;
    return {
      ...account,
      className: user.className ?? account.className,
      parentPin: user.parentPin ?? account.parentPin,
      linkedChildren: user.linkedChildren ?? account.linkedChildren,
    };
  });
  if (changed) writeLocalAccounts(next);
}

async function upsertLocalAccount(
  input: {
    fullName: string;
    role: Role;
    username: string;
    password: string;
    className?: string;
    parentPin?: string;
    linkedChildren?: LinkedChild[];
  },
  user: AuthUser
): Promise<void> {
  try {
    const salt = randomHex(16);
    const passwordHash = await hashPassword(input.password, salt);
    const record: LocalAccountRecord = {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      username: user.username,
      usernameKey: usernameKey(user.username),
      passwordHash,
      salt,
      createdAt: user.createdAt,
      className: user.className ?? input.className,
      parentPin: user.parentPin ?? input.parentPin,
      linkedChildren: user.linkedChildren ?? input.linkedChildren,
    };
    const accounts = readLocalAccounts().filter(
      (a) => a.id !== record.id && a.usernameKey !== record.usernameKey
    );
    writeLocalAccounts([...accounts, record]);
  } catch {
    // Without Web Crypto the account still works while the server is online
  }
}

async function verifyLocalPassword(
  account: LocalAccountRecord,
  password: string
): Promise<boolean> {
  const candidate = await hashPassword(password, account.salt);
  return candidate === account.passwordHash;
}

function buildLocalSession(account: LocalAccountRecord): AuthSession {
  const user: AuthUser = {
    id: account.id,
    fullName: account.fullName,
    role: account.role,
    username: account.username,
    createdAt: account.createdAt,
  };
  if (account.role === "student") {
    user.className = normalizeClassId();
    user.parentPin = account.parentPin;
  }
  if (account.role === "parent") {
    user.linkedChildren = account.linkedChildren ?? [];
  }
  return { token: `local-${randomHex(24)}`, user };
}

async function tryLocalLogin(input: LoginAccountInput): Promise<AuthSession | null> {
  const account = readLocalAccounts().find(
    (a) => a.usernameKey === usernameKey(input.username)
  );
  if (!account) return null;
  const trimmed = normalizePassword(input.password);
  if (await verifyLocalPassword(account, trimmed)) {
    return buildLocalSession(account);
  }
  // Tương thích tài khoản cũ từng lưu mật khẩu kèm khoảng trắng hai đầu.
  if (trimmed !== input.password && (await verifyLocalPassword(account, input.password))) {
    return buildLocalSession(account);
  }
  return null;
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const user = record.user as Record<string, unknown> | undefined;
  return (
    typeof record.token === "string" &&
    !!user &&
    typeof user.id === "string" &&
    typeof user.fullName === "string" &&
    typeof user.username === "string" &&
    (user.role === "student" ||
      user.role === "teacher" ||
      user.role === "parent") &&
    typeof user.createdAt === "string"
  );
}

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: AuthSession): void {
  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Session still lives in memory for this tab
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    // Ignore restricted storage
  }
}

const LEGACY_DEVICE_RESET_KEY = "la_ban_v2:legacy_students_reset_v2:device";

/**
 * Dọn một lần tài khoản học sinh cũ đã lưu trên thiết bị (bản mirror ngoại
 * tuyến) để khớp với đợt reset dữ liệu học sinh ở máy chủ. Không đụng tới tài
 * khoản giáo viên cố định và không chạy lại ở các lần mở app sau.
 */
export function resetLegacyStudentAccountsOnDevice(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(LEGACY_DEVICE_RESET_KEY)) return;
    const accounts = readLocalAccounts();
    const nextAccounts = accounts
      .filter((account) => account.role !== "student")
      .map((account) => {
        if (account.role !== "parent") return account;
        // Reset xóa toàn bộ học sinh cũ nên mọi liên kết con đều treo lơ lửng.
        const linked = account.linkedChildren ?? [];
        return linked.length === 0
          ? account
          : { ...account, linkedChildren: [] };
      });
    if (nextAccounts.length !== accounts.length) {
      writeLocalAccounts(nextAccounts);
    } else if (accounts.some((account) => (account.linkedChildren ?? []).length > 0)) {
      writeLocalAccounts(nextAccounts);
    }
    const storedSession = getStoredSession();
    if (
      storedSession?.user.role === "student" ||
      storedSession?.user.role === "parent"
    ) {
      clearStoredSession();
    }
    localStorage.setItem(LEGACY_DEVICE_RESET_KEY, new Date().toISOString());
  } catch {
    // Trình duyệt chặn localStorage — bỏ qua, lần mở sau thử lại.
  }
}

/**
 * Đồng bộ bản lưu tài khoản trên thiết bị với danh sách học sinh mới nhất từ
 * máy chủ: bỏ học sinh đã bị xóa để không đăng nhập nhầm bằng bản offline.
 */
export function pruneLocalStudentAccounts(validAccountIds: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const valid = new Set(validAccountIds);
    const accounts = readLocalAccounts();
    const kept = accounts.filter(
      (account) => account.role !== "student" || valid.has(account.id)
    );
    if (kept.length === accounts.length) return;
    writeLocalAccounts(kept);
    const storedSession = getStoredSession();
    if (storedSession?.user.role === "student" && !valid.has(storedSession.user.id)) {
      clearStoredSession();
    }
  } catch {
    // Trình duyệt chặn localStorage — bỏ qua.
  }
}

async function apiRequest<T>(
  path: string,
  options: {
    method: "GET" | "POST";
    body?: unknown;
    token?: string;
    base?: string;
  }
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${options.base ?? API_BASE}${path}`, {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new AuthNetworkError("Không kết nối được máy chủ.");
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (data && typeof data === "object" && "error" in data) {
      const payload = data as {
        error?: unknown;
        code?: unknown;
        field?: unknown;
      };
      throw new AuthError(String(payload.error), {
        code: typeof payload.code === "string" ? payload.code : "AUTH_ERROR",
        field:
          typeof payload.field === "string"
            ? (payload.field as AuthField)
            : undefined,
        status: response.status,
      });
    }
    throw new AuthNetworkError("Phản hồi máy chủ không hợp lệ.");
  }

  if (data === null) {
    throw new AuthNetworkError("Máy chủ không trả về dữ liệu đăng nhập.");
  }

  return data as T;
}

function assertSessionPayload(payload: unknown): AuthSession {
  if (!isAuthSession(payload)) {
    throw new AuthNetworkError("Dữ liệu phiên đăng nhập không hợp lệ.");
  }
  return payload;
}

/**
 * Danh sách học sinh đã đăng ký trên thiết bị này (dùng khi không có máy chủ).
 * Không còn dữ liệu mẫu: mọi học sinh đều do chính người dùng đăng ký.
 */
export function buildLocalRoster(): SchoolRoster {
  const classes: RosterClass[] = SCHOOL_CLASSES.map((option) => ({
    id: option.id,
    label: option.label,
    students: [],
  }));

  for (const account of readLocalAccounts()) {
    if (account.role !== "student") continue;
    classes[0]?.students.push({
      id: `acc:${account.id}`,
      fullName: account.fullName,
      source: "account",
    });
  }

  return { classes };
}

export async function fetchSchoolRoster(): Promise<SchoolRoster> {
  if (!isOnline()) return buildLocalRoster();
  try {
    const payload = await apiRequest<SchoolRoster>("/roster", {
      method: "GET",
      base: SCHOOL_API_BASE,
    });
    if (!payload || !Array.isArray(payload.classes)) {
      return buildLocalRoster();
    }
    return payload;
  } catch {
    return buildLocalRoster();
  }
}

function toLocalStudentAccountSummary(
  account: LocalAccountRecord,
  accounts: LocalAccountRecord[]
): StudentAccountSummary {
  const studentCode = `acc:${account.id}`;
  return {
    id: account.id,
    fullName: account.fullName,
    username: account.username,
    className: DEFAULT_CLASS_ID,
    parentPin: account.parentPin ?? "",
    createdAt: account.createdAt,
    linkedParents: accounts
      .filter(
        (item) =>
          item.role === "parent" &&
          (item.linkedChildren ?? []).some(
            (child) => child.studentId === studentCode
          )
      )
      .map((parent) => ({
        id: parent.id,
        fullName: parent.fullName,
        username: parent.username,
      })),
  };
}

function readLocalStudentAccounts(): StudentAccountSummary[] {
  const accounts = readLocalAccounts();
  return accounts
    .filter((account) => account.role === "student")
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"))
    .map((account) => toLocalStudentAccountSummary(account, accounts));
}

function assertTeacherSession(session: AuthSession): void {
  if (session.user.role !== "teacher") {
    throw new AuthError(
      "Chỉ tài khoản Giáo viên mới quản lý được danh sách tài khoản học sinh.",
      { code: "FORBIDDEN" }
    );
  }
}

function validateStudentNameAndUsername(input: {
  fullName: string;
  username: string;
}): { fullName: string; username: string } {
  const fullName = input.fullName.trim();
  const username = normalizeUsername(input.username);
  const fullNameError = formatFullNameError(fullName);
  if (fullNameError) {
    throw new AuthError(fullNameError, {
      code: "INVALID_INPUT",
      field: "fullName",
    });
  }
  const usernameError = formatUsernameError(username);
  if (usernameError) {
    throw new AuthError(usernameError, {
      code: "INVALID_INPUT",
      field: "username",
    });
  }
  return { fullName, username };
}

function validateOptionalPin(pin: string | undefined): string {
  const clean = (pin ?? "").trim();
  if (!clean) return "";
  const pinError = formatPinError(clean);
  if (pinError) {
    throw new AuthError(pinError, {
      code: "INVALID_INPUT",
      field: "parentPin",
    });
  }
  return clean;
}

function validatePassword(password: string): string {
  const normalized = normalizePassword(password);
  const passwordError = formatPasswordError(normalized);
  if (passwordError) {
    throw new AuthError(passwordError, {
      code: "INVALID_INPUT",
      field: "password",
    });
  }
  return normalized;
}

async function updateLocalStudentAccount(
  accountId: string,
  input: {
    fullName: string;
    username: string;
    parentPin?: string;
    newPassword?: string;
  }
): Promise<StudentAccountSummary | null> {
  const accounts = readLocalAccounts();
  const target = accounts.find(
    (account) => account.id === accountId && account.role === "student"
  );
  if (!target) return null;

  let updated: LocalAccountRecord = {
    ...target,
    fullName: input.fullName,
    username: input.username,
    usernameKey: usernameKey(input.username),
    parentPin: input.parentPin || target.parentPin,
  };

  if (input.newPassword) {
    const salt = randomHex(16);
    updated = {
      ...updated,
      salt,
      passwordHash: await hashPassword(input.newPassword, salt),
    };
  }

  const studentCode = `acc:${updated.id}`;
  const nextAccounts = accounts.map((account) => {
    if (account.id === updated.id) return updated;
    if (account.role === "parent") {
      const linked = account.linkedChildren ?? [];
      if (linked.some((child) => child.studentId === studentCode)) {
        return {
          ...account,
          linkedChildren: linked.map((child) =>
            child.studentId === studentCode
              ? { ...child, displayName: updated.fullName }
              : child
          ),
        };
      }
    }
    return account;
  });

  writeLocalAccounts(nextAccounts);
  return toLocalStudentAccountSummary(updated, nextAccounts);
}

function removeLocalStudentAccount(accountId: string): void {
  const accounts = readLocalAccounts();
  const studentCode = `acc:${accountId}`;
  const nextAccounts = accounts
    .filter((account) => account.id !== accountId)
    .map((account) => {
      if (account.role !== "parent") return account;
      const linked = account.linkedChildren ?? [];
      if (!linked.some((child) => child.studentId === studentCode)) {
        return account;
      }
      return {
        ...account,
        linkedChildren: linked.filter(
          (child) => child.studentId !== studentCode
        ),
      };
    });
  writeLocalAccounts(nextAccounts);
}

export async function listStudentAccounts(
  session: AuthSession
): Promise<StudentAccountSummary[]> {
  assertTeacherSession(session);

  if (isOnline() && !session.token.startsWith("local-")) {
    try {
      const payload = await apiRequest<{ accounts?: StudentAccountSummary[] }>(
        "",
        {
          method: "GET",
          token: session.token,
          base: STUDENT_ACCOUNTS_API_BASE,
        }
      );
      if (payload && Array.isArray(payload.accounts)) {
        return payload.accounts;
      }
      throw new AuthNetworkError("Danh sách tài khoản không hợp lệ.");
    } catch (err) {
      if (err instanceof AuthError) throw err;
    }
  }

  return readLocalStudentAccounts();
}

export async function createStudentAccount(
  session: AuthSession,
  input: CreateStudentAccountInput
): Promise<StudentAccountResult> {
  assertTeacherSession(session);
  const { fullName, username } = validateStudentNameAndUsername(input);
  const password = validatePassword(input.password);
  const parentPin = validateOptionalPin(input.parentPin);

  // A session restored from the device mirror never syncs by itself; creating an
  // account from it would make the student phone-only invisible to other devices.
  if (isOnline() && session.token.startsWith("local-")) {
    throw new AuthError(
      "Phiên đăng nhập của thầy/cô đang dùng bản lưu ngoại tuyến trên thiết bị này. Nếu tạo ngay, học sinh chỉ đăng nhập được trên máy tính này. Hãy đăng xuất, đăng nhập lại khi có mạng rồi tạo tài khoản để dùng được cả trên điện thoại.",
      { code: "SESSION_NOT_SYNCED", field: "form" }
    );
  }

  if (isOnline() && !session.token.startsWith("local-")) {
    try {
      const payload = await apiRequest<{ account?: StudentAccountSummary }>(
        "",
        {
          method: "POST",
          token: session.token,
          base: STUDENT_ACCOUNTS_API_BASE,
          body: { fullName, username, password, parentPin },
        }
      );
      if (payload?.account) {
        const account = payload.account;
        await upsertLocalAccount(
          {
            fullName: account.fullName,
            role: "student",
            username: account.username,
            password,
            className: account.className,
            parentPin: account.parentPin,
          },
          {
            id: account.id,
            fullName: account.fullName,
            role: "student",
            username: account.username,
            createdAt: account.createdAt,
            className: account.className,
            parentPin: account.parentPin,
          }
        );
        return { account, savedOffline: false };
      }
      throw new AuthNetworkError("Phản hồi tạo tài khoản không hợp lệ.");
    } catch (err) {
      if (err instanceof AuthError) throw err;
    }
  }

  const accounts = readLocalAccounts();
  const key = usernameKey(username);
  if (accounts.some((account) => account.usernameKey === key)) {
    throw new AuthError(
      "Tên đăng nhập hoặc email này đã được dùng trên thiết bị. Vui lòng chọn tên khác.",
      { code: "USERNAME_TAKEN", field: "username" }
    );
  }

  const salt = randomHex(16);
  const passwordHash = await hashPassword(password, salt);
  const record: LocalAccountRecord = {
    id: `local-${randomHex(12)}`,
    fullName,
    role: "student",
    username,
    usernameKey: key,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    className: DEFAULT_CLASS_ID,
    parentPin: parentPin || generateParentPin(),
  };
  const nextAccounts = [...accounts, record];
  writeLocalAccounts(nextAccounts);

  return {
    account: toLocalStudentAccountSummary(record, nextAccounts),
    savedOffline: true,
  };
}

export async function updateStudentAccount(
  session: AuthSession,
  accountId: string,
  input: UpdateStudentAccountInput
): Promise<StudentAccountResult> {
  assertTeacherSession(session);
  const { fullName, username } = validateStudentNameAndUsername(input);
  const parentPin = validateOptionalPin(input.parentPin);
  const newPassword = input.newPassword?.trim()
    ? validatePassword(input.newPassword)
    : "";

  const canUseServer =
    isOnline() &&
    !session.token.startsWith("local-") &&
    !accountId.startsWith("local-");

  if (canUseServer) {
    try {
      const payload = await apiRequest<{ account?: StudentAccountSummary }>(
        `/${encodeURIComponent(accountId)}/update`,
        {
          method: "POST",
          token: session.token,
          base: STUDENT_ACCOUNTS_API_BASE,
          body: { fullName, username, parentPin, newPassword },
        }
      );
      if (payload?.account) {
        await updateLocalStudentAccount(accountId, {
          fullName,
          username,
          parentPin,
          newPassword: newPassword || undefined,
        });
        return { account: payload.account, savedOffline: false };
      }
      throw new AuthNetworkError("Phản hồi cập nhật tài khoản không hợp lệ.");
    } catch (err) {
      if (err instanceof AuthError) throw err;
    }
  }

  const updated = await updateLocalStudentAccount(accountId, {
    fullName,
    username,
    parentPin,
    newPassword: newPassword || undefined,
  });
  if (!updated) {
    throw new AuthError(
      "Chưa kết nối được máy chủ nên không thể chỉnh sửa tài khoản này. Vui lòng kiểm tra mạng rồi thử lại.",
      { code: "AUTH_UNAVAILABLE", field: "form" }
    );
  }
  return { account: updated, savedOffline: true };
}

export async function deleteStudentAccount(
  session: AuthSession,
  accountId: string
): Promise<void> {
  assertTeacherSession(session);

  const canUseServer =
    isOnline() &&
    !session.token.startsWith("local-") &&
    !accountId.startsWith("local-");

  if (canUseServer) {
    try {
      await apiRequest(`/${encodeURIComponent(accountId)}/delete`, {
        method: "POST",
        token: session.token,
        base: STUDENT_ACCOUNTS_API_BASE,
      });
      removeLocalStudentAccount(accountId);
      return;
    } catch (err) {
      if (err instanceof AuthError) throw err;
    }
    throw new AuthError(
      "Chưa kết nối được máy chủ nên chưa thể xóa tài khoản. Vui lòng kiểm tra mạng rồi thử lại.",
      { code: "AUTH_UNAVAILABLE", field: "form" }
    );
  }

  removeLocalStudentAccount(accountId);
}

interface LocalLinkTarget {
  studentId: string;
  className: string;
  displayName: string;
}

function findLocalLinkTarget(studentId: string): LocalLinkTarget | null {
  if (studentId.startsWith("acc:")) {
    const account = readLocalAccounts().find(
      (a) => a.id === studentId.slice("acc:".length) && a.role === "student"
    );
    if (account) {
      return {
        studentId,
        className: DEFAULT_CLASS_ID,
        displayName: account.fullName,
      };
    }
  }
  return null;
}

function verifyLocalLinkPin(target: LocalLinkTarget, pin: string): boolean {
  if (!PIN_PATTERN.test(pin)) return false;
  if (!target.studentId.startsWith("acc:")) return false;
  const account = readLocalAccounts().find(
    (a) => a.id === target.studentId.slice("acc:".length)
  );
  return Boolean(account?.parentPin) && account?.parentPin === pin;
}

/**
 * Liên kết thêm một con vào tài khoản phụ huynh, xác thực bằng mã PIN 4 số của con.
 */
export async function addParentLink(
  session: AuthSession,
  input: { classId: string; studentId: string; pin: string }
): Promise<AuthResult> {
  if (session.user.role !== "parent") {
    throw new AuthError("Chỉ tài khoản Phụ huynh mới có thể liên kết con.", {
      code: "FORBIDDEN",
    });
  }
  const pin = input.pin.trim();
  if (!PIN_PATTERN.test(pin)) {
    throw new AuthError("Mã PIN của con phải gồm đúng 4 chữ số.", {
      code: "INVALID_INPUT",
      field: "childPin",
    });
  }
  const existing = session.user.linkedChildren ?? [];
  if (existing.some((child) => child.studentId === input.studentId)) {
    throw new AuthError(
      "Học sinh này đã được liên kết với tài khoản của bạn.",
      { code: "ALREADY_LINKED", field: "childStudentId" }
    );
  }
  if (existing.length >= MAX_CHILDREN_PER_PARENT) {
    throw new AuthError(
      `Mỗi tài khoản phụ huynh chỉ liên kết tối đa ${MAX_CHILDREN_PER_PARENT} con.`,
      { code: "MAX_CHILDREN", field: "form" }
    );
  }

  if (!session.token.startsWith("local-") && isOnline()) {
    try {
      const payload = await apiRequest<{ user?: AuthUser }>("/parent-links", {
        method: "POST",
        token: session.token,
        body: { classId: normalizeClassId(), studentId: input.studentId, pin },
      });
      if (payload?.user && isAuthSession({ token: session.token, user: payload.user })) {
        const next: AuthSession = { token: session.token, user: payload.user };
        saveStoredSession(next);
        updateLocalAccountExtras(payload.user);
        return { session: next, savedOffline: false };
      }
      throw new AuthNetworkError("Phản hồi liên kết không hợp lệ.");
    } catch (err) {
      if (err instanceof AuthError) throw err;
      // Mất mạng giữa chừng: thử xác thực bằng bản lưu trên thiết bị.
    }
  }

  const target = findLocalLinkTarget(input.studentId);
  if (!target) {
    throw new AuthError(
      "Không xác thực được mã PIN khi ngoại tuyến. Vui lòng kết nối mạng rồi thử lại.",
      { code: "AUTH_UNAVAILABLE", field: "form" }
    );
  }
  if (!verifyLocalLinkPin(target, pin)) {
    throw new AuthError(
      "Mã PIN chưa đúng nên chưa thể liên kết. Vui lòng hỏi lại con mã PIN 4 số.",
      { code: "INVALID_PIN", field: "childPin" }
    );
  }

  const link: LinkedChild = { ...target, linkedAt: new Date().toISOString() };
  const nextUser: AuthUser = {
    ...session.user,
    linkedChildren: [...existing, link],
  };
  const next: AuthSession = { token: session.token, user: nextUser };
  saveStoredSession(next);
  updateLocalAccountExtras(nextUser);
  return { session: next, savedOffline: true };
}

/**
 * Học sinh đổi mã PIN chia sẻ cho phụ huynh.
 */
export async function changeParentPin(
  session: AuthSession,
  newPin: string
): Promise<AuthResult> {
  if (session.user.role !== "student") {
    throw new AuthError("Chỉ tài khoản Học sinh mới có mã PIN phụ huynh.", {
      code: "FORBIDDEN",
    });
  }
  const pin = newPin.trim();
  if (!PIN_PATTERN.test(pin)) {
    throw new AuthError("Mã PIN phụ huynh phải gồm đúng 4 chữ số.", {
      code: "INVALID_INPUT",
      field: "parentPin",
    });
  }

  if (!session.token.startsWith("local-") && isOnline()) {
    try {
      const payload = await apiRequest<{ user?: AuthUser }>("/parent-pin", {
        method: "POST",
        token: session.token,
        body: { parentPin: pin },
      });
      if (payload?.user && isAuthSession({ token: session.token, user: payload.user })) {
        const next: AuthSession = { token: session.token, user: payload.user };
        saveStoredSession(next);
        updateLocalAccountExtras(payload.user);
        return { session: next, savedOffline: false };
      }
      throw new AuthNetworkError("Phản hồi đổi PIN không hợp lệ.");
    } catch (err) {
      if (err instanceof AuthError) throw err;
    }
  }

  const local = readLocalAccounts().find((a) => a.id === session.user.id);
  const nextUser: AuthUser = { ...session.user, parentPin: pin };
  const next: AuthSession = { token: session.token, user: nextUser };
  saveStoredSession(next);
  if (local) updateLocalAccountExtras(nextUser);
  return { session: next, savedOffline: Boolean(local) };
}

export async function registerAccount(
  input: RegisterAccountInput
): Promise<AuthResult> {
  const normalized: RegisterAccountInput = {
    ...input,
    fullName: input.fullName.trim(),
    username: normalizeUsername(input.username),
    password: normalizePassword(input.password),
    confirmPassword: normalizePassword(input.confirmPassword),
    className: input.role === "student" ? normalizeClassId() : undefined,
    parentPin: input.role === "student" ? input.parentPin?.trim() : undefined,
    childStudentId:
      input.role === "parent" ? input.childStudentId : undefined,
    childPin: input.role === "parent" ? input.childPin?.trim() : undefined,
  };

  const issue = validateRegisterInput(normalized);
  if (issue) {
    throw new AuthError(issue.message, {
      code: "INVALID_INPUT",
      field: issue.field,
    });
  }

  try {
    const payload = await apiRequest<unknown>("/register", {
      method: "POST",
      body: normalized,
    });
    const session = assertSessionPayload(payload);
    await upsertLocalAccount(
      {
        fullName: session.user.fullName,
        role: session.user.role,
        username: session.user.username,
        password: normalized.password,
        className: session.user.className,
        parentPin: session.user.parentPin,
        linkedChildren: session.user.linkedChildren,
      },
      session.user
    );
    saveStoredSession(session);
    return { session, savedOffline: false };
  } catch (err) {
    if (err instanceof AuthError) throw err;
  }

  const accounts = readLocalAccounts();
  if (
    accounts.some((a) => a.usernameKey === usernameKey(normalized.username))
  ) {
    throw new AuthError(
      "Tên đăng nhập hoặc email này đã được dùng trên thiết bị. Vui lòng chọn tên khác.",
      { code: "USERNAME_TAKEN", field: "username" }
    );
  }

  const salt = randomHex(16);
  const passwordHash = await hashPassword(normalized.password, salt);
  const createdAt = new Date().toISOString();
  const id = `local-${randomHex(12)}`;

  let linkedChildren: LinkedChild[] | undefined;
  if (normalized.role === "parent") {
    const target = findLocalLinkTarget(normalized.childStudentId ?? "");
    if (!target) {
      throw new AuthError(
        "Không xác thực được mã PIN khi ngoại tuyến. Vui lòng kết nối mạng rồi thử lại.",
        { code: "AUTH_UNAVAILABLE", field: "form" }
      );
    }
    if (!verifyLocalLinkPin(target, normalized.childPin ?? "")) {
      throw new AuthError(
        "Mã PIN chưa đúng nên chưa thể liên kết. Vui lòng hỏi lại con mã PIN 4 số.",
        { code: "INVALID_PIN", field: "childPin" }
      );
    }
    linkedChildren = [{ ...target, linkedAt: createdAt }];
  }

  const account: LocalAccountRecord = {
    id,
    fullName: normalized.fullName,
    role: normalized.role,
    username: normalized.username,
    usernameKey: usernameKey(normalized.username),
    passwordHash,
    salt,
    createdAt,
    className: normalized.className,
    parentPin:
      normalized.role === "student"
        ? normalized.parentPin || generateParentPin()
        : undefined,
    linkedChildren,
  };
  writeLocalAccounts([...accounts, account]);

  const session = buildLocalSession(account);
  saveStoredSession(session);
  return { session, savedOffline: true };
}

export async function loginAccount(
  input: LoginAccountInput
): Promise<AuthResult> {
  const issue = validateLoginInput(input);
  if (issue) {
    throw new AuthError(issue.message, {
      code: "INVALID_INPUT",
      field: issue.field,
    });
  }

  const normalized: LoginAccountInput = {
    username: normalizeUsername(input.username),
    password: input.password,
  };

  let remoteRejection: AuthError | null = null;
  let networkError = !isOnline();

  if (isOnline()) {
    try {
      const payload = await apiRequest<unknown>("/login", {
        method: "POST",
        body: normalized,
      });
      const session = assertSessionPayload(payload);
      await upsertLocalAccount(
        {
          fullName: session.user.fullName,
          role: session.user.role,
          username: session.user.username,
          password: normalized.password,
          className: session.user.className,
          parentPin: session.user.parentPin,
          linkedChildren: session.user.linkedChildren,
        },
        session.user
      );
      saveStoredSession(session);
      return { session, savedOffline: false };
    } catch (err) {
      if (err instanceof AuthError) {
        remoteRejection = err;
      } else {
        networkError = true;
      }
    }
  }

  // Accounts created while offline still work, even after the server is reachable again.
  const localSession = await tryLocalLogin(normalized);
  if (localSession) {
    saveStoredSession(localSession);
    return { session: localSession, savedOffline: true };
  }

  const localAccounts = readLocalAccounts();
  const displayUsername = normalized.username;
  const hasLocalUsername = localAccounts.some(
    (account) => account.usernameKey === usernameKey(displayUsername)
  );

  if (remoteRejection) {
    if (remoteRejection.code === "ACCOUNT_NOT_FOUND") {
      throw new AuthError(
        hasLocalUsername
          ? `Tài khoản “${displayUsername}” chưa có trên máy chủ nhưng có bản lưu trên thiết bị này. Tài khoản trên máy chủ có thể đã bị mất sau một lần khởi động lại/triển khai mới — hãy nhờ giáo viên tạo lại để đăng nhập được trên thiết bị khác.`
          : `Tài khoản “${displayUsername}” chưa được lưu trên máy chủ lẫn thiết bị này. Hãy kiểm tra lại tên đăng nhập/email (không phân biệt chữ hoa/thường), hoặc nhờ giáo viên kiểm tra và tạo lại tài khoản.`,
        { code: "ACCOUNT_NOT_FOUND", field: "username" }
      );
    }
    if (remoteRejection.code === "INVALID_CREDENTIALS") {
      throw new AuthError(
        hasLocalUsername
          ? `Mật khẩu chưa đúng cho tài khoản “${displayUsername}” (cả trên máy chủ và bản lưu trên thiết bị). Mật khẩu phân biệt chữ hoa/thường và không tính khoảng trắng hai đầu.`
          : `Mật khẩu chưa đúng cho tài khoản “${displayUsername}”. Mật khẩu phân biệt chữ hoa/thường; nếu nhập trên điện thoại, hãy kiểm tra bàn phím có tự viết hoa kí tự đầu không, hoặc nhờ giáo viên đặt lại mật khẩu.`,
        { code: "INVALID_CREDENTIALS", field: "password" }
      );
    }
    throw remoteRejection;
  }

  if (networkError) {
    if (localAccounts.length === 0) {
      throw new AuthError(
        "Không kết nối được máy chủ và thiết bị này chưa lưu tài khoản nào. Hãy kiểm tra Wi‑Fi/4G rồi thử lại.",
        { code: "AUTH_UNAVAILABLE", field: "form" }
      );
    }
    if (hasLocalUsername) {
      throw new AuthError(
        `Mật khẩu không khớp với bản lưu trên thiết bị cho tài khoản “${displayUsername}”. Hãy kiểm tra chữ hoa/thường và khoảng trắng, hoặc kết nối mạng để máy chủ kiểm tra lại.`,
        { code: "INVALID_CREDENTIALS", field: "password" }
      );
    }
    throw new AuthError(
      `Không kết nối được máy chủ nên chưa thể đăng nhập tài khoản “${displayUsername}”. Tài khoản này chưa được lưu trên thiết bị này — hãy kiểm tra mạng, hoặc đăng nhập trên thiết bị đã tạo tài khoản để kiểm tra.`,
      { code: "AUTH_UNAVAILABLE", field: "form" }
    );
  }

  throw new AuthError("Tên đăng nhập hoặc mật khẩu không đúng.", {
    code: "INVALID_CREDENTIALS",
    field: "form",
  });
}

export async function logoutAccount(session: AuthSession | null): Promise<void> {
  clearStoredSession();
  if (!session || session.token.startsWith("local-") || !isOnline()) {
    return;
  }
  try {
    await apiRequest("/logout", {
      method: "POST",
      token: session.token,
    });
  } catch {
    // Signing out locally is enough when the server is unreachable
  }
}

export type StoredSessionState = "valid" | "invalid" | "unreachable";

export async function validateStoredSession(
  session: AuthSession
): Promise<StoredSessionState> {
  if (session.token.startsWith("local-")) {
    return "valid";
  }
  if (!isOnline()) {
    return "unreachable";
  }
  try {
    const payload = await apiRequest<{ user?: AuthUser }>("/me", {
      method: "GET",
      token: session.token,
    });
    if (isAuthSession({ token: session.token, user: payload.user })) {
      saveStoredSession({ token: session.token, user: payload.user! });
      return "valid";
    }
    return "invalid";
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) {
      return "invalid";
    }
    return "unreachable";
  }
}
