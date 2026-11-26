import { describeBehavioralSignals } from "../data/mockData";
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
 * Builds compact context before leaving the browser.
 */
export function buildCompactAIContext(
  student: Student,
  studentMessage: string,
  triggerReason: string
): AskAIParams {
  return {
    studentCode: student.fullName,
    studentMessage,
    triggerReason,
    currentStep: student.currentStep,
    criteria: student.criteria.map((c) => c.label),
    consideredOptions: student.consideredOptions
      .filter((o) => o.status !== "Tạm gác lại")
      .map((o) => o.title),
    committedOption: student.commitment.chosenOption || null,
    deadlineDate: student.commitment.deadlineDate,
    recentJournals: student.journal.slice(0, 3).map((j) => ({
      date: j.date,
      activityType: j.activityType,
      content: j.content,
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

export interface InterestProfileAnalysisParams {
  studentCode: string;
  mbtiType: string;
  mbtiDetail: {
    EI: string;
    SN: string;
    TF: string;
    JP: string;
  };
  hollandTop: { name: string; score: number }[];
}

export interface InterestProfileAnalysisResponse {
  personality: string;
  interests: string;
  environment: string;
}

export async function requestInterestProfileAnalysis(
  params: InterestProfileAnalysisParams
): Promise<InterestProfileAnalysisResponse> {
  const res = await fetch("/api/ai/student/interest-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = (await res.json().catch(() => ({}))) as
    | InterestProfileAnalysisResponse
    | { error?: string };
  if (!res.ok) {
    throw new Error(
      "error" in data && data.error
        ? data.error
        : `Lỗi kết nối AI (HTTP ${res.status}).`
    );
  }
  const analysis = data as Partial<InterestProfileAnalysisResponse>;
  if (!analysis.personality || !analysis.interests || !analysis.environment) {
    throw new Error("AI trả về chưa đủ 3 khối nhận định.");
  }
  return {
    personality: analysis.personality,
    interests: analysis.interests,
    environment: analysis.environment,
  };
}

export interface JourneySummaryResponse {
  summary: string;
  highlights: string[];
}

export async function requestTeacherJourneySummary(
  student: Student
): Promise<JourneySummaryResponse> {
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
      studentCode: student.fullName,
      currentStep: student.currentStep,
      completedSteps: student.completedSteps || [],
      abilitiesTeacherNote: student.profile.abilitiesTeacherNote,
      abilitiesStudentSelf: student.profile.abilitiesStudentSelf,
      hollandSummary: student.profile.hollandSummaryText,
      conditionsSummary,
      criteria: student.criteria.map((c) => c.label),
      consideredOptions: student.consideredOptions.map((o) => ({
        title: o.title,
        status: o.status,
      })),
      recentJournals: student.journal.slice(0, 4).map((j) => ({
        date: j.date,
        activityType: j.activityType,
        content: j.content,
      })),
      committedOption: student.commitment.chosenOption || "",
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
      studentCode: student.fullName,
      currentStep: student.currentStep,
      criteria: student.criteria.map((c) => c.label),
      consideredOptions: student.consideredOptions.map((o) => ({
        title: o.title,
        status: o.status,
      })),
      committedOption: student.commitment.chosenOption || "",
      conditionsSummary,
      recentJournals: student.journal.slice(0, 3).map((j) => ({
        date: j.date,
        activityType: j.activityType,
        content: j.content,
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
  studentName: string;
  date: string;
  activityType: string;
  content: string;
}

export interface ThematicCodingAIItem {
  journalId: string;
  studentName: string;
  sourceLabel: string;
  codeLabel: string;
  suggestedTheme: string;
  evidenceQuote: string;
}

export async function requestThematicCoding(
  entries: ThematicCodingInputItem[]
): Promise<ThematicCodingAIItem[]> {
  const res = await fetch("/api/ai/teacher/thematic-coding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entries: entries.map((e) => ({
        journalId: e.journalId,
        studentCode: e.studentName,
        date: e.date,
        activityType: e.activityType,
        content: e.content,
      })),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    items?: Array<Omit<ThematicCodingAIItem, "studentName"> & {
      studentCode?: string;
    }>;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Không phân tích mã hóa chủ đề được lúc này.");
  }
  return Array.isArray(data.items)
    ? data.items.map((item) => ({
        journalId: item.journalId,
        studentName: item.studentCode ?? "",
        sourceLabel: item.sourceLabel,
        codeLabel: item.codeLabel,
        suggestedTheme: item.suggestedTheme,
        evidenceQuote: item.evidenceQuote,
      }))
    : [];
}
