import React, { useState } from "react";
import { AIReviewItem, StudentProfileData, TryActivity } from "../types";
import { Calendar, MapPin, PenLine, CheckCircle2, MessageSquareText, AlertCircle } from "lucide-react";

interface TryAndJournalProps {
  student: StudentProfileData;
  tryActivities: TryActivity[];
  aiQueue: AIReviewItem[];
  requireTeacherPreApproval: boolean;
  onRegisterActivity: (activityId: string) => void;
  onSubmitActivityReflection: (activityId: string, reflection: string) => void;
  onAddJournalEntry: (activityType: string, reflection: string) => Promise<void>;
  onGoToCommit: () => void;
}

const JOURNAL_TYPES = [
  "Suy nghĩ cá nhân",
  "Tham quan xưởng thực hành",
  "Giao lưu người làm nghề",
  "Bài tập tình huống nghề",
  "Trao đổi cùng bố mẹ",
];

export const TryAndJournal: React.FC<TryAndJournalProps> = ({
  student,
  tryActivities,
  aiQueue,
  requireTeacherPreApproval,
  onRegisterActivity,
  onSubmitActivityReflection,
  onAddJournalEntry,
  onGoToCommit,
}) => {
  const [activityType, setActivityType] = useState(JOURNAL_TYPES[0]);
  const [reflectionText, setReflectionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReflectionId, setActiveReflectionId] = useState<string | null>(null);
  const [activityReflectionText, setActivityReflectionText] = useState("");

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddJournalEntry(activityType, reflectionText.trim());
      setReflectionText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRegistration = (activityId: string) =>
    student.tryRegistrations.find((r) => r.activityId === activityId);

  return (
    <div className="space-y-6">
      {/* Trải nghiệm THỬ */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
            Trải nghiệm THỬ (do thầy cô tổ chức)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Chạm vào hoạt động để đăng kí tham gia trực tiếp và ghi lại cảm nhận thực tế của chính em.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tryActivities.map((act) => {
            const reg = getRegistration(act.id);
            const isWriting = activeReflectionId === act.id;

            return (
              <div
                key={act.id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FB] dark:bg-slate-800/50 p-4 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#2A7F7F] dark:text-[#6EE7E7] font-medium">
                    <span>{act.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {act.date}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1F3A5F] dark:text-slate-100 leading-snug">
                    {act.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{act.location}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {act.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  {!reg ? (
                    <button
                      type="button"
                      onClick={() => onRegisterActivity(act.id)}
                      className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#E0A030] hover:bg-[#d19225] text-[#14263E] text-sm font-semibold cursor-pointer"
                    >
                      Đăng kí tham gia
                    </button>
                  ) : reg.status === "Đã đăng kí" && !isWriting ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#2A7F7F] dark:text-[#6EE7E7] flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Đã đăng kí tham gia
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReflectionId(act.id);
                          setActivityReflectionText(reg.reflection ?? "");
                        }}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#1F3A5F] dark:bg-[#2A7F7F] text-white text-xs font-semibold cursor-pointer"
                      >
                        Viết cảm nhận sau khi đi
                      </button>
                    </div>
                  ) : isWriting ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={activityReflectionText}
                        onChange={(e) => setActivityReflectionText(e.target.value)}
                        placeholder="Em thấy điều gì thú vị hoặc còn băn khoăn sau trải nghiệm này?"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-3 text-sm text-[#14263E] dark:text-slate-100"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveReflectionId(null)}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-medium cursor-pointer"
                        >
                          Đóng
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!activityReflectionText.trim()) return;
                            onSubmitActivityReflection(act.id, activityReflectionText.trim());
                            setActiveReflectionId(null);
                          }}
                          className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#2A7F7F] text-white text-xs font-semibold cursor-pointer"
                        >
                          Lưu cảm nhận
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[#2A7F7F] dark:text-[#6EE7E7] flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Đã tham gia trải nghiệm
                      </p>
                      {reg.reflection && (
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 italic">
                          “{reg.reflection}”
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Nhật ký lựa chọn */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <PenLine className="w-5 h-5 text-[#1F3A5F] dark:text-[#F0B44A]" />
          <div>
            <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
              Nhật ký lựa chọn của em
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Ghi lại suy nghĩ thật sau mỗi buổi trải nghiệm hoặc trao đổi. Trợ lí sẽ đặt 1 câu hỏi gợi mở giúp em tự đối chiếu.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveJournal} className="space-y-3 bg-[#F7F9FB] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="journal-type" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Loại hoạt động
              </label>
              <select
                id="journal-type"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-[#14263E] dark:text-slate-100"
              >
                {JOURNAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="journal-text" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Suy nghĩ, cảm nhận của em hôm nay
              </label>
              <textarea
                id="journal-text"
                rows={3}
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Ví dụ: Hôm nay em đi tham quan xưởng nghề về thấy cũng hợp, nhưng biết đâu trường kia tốt hơn..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-3 text-sm text-[#14263E] dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !reflectionText.trim()}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#E0A030] hover:bg-[#d19225] disabled:opacity-50 text-[#14263E] text-sm font-semibold cursor-pointer"
            >
              {isSubmitting ? "Đang lưu và tạo câu hỏi gợi mở..." : "Lưu nhật ký"}
            </button>
          </div>
        </form>

        {/* Journal Timeline */}
        <div className="space-y-4">
          {student.journal.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
              Em chưa viết mục nhật ký nào. Hãy ghi lại cảm nhận đầu tiên phía trên nhé.
            </p>
          ) : (
            student.journal.map((entry) => {
              const linkedReview = entry.aiPromptId
                ? aiQueue.find((r) => r.id === entry.aiPromptId)
                : undefined;

              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-[#1F3A5F] dark:text-slate-200">{entry.date}</span>
                    <span aria-hidden="true">·</span>
                    <span>{entry.activityType}</span>
                  </div>
                  <p className="text-sm text-[#14263E] dark:text-slate-100 leading-relaxed">
                    {entry.reflection}
                  </p>

                  {linkedReview && (
                    <div className="rounded-xl bg-[#2A7F7F]/8 dark:bg-[#2A7F7F]/20 border border-[#2A7F7F]/30 p-3.5 space-y-2">
                      {!linkedReview.visibleToStudent && requireTeacherPreApproval && linkedReview.status === "Chờ duyệt" ? (
                        <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-[#E0A030] shrink-0" />
                          <span>Câu hỏi gợi mở đang chờ thầy/cô xem trước khi hiển thị cho em.</span>
                        </p>
                      ) : linkedReview.nhayCam ? (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-[#2A7F7F] dark:text-[#6EE7E7]">
                            Lời nhắn đồng hành
                          </p>
                          <p className="text-sm text-[#14263E] dark:text-slate-100 leading-relaxed">
                            Mình lắng nghe thấy em đang có nhiều áp lực lúc này. Em hãy chia sẻ trực tiếp với thầy cô chủ nhiệm để được hỗ trợ kịp thời nhé.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-[#2A7F7F] dark:text-[#6EE7E7] flex items-center gap-1.5">
                              <MessageSquareText className="w-3.5 h-3.5" />
                              {linkedReview.status === "Chờ duyệt" ? "Trợ lí gợi ý" : "Thầy/cô đã xem"}
                            </span>
                          </div>
                          <p className="text-sm text-[#14263E] dark:text-slate-100 leading-relaxed">
                            {linkedReview.teacherEditedReply ?? linkedReview.aiReply}
                          </p>
                          {linkedReview.teacherEncouragement && (
                            <p className="text-xs text-[#1F3A5F] dark:text-[#F0B44A] font-medium pt-1">
                              Lời nhắn từ thầy/cô: “{linkedReview.teacherEncouragement}”
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onGoToCommit}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1F3A5F] hover:bg-[#162b47] dark:bg-[#2A7F7F] text-white text-sm font-semibold cursor-pointer"
          >
            Sang Bước CHỐT & CAM KẾT
          </button>
        </div>
      </section>
    </div>
  );
};
