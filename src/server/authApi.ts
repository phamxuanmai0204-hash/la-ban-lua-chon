import type { Express, Request, Response } from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  HOMEROOM_TEACHER_USERNAME,
  formatFullNameError,
  formatPasswordError,
  formatPinError,
  formatUsernameError,
  normalizePassword,
  normalizeUsername,
  usernameKey,
  validateLoginInput,
  validateRegisterInput,
} from "../services/authValidation.ts";
import {
  DEFAULT_CLASS_ID,
  MAX_CHILDREN_PER_PARENT,
  SCHOOL_CLASSES,
  type RosterClass,
  type SchoolRoster,
} from "../data/schoolClasses.ts";
import type {
  AIMessage,
  AIModerationLog,
  AuthUser,
  LinkedChild,
  Meeting,
  RegisterAccountInput,
  Role,
  Student,
} from "../types.ts";
import { getDataDir, isCloudDatabaseEnabled } from "./db.ts";
import {
  CLASS_SETTINGS_ID,
  accountsStore,
  meetingsStore,
  messagesStore,
  moderationLogsStore,
  recordsStore,
  sessionsStore,
  settingsStore,
  type StoredAccount,
  type StoredSession,
  type StoredStudentRecord,
} from "./stores.ts";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PIN_PATTERN = /^\d{4}$/;

/**
 * Phạm vi hiện tại chỉ có MỘT lớp 9 với MỘT giáo viên chủ nhiệm duy nhất.
 * Tài khoản này được tạo sẵn mỗi lần máy chủ khởi động, không cho tự đăng ký.
 */
const HOMEROOM_TEACHER = {
  id: "homeroom-teacher-cothuy912",
  fullName: "Cô Thủy",
  username: HOMEROOM_TEACHER_USERNAME,
  password: "041126",
};

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): boolean {
  const candidate = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return (
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected)
  );
}

function toAuthUser(account: StoredAccount): AuthUser {
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
  return user;
}

/**
 * Bảo đảm luôn có đúng tài khoản giáo viên chủ nhiệm cố định CoThuy912.
 * Nếu tài khoản đã tồn tại nhưng mật khẩu/vai trò bị lệch, đưa về đúng cấu hình.
 */
async function ensureHomeroomTeacherAccount(): Promise<void> {
  let accounts = await accountsStore.read();
  let changed = false;
  const key = usernameKey(HOMEROOM_TEACHER.username);
  const existing = accounts.find((account) => account.usernameKey === key);

  if (!existing) {
    changed = true;
    const idTaken = accounts.some(
      (account) => account.id === HOMEROOM_TEACHER.id
    );
    const salt = crypto.randomBytes(16).toString("hex");
    const account: StoredAccount = {
      id: idTaken ? crypto.randomUUID() : HOMEROOM_TEACHER.id,
      fullName: HOMEROOM_TEACHER.fullName,
      role: "teacher",
      username: HOMEROOM_TEACHER.username,
      usernameKey: key,
      passwordHash: hashPassword(HOMEROOM_TEACHER.password, salt),
      salt,
      createdAt: new Date().toISOString(),
    };
    accounts = [...accounts, account];
  } else {
    const passwordMatches = verifyPassword(
      HOMEROOM_TEACHER.password,
      existing.salt,
      existing.passwordHash
    );
    if (existing.role !== "teacher" || !passwordMatches) {
      changed = true;
      const salt = crypto.randomBytes(16).toString("hex");
      const updated: StoredAccount = {
        ...existing,
        fullName: HOMEROOM_TEACHER.fullName,
        role: "teacher",
        username: HOMEROOM_TEACHER.username,
        usernameKey: key,
        salt,
        passwordHash: hashPassword(HOMEROOM_TEACHER.password, salt),
      };
      accounts = accounts.map((account) =>
        account.id === existing.id ? updated : account
      );
    }
  }

  // Mọi tài khoản học sinh của lớp đều thuộc giáo viên chủ nhiệm duy nhất.
  const needsBackfill = accounts.some(
    (account) => account.role === "student" && !account.homeroomTeacherUsername
  );
  if (needsBackfill) {
    changed = true;
    accounts = accounts.map((account) =>
      account.role === "student"
        ? {
            ...account,
            homeroomTeacherUsername: HOMEROOM_TEACHER.username,
          }
        : account
    );
  }

  if (changed) {
    await accountsStore.replace(accounts);
  }
}

/**
 * Xóa một lần toàn bộ dữ liệu học sinh của các phiên bản trước (tài khoản,
 * phiên đăng nhập, hồ sơ gửi lên) để danh sách Lớp 9 bắt đầu sạch. Marker
 * đảm bảo chỉ chạy đúng một lần, không xóa tài khoản do người dùng tạo sau đó.
 */
async function resetLegacyStudentDataOnce(): Promise<void> {
  // Dữ liệu đã nằm trên Supabase thì không bao giờ chạy lệnh dọn legacy:
  // marker lưu trên ổ đĩa tạm có thể mất và xoá nhầm tài khoản thật.
  if (isCloudDatabaseEnabled()) return;

  const dataDir = getDataDir();
  const marker = path.join(dataDir, "legacy-students-reset-v2.done");
  try {
    await fs.access(marker);
    return;
  } catch {
    // Chưa reset lần nào — tiếp tục.
  }

  try {
    await fs.mkdir(dataDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(dataDir, `backup-before-reset-${stamp}`);
    await fs.mkdir(backupDir, { recursive: true });
    await Promise.all(
      [
        path.join(dataDir, "auth-accounts.json"),
        path.join(dataDir, "auth-sessions.json"),
        path.join(dataDir, "student-records.json"),
      ].map(async (file) => {
        try {
          await fs.copyFile(file, path.join(backupDir, path.basename(file)));
        } catch {
          // File có thể chưa tồn tại.
        }
      })
    );

    const accounts = await accountsStore.read();
    const studentIds = new Set(
      accounts
        .filter((account) => account.role === "student")
        .map((account) => account.id)
    );

    const remaining = accounts.filter((account) => account.role !== "student");
    const nextAccounts = remaining.map((account) => {
      if (account.role !== "parent") return account;
      // Reset xóa toàn bộ học sinh cũ nên liên kết con (kể cả mã học sinh mẫu
      // kiểu "hs-06" của bản cũ) đều treo lơ lửng và phải bỏ.
      const linked = account.linkedChildren ?? [];
      return linked.length === 0
        ? account
        : { ...account, linkedChildren: [] };
    });
    if (JSON.stringify(nextAccounts) !== JSON.stringify(accounts)) {
      await accountsStore.replace(nextAccounts);
    }

    if (studentIds.size > 0) {
      const sessions = await sessionsStore.read();
      const nextSessions = sessions.filter(
        (session) => !studentIds.has(session.userId)
      );
      if (nextSessions.length !== sessions.length) {
        await sessionsStore.replace(nextSessions);
      }
    }

    const records = await recordsStore.read();
    if (records.length > 0) {
      await recordsStore.replace([]);
    }

    await fs.writeFile(
      marker,
      JSON.stringify(
        {
          completedAt: new Date().toISOString(),
          removedStudentAccounts: studentIds.size,
        },
        null,
        2
      ),
      "utf8"
    );
  } catch (err) {
    // Không ghi marker để lần khởi động sau thử lại.
    console.error("Không thể reset dữ liệu học sinh cũ:", err);
  }
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

async function createSession(account: StoredAccount) {
  const now = Date.now();
  const token = crypto.randomBytes(32).toString("hex");
  const sessions = (await sessionsStore.read()).filter(
    (session) => session.expiresAt > now
  );
  sessions.push({
    token,
    userId: account.id,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });
  await sessionsStore.replace(sessions);
  return { token, user: toAuthUser(account) };
}

async function findAccountByToken(token: string): Promise<StoredAccount | null> {
  const now = Date.now();
  const session = (await sessionsStore.read()).find(
    (item) => item.token === token && item.expiresAt > now
  );
  if (!session) return null;
  const account = (await accountsStore.read()).find(
    (item) => item.id === session.userId
  );
  return account ?? null;
}

function parseRegisterBody(req: Request): RegisterAccountInput {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const str = (key: string) =>
    typeof body[key] === "string" ? (body[key] as string) : "";
  return {
    fullName: str("fullName"),
    role: body.role as Role,
    username: str("username"),
    password: str("password"),
    confirmPassword: str("confirmPassword"),
    parentPin: str("parentPin") || undefined,
    childStudentId: str("childStudentId") || undefined,
    childPin: str("childPin") || undefined,
  };
}

interface ResolvedChild {
  studentId: string;
  className: string;
  displayName: string;
}

/**
 * Tìm học sinh theo mã hồ sơ. Chỉ còn học sinh có tài khoản thật ("acc:<id>").
 */
function resolveChild(
  accounts: StoredAccount[],
  studentId: string
): ResolvedChild | null {
  if (!studentId.startsWith("acc:")) return null;
  const accountId = studentId.slice("acc:".length);
  const account = accounts.find(
    (item) => item.id === accountId && item.role === "student"
  );
  if (!account) return null;
  return {
    studentId,
    className: DEFAULT_CLASS_ID,
    displayName: account.fullName,
  };
}

function verifyChildPin(
  accounts: StoredAccount[],
  child: ResolvedChild,
  pin: string
): boolean {
  if (!PIN_PATTERN.test(pin)) return false;
  if (!child.studentId.startsWith("acc:")) return false;
  const accountId = child.studentId.slice("acc:".length);
  const account = accounts.find(
    (item) => item.id === accountId && item.role === "student"
  );
  return Boolean(account?.parentPin) && account?.parentPin === pin;
}

function generateParentPin(): string {
  return String(crypto.randomInt(1000, 10000));
}

function buildRoster(accounts: StoredAccount[]): SchoolRoster {
  const classes: RosterClass[] = SCHOOL_CLASSES.map((option) => ({
    id: option.id,
    label: option.label,
    students: [],
  }));

  for (const account of accounts) {
    if (account.role !== "student") continue;
    classes[0]?.students.push({
      id: `acc:${account.id}`,
      fullName: account.fullName,
      source: "account",
    });
  }

  return { classes };
}

interface StudentAccountSummary {
  id: string;
  fullName: string;
  username: string;
  className: string;
  parentPin: string;
  createdAt: string;
  linkedParents: { id: string; fullName: string; username: string }[];
}

function toStudentAccountSummary(
  account: StoredAccount,
  accounts: StoredAccount[]
): StudentAccountSummary {
  const studentCode = `acc:${account.id}`;
  const linkedParents = accounts
    .filter(
      (item) =>
        item.role === "parent" &&
        (item.linkedChildren ?? []).some((child) => child.studentId === studentCode)
    )
    .map((parent) => ({
      id: parent.id,
      fullName: parent.fullName,
      username: parent.username,
    }));

  return {
    id: account.id,
    fullName: account.fullName,
    username: account.username,
    className: DEFAULT_CLASS_ID,
    parentPin: account.parentPin ?? "",
    createdAt: account.createdAt,
    linkedParents,
  };
}

async function requireTeacher(
  req: Request,
  res: Response
): Promise<StoredAccount | null> {
  const token = getBearerToken(req);
  const account = token ? await findAccountByToken(token) : null;
  if (!account) {
    res.status(401).json({
      error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      code: "UNAUTHORIZED",
    });
    return null;
  }
  if (account.role !== "teacher") {
    res.status(403).json({
      error: "Chỉ tài khoản Giáo viên mới quản lý được danh sách tài khoản học sinh.",
      code: "FORBIDDEN",
    });
    return null;
  }
  return account;
}

function readString(
  body: Record<string, unknown>,
  key: string
): string {
  return typeof body[key] === "string" ? (body[key] as string) : "";
}

export async function registerAuthRoutes(app: Express): Promise<void> {
  if (isCloudDatabaseEnabled()) {
    console.log(
      "[db] Đang dùng Supabase làm cơ sở dữ liệu trung tâm cho tài khoản, hành trình và lịch sử AI."
    );
  } else if (process.env.NODE_ENV === "production" && !process.env.DATA_DIR) {
    console.warn(
      `[db] Chưa cấu hình SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY. Dữ liệu đang lưu tại ${getDataDir()}; trên Render thư mục này là ổ đĩa tạm và sẽ mất khi triển khai lại. Hãy làm theo hướng dẫn trong README để bật Supabase.`
    );
  }
  await ensureHomeroomTeacherAccount();
  await resetLegacyStudentDataOnce();

  app.post("/api/auth/register", async (req, res) => {
    const input = parseRegisterBody(req);
    const trimmedInput: RegisterAccountInput = {
      ...input,
      username: normalizeUsername(input.username),
      password: normalizePassword(input.password),
      confirmPassword: normalizePassword(input.confirmPassword),
    };
    const issue = validateRegisterInput(trimmedInput);
    if (issue) {
      res.status(400).json({
        error: issue.message,
        code: "INVALID_INPUT",
        field: issue.field,
      });
      return;
    }
    if (trimmedInput.role !== "student" && trimmedInput.role !== "parent") {
      res.status(403).json({
        error:
          "Chỉ tài khoản Học sinh và Phụ huynh được tự đăng ký. Tài khoản Giáo viên chủ nhiệm do nhà trường cấp sẵn.",
        code: "ROLE_NOT_ALLOWED",
        field: "role",
      });
      return;
    }

    const username = normalizeUsername(trimmedInput.username);
    const key = usernameKey(username);
    const accounts = await accountsStore.read();
    if (accounts.some((account) => account.usernameKey === key)) {
      res.status(409).json({
        error:
          "Tên đăng nhập hoặc email này đã được đăng ký. Vui lòng chọn tên khác hoặc đăng nhập.",
        code: "USERNAME_TAKEN",
        field: "username",
      });
      return;
    }

    let className: string | undefined;
    let parentPin: string | undefined;
    let linkedChildren: LinkedChild[] | undefined;

    if (trimmedInput.role === "student") {
      className = DEFAULT_CLASS_ID;
      parentPin = generateParentPin();
    }

    if (trimmedInput.role === "parent") {
      const child = resolveChild(
        accounts,
        trimmedInput.childStudentId ?? ""
      );
      if (!child) {
        res.status(400).json({
          error:
            "Không tìm thấy học sinh này trong danh sách đã đăng ký. Vui lòng kiểm tra lại.",
          code: "CHILD_NOT_FOUND",
          field: "childStudentId",
        });
        return;
      }
      if (
        !verifyChildPin(
          accounts,
          child,
          trimmedInput.childPin?.trim() ?? ""
        )
      ) {
        res.status(403).json({
          error:
            "Mã PIN chưa đúng nên chưa thể liên kết. Vui lòng hỏi lại con mã PIN 4 số.",
          code: "INVALID_PIN",
          field: "childPin",
        });
        return;
      }
      linkedChildren = [
        { ...child, linkedAt: new Date().toISOString() },
      ];
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const account: StoredAccount = {
      id: crypto.randomUUID(),
      fullName: trimmedInput.fullName.trim(),
      role: trimmedInput.role,
      username,
      usernameKey: key,
      passwordHash: hashPassword(trimmedInput.password, salt),
      salt,
      createdAt: new Date().toISOString(),
      className,
      parentPin,
      linkedChildren,
      homeroomTeacherUsername:
        trimmedInput.role === "student" ? HOMEROOM_TEACHER.username : undefined,
    };

    await accountsStore.replace([...accounts, account]);
    const session = await createSession(account);
    res.status(201).json(session);
  });

  app.post("/api/auth/login", async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const username = normalizeUsername(
      typeof body.username === "string" ? body.username : ""
    );
    const password = typeof body.password === "string" ? body.password : "";

    const issue = validateLoginInput({ username, password });
    if (issue) {
      res.status(400).json({
        error: issue.message,
        code: "INVALID_INPUT",
        field: issue.field,
      });
      return;
    }

    const key = usernameKey(username);
    const account = (await accountsStore.read()).find(
      (item) => item.usernameKey === key
    );

    if (!account) {
      res.status(401).json({
        error:
          "Tài khoản này chưa được lưu trên máy chủ. Nếu tài khoản vừa được tạo trong lúc máy chủ khởi động lại hoặc sau khi triển khai bản mới, hãy nhờ giáo viên tạo lại tài khoản. Hãy kiểm tra thêm tên đăng nhập/email (so khớp không phân biệt chữ hoa/thường).",
        code: "ACCOUNT_NOT_FOUND",
        field: "username",
      });
      return;
    }

    const trimmedPassword = normalizePassword(password);
    const passwordMatches = Boolean(
      verifyPassword(trimmedPassword, account.salt, account.passwordHash) ||
        (trimmedPassword !== password &&
          verifyPassword(password, account.salt, account.passwordHash))
    );

    if (!passwordMatches) {
      res.status(401).json({
        error: `Mật khẩu chưa đúng cho tài khoản “${account.username}”. Mật khẩu phân biệt chữ hoa/thường — hãy nhập chính xác như lúc tạo tài khoản hoặc nhờ giáo viên đặt lại mật khẩu.`,
        code: "INVALID_CREDENTIALS",
        field: "password",
      });
      return;
    }

    const session = await createSession(account);
    res.json(session);
  });

  app.get("/api/auth/me", async (req, res) => {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({
        error: "Bạn chưa đăng nhập.",
        code: "UNAUTHORIZED",
      });
      return;
    }
    const account = await findAccountByToken(token);
    if (!account) {
      res.status(401).json({
        error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        code: "SESSION_EXPIRED",
      });
      return;
    }
    res.json({ user: toAuthUser(account) });
  });

  app.post("/api/auth/logout", async (req, res) => {
    const token = getBearerToken(req);
    if (token) {
      const now = Date.now();
      const sessions = (await sessionsStore.read()).filter(
        (item) => item.token !== token && item.expiresAt > now
      );
      await sessionsStore.replace(sessions);
    }
    res.status(204).end();
  });

  /**
   * Phụ huynh thêm một con vào tài khoản bằng mã PIN 4 số của học sinh.
   */
  app.post("/api/auth/parent-links", async (req, res) => {
    const token = getBearerToken(req);
    const account = token ? await findAccountByToken(token) : null;
    if (!account) {
      res.status(401).json({
        error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        code: "UNAUTHORIZED",
      });
      return;
    }
    if (account.role !== "parent") {
      res.status(403).json({
        error: "Chỉ tài khoản Phụ huynh mới có thể liên kết con.",
        code: "FORBIDDEN",
      });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const studentId = typeof body.studentId === "string" ? body.studentId : "";
    const pin = typeof body.pin === "string" ? body.pin.trim() : "";

    const accounts = await accountsStore.read();
    const child = resolveChild(accounts, studentId);
    if (!child) {
      res.status(400).json({
        error:
          "Không tìm thấy học sinh này trong danh sách đã đăng ký. Vui lòng kiểm tra lại.",
        code: "CHILD_NOT_FOUND",
        field: "childStudentId",
      });
      return;
    }
    if (!verifyChildPin(accounts, child, pin)) {
      res.status(403).json({
        error:
          "Mã PIN chưa đúng nên chưa thể liên kết. Vui lòng hỏi lại con mã PIN 4 số.",
        code: "INVALID_PIN",
        field: "childPin",
      });
      return;
    }

    const linked = account.linkedChildren ?? [];
    if (linked.some((item) => item.studentId === child.studentId)) {
      res.status(409).json({
        error: "Học sinh này đã được liên kết với tài khoản của bạn.",
        code: "ALREADY_LINKED",
        field: "childStudentId",
      });
      return;
    }
    if (linked.length >= MAX_CHILDREN_PER_PARENT) {
      res.status(409).json({
        error: `Mỗi tài khoản phụ huynh chỉ liên kết tối đa ${MAX_CHILDREN_PER_PARENT} con.`,
        code: "MAX_CHILDREN",
        field: "form",
      });
      return;
    }

    const updated: StoredAccount = {
      ...account,
      linkedChildren: [
        ...linked,
        { ...child, linkedAt: new Date().toISOString() },
      ],
    };
    await accountsStore.replace(
      accounts.map((item) => (item.id === updated.id ? updated : item))
    );
    res.json({ user: toAuthUser(updated) });
  });

  /**
   * Học sinh đổi mã PIN chia sẻ cho phụ huynh.
   */
  app.post("/api/auth/parent-pin", async (req, res) => {
    const token = getBearerToken(req);
    const account = token ? await findAccountByToken(token) : null;
    if (!account) {
      res.status(401).json({
        error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        code: "UNAUTHORIZED",
      });
      return;
    }
    if (account.role !== "student") {
      res.status(403).json({
        error: "Chỉ tài khoản Học sinh mới có mã PIN phụ huynh.",
        code: "FORBIDDEN",
      });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const pin = typeof body.parentPin === "string" ? body.parentPin.trim() : "";
    if (!PIN_PATTERN.test(pin)) {
      res.status(400).json({
        error: "Mã PIN phụ huynh phải gồm đúng 4 chữ số.",
        code: "INVALID_INPUT",
        field: "parentPin",
      });
      return;
    }

    const accounts = await accountsStore.read();
    const updated: StoredAccount = { ...account, parentPin: pin };
    await accountsStore.replace(
      accounts.map((item) => (item.id === updated.id ? updated : item))
    );
    res.json({ user: toAuthUser(updated) });
  });

  /**
   * Giáo viên xem danh sách tài khoản học sinh kèm mã PIN liên kết phụ huynh.
   */
  app.get("/api/school/student-accounts", async (req, res) => {
    if (!(await requireTeacher(req, res))) return;

    const accounts = await accountsStore.read();
    const studentAccounts = accounts
      .filter((account) => account.role === "student")
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"))
      .map((account) => toStudentAccountSummary(account, accounts));

    res.json({ accounts: studentAccounts });
  });

  /**
   * Giáo viên tạo tài khoản học sinh mới (lớp cố định Lớp 9, không sinh dữ liệu mẫu).
   */
  app.post("/api/school/student-accounts", async (req, res) => {
    if (!(await requireTeacher(req, res))) return;

    const body = (req.body ?? {}) as Record<string, unknown>;
    const fullName = readString(body, "fullName").trim();
    const username = normalizeUsername(readString(body, "username"));
    const password = normalizePassword(readString(body, "password"));
    const parentPin = readString(body, "parentPin").trim();

    const fullNameError = formatFullNameError(fullName);
    if (fullNameError) {
      res.status(400).json({
        error: fullNameError,
        code: "INVALID_INPUT",
        field: "fullName",
      });
      return;
    }
    const usernameError = formatUsernameError(username);
    if (usernameError) {
      res.status(400).json({
        error: usernameError,
        code: "INVALID_INPUT",
        field: "username",
      });
      return;
    }
    const passwordError = formatPasswordError(password);
    if (passwordError) {
      res.status(400).json({
        error: passwordError,
        code: "INVALID_INPUT",
        field: "password",
      });
      return;
    }
    if (parentPin) {
      const pinError = formatPinError(parentPin);
      if (pinError) {
        res.status(400).json({
          error: pinError,
          code: "INVALID_INPUT",
          field: "parentPin",
        });
        return;
      }
    }

    const accounts = await accountsStore.read();
    const key = usernameKey(username);
    if (accounts.some((account) => account.usernameKey === key)) {
      res.status(409).json({
        error:
          "Tên đăng nhập hoặc email này đã được dùng. Vui lòng chọn tên khác.",
        code: "USERNAME_TAKEN",
        field: "username",
      });
      return;
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const account: StoredAccount = {
      id: crypto.randomUUID(),
      fullName,
      role: "student",
      username,
      usernameKey: key,
      passwordHash: hashPassword(password, salt),
      salt,
      createdAt: new Date().toISOString(),
      className: DEFAULT_CLASS_ID,
      parentPin: parentPin || generateParentPin(),
      homeroomTeacherUsername: HOMEROOM_TEACHER.username,
    };

    await accountsStore.replace([...accounts, account]);
    res.status(201).json({
      account: toStudentAccountSummary(account, [...accounts, account]),
    });
  });

  /**
   * Giáo viên chỉnh sửa họ tên, tên đăng nhập, mã PIN phụ huynh hoặc đặt lại mật khẩu.
   */
  app.post("/api/school/student-accounts/:id/update", async (req, res) => {
    if (!(await requireTeacher(req, res))) return;

    const accounts = await accountsStore.read();
    const target = accounts.find(
      (account) => account.id === req.params.id && account.role === "student"
    );
    if (!target) {
      res.status(404).json({
        error: "Không tìm thấy tài khoản học sinh này.",
        code: "NOT_FOUND",
      });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const fullName = readString(body, "fullName").trim();
    const username = normalizeUsername(readString(body, "username"));
    const parentPin = readString(body, "parentPin").trim();
    const newPassword = normalizePassword(readString(body, "newPassword"));

    const fullNameError = formatFullNameError(fullName);
    if (fullNameError) {
      res.status(400).json({
        error: fullNameError,
        code: "INVALID_INPUT",
        field: "fullName",
      });
      return;
    }
    const usernameError = formatUsernameError(username);
    if (usernameError) {
      res.status(400).json({
        error: usernameError,
        code: "INVALID_INPUT",
        field: "username",
      });
      return;
    }
    if (parentPin) {
      const pinError = formatPinError(parentPin);
      if (pinError) {
        res.status(400).json({
          error: pinError,
          code: "INVALID_INPUT",
          field: "parentPin",
        });
        return;
      }
    }
    if (newPassword) {
      const passwordError = formatPasswordError(newPassword);
      if (passwordError) {
        res.status(400).json({
          error: passwordError,
          code: "INVALID_INPUT",
          field: "password",
        });
        return;
      }
    }

    const key = usernameKey(username);
    if (
      accounts.some(
        (account) => account.id !== target.id && account.usernameKey === key
      )
    ) {
      res.status(409).json({
        error:
          "Tên đăng nhập hoặc email này đã được dùng. Vui lòng chọn tên khác.",
        code: "USERNAME_TAKEN",
        field: "username",
      });
      return;
    }

    let updated: StoredAccount = {
      ...target,
      fullName,
      username,
      usernameKey: key,
      parentPin: parentPin || target.parentPin,
    };
    if (newPassword) {
      const salt = crypto.randomBytes(16).toString("hex");
      updated = {
        ...updated,
        salt,
        passwordHash: hashPassword(newPassword, salt),
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

    await accountsStore.replace(nextAccounts);

    const records = await recordsStore.read();
    if (records.some((record) => record.accountId === updated.id)) {
      await recordsStore.replace(
        records.map((record) =>
          record.accountId === updated.id
            ? {
                ...record,
                fullName: updated.fullName,
                student: { ...record.student, fullName: updated.fullName },
              }
            : record
        )
      );
    }

    if (newPassword) {
      const sessions = (await sessionsStore.read()).filter(
        (session) => session.userId !== updated.id
      );
      await sessionsStore.replace(sessions);
    }

    res.json({
      account: toStudentAccountSummary(updated, nextAccounts),
    });
  });

  /**
   * Giáo viên xóa hẳn tài khoản học sinh và gỡ liên kết phụ huynh liên quan.
   */
  app.post("/api/school/student-accounts/:id/delete", async (req, res) => {
    if (!(await requireTeacher(req, res))) return;

    const accounts = await accountsStore.read();
    const target = accounts.find(
      (account) => account.id === req.params.id && account.role === "student"
    );
    if (!target) {
      res.status(404).json({
        error: "Không tìm thấy tài khoản học sinh này.",
        code: "NOT_FOUND",
      });
      return;
    }

    const studentCode = `acc:${target.id}`;
    const nextAccounts = accounts
      .filter((account) => account.id !== target.id)
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
    await accountsStore.replace(nextAccounts);

    const sessions = (await sessionsStore.read()).filter(
      (session) => session.userId !== target.id
    );
    await sessionsStore.replace(sessions);

    const records = await recordsStore.read();
    if (records.some((record) => record.accountId === target.id)) {
      await recordsStore.replace(
        records.filter((record) => record.accountId !== target.id)
      );
    }

    await Promise.all([
      messagesStore.deleteByColumn("student_id", [studentCode]),
      moderationLogsStore.deleteByColumn("student_id", [studentCode]),
      meetingsStore.deleteByColumn("student_id", [studentCode]),
    ]);

    res.status(204).end();
  });

  /**
   * Học sinh gửi bản dữ liệu mới nhất (hồ sơ, hành trình, hồ sơ tổng hợp) về máy chủ.
   * Giáo viên chủ nhiệm luôn là CoThuy912 nên dữ liệu đi thẳng về tài khoản này.
   */
  app.post("/api/student/records", async (req, res) => {
    const token = getBearerToken(req);
    const account = token ? await findAccountByToken(token) : null;
    if (!account) {
      res.status(401).json({
        error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        code: "UNAUTHORIZED",
      });
      return;
    }
    if (account.role !== "student") {
      res.status(403).json({
        error: "Chỉ tài khoản Học sinh mới gửi được dữ liệu hành trình.",
        code: "FORBIDDEN",
      });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const student = body.student as Student | undefined;
    if (
      !student ||
      typeof student !== "object" ||
      student.id !== `acc:${account.id}`
    ) {
      res.status(400).json({
        error: "Dữ liệu học sinh không hợp lệ.",
        code: "INVALID_INPUT",
      });
      return;
    }

    const records = await recordsStore.read();
    const now = new Date().toISOString();
    const record: StoredStudentRecord = {
      studentId: student.id,
      accountId: account.id,
      fullName:
        typeof student.fullName === "string"
          ? student.fullName
          : account.fullName,
      className:
        typeof student.className === "string"
          ? student.className
          : DEFAULT_CLASS_ID,
      teacherUsername: HOMEROOM_TEACHER.username,
      updatedAt: now,
      student,
    };
    await recordsStore.replace([
      ...records.filter((item) => item.accountId !== account.id),
      record,
    ]);
    res.json({ ok: true, updatedAt: now });
  });

  /**
   * Giáo viên chủ nhiệm nhận dữ liệu học sinh do các thiết bị của học sinh gửi lên.
   */
  app.get("/api/school/student-records", async (req, res) => {
    if (!(await requireTeacher(req, res))) return;
    const records = (await recordsStore.read())
      .slice()
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"));
    res.json({ records });
  });

  /**
   * Danh sách lớp + học sinh đã đăng ký dùng cho liên kết phụ huynh (không chứa mã PIN).
   */
  app.get("/api/school/roster", async (_req, res) => {
    const accounts = await accountsStore.read();
    res.json(buildRoster(accounts));
  });

  const workspaceStudentIds = (
    account: StoredAccount,
    accounts: StoredAccount[]
  ): Set<string> => {
    if (account.role === "teacher") {
      return new Set(
        accounts
          .filter((item) => item.role === "student")
          .map((item) => `acc:${item.id}`)
      );
    }
    if (account.role === "student") {
      return new Set([`acc:${account.id}`]);
    }
    return new Set(
      (account.linkedChildren ?? []).map((child) => child.studentId)
    );
  };

  const buildWorkspaceSnapshot = async (account: StoredAccount) => {
    const accounts = await accountsStore.read();
    const allowed = workspaceStudentIds(account, accounts);
    const [records, messages, logs, meetings, settings] = await Promise.all([
      recordsStore.read(),
      messagesStore.read(),
      moderationLogsStore.read(),
      meetingsStore.read(),
      settingsStore.read(),
    ]);
    const settingsRow = settings.find((row) => row.id === CLASS_SETTINGS_ID);
    return {
      students: records
        .filter((record) => allowed.has(record.studentId))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"))
        .map((record) => record.student),
      aiMessages: messages.filter((message) =>
        allowed.has(message.studentId)
      ),
      aiModerationLogs: logs.filter((log) => allowed.has(log.studentId)),
      meetings: meetings.filter((meeting) =>
        allowed.has(meeting.studentId)
      ),
      settings: {
        requireTeacherApprovalBeforeDisplay:
          settingsRow?.requireTeacherApprovalBeforeDisplay === true,
      },
      updatedAt: new Date().toISOString(),
    };
  };

  /**
   * Tải toàn bộ dữ liệu hành trình mà tài khoản được phép xem từ cơ sở dữ liệu
   * trung tâm: học sinh chỉ thấy dữ liệu của mình, phụ huynh thấy các con đã
   * liên kết PIN, giáo viên chủ nhiệm thấy cả lớp.
   */
  app.get("/api/sync/workspace", async (req, res) => {
    const token = getBearerToken(req);
    const account = token ? await findAccountByToken(token) : null;
    if (!account) {
      res.status(401).json({
        error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        code: "UNAUTHORIZED",
      });
      return;
    }
    res.json(await buildWorkspaceSnapshot(account));
  });

  /**
   * Gửi các thay đổi mới lên cơ sở dữ liệu trung tâm. Máy chủ luôn lọc theo
   * quyền của tài khoản: học sinh chỉ ghi dữ liệu của mình; phụ huynh chỉ xác
   * nhận phiếu cam kết/biên bản họp của con; giáo viên ghi toàn bộ lớp.
   */
  app.post("/api/sync/workspace", async (req, res) => {
    const token = getBearerToken(req);
    const account = token ? await findAccountByToken(token) : null;
    if (!account) {
      res.status(401).json({
        error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        code: "UNAUTHORIZED",
      });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const accounts = await accountsStore.read();
    const allowed = workspaceStudentIds(account, accounts);
    const now = new Date().toISOString();

    const incomingStudents = Array.isArray(body.students)
      ? (body.students as Student[]).filter(
          (student) =>
            student &&
            typeof student === "object" &&
            typeof student.id === "string" &&
            allowed.has(student.id)
        )
      : [];
    const incomingMessages = Array.isArray(body.aiMessages)
      ? (body.aiMessages as AIMessage[]).filter(
          (message) =>
            message &&
            typeof message.id === "string" &&
            typeof message.studentId === "string" &&
            allowed.has(message.studentId)
        )
      : [];
    const incomingLogs = Array.isArray(body.aiModerationLogs)
      ? (body.aiModerationLogs as AIModerationLog[]).filter(
          (log) =>
            log &&
            typeof log.id === "string" &&
            typeof log.studentId === "string" &&
            allowed.has(log.studentId)
        )
      : [];
    const incomingMeetings = Array.isArray(body.meetings)
      ? (body.meetings as Meeting[]).filter(
          (meeting) =>
            meeting &&
            typeof meeting.id === "string" &&
            typeof meeting.studentId === "string" &&
            allowed.has(meeting.studentId)
        )
      : [];

    const accountById = new Map(accounts.map((item) => [item.id, item]));

    if (account.role === "parent") {
      const existingRecords = await recordsStore.read();
      const recordsToWrite: StoredStudentRecord[] = [];
      for (const student of incomingStudents) {
        const current = existingRecords.find(
          (record) => record.studentId === student.id
        );
        const parentConfirmedAt = student.commitment?.parentConfirmedAt;
        if (!current || parentConfirmedAt === undefined) continue;
        if (
          current.student.commitment?.parentConfirmedAt === parentConfirmedAt
        ) {
          continue;
        }
        recordsToWrite.push({
          ...current,
          updatedAt: now,
          student: {
            ...current.student,
            commitment: {
              ...current.student.commitment,
              parentConfirmedAt,
            },
          },
        });
      }
      if (recordsToWrite.length > 0) {
        await recordsStore.upsertMany(recordsToWrite);
      }

      const existingMeetings = await meetingsStore.read();
      const meetingsToWrite: Meeting[] = [];
      for (const meeting of incomingMeetings) {
        const current = existingMeetings.find(
          (item) => item.id === meeting.id
        );
        if (!current) continue;
        const parentConfirmed = meeting.confirmations?.parent;
        if (parentConfirmed === undefined) continue;
        if (current.confirmations?.parent === parentConfirmed) continue;
        meetingsToWrite.push({
          ...current,
          confirmations: {
            ...(current.confirmations ?? {}),
            parent: parentConfirmed,
          },
        });
      }
      await meetingsStore.upsertMany(meetingsToWrite);
    } else {
      const recordsToWrite: StoredStudentRecord[] = [];
      for (const student of incomingStudents) {
        const accountId = student.id.slice("acc:".length);
        const studentAccount = accountById.get(accountId);
        recordsToWrite.push({
          studentId: student.id,
          accountId,
          fullName:
            typeof student.fullName === "string"
              ? student.fullName
              : studentAccount?.fullName ?? "Học sinh",
          className:
            typeof student.className === "string"
              ? student.className
              : DEFAULT_CLASS_ID,
          teacherUsername: HOMEROOM_TEACHER.username,
          updatedAt: now,
          student,
        });
      }
      await recordsStore.upsertMany(recordsToWrite);

      await messagesStore.upsertMany(
        incomingMessages.map((message) => ({ ...message }))
      );
      await moderationLogsStore.upsertMany(
        incomingLogs.map((log) => ({ ...log }))
      );
      await meetingsStore.upsertMany(
        incomingMeetings.map((meeting) => ({ ...meeting }))
      );
    }

    if (account.role === "teacher" && body.settings && typeof body.settings === "object") {
      const settingsBody = body.settings as Record<string, unknown>;
      if (typeof settingsBody.requireTeacherApprovalBeforeDisplay === "boolean") {
        await settingsStore.upsertMany([
          {
            id: CLASS_SETTINGS_ID,
            requireTeacherApprovalBeforeDisplay:
              settingsBody.requireTeacherApprovalBeforeDisplay,
            updatedAt: now,
          },
        ]);
      }
    }

    res.json(await buildWorkspaceSnapshot(account));
  });

  /** Thông tin phiên bản đồng bộ để giao diện hiển thị trạng thái lưu trữ. */
  app.get("/api/sync/status", async (_req, res) => {
    res.json({
      kind: isCloudDatabaseEnabled() ? "supabase" : "json",
      serverTime: new Date().toISOString(),
      uptimeMs: Math.round(process.uptime() * 1000),
    });
  });
}
