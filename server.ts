import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import {
  anDanhHoa,
  checkLayer1Sensitive,
  checkLayer2OutputSafety,
} from "./src/services/safety.ts";
import type { AIQuestionType } from "./src/types.ts";
import { registerAuthRoutes } from "./src/server/authApi.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_PROMPT = `Bạn là trợ lí đặt câu hỏi trong ứng dụng La Bàn Lựa Chọn, đồng hành với học sinh lớp 9 (khoảng 14–15 tuổi) đang chọn hướng đi sau THCS. Xưng "mình", gọi học sinh là "em".
Nhiệm vụ: giúp em TỰ suy nghĩ bằng câu hỏi gợi mở, dựa trên tiêu chí em đã tự đặt và những gì em vừa viết.
Bắt buộc:
- Trả lời tối đa 2 câu ngắn, kết thúc bằng đúng 1 câu hỏi.
- Gọi đúng điều em vừa viết, nhắc lại tiêu chí em đã đặt nếu có (được cung cấp trong ngữ cảnh).
- Không bao giờ nói "em nên chọn…", không xếp hạng phương án, không khen chê trường hay nghề cụ thể, không so sánh em với bạn khác.
- Không dùng từ "FOBO" hay bất kỳ nhãn tâm lí nào.
- Không đưa ra số liệu (học phí, điểm chuẩn, lương) – nếu em hỏi, đề nghị em hỏi thầy cô hoặc xem thẻ lộ trình do nhà trường cập nhật.
- Nếu em nhắc tới áp lực gia đình nặng nề, buồn bã kéo dài, bị la mắng, muốn bỏ học hoặc dấu hiệu căng thẳng: trả lời ấm áp, ngắn gọn, khuyến khích em nói chuyện trực tiếp với thầy cô chủ nhiệm, và đặt cờ NHAY_CAM = true. Không tư vấn tâm lí.
Ví dụ câu hỏi tốt: "Trường đó có đáp ứng tiêu chí 'gần nhà' và 'chi phí vừa phải' em đã đặt chưa?", "Điều gì khiến em muốn đổi ý lúc này?"
Trả về JSON theo schema: reply, loai_cau_hoi ("doi_chieu_tieu_chi" | "phan_tu_cam_xuc" | "goi_mo_thong_tin" | "dong_vien"), nhay_cam (boolean), dau_hieu (mô tả ngắn hành vi cho giáo viên hoặc chuỗi rỗng).`;

interface JournalContextItem {
  date: string;
  activityType: string;
  content: string;
}

interface QuestionRequestBody {
  studentCode?: string;
  studentMessage?: string;
  triggerReason?: string;
  currentStep?: string;
  criteria?: string[];
  consideredOptions?: string[];
  committedOption?: string | null;
  deadlineDate?: string;
  recentJournals?: JournalContextItem[];
  behavioralSignals?: string[];
}

interface AIQuestionResult {
  reply: string;
  nhay_cam: boolean;
  dau_hieu: string;
  loai_cau_hoi: AIQuestionType;
  layer1Triggered: boolean;
  layer2Filtered: boolean;
  layer2Reason?: string;
  originalAiReply?: string;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim().length < 10) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function buildAnonymizedQuestionContext(body: QuestionRequestBody) {
  const code = (body.studentCode || "HS Ẩn danh").trim();
  const safeMessage = anDanhHoa(body.studentMessage || "", code);
  const criteria = Array.isArray(body.criteria)
    ? body.criteria.map((c) => anDanhHoa(c, code)).filter(Boolean)
    : [];
  const options = Array.isArray(body.consideredOptions)
    ? body.consideredOptions.map((o) => anDanhHoa(o, code)).filter(Boolean)
    : [];
  const recentJournals = Array.isArray(body.recentJournals)
    ? body.recentJournals.slice(0, 3).map((j) => ({
        date: j.date,
        activityType: j.activityType,
        content: anDanhHoa(j.content, code),
      }))
    : [];
  const signals = Array.isArray(body.behavioralSignals)
    ? body.behavioralSignals.map((s) => anDanhHoa(s, code)).filter(Boolean)
    : [];

  const prompt = [
    `Ngữ cảnh học sinh (${code}):`,
    `- Bước hành trình hiện tại: ${body.currentStep || "Chưa xác định"}`,
    `- Tiêu chí "đủ tốt" em đã tự đặt: ${
      criteria.length > 0 ? criteria.join("; ") : "Chưa đặt tiêu chí cụ thể"
    }`,
    `- Danh sách cân nhắc hiện tại (tối đa 3): ${
      options.length > 0 ? options.join("; ") : "Chưa có phương án"
    }`,
    `- Phương án đã chốt: ${
      body.committedOption ? anDanhHoa(body.committedOption, code) : "Chưa chốt"
    }`,
    `- Hạn chốt em đặt: ${body.deadlineDate || "Chưa đặt"}`,
    `- 3 mục nhật ký gần nhất: ${
      recentJournals.length > 0
        ? recentJournals
            .map((j) => `[${j.date} - ${j.activityType}] ${j.content}`)
            .join(" || ")
        : "Chưa có nhật ký"
    }`,
    `- Dấu hiệu hành vi gần đây (mô tả): ${
      signals.length > 0 ? signals.join("; ") : "Ổn định, chưa có dấu hiệu đặc biệt"
    }`,
    body.triggerReason ? `- Ngữ cảnh kích hoạt: ${body.triggerReason}` : "",
    `- Điều em vừa viết: "${safeMessage}"`,
  ]
    .filter(Boolean)
    .join("\n");

  return { code, safeMessage, criteria, prompt };
}

const QUESTION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    reply: {
      type: Type.STRING,
      description:
        "Câu phản hồi tối đa 2 câu ngắn, kết thúc bằng đúng 1 câu hỏi gợi mở.",
    },
    loai_cau_hoi: {
      type: Type.STRING,
      enum: [
        "doi_chieu_tieu_chi",
        "phan_tu_cam_xuc",
        "goi_mo_thong_tin",
        "dong_vien",
      ],
      description: "Phân loại câu hỏi gợi mở phù hợp với nội dung em vừa chia sẻ.",
    },
    nhay_cam: {
      type: Type.BOOLEAN,
      description:
        "True nếu học sinh có dấu hiệu áp lực nặng nề, bị đánh, buồn kéo dài hoặc muốn bỏ học.",
    },
    dau_hieu: {
      type: Type.STRING,
      description:
        "Mô tả ngắn hành vi để giáo viên theo dõi (hoặc chuỗi rỗng nếu bình thường).",
    },
  },
  required: ["reply", "loai_cau_hoi", "nhay_cam", "dau_hieu"],
  propertyOrdering: ["reply", "loai_cau_hoi", "nhay_cam", "dau_hieu"],
};

function normalizeQuestionType(raw?: string): AIQuestionType {
  if (
    raw === "doi_chieu_tieu_chi" ||
    raw === "phan_tu_cam_xuc" ||
    raw === "goi_mo_thong_tin" ||
    raw === "dong_vien"
  ) {
    return raw;
  }
  return "doi_chieu_tieu_chi";
}

function finalizeWithLayer2(
  parsed: Partial<{
    reply: string;
    nhay_cam: boolean;
    dau_hieu: string;
    loai_cau_hoi: string;
  }>,
  criteria: string[]
): AIQuestionResult {
  const rawReply = (parsed.reply || "").trim();
  const layer2 = checkLayer2OutputSafety(rawReply, criteria);

  if (layer2.blocked) {
    const reasonText = layer2.reasons.join("; ");
    return {
      reply: layer2.safeReply,
      nhay_cam: Boolean(parsed.nhay_cam),
      dau_hieu:
        typeof parsed.dau_hieu === "string" && parsed.dau_hieu.trim()
          ? parsed.dau_hieu.trim()
          : `Bộ lọc Lớp 2 đã thay thế phản hồi AI (${reasonText}).`,
      loai_cau_hoi: "doi_chieu_tieu_chi",
      layer1Triggered: false,
      layer2Filtered: true,
      layer2Reason: reasonText,
      originalAiReply: rawReply,
    };
  }

  return {
    reply: rawReply,
    nhay_cam: Boolean(parsed.nhay_cam),
    dau_hieu: typeof parsed.dau_hieu === "string" ? parsed.dau_hieu.trim() : "",
    loai_cau_hoi: normalizeQuestionType(parsed.loai_cau_hoi),
    layer1Triggered: false,
    layer2Filtered: false,
  };
}

/**
 * Extracts partial string content of `"reply": "..."` while JSON chunks are streaming in.
 */
function extractPartialJsonReply(buffer: string): string {
  const match = /"reply"\s*:\s*"/.exec(buffer);
  if (!match) return "";
  let idx = match.index + match[0].length;
  let result = "";
  while (idx < buffer.length) {
    const ch = buffer[idx];
    if (ch === '"') {
      break;
    }
    if (ch === "\\") {
      if (idx + 1 >= buffer.length) break;
      const next = buffer[idx + 1];
      if (next === "n") result += "\n";
      else if (next === "t") result += "\t";
      else if (next === "r") result += "\r";
      else if (next === '"' || next === "\\" || next === "/") result += next;
      else if (next === "u" && idx + 5 < buffer.length) {
        const hex = buffer.slice(idx + 2, idx + 6);
        const code = parseInt(hex, 16);
        if (!Number.isNaN(code)) {
          result += String.fromCharCode(code);
        }
        idx += 4;
      }
      idx += 2;
      continue;
    }
    result += ch;
    idx += 1;
  }
  return result;
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("403") || msg.includes("PERMISSION_DENIED")) {
    return {
      status: 403,
      message:
        "Không có quyền truy cập Gemini API. Vui lòng kiểm tra khóa API trong Settings > Secrets.",
    };
  }
  if (msg.includes("400") || msg.includes("API_KEY_INVALID")) {
    return {
      status: 400,
      message:
        "Khóa Gemini API chưa hợp lệ. Vui lòng cập nhật lại trong Settings > Secrets.",
    };
  }
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return {
      status: 429,
      message:
        "Hệ thống AI đang vượt hạn mức tạm thời (429). Thầy/cô hoặc em vui lòng thử lại sau ít phút.",
    };
  }
  return {
    status: 502,
    message:
      "Chưa kết nối được tới dịch vụ Gemini AI lúc này. Vui lòng thử lại sau.",
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // 0. Account registration and sign-in (local JSON store, ready to swap for a cloud DB)
  registerAuthRoutes(app);

  // 1. Standard JSON AI question endpoint (with Layer 1 + Anonymization + Schema + Layer 2)
  app.post("/api/ai/question", async (req, res) => {
    const body = (req.body || {}) as QuestionRequestBody;
    const { safeMessage, criteria, prompt } =
      buildAnonymizedQuestionContext(body);

    // Layer 1 (before calling AI): sensitive keyword guard
    const layer1 = checkLayer1Sensitive(safeMessage);
    if (layer1.triggered) {
      const result: AIQuestionResult = {
        reply: layer1.reply!,
        nhay_cam: true,
        dau_hieu: layer1.dauHieu!,
        loai_cau_hoi: "dong_vien",
        layer1Triggered: true,
        layer2Filtered: false,
      };
      res.json(result);
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          "Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập khóa trong Settings > Secrets.",
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: QUESTION_RESPONSE_SCHEMA,
        },
      });

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        res.status(502).json({
          error: "AI chưa trả về nội dung phản hồi. Vui lòng thử lại.",
        });
        return;
      }

      const parsed = JSON.parse(rawText);
      const finalized = finalizeWithLayer2(parsed, criteria);
      res.json(finalized);
    } catch (err) {
      console.error("Gemini /api/ai/question error:", err);
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 2. Streaming SSE AI question endpoint (with Layer 1 + Anonymization + Stream + Layer 2)
  app.post("/api/ai/question/stream", async (req, res) => {
    const body = (req.body || {}) as QuestionRequestBody;
    const { safeMessage, criteria, prompt } =
      buildAnonymizedQuestionContext(body);

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendEvent = (payload: unknown) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    // Layer 1 (before calling AI): no AI call
    const layer1 = checkLayer1Sensitive(safeMessage);
    if (layer1.triggered) {
      const result: AIQuestionResult = {
        reply: layer1.reply!,
        nhay_cam: true,
        dau_hieu: layer1.dauHieu!,
        loai_cau_hoi: "dong_vien",
        layer1Triggered: true,
        layer2Filtered: false,
      };
      sendEvent({ type: "chunk", partialReply: result.reply });
      sendEvent({ type: "done", result });
      res.end();
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      sendEvent({
        type: "error",
        error:
          "Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập khóa trong Settings > Secrets.",
      });
      res.end();
      return;
    }

    try {
      const stream = await ai.models.generateContentStream({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: QUESTION_RESPONSE_SCHEMA,
        },
      });

      let fullBuffer = "";
      let lastStreamedReply = "";

      for await (const chunk of stream) {
        const textPart = chunk.text ?? "";
        if (!textPart) continue;
        fullBuffer += textPart;
        const partialReply = extractPartialJsonReply(fullBuffer);
        if (partialReply && partialReply !== lastStreamedReply) {
          lastStreamedReply = partialReply;
          sendEvent({ type: "chunk", partialReply });
        }
      }

      const trimmed = fullBuffer.trim();
      const parsed = JSON.parse(trimmed);
      const finalized = finalizeWithLayer2(parsed, criteria);
      sendEvent({ type: "done", result: finalized });
      res.end();
    } catch (err) {
      console.error("Gemini /api/ai/question/stream error:", err);
      const formatted = formatGeminiError(err);
      sendEvent({ type: "error", error: formatted.message });
      res.end();
    }
  });

  // 3. Teacher AI Tool: "Tóm tắt hành trình" (4-5 descriptive sentences)
  app.post("/api/ai/teacher/journey-summary", async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          "Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng kiểm tra khóa trong Settings > Secrets.",
      });
      return;
    }

    const body = (req.body || {}) as {
      studentCode?: string;
      currentStep?: string;
      completedSteps?: string[];
      abilitiesTeacherNote?: string;
      abilitiesStudentSelf?: string;
      hollandSummary?: string;
      conditionsSummary?: string;
      criteria?: string[];
      consideredOptions?: { title: string; status: string }[];
      recentJournals?: JournalContextItem[];
      committedOption?: string;
      behavioralSignals?: string[];
    };

    const code = (body.studentCode || "HS Ẩn danh").trim();
    const prompt = [
      `Hãy tóm tắt hành trình định hướng của ${code} cho giáo viên chủ nhiệm xem.`,
      `- Bước hiện tại: ${body.currentStep || "THU"}`,
      `- Bước đã xong: ${(body.completedSteps || []).join(", ") || "Chưa có"}`,
      `- Nhận xét năng lực của GV: ${anDanhHoa(body.abilitiesTeacherNote || "", code)}`,
      `- Tự nhận xét của HS: ${anDanhHoa(body.abilitiesStudentSelf || "", code)}`,
      `- Sở thích nổi bật: ${anDanhHoa(body.hollandSummary || "", code)}`,
      `- Điều kiện thực tế: ${anDanhHoa(body.conditionsSummary || "", code)}`,
      `- Tiêu chí tự đặt: ${(body.criteria || []).map((c) => anDanhHoa(c, code)).join("; ") || "Chưa có"}`,
      `- Phương án đang xét: ${(body.consideredOptions || []).map((o) => `${anDanhHoa(o.title, code)} (${o.status})`).join("; ") || "Chưa có"}`,
      `- Phương án chốt: ${body.committedOption ? anDanhHoa(body.committedOption, code) : "Chưa chốt"}`,
      `- Nhật ký gần đây: ${(body.recentJournals || []).slice(0, 4).map((j) => `[${j.date}] ${anDanhHoa(j.content, code)}`).join(" | ") || "Chưa viết"}`,
      `- Dấu hiệu hành vi: ${(body.behavioralSignals || []).join("; ") || "Ổn định"}`,
    ].join("\n");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction: `Bạn là trợ lí hỗ trợ giáo viên THCS tổng hợp hồ sơ định hướng học sinh bằng tiếng Việt chuẩn mực, khách quan, giàu tính sư phạm.
Yêu cầu:
- Viết đúng 4–5 câu mô tả bằng lời: học sinh đang ở bước nào, đã làm được những gì (tiêu chí, thử nghiệm, nhật ký, chốt), và điều gì giáo viên cần lưu ý khi đồng hành.
- Tuyệt đối KHÔNG chấm điểm, KHÔNG xếp hạng, KHÔNG dùng nhãn chẩn đoán tâm lí hay từ "FOBO", KHÔNG bịa số liệu học phí/điểm chuẩn.
- Không quyết định thay học sinh hay giáo viên.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "Đoạn tóm tắt 4–5 câu bằng tiếng Việt cho giáo viên.",
              },
              highlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2–3 điểm đáng chú ý ngắn gọn để giáo viên theo dõi.",
              },
            },
            required: ["summary", "highlights"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json({
        summary: parsed.summary || "",
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      });
    } catch (err) {
      console.error("Gemini /api/ai/teacher/journey-summary error:", err);
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 4. Teacher AI Tool: "Gợi ý chương trình họp ba bên"
  app.post("/api/ai/teacher/meeting-agenda", async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          "Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng kiểm tra khóa trong Settings > Secrets.",
      });
      return;
    }

    const body = (req.body || {}) as {
      studentCode?: string;
      currentStep?: string;
      criteria?: string[];
      consideredOptions?: { title: string; status: string }[];
      committedOption?: string;
      conditionsSummary?: string;
      recentJournals?: JournalContextItem[];
      behavioralSignals?: string[];
    };

    const code = (body.studentCode || "HS Ẩn danh").trim();
    const prompt = [
      `Đề xuất khung câu hỏi cho buổi họp ba bên (Học sinh ${code} – Phụ huynh – Giáo viên chủ nhiệm):`,
      `- Bước hiện tại: ${body.currentStep || "THU"}`,
      `- Tiêu chí HS đặt: ${(body.criteria || []).map((c) => anDanhHoa(c, code)).join("; ") || "Chưa có"}`,
      `- Phương án cân nhắc: ${(body.consideredOptions || []).map((o) => `${anDanhHoa(o.title, code)} (${o.status})`).join("; ") || "Chưa có"}`,
      `- Lựa chọn dự kiến / đã chốt: ${body.committedOption ? anDanhHoa(body.committedOption, code) : "Chưa chốt"}`,
      `- Điều kiện gia đình: ${anDanhHoa(body.conditionsSummary || "", code)}`,
      `- Nhật ký gần đây: ${(body.recentJournals || []).slice(0, 3).map((j) => anDanhHoa(j.content, code)).join(" | ") || "Chưa có"}`,
      `- Lưu ý hành vi: ${(body.behavioralSignals || []).join("; ") || "Không có"}`,
    ].join("\n");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction: `Bạn hỗ trợ giáo viên chủ nhiệm chuẩn bị kịch bản hỏi mở trong buổi họp ba bên (Học sinh – Phụ huynh – Giáo viên).
Yêu cầu:
- Đề xuất 1 lời mở đầu ngắn kết nối phụ huynh và học sinh, và 3–4 câu hỏi gợi mở cụ thể để giáo viên đặt trong buổi họp.
- Câu hỏi phải tôn trọng quyền tự chủ của học sinh, giúp phụ huynh hiểu lộ trình liên thông, không áp đặt hay chê bai học nghề/THPT.
- Không dùng từ "FOBO", không chấm điểm, không đưa số liệu học phí hay điểm chuẩn tự bịa.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              openingNote: {
                type: Type.STRING,
                description: "1–2 câu mở đầu buổi họp tạo không khí lắng nghe.",
              },
              questions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3–4 câu hỏi gợi mở dành cho giáo viên hỏi trong buổi họp.",
              },
            },
            required: ["openingNote", "questions"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json({
        openingNote: parsed.openingNote || "",
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      });
    } catch (err) {
      console.error("Gemini /api/ai/teacher/meeting-agenda error:", err);
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 5. Teacher AI Tool: "Hỗ trợ mã hóa chủ đề" (Braun & Clarke, 2006)
  app.post("/api/ai/teacher/thematic-coding", async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          "Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng kiểm tra khóa trong Settings > Secrets.",
      });
      return;
    }

    const body = (req.body || {}) as {
      entries?: {
        journalId: string;
        studentCode: string;
        date: string;
        activityType: string;
        content: string;
      }[];
    };

    const entries = Array.isArray(body.entries) ? body.entries : [];
    if (entries.length === 0) {
      res.status(400).json({ error: "Vui lòng chọn ít nhất một mục nhật ký." });
      return;
    }

    const sanitizedEntries = entries.slice(0, 30).map((item) => ({
      journalId: item.journalId,
      studentCode: item.studentCode,
      sourceLabel: `${item.studentCode} · ${item.activityType} (${item.date})`,
      content: anDanhHoa(item.content, item.studentCode),
    }));

    const prompt = [
      "Hãy thực hiện bước mã hóa ban đầu (initial coding) và gợi ý nhóm chủ đề theo phương pháp phân tích chủ đề của Braun & Clarke (2006) cho các đoạn nhật ký ẩn danh dưới đây:",
      ...sanitizedEntries.map(
        (e, i) =>
          `${i + 1}. [journalId="${e.journalId}" | studentCode="${e.studentCode}" | nguồn="${e.sourceLabel}"] "${e.content}"`
      ),
    ].join("\n");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction: `Bạn là trợ lí nghiên cứu giáo dục hỗ trợ giáo viên thực hiện phân tích chủ đề (thematic analysis theo Braun & Clarke, 2006) trên dữ liệu nhật ký ẩn danh của học sinh lớp 9.
Yêu cầu:
- Với mỗi mục nhật ký phù hợp, đề xuất 1–2 mã ban đầu ngắn gọn (codeLabel bằng tiếng Việt), nhóm vào chủ đề gợi ý (suggestedTheme), và trích chính xác nguyên văn câu minh chứng ngắn (evidenceQuote) từ nội dung đã cung cấp.
- Giữ đúng journalId, studentCode và sourceLabel từ dữ liệu đầu vào.
- Không bịa đặt trích dẫn ngoài văn bản cung cấp.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    journalId: { type: Type.STRING },
                    studentCode: { type: Type.STRING },
                    sourceLabel: { type: Type.STRING },
                    codeLabel: {
                      type: Type.STRING,
                      description: "Tên mã ban đầu ngắn gọn bằng tiếng Việt.",
                    },
                    suggestedTheme: {
                      type: Type.STRING,
                      description: "Chủ đề khái quát gợi ý.",
                    },
                    evidenceQuote: {
                      type: Type.STRING,
                      description: "Câu trích dẫn nguyên văn làm minh chứng.",
                    },
                  },
                  required: [
                    "journalId",
                    "studentCode",
                    "sourceLabel",
                    "codeLabel",
                    "suggestedTheme",
                    "evidenceQuote",
                  ],
                },
              },
            },
            required: ["items"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json({
        items: Array.isArray(parsed.items) ? parsed.items : [],
      });
    } catch (err) {
      console.error("Gemini /api/ai/teacher/thematic-coding error:", err);
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  const isProd =
    process.env.NODE_ENV === "production" || process.env.RENDER === "true";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.use("/api", (_req, res) => {
      res.status(404).json({ error: "Không tìm thấy endpoint API." });
    });
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`La Bàn Lựa Chọn server running on http://0.0.0.0:${port}`);
  });
}

startServer();
