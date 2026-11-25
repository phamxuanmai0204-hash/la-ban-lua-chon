import type { Express, Request } from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
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
  AuthUser,
  LinkedChild,
  RegisterAccountInput,
  Role,
} from "../types.ts";

const DATA_DIR = path.join(process.cwd(), ".data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "auth-accounts.json");
const SESSIONS_FILE = path.join(DATA_DIR, "auth-sessions.json");
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PIN_PATTERN = /^\d{4}$/;

interface StoredAccount {
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

interface StoredSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Small JSON-file collection so accounts survive server restarts today and can
 * be swapped for a real database later without touching the HTTP layer.
 */
class JsonCollection<T> {
  private data: T[] | null = null;
  private loading: Promise<T[]> | null = null;
  private queue: Promise<void> = Promise.resolve();
  private readonly file: string;

  constructor(file: string) {
    this.file = file;
  }

  async read(): Promise<T[]> {
    if (this.data) return this.data;
    if (!this.loading) {
      this.loading = (async () => {
        try {
          const raw = await fs.readFile(this.file, "utf8");
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? (parsed as T[]) : [];
        } catch {
          return [];
        }
      })().then((list) => {
        this.data = list;
        return list;
      });
    }
    return this.loading;
  }

  async replace(list: T[]): Promise<void> {
    this.data = list;
    this.queue = this.queue
      .then(async () => {
        await fs.mkdir(path.dirname(this.file), { recursive: true });
        await fs.writeFile(this.file, JSON.stringify(list, null, 2), "utf8");
      })
      .catch((err) => {
        console.error(`Không ghi được dữ liệu xác thực (${this.file}):`, err);
      });
    return this.queue;
  }
}

const accountsStore = new JsonCollection<StoredAccount>(ACCOUNTS_FILE);
const sessionsStore = new JsonCollection<StoredSession>(SESSIONS_FILE);

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

export function registerAuthRoutes(app: Express): void {
  app.post("/api/auth/register", async (req, res) => {
    const input = parseRegisterBody(req);
    const issue = validateRegisterInput(input);
    if (issue) {
      res.status(400).json({
        error: issue.message,
        code: "INVALID_INPUT",
        field: issue.field,
      });
      return;
    }

    const username = normalizeUsername(input.username);
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

    if (input.role === "student") {
      className = DEFAULT_CLASS_ID;
      parentPin = generateParentPin();
    }

    if (input.role === "parent") {
      const child = resolveChild(accounts, input.childStudentId ?? "");
      if (!child) {
        res.status(400).json({
          error:
            "Không tìm thấy học sinh này trong danh sách đã đăng ký. Vui lòng kiểm tra lại.",
          code: "CHILD_NOT_FOUND",
          field: "childStudentId",
        });
        return;
      }
      if (!verifyChildPin(accounts, child, input.childPin?.trim() ?? "")) {
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
      fullName: input.fullName.trim(),
      role: input.role,
      username,
      usernameKey: key,
      passwordHash: hashPassword(input.password, salt),
      salt,
      createdAt: new Date().toISOString(),
      className,
      parentPin,
      linkedChildren,
    };

    await accountsStore.replace([...accounts, account]);
    const session = await createSession(account);
    res.status(201).json(session);
  });

  app.post("/api/auth/login", async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const username = typeof body.username === "string" ? body.username : "";
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

    if (
      !account ||
      !verifyPassword(password, account.salt, account.passwordHash)
    ) {
      res.status(401).json({
        error: "Tên đăng nhập hoặc mật khẩu không đúng.",
        code: "INVALID_CREDENTIALS",
        field: "form",
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
   * Danh sách lớp + học sinh đã đăng ký dùng cho liên kết phụ huynh (không chứa mã PIN).
   */
  app.get("/api/school/roster", async (_req, res) => {
    const accounts = await accountsStore.read();
    res.json(buildRoster(accounts));
  });
}
