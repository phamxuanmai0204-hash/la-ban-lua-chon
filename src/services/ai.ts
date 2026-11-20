import { describeBehavioralSignals } from "../data/mockData";
import { anDanhHoa } from "./safety";
import type { AIQuestionType, JourneyStep, Student } from "../types";

export interface JournalContextItem {
  date: string;
  activityType: string;
  content: string;
}

export interface AskAIParams {
  studentCode: string;
  studentMessage: string;
  triggerReason: string;
  currentStep: JourneyStep;
  criteria: string[];
  consideredOptions: string[];
  committedOption: string | null;
  deadlineDate?: string;
  recentJournals: JournalContextItem[];
  behavioralSignals: string[];
}

export interface AskAIResponse {
  reply: string;
  nhay_cam: boolean;
  dau_hieu: string;
  loai_cau_hoi: AIQuestionType;
  layer1Triggered: boolean;
  layer2Filtered: boolean;
  layer2Reason?: string;
  originalAiReply?: string;
}

const HESITANCY_KEYWORDS = [
  "nhưng biết đâu",
  "hay là",
  "chắc là được",
  "để em nghĩ thêm",
  "trường kia tốt hơn",
  "phân vân",
  "chưa chắc",
];

export function detectHesitancyPhrase(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of HESITANCY_KEYWORDS) {
    if (lower.includes(phrase)) {
      return phrase;
    }
  }
  return null;
}

/**
 * Builds compact, anonymized context before leaving the browser.
 */
export function buildCompactAIContext(
  student: Student,
  studentMessage: string,
  triggerReason: string
): AskAIParams {
  const code = student.anonymizedLabel || student.code;
  return {
    studentCode: `${student.code} (${code})`,
    studentMessage: anDanhHoa(studentMessage, code),
    triggerReason,
    currentStep: student.currentStep,
    criteria: student.criteria.map((c) => anDanhHoa(c.label, code)),
    consideredOptions: student.consideredOptions
      .filter((o) => o.status !== "Tạm gác lại")
      .map((o) => anDanhHoa(o.title, code)),
    committedOption: student.commitment.chosenOption
      ? anDanhHoa(student.commitment.chosenOption, code)
      : null,
    deadlineDate: student.commitment.deadlineDate,
    recentJournals: student.journal.slice(0, 3).map((j) => ({
      date: j.date,
      activityType: j.activityType,
      content: anDanhHoa(j.content, code),
    })),
    behavioralSignals: describeBehavioralSignals(student.signals),
  };
}

export async function requestAIQuestion(
  params: AskAIParams
): Promise<AskAIResponse> {
  const res = await fetch("/api/ai/question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const payload = (await res.json().catch(() => ({}))) as AskAIResponse & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(payload.error || `Lỗi kết nối AI (HTTP ${res.status}).`);
  }
  return payload;
}

export async function requestAIQuestionStream(
  params: AskAIParams,
  onPartialReply?: (partialText: string) => void
): Promise<AskAIResponse> {
  const res = await fetch("/api/ai/question/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok || !res.body) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || `Lỗi kết nối luồng AI (HTTP ${res.status}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let sseBuffer = "";
  let finalResult: AskAIResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    sseBuffer += decoder.decode(value, { stream: true });

    const events = sseBuffer.split("\n\n");
    sseBuffer = events.pop() || "";

    for (const rawEvent of events) {
      const dataLine = rawEvent
        .split("\n")
        .find((line) => line.startsWith("data:"));
      if (!dataLine) continue;
      const jsonStr = dataLine.slice(5).trim();
      if (!jsonStr) continue;

      const parsed = JSON.parse(jsonStr) as
        | { type: "chunk"; partialReply: string }
        | { type: "done"; result: AskAIResponse }
        | { type: "error"; error: string };

      if (parsed.type === "chunk" && onPartialReply) {
        onPartialReply(parsed.partialReply);
      } else if (parsed.type === "error") {
        throw new Error(parsed.error);
      } else if (parsed.type === "done") {
        finalResult = parsed.result;
      }
    }
  }

  if (!finalResult) {
    throw new Error("Luồng phản hồi AI kết thúc chưa đầy đủ. Vui lòng thử lại.");
  }

  return finalResult;
}

export interface JourneySummaryResponse {
  summary: string;
  highlights: string[];
}

export async function requestTeacherJourneySummary(
  student: Student
): Promise<JourneySummaryResponse> {
  const code = student.anonymizedLabel || student.code;
  const conditionsSummary = [
    student.profile.conditions.commuteDistance,
    student.profile.conditions.familyFinance,
    student.profile.conditions.earlyIndependence,
  ]
    .filter(Boolean)
    .join("; ");

  const res = await fetch("/api/ai/teacher/journey-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentCode: `${student.code} (${code})`,
      currentStep: student.currentStep,
      completedSteps: student.completedSteps || [],
      abilitiesTeacherNote: anDanhHoa(student.profile.abilitiesTeacherNote, code),
      abilitiesStudentSelf: anDanhHoa(student.profile.abilitiesStudentSelf, code),
      hollandSummary: anDanhHoa(student.profile.hollandSummaryText, code),
      conditionsSummary: anDanhHoa(conditionsSummary, code),
      criteria: student.criteria.map((c) => anDanhHoa(c.label, code)),
      consideredOptions: student.consideredOptions.map((o) => ({
        title: anDanhHoa(o.title, code),
        status: o.status,
      })),
      recentJournals: student.journal.slice(0, 4).map((j) => ({
        date: j.date,
        activityType: j.activityType,
        content: anDanhHoa(j.content, code),
      })),
      committedOption: student.commitment.chosenOption
        ? anDanhHoa(student.commitment.chosenOption, code)
        : "",
      behavioralSignals: describeBehavioralSignals(student.signals),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as JourneySummaryResponse & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Không tạo được bản tóm tắt hành trình.");
  }
  return data;
}

export interface MeetingAgendaResponse {
  openingNote: string;
  questions: string[];
}

export async function requestTeacherMeetingAgenda(
  student: Student
): Promise<MeetingAgendaResponse> {
  const code = student.anonymizedLabel || student.code;
  const conditionsSummary = [
    student.profile.conditions.commuteDistance,
    student.profile.conditions.familyFinance,
    student.profile.conditions.earlyIndependence,
  ]
    .filter(Boolean)
    .join("; ");

  const res = await fetch("/api/ai/teacher/meeting-agenda", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentCode: `${student.code} (${code})`,
      currentStep: student.currentStep,
      criteria: student.criteria.map((c) => anDanhHoa(c.label, code)),
      consideredOptions: student.consideredOptions.map((o) => ({
        title: anDanhHoa(o.title, code),
        status: o.status,
      })),
      committedOption: student.commitment.chosenOption
        ? anDanhHoa(student.commitment.chosenOption, code)
        : "",
      conditionsSummary: anDanhHoa(conditionsSummary, code),
      recentJournals: student.journal.slice(0, 3).map((j) => ({
        date: j.date,
        activityType: j.activityType,
        content: anDanhHoa(j.content, code),
      })),
      behavioralSignals: describeBehavioralSignals(student.signals),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as MeetingAgendaResponse & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Không gợi ý được chương trình họp ba bên.");
  }
  return data;
}

export interface ThematicCodingInputItem {
  journalId: string;
  studentCode: string;
  date: string;
  activityType: string;
  content: string;
}

export interface ThematicCodingAIItem {
  journalId: string;
  studentCode: string;
  sourceLabel: string;
  codeLabel: string;
  suggestedTheme: string;
  evidenceQuote: string;
}

export async function requestThematicCoding(
  entries: ThematicCodingInputItem[]
): Promise<ThematicCodingAIItem[]> {
  const sanitized = entries.map((e) => ({
    ...e,
    content: anDanhHoa(e.content, e.studentCode),
  }));

  const res = await fetch("/api/ai/teacher/thematic-coding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries: sanitized }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    items?: ThematicCodingAIItem[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Không phân tích mã hóa chủ đề được lúc này.");
  }
  return Array.isArray(data.items) ? data.items : [];
}
