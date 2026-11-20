import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

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
Trả về JSON: {"reply": "...", "nhay_cam": true/false, "dau_hieu": "mô tả ngắn hành vi (cho giáo viên) hoặc chuỗi rỗng"}`;

const SENSITIVE_PATTERNS = [
  "bỏ học",
  "la mắng",
  "đánh mắng",
  "áp lực quá",
  "chán sống",
  "tuyệt vọng",
  "không muốn sống",
  "khóc suốt",
  "buồn bã kéo dài",
  "sợ về nhà",
  "bị ép",
  "căng thẳng quá",
];

const FALLBACK_QUESTIONS = [
  (snippet: string, criteria: string[]) => {
    const critText = criteria.length > 0 ? `tiêu chí "${criteria[0]}"` : "những tiêu chí em đã tự đặt";
    return `Mình nghe thấy điều em vừa chia sẻ${snippet ? ` về "${snippet}"` : ""}. Hướng đi này có thật sự đáp ứng ${critText} của riêng em chưa?`;
  },
  (snippet: string, criteria: string[]) => {
    const critText = criteria.length > 1 ? `"${criteria[0]}" và "${criteria[1]}"` : criteria[0] ? `"${criteria[0]}"` : "điều kiện thực tế của gia đình";
    return `Em đang cân nhắc rất kĩ${snippet ? ` khi nhắc tới "${snippet}"` : ""}. Nếu đối chiếu với ${critText}, em thấy điều gì là chắc chắn nhất và điều gì em cần hỏi thêm thầy cô?`;
  },
  (_snippet: string, criteria: string[]) => {
    const critText = criteria.length > 0 ? `"${criteria[0]}"` : "những điều em mong muốn";
    return `Thay vì cố tìm một lựa chọn hoàn hảo trong tưởng tượng, mình cùng nhìn lại ${critText} mà em đã viết nhé. Điều gì khiến em thấy yên tâm nhất hoặc còn băn khoăn nhất lúc này?`;
  },
  (_snippet: string) => {
    return `Mỗi lựa chọn đều có những điểm cần tìm hiểu kĩ để em không phải đoán mò. Em muốn kiểm chứng thêm thông tin nào ở Bước THU hoặc qua một buổi trải nghiệm thực tế trước khi quyết định?`;
  },
];

function buildFallbackResponse(studentMessage: string, criteriaList: string[], triggerReason?: string) {
  const normalized = studentMessage.toLowerCase();
  const isSensitive = SENSITIVE_PATTERNS.some((kw) => normalized.includes(kw));

  if (isSensitive) {
    return {
      reply:
        "Mình nghe thấy em đang trải qua nhiều áp lực và cảm xúc nặng nề lúc này. Em hãy chia sẻ trực tiếp với thầy cô chủ nhiệm để được lắng nghe và đồng hành kịp thời nhé?",
      nhay_cam: true,
      dau_hieu: "Học sinh có chia sẻ về áp lực/căng thẳng cần giáo viên quan tâm trực tiếp.",
      source: "fallback" as const,
    };
  }

  const cleanSnippet = studentMessage.trim().slice(0, 48).replace(/["\n]/g, " ");
  const picker = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
  const reply = picker(cleanSnippet, criteriaList);

  let dauHieu = "";
  if (triggerReason === "change_after_lock") {
    dauHieu = "Em cân nhắc đổi phương án sau khi đã chốt lựa chọn.";
  } else if (triggerReason === "add_after_filter") {
    dauHieu = "Em muốn thêm phương án mới sau khi đã lọc tiêu chí.";
  } else if (
    normalized.includes("nhưng biết đâu") ||
    normalized.includes("hay là") ||
    normalized.includes("chắc là được") ||
    normalized.includes("để em nghĩ thêm") ||
    normalized.includes("trường kia tốt hơn")
  ) {
    dauHieu = "Em viết câu thể hiện sự phân vân, chờ đợi phương án khác chưa kiểm chứng.";
  }

  return {
    reply,
    nhay_cam: false,
    dau_hieu: dauHieu,
    source: "fallback" as const,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "1mb" }));

  app.post("/api/ai-question", async (req, res) => {
    const {
      studentMessage = "",
      triggerReason = "chat",
      criteriaList = [],
      currentOptions = [],
      lockedOption = "",
      recentHistory = [],
    } = req.body ?? {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json(buildFallbackResponse(String(studentMessage), criteriaList, triggerReason));
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const contextLines = [
        `Ngữ cảnh kích hoạt: ${triggerReason}`,
        `Tiêu chí "đủ tốt" em đã tự đặt: ${criteriaList.length > 0 ? criteriaList.join("; ") : "Em chưa ghi rõ tiêu chí"}`,
        `Các phương án em đang cân nhắc: ${currentOptions.length > 0 ? currentOptions.join("; ") : "Chưa có phương án"}`,
        lockedOption ? `Phương án em đã chốt trước đó: ${lockedOption}` : "",
        recentHistory.length > 0
          ? `Trao đổi gần đây:\n${recentHistory
              .slice(-4)
              .map((m: { sender: string; text: string }) => `- ${m.sender}: ${m.text}`)
              .join("\n")}`
          : "",
        `Điều em vừa viết: "${studentMessage}"`,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: contextLines,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: "Tối đa 2 câu ngắn, kết thúc bằng đúng 1 câu hỏi gợi mở cho học sinh.",
              },
              nhay_cam: {
                type: Type.BOOLEAN,
                description: "true nếu học sinh có dấu hiệu áp lực gia đình nặng nề, buồn bã kéo dài, muốn bỏ học hoặc căng thẳng.",
              },
              dau_hieu: {
                type: Type.STRING,
                description: "Mô tả ngắn hành vi bằng lời dành cho giáo viên (không dùng nhãn chẩn đoán) hoặc chuỗi rỗng.",
              },
            },
            required: ["reply", "nhay_cam", "dau_hieu"],
          },
        },
      });

      const rawText = (response.text ?? "").trim();
      const parsed = JSON.parse(rawText);

      // Extra safety guard for sensitive keywords
      const normalized = String(studentMessage).toLowerCase();
      const keywordSensitive = SENSITIVE_PATTERNS.some((kw) => normalized.includes(kw));

      return res.json({
        reply: typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.trim() : buildFallbackResponse(studentMessage, criteriaList, triggerReason).reply,
        nhay_cam: Boolean(parsed.nhay_cam) || keywordSensitive,
        dau_hieu: typeof parsed.dau_hieu === "string" ? parsed.dau_hieu.trim() : "",
        source: "gemini",
      });
    } catch (error) {
      console.error("Gemini API error, using curated fallback:", error);
      return res.json(buildFallbackResponse(String(studentMessage), criteriaList, triggerReason));
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`La Bàn Lựa Chọn server running on http://localhost:${PORT}`);
  });
}

startServer();
