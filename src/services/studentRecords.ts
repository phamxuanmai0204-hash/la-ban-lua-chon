import type { AuthSession, Student } from "../types";

const STUDENT_RECORDS_API = "/api/student/records";
const TEACHER_RECORDS_API = "/api/school/student-records";
const REQUEST_TIMEOUT_MS = 8000;

export interface StudentRecord {
  studentId: string;
  fullName: string;
  className: string;
  teacherUsername: string;
  updatedAt: string;
  student: Student;
}

function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

async function request<T>(
  url: string,
  init: RequestInit
): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Gửi bản dữ liệu mới nhất của học sinh lên máy chủ cho giáo viên chủ nhiệm. */
export async function publishStudentRecord(
  session: AuthSession,
  student: Student
): Promise<boolean> {
  if (session.user.role !== "student") return false;
  if (session.token.startsWith("local-")) return false;
  if (!isOnline()) return false;

  const payload = await request<{ ok?: boolean }>(STUDENT_RECORDS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({ student }),
  });
  return Boolean(payload?.ok);
}

/** Giáo viên chủ nhiệm tải dữ liệu do các thiết bị học sinh đã gửi lên. */
export async function fetchStudentRecords(
  session: AuthSession
): Promise<StudentRecord[]> {
  if (session.user.role !== "teacher") return [];
  if (session.token.startsWith("local-")) return [];
  if (!isOnline()) return [];

  const payload = await request<{ records?: StudentRecord[] }>(
    TEACHER_RECORDS_API,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${session.token}` },
    }
  );
  return Array.isArray(payload?.records) ? payload.records : [];
}
