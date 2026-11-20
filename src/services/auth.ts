import type {
  AuthSession,
  AuthUser,
  LinkedChild,
  LoginAccountInput,
  RegisterAccountInput,
  Role,
  Student,
} from "../types";
import {
  normalizeUsername,
  usernameKey,
  validateLoginInput,
  validateRegisterInput,
  type AuthField,
} from "./authValidation";
import {
  DEMO_PARENT_PIN,
  MAX_CHILDREN_PER_PARENT,
  SCHOOL_CLASSES,
  type RosterClass,
  type SchoolRoster,
  type SchoolStats,
} from "../data/schoolClasses";
import { createInitialAppState } from "../data/mockData";

const AUTH_SESSION_KEY = "la_ban_v2:auth_session";
const AUTH_ACCOUNTS_KEY = "la_ban_v2:auth_accounts";
const API_BASE = "/api/auth";
const SCHOOL_API_BASE = "/api/school";
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
    user.className = account.className;
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
  if (!(await verifyLocalPassword(account, input.password))) return null;
  return buildLocalSession(account);
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
      user.role === "parent" ||
      user.role === "school_admin") &&
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

let demoStudentsCache: Student[] | null = null;

function demoStudents(): Student[] {
  if (!demoStudentsCache) {
    demoStudentsCache = createInitialAppState().students;
  }
  return demoStudentsCache;
}

/**
 * Roster dự phòng khi không có máy chủ: học sinh mẫu + tài khoản lưu trên máy.
 */
export function buildLocalRoster(students?: Student[]): SchoolRoster {
  const source = students && students.length > 0 ? students : demoStudents();
  const classes: RosterClass[] = SCHOOL_CLASSES.map((option) => ({
    id: option.id,
    label: option.label,
    students: source
      .filter((student) => student.className === option.id)
      .map((student) => ({
        id: student.id,
        displayName: `${student.code} (${student.anonymizedLabel})`,
        source: "demo" as const,
      })),
  }));

  for (const account of readLocalAccounts()) {
    if (account.role !== "student" || !account.className) continue;
    const target = classes.find((cls) => cls.id === account.className);
    if (!target) continue;
    if (target.students.some((s) => s.id === `acc:${account.id}`)) continue;
    target.students.push({
      id: `acc:${account.id}`,
      displayName: account.fullName,
      source: "account",
    });
  }

  return { classes, demoPin: DEMO_PARENT_PIN };
}

export async function fetchSchoolRoster(
  fallbackStudents?: Student[]
): Promise<SchoolRoster> {
  if (!isOnline()) return buildLocalRoster(fallbackStudents);
  try {
    const payload = await apiRequest<SchoolRoster>("/roster", {
      method: "GET",
      base: SCHOOL_API_BASE,
    });
    if (!payload || !Array.isArray(payload.classes)) {
      return buildLocalRoster(fallbackStudents);
    }
    return payload;
  } catch {
    return buildLocalRoster(fallbackStudents);
  }
}

export async function fetchSchoolStats(): Promise<SchoolStats | null> {
  if (!isOnline()) return null;
  try {
    return await apiRequest<SchoolStats>("/stats", {
      method: "GET",
      base: SCHOOL_API_BASE,
    });
  } catch {
    return null;
  }
}

interface LocalLinkTarget {
  studentId: string;
  className: string;
  displayName: string;
}

function findLocalLinkTarget(studentId: string): LocalLinkTarget | null {
  const demo = demoStudents().find((s) => s.id === studentId);
  if (demo) {
    return {
      studentId,
      className: demo.className,
      displayName: `${demo.code} (${demo.anonymizedLabel})`,
    };
  }
  if (studentId.startsWith("acc:")) {
    const account = readLocalAccounts().find(
      (a) => a.id === studentId.slice("acc:".length) && a.role === "student"
    );
    if (account?.className) {
      return {
        studentId,
        className: account.className,
        displayName: account.fullName,
      };
    }
  }
  return null;
}

function verifyLocalLinkPin(target: LocalLinkTarget, pin: string): boolean {
  if (!PIN_PATTERN.test(pin)) return false;
  if (target.studentId.startsWith("acc:")) {
    const account = readLocalAccounts().find(
      (a) => a.id === target.studentId.slice("acc:".length)
    );
    return Boolean(account?.parentPin) && account?.parentPin === pin;
  }
  return pin === DEMO_PARENT_PIN;
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
        body: { classId: input.classId, studentId: input.studentId, pin },
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
  const issue = validateRegisterInput(input);
  if (issue) {
    throw new AuthError(issue.message, {
      code: "INVALID_INPUT",
      field: issue.field,
    });
  }

  const normalized: RegisterAccountInput = {
    ...input,
    fullName: input.fullName.trim(),
    username: normalizeUsername(input.username),
    className: input.role === "student" ? input.className : undefined,
    parentPin: input.role === "student" ? input.parentPin?.trim() : undefined,
    childClassName:
      input.role === "parent" ? input.childClassName : undefined,
    childStudentId:
      input.role === "parent" ? input.childStudentId : undefined,
    childPin: input.role === "parent" ? input.childPin?.trim() : undefined,
  };

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
      }
    }
  }

  // Accounts created while offline still work, even after the server is reachable again.
  const localSession = await tryLocalLogin(normalized);
  if (localSession) {
    saveStoredSession(localSession);
    return { session: localSession, savedOffline: true };
  }

  if (remoteRejection) {
    throw remoteRejection;
  }

  if (readLocalAccounts().length === 0) {
    throw new AuthError(
      "Không kết nối được máy chủ và thiết bị chưa lưu tài khoản nào. Vui lòng kiểm tra mạng rồi thử lại.",
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
