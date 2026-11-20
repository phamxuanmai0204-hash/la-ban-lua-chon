import React, { useState } from "react";
import {
  MessageCircle,
  Send,
  UserCheck,
  HeartHandshake,
  Compass,
  AlertCircle,
  WifiOff,
} from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import type { AIMessage, AIQuestionType, Student } from "../../types";

interface AIChatProps {
  student: Student;
  messages: AIMessage[];
  requireApproval: boolean;
  onSendMessage: (
    text: string,
    onStreamPartial?: (partialReply: string) => void
  ) => Promise<void>;
}

const STARTER_PROMPTS = [
  "Em đang phân vân giữa hai hướng đi và chưa biết chọn sao.",
  "Em định chọn trường theo bạn thân cho vui.",
  "Nhưng biết đâu em thi thử lớp 10 vẫn đỗ thì sao?",
];

const QUESTION_BADGES: Record<AIQuestionType, string> = {
  doi_chieu_tieu_chi: "Đối chiếu tiêu chí",
  phan_tu_cam_xuc: "Phản tư cảm xúc",
  goi_mo_thong_tin: "Gợi mở thông tin",
  dong_vien: "Động viên",
};

export const AIChat: React.FC<AIChatProps> = ({
  student,
  messages,
  requireApproval,
  onSendMessage,
}) => {
  const isOnline = useOnlineStatus();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingUserText, setPendingUserText] = useState<string | null>(null);
  const [streamingReply, setStreamingReply] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const studentMessages = messages.filter((m) => m.studentId === student.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = input.trim();
    if (!clean || sending || !isOnline) return;
    setErrorMsg(null);
    setSending(true);
    setPendingUserText(clean);
    setStreamingReply("");
    setInput("");

    try {
      await onSendMessage(clean, (partial) => {
        if (!requireApproval) {
          setStreamingReply(partial);
        }
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Chưa kết nối được với Trợ lí đặt câu hỏi. Em hãy thử lại sau nhé."
      );
      setInput(clean);
    } finally {
      setSending(false);
      setPendingUserText(null);
      setStreamingReply("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#B3DEE2]/35 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2] dark:border-slate-700 rounded-2xl p-5 flex items-start gap-3">
        <Compass className="w-5 h-5 text-[#133C42] dark:text-[#B3DEE2] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold">
            Trò chuyện cùng Trợ lí đặt câu hỏi
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            Trợ lí không khuyên em chọn trường nào hay xếp hạng phương án. Mình chỉ đặt một câu hỏi nhỏ dựa trên tiêu chí, nhật ký và bước hành trình hiện tại để em tự soi chiếu rõ hơn.
          </p>
        </div>
      </div>

      {!isOnline && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#EFCFE3]/45 dark:bg-[#4A1A2C]/40 border border-[#E27396] flex items-start gap-3 text-sm text-[#4A1A2C] dark:text-[#EFCFE3]"
        >
          <WifiOff className="w-5 h-5 shrink-0 mt-0.5 text-[#9D2950] dark:text-[#EA9AB2]" />
          <div className="space-y-1">
            <p className="font-bold">Cần có mạng để trò chuyện với Trợ lí AI</p>
            <p className="text-xs sm:text-sm leading-relaxed">
              Hiện thiết bị đang ngoại tuyến. Em vẫn có thể đọc lại các câu trả lời cũ ở dưới, xem Bản đồ lộ trình hoặc viết Nhật ký bình thường — hệ thống sẽ tự đồng bộ khi có mạng lại.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STARTER_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={!isOnline}
            onClick={() => setInput(p)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:border-[#E27396] disabled:opacity-50 text-xs sm:text-sm text-left transition-colors cursor-pointer"
          >
            &ldquo;{p}&rdquo;
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
        {studentMessages.length === 0 && !pendingUserText ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
            <MessageCircle className="w-8 h-8 mx-auto text-slate-400" />
            <p>
              Em có thể viết điều mình đang băn khoăn vào ô bên dưới. Trợ lí sẽ lắng nghe và đặt câu hỏi gợi mở cho em.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {studentMessages.map((m) => {
              const teacherReviewed =
                m.status === "giữ nguyên" ||
                m.status === "giáo viên đã sửa" ||
                m.status === "chuyển tư vấn";
              const displayText =
                m.status === "giáo viên đã sửa" && m.teacherEditedReply
                  ? m.teacherEditedReply
                  : m.aiReply;

              return (
                <div key={m.id} className="space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[88%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-[#EFCFE3]/60 dark:bg-[#E27396]/20 border border-[#EA9AB2]/50 dark:border-[#E27396]/40 px-4 py-3 space-y-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Em · {m.createdAt}
                      </p>
                      <p className="text-sm sm:text-[15px] leading-relaxed text-[#1D242B] dark:text-white">
                        {m.studentText}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className="max-w-[92%] sm:max-w-[80%] rounded-2xl rounded-tl-sm bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 px-4 py-3.5 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {teacherReviewed ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#223A1E] dark:text-[#EAF2D7]">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Thầy/cô đã xem</span>
                          </span>
                        ) : (
                          <span className="font-semibold text-[#133C42] dark:text-[#B3DEE2]">
                            Trợ lí gợi ý
                          </span>
                        )}
                        {m.loaiCauHoi && (m.visibleToStudent || !requireApproval) && (
                          <span className="text-slate-500 dark:text-slate-400">
                            · {QUESTION_BADGES[m.loaiCauHoi]}
                          </span>
                        )}
                      </div>

                      {!m.visibleToStudent && requireApproval ? (
                        <p className="text-sm italic text-slate-600 dark:text-slate-300">
                          Tin nhắn gợi mở đang chờ thầy/cô xem trước khi hiển thị cho em.
                        </p>
                      ) : m.nhayCam || m.status === "chuyển tư vấn" ? (
                        <div className="p-3 rounded-xl bg-[#EFCFE3]/40 dark:bg-[#E27396]/15 border border-[#EA9AB2] dark:border-[#E27396]/40 space-y-1.5">
                          <p className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2] flex items-center gap-1.5">
                            <HeartHandshake className="w-4 h-4" />
                            <span>Mời em trao đổi trực tiếp cùng thầy/cô</span>
                          </p>
                          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                            {displayText}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm sm:text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">
                          {displayText}
                        </p>
                      )}

                      {m.teacherEncouragement && (
                        <div className="p-3 rounded-xl bg-[#EAF2D7]/70 dark:bg-[#EAF2D7]/10 border border-[#EAF2D7] dark:border-slate-700 text-sm text-[#223A1E] dark:text-[#EAF2D7]">
                          <span className="font-semibold">
                            Lời nhắn của thầy/cô:{" "}
                          </span>
                          {m.teacherEncouragement}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Live streaming reply bubble */}
            {pendingUserText && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[88%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-[#EFCFE3]/60 dark:bg-[#E27396]/20 border border-[#EA9AB2]/50 dark:border-[#E27396]/40 px-4 py-3 space-y-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Em · Vừa gửi
                    </p>
                    <p className="text-sm sm:text-[15px] leading-relaxed text-[#1D242B] dark:text-white">
                      {pendingUserText}
                    </p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[92%] sm:max-w-[80%] rounded-2xl rounded-tl-sm bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 px-4 py-3.5 space-y-2">
                    <span className="text-xs font-semibold text-[#133C42] dark:text-[#B3DEE2]">
                      {requireApproval
                        ? "Đang gửi tới thầy/cô xem trước..."
                        : "Trợ lí đang lắng nghe và viết câu hỏi..."}
                    </span>
                    {!requireApproval && (
                      <p
                        aria-live="polite"
                        className="text-sm sm:text-[15px] leading-relaxed text-slate-800 dark:text-slate-100"
                      >
                        {streamingReply || "..."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-700 text-xs sm:text-sm text-rose-800 dark:text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5"
        >
          <input
            type="text"
            aria-label="Nhập điều em đang băn khoăn"
            disabled={!isOnline}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isOnline
                ? "Viết điều em đang băn khoăn..."
                : "Cần có mạng để gửi câu hỏi cho Trợ lí AI..."
            }
            className="flex-1 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] disabled:opacity-60 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
          />
          <button
            type="submit"
            disabled={!isOnline || sending || !input.trim()}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-50 text-[#1D1519] text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>
              {!isOnline
                ? "Cần có mạng"
                : sending
                ? "Đang gửi..."
                : "Gửi suy nghĩ"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
