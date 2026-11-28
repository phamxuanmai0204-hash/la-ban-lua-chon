import type {
  AIMessage,
  AIModerationLog,
  AuthSession,
  Meeting,
  Student,
} from "../types";

const SYNC_API = "/api/sync";
const REQUEST_TIMEOUT_MS = 10000;

export interface WorkspaceSnapshot {
  students: Student[];
  aiMessages: AIMessage[];
  aiModerationLogs: AIModerationLog[];
  meetings: Meeting[];
  settings?: {
    requireTeacherApprovalBeforeDisplay?: boolean;
  };
  updatedAt?: string;
}

export interface WorkspaceDelta {
  students?: Student[];
  aiMessages?: AIMessage[];
  aiModerationLogs?: AIModerationLog[];
  meetings?: Meeting[];
  settings?: {
    requireTeacherApprovalBeforeDisplay?: boolean;
  };
}

export type CloudStorageKind = "supabase" | "json";

function canSync(session: AuthSession | null): session is AuthSession {
  return Boolean(session) && !session!.token.startsWith("local-");
}

async function request<T>(
  path: string,
  session: AuthSession,
  init: RequestInit
): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${SYNC_API}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
        ...(init.headers ?? {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function pullWorkspace(
  session: AuthSession | null
): Promise<WorkspaceSnapshot | null> {
  if (!canSync(session)) return null;
  const payload = await request<WorkspaceSnapshot>("/workspace", session, {
    method: "GET",
  });
  if (!payload || !Array.isArray(payload.students)) return null;
  return {
    students: payload.students,
    aiMessages: Array.isArray(payload.aiMessages) ? payload.aiMessages : [],
    aiModerationLogs: Array.isArray(payload.aiModerationLogs)
      ? payload.aiModerationLogs
      : [],
    meetings: Array.isArray(payload.meetings) ? payload.meetings : [],
    settings: payload.settings,
    updatedAt: payload.updatedAt,
  };
}

export async function pushWorkspace(
  session: AuthSession | null,
  delta: WorkspaceDelta
): Promise<WorkspaceSnapshot | null> {
  if (!canSync(session)) return null;
  const payload = await request<WorkspaceSnapshot>("/workspace", session, {
    method: "POST",
    body: JSON.stringify(delta),
  });
  if (!payload || !Array.isArray(payload.students)) return null;
  return {
    students: payload.students,
    aiMessages: Array.isArray(payload.aiMessages) ? payload.aiMessages : [],
    aiModerationLogs: Array.isArray(payload.aiModerationLogs)
      ? payload.aiModerationLogs
      : [],
    meetings: Array.isArray(payload.meetings) ? payload.meetings : [],
    settings: payload.settings,
    updatedAt: payload.updatedAt,
  };
}

export async function fetchCloudStorageKind(): Promise<CloudStorageKind | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(`${SYNC_API}/status`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { kind?: unknown };
      return data.kind === "supabase" || data.kind === "json"
        ? data.kind
        : null;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
}