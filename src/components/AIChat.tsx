import React, { useState } from "react";
import { AIReviewItem, StudentProfileData } from "../types";
import { Send, MessageCircleQuestion, ShieldAlert } from "lucide-react";

interface AIChatProps {
  student: StudentProfileData;
  aiQueue: AIReviewItem[];
  requireTeacherPreApproval: boolean;
  onSendMessage: (messageText: string) => Promise<void>;
}

const STARTER_PROMPTS = [
  "Em vẫn muốn thi lớp 10 thử, trượt thì tính tiếp.",
  "Bạn em rủ vào trường kia, nhưng biết đâu trường đó tốt hơn.",
  "Em thấy học nghề gần nhà cũng ổn, hay là để em nghĩ thêm.",
];

export const AIChat: React.FC<AIChatProps> = ({
  student,
  aiQueue,
  requireTeacherPreApproval,
  onSendMessage,
}) => {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput("");
    try {
      await onSendMessage(trimmed);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700 space-y-1.5">
        <div className="flex items-center gap-2.5">
          <MessageCircleQuestion className="w-5 h-5 text-[#2A7F7F] dark:text-[#6EE7E7]" />
          <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
            Trò chuyện cùng Trợ lí đặt câu hỏi
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Trợ lí không chọn thay hay khuyên em nên vào trường nào. Mình chỉ đặt câu hỏi ngắn giúp em tự soi chiếu lại tiêu chí của chính mình.
        </p>
        {student.criteria.length > 0 && (
          <p className="text-xs text-[#2A7F7F] dark:text-[#6EE7E7] pt-0.5">
            Tiêu chí em đã đặt: {student.criteria.join(" · ")}
          </p>
        )}
      </div>

      {/* Chat Messages */}
      <div className="p-5 space-y-4 min-h-[320px] max-h-[460px] overflow-y-auto bg-[#F7F9FB] dark:bg-slate-900/40">
        {student.chatMessages.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Em đang băn khoăn điều gì khi đứng trước các lựa chọn sau lớp 9?
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hãy viết một suy nghĩ thật lòng bên dưới hoặc chọn một câu gợi ý.
            </p>
          </div>
        ) : (
          student.chatMessages.map((msg) => {
            if (msg.sender === "student") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-sm bg-[#1F3A5F] text-white px-4 py-3 text-sm space-y-1">
                    <p className="leading-relaxed">{msg.text}</p>
                    <p className="text-[11px] text-slate-300 text-right">{msg.createdAt}</p>
                  </div>
                </div>
              );
            }

            const review = msg.reviewId
              ? aiQueue.find((r) => r.id === msg.reviewId)
              : undefined;

            const isBlockedForPreApproval =
              review && !review.visibleToStudent && requireTeacherPreApproval && review.status === "Chờ duyệt";

            const isSensitive = Boolean(msg.nhayCam || review?.nhayCam);
            const displayText = isBlockedForPreApproval
              ? "Tin nhắn đang chờ thầy/cô xem trước khi hiển thị cho em."
              : isSensitive
              ? "Mình nghe thấy em đang chịu nhiều áp lực lúc này. Em hãy chia sẻ trực tiếp với thầy cô chủ nhiệm để được lắng nghe và đồng hành kịp thời nhé."
              : review?.teacherEditedReply ?? review?.aiReply ?? msg.text;

            const statusLabel =
              review && review.status !== "Chờ duyệt" ? "Thầy/cô đã xem" : "Trợ lí gợi ý";

            return (
              <div key={msg.id} className="flex justify-start">
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-bl-sm border px-4 py-3 text-sm space-y-1.5 ${
                    isSensitive
                      ? "bg-[#C0504D]/10 border-[#C0504D]/40 text-[#14263E] dark:text-slate-100"
                      : "bg-white dark:bg-[#182334] border-slate-200 dark:border-slate-700 text-[#14263E] dark:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2A7F7F] dark:text-[#6EE7E7]">
                    {isSensitive && <ShieldAlert className="w-3.5 h-3.5 text-[#C0504D]" />}
                    <span>{isSensitive ? "Lời nhắn đồng hành" : statusLabel}</span>
                  </div>
                  <p className="leading-relaxed">{displayText}</p>
                  {review?.teacherEncouragement && !isBlockedForPreApproval && (
                    <p className="text-xs font-medium text-[#1F3A5F] dark:text-[#F0B44A] pt-1 border-t border-slate-100 dark:border-slate-700">
                      Thầy/cô nhắn thêm: “{review.teacherEncouragement}”
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400">{msg.createdAt}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Starter Chips & Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3 bg-white dark:bg-[#182334]">
        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleSend(p)}
              disabled={sending}
              className="text-left text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FB] dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              “{p}”
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Viết điều em đang băn khoăn..."
            className="flex-1 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-[#14263E] dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Gửi suy nghĩ cho trợ lí"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#E0A030] hover:bg-[#d19225] disabled:opacity-50 text-[#14263E] text-sm font-semibold flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{sending ? "Đang gửi..." : "Gửi"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
