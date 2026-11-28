import type {
  AIMessage,
  AIModerationLog,
  LinkedChild,
  Meeting,
  Role,
  Student,
} from "../types.ts";
import { RowStore, type RowCodec } from "./db.ts";

export interface StoredAccount {
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
  /** Giáo viên chủ nhiệm được liên kết tự động (luôn là CoThuy912). */
  homeroomTeacherUsername?: string;
}

export interface StoredSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

/** Bản dữ liệu học sinh do chính thiết bị của em gửi lên cho giáo viên chủ nhiệm. */
export interface StoredStudentRecord {
  studentId: string;
  accountId: string;
  fullName: string;
  className: string;
  teacherUsername: string;
  updatedAt: string;
  student: Student;
}

export interface StoredSetting {
  id: string;
  requireTeacherApprovalBeforeDisplay: boolean;
  updatedAt: string;
}

export const CLASS_SETTINGS_ID = "class-9";

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function optionalStr(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function num(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return fallback;
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

const accountsCodec: RowCodec<StoredAccount> = {
  table: "auth_accounts",
  idColumn: "id",
  idOf: (account) => account.id,
  toRow: (account) => ({
    id: account.id,
    full_name: account.fullName,
    role: account.role,
    username: account.username,
    username_key: account.usernameKey,
    password_hash: account.passwordHash,
    salt: account.salt,
    created_at: account.createdAt,
    class_name: account.className ?? null,
    parent_pin: account.parentPin ?? null,
    linked_children: account.linkedChildren ?? [],
    homeroom_teacher_username: account.homeroomTeacherUsername ?? null,
  }),
  fromRow: (row) => ({
    id: str(row.id),
    fullName: str(row.full_name ?? row.fullName),
    role: str(row.role) as Role,
    username: str(row.username),
    usernameKey: str(row.username_key ?? row.usernameKey),
    passwordHash: str(row.password_hash ?? row.passwordHash),
    salt: str(row.salt),
    createdAt: str(row.created_at ?? row.createdAt),
    className: optionalStr(row.class_name ?? row.className),
    parentPin: optionalStr(row.parent_pin ?? row.parentPin),
    linkedChildren: Array.isArray(row.linked_children ?? row.linkedChildren)
      ? ((row.linked_children ?? row.linkedChildren) as LinkedChild[])
      : [],
    homeroomTeacherUsername: optionalStr(
      row.homeroom_teacher_username ?? row.homeroomTeacherUsername
    ),
  }),
};

const sessionsCodec: RowCodec<StoredSession> = {
  table: "auth_sessions",
  idColumn: "token",
  idOf: (session) => session.token,
  toRow: (session) => ({
    token: session.token,
    user_id: session.userId,
    created_at: session.createdAt,
    expires_at: session.expiresAt,
  }),
  fromRow: (row) => ({
    token: str(row.token),
    userId: str(row.user_id ?? row.userId),
    createdAt: num(row.created_at ?? row.createdAt),
    expiresAt: num(row.expires_at ?? row.expiresAt),
  }),
};

const recordsCodec: RowCodec<StoredStudentRecord> = {
  table: "student_records",
  idColumn: "student_id",
  idOf: (record) => record.studentId,
  toRow: (record) => ({
    student_id: record.studentId,
    account_id: record.accountId,
    full_name: record.fullName,
    class_name: record.className,
    teacher_username: record.teacherUsername,
    updated_at: record.updatedAt,
    student: record.student,
  }),
  fromRow: (row) => ({
    studentId: str(row.student_id ?? row.studentId),
    accountId: str(row.account_id ?? row.accountId),
    fullName: str(row.full_name ?? row.fullName),
    className: str(row.class_name ?? row.className),
    teacherUsername: str(row.teacher_username ?? row.teacherUsername),
    updatedAt: str(row.updated_at ?? row.updatedAt),
    student: recordValue(row.student) as unknown as Student,
  }),
};

function payloadCodec<T extends { id: string; studentId: string }>(
  table: string,
  idColumn: string
): RowCodec<T> {
  return {
    table,
    idColumn,
    idOf: (item) => item.id,
    toRow: (item) => ({
      id: item.id,
      student_id: item.studentId,
      payload: item,
      updated_at: new Date().toISOString(),
    }),
    fromRow: (row) => {
      const payload = recordValue(row.payload);
      return {
        ...(payload as T),
        id: str(payload.id, str(row.id)),
        studentId: str(payload.studentId, str(row.student_id)),
      } as T;
    },
  };
}

const settingsCodec: RowCodec<StoredSetting> = {
  table: "class_settings",
  idColumn: "id",
  idOf: (setting) => setting.id,
  toRow: (setting) => ({
    id: setting.id,
    payload: {
      requireTeacherApprovalBeforeDisplay:
        setting.requireTeacherApprovalBeforeDisplay,
    },
    updated_at: setting.updatedAt,
  }),
  fromRow: (row) => {
    const payload = recordValue(row.payload);
    return {
      id: str(row.id, CLASS_SETTINGS_ID),
      requireTeacherApprovalBeforeDisplay:
        payload.requireTeacherApprovalBeforeDisplay === true,
      updatedAt: str(row.updated_at ?? row.updatedAt),
    };
  },
};

export const accountsStore = new RowStore<StoredAccount>(accountsCodec);
export const sessionsStore = new RowStore<StoredSession>(sessionsCodec);
export const recordsStore = new RowStore<StoredStudentRecord>(recordsCodec);
export const messagesStore = new RowStore<AIMessage>(
  payloadCodec<AIMessage>("ai_messages", "id")
);
export const moderationLogsStore = new RowStore<AIModerationLog>(
  payloadCodec<AIModerationLog>("ai_moderation_logs", "id")
);
export const meetingsStore = new RowStore<Meeting>(
  payloadCodec<Meeting>("meetings", "id")
);
export const settingsStore = new RowStore<StoredSetting>(settingsCodec);