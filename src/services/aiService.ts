import { ChatMessage } from "../types";

export const HESITANT_TRIGGER_PHRASES = [
  "nhưng biết đâu",
  "hay là",
  "chắc là được",
  "để em nghĩ thêm",
  "trường kia tốt hơn",
  "trượt thì tính tiếp",
  "sợ chọn nhầm",
  "bạn em bảo",
];

export function detectHesitantPhrase(text: string): boolean {
  const lower = text.toLowerCase();
  return HESITANT_TRIGGER_PHRASES.some((phrase) => lower.includes(phrase));
}

export interface AIQuestionRequest {
  studentMessage: string;
  triggerReason: string;
  criteriaList: string[];
  currentOptions: string[];
  lockedOption?: string;
  recentHistory?: ChatMessage[];
}

export interface AIQuestionResult {
  reply: string;
  nhay_cam: boolean;
  dau_hieu: string;
  source: "gemini" | "fallback";
}

export async function requestAIQuestion(payload: AIQuestionRequest): Promise<AIQuestionResult> {
  try {
    const res = await fetch("/api/ai-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentMessage: payload.studentMessage,
        triggerReason: payload.triggerReason,
        criteriaList: payload.criteriaList,
        currentOptions: payload.currentOptions,
        lockedOption: payload.lockedOption ?? "",
        recentHistory: (payload.recentHistory ?? []).map((m) => ({
          sender: m.sender === "student" ? "Học sinh" : "Trợ lí",
          text: m.text,
        })),
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as AIQuestionResult;
    return data;
  } catch {
    const crit = payload.criteriaList[0]
      ? `tiêu chí "${payload.criteriaList[0]}"`
      : "những điều em vừa tự đặt cho mình";
    return {
      reply: `Mình đã đọc suy nghĩ của em. Nếu đối chiếu trực tiếp với ${crit}, em thấy điều gì đang rõ ràng nhất và điều gì em cần hỏi thêm thầy cô?`,
      nhay_cam: false,
      dau_hieu: detectHesitantPhrase(payload.studentMessage)
        ? "Em có câu viết thể hiện sự phân vân trước khi ra quyết định."
        : "",
      source: "fallback",
    };
  }
}
