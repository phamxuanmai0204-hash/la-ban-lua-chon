import React from "react";
import { HOLLAND_OPTIONS } from "../data/seedData";
import { StudentProfileData } from "../types";
import { Compass, Sparkles, UserCheck, MapPin } from "lucide-react";

interface SelfProfileProps {
  student: StudentProfileData;
  isTeacherReadingTogether?: boolean;
  onUpdateStudent: (updated: StudentProfileData) => void;
  onGoToPathways?: () => void;
}

export const SelfProfile: React.FC<SelfProfileProps> = ({
  student,
  isTeacherReadingTogether = false,
  onUpdateStudent,
  onGoToPathways,
}) => {
  const toggleHolland = (optionId: string) => {
    const exists = student.selectedHollandAnswers.includes(optionId);
    const next = exists
      ? student.selectedHollandAnswers.filter((id) => id !== optionId)
      : [...student.selectedHollandAnswers, optionId];
    onUpdateStudent({
      ...student,
      selectedHollandAnswers: next,
    });
  };

  const selectedNarratives = HOLLAND_OPTIONS.filter((opt) =>
    student.selectedHollandAnswers.includes(opt.id)
  );

  return (
    <div className="space-y-6">
      {/* Key Question Banner */}
      <div className="bg-[#1F3A5F] text-white dark:bg-[#182334] dark:border dark:border-slate-700 rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Compass className="w-6 h-6 text-[#F0B44A] shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#F0B44A]">Câu hỏi soi chiếu bản thân</p>
            <h2 className="text-lg sm:text-xl font-bold leading-snug">
              “Em thực sự giỏi ở việc gì, thích việc gì, và gia đình em có thể hỗ trợ đến đâu?”
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 dark:text-slate-300">
              Không có đúng hay sai, không có điểm số. Hãy viết chân thật về chính mình để làm gốc trước khi chọn hướng đi.
            </p>
          </div>
        </div>
      </div>

      {/* Layer 1: Năng lực */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <UserCheck className="w-5 h-5 text-[#2A7F7F] dark:text-[#6EE7E7]" />
          <h3 className="text-base sm:text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
            Lớp 1 · Năng lực của em (diễn đạt bằng lời)
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label
              htmlFor="teacher-ability-note"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Nhận xét của thầy cô {isTeacherReadingTogether ? "(Giáo viên chỉnh sửa)" : "(Chỉ đọc)"}
            </label>
            {isTeacherReadingTogether ? (
              <textarea
                id="teacher-ability-note"
                rows={4}
                value={student.teacherAbilityNote}
                onChange={(e) =>
                  onUpdateStudent({ ...student, teacherAbilityNote: e.target.value })
                }
                placeholder="Nhập nhận xét năng lực bằng lời (tránh liệt kê điểm số)..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-[#F7F9FB] dark:bg-slate-800 px-3.5 py-2.5 text-sm text-[#14263E] dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-[#1F3A5F]"
              />
            ) : (
              <div className="rounded-xl bg-[#F7F9FB] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed min-h-[108px]">
                {student.teacherAbilityNote || "Thầy cô sẽ cập nhật nhận xét bằng lời sau buổi trao đổi."}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="student-ability-note"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Em tự nhận xét về mình
            </label>
            <textarea
              id="student-ability-note"
              rows={4}
              value={student.studentAbilityNote}
              onChange={(e) =>
                onUpdateStudent({ ...student, studentAbilityNote: e.target.value })
              }
              placeholder="Ví dụ: Em làm tốt các việc cần đôi tay khéo léo, nhưng hay nản khi phải ghi nhớ nhiều..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-[#14263E] dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-[#1F3A5F]"
            />
          </div>
        </div>
      </section>

      {/* Layer 2: Hứng thú Holland */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#E0A030]" />
            <h3 className="text-base sm:text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
              Lớp 2 · Hứng thú nghề nghiệp (gợi mở theo 6 nhóm Holland)
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Chọn những hoạt động em thấy mình hứng thú
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {HOLLAND_OPTIONS.map((opt) => {
            const checked = student.selectedHollandAnswers.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleHolland(opt.id)}
                className={`text-left rounded-xl border p-3.5 transition-colors flex items-start gap-3 min-h-[56px] cursor-pointer ${
                  checked
                    ? "bg-[#2A7F7F]/10 border-[#2A7F7F] dark:bg-[#2A7F7F]/25 dark:border-[#6EE7E7]"
                    : "bg-[#F7F9FB] dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 text-xs font-bold ${
                    checked
                      ? "bg-[#2A7F7F] border-[#2A7F7F] text-white"
                      : "border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-900"
                  }`}
                  aria-hidden="true"
                >
                  {checked ? "✓" : ""}
                </span>
                <span className="space-y-1">
                  <span className="block text-xs font-semibold text-[#2A7F7F] dark:text-[#6EE7E7]">
                    Nhóm {opt.group}
                  </span>
                  <span className="block text-sm text-[#14263E] dark:text-slate-100 leading-snug">
                    {opt.prompt}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Descriptive Narrative Result (NO SCORES) */}
        <div className="rounded-xl bg-[#F7F9FB] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <p className="text-xs font-semibold text-[#1F3A5F] dark:text-[#F0B44A]">
            Gợi ý mô tả từ những điều em vừa chọn:
          </p>
          {selectedNarratives.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Em hãy chạm chọn ít nhất một hoạt động phía trên để thấy bức tranh sở thích của mình nhé.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-200">
              {selectedNarratives.map((item) => (
                <li key={item.id}>• {item.narrativeResult}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Layer 3: Điều kiện thực tế */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-[#1F3A5F] dark:text-[#F0B44A]" />
          <h3 className="text-base sm:text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
            Lớp 3 · Điều kiện thực tế của em và gia đình
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="cond-travel" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Khoảng cách & việc đi lại
            </label>
            <input
              id="cond-travel"
              type="text"
              value={student.conditions.travelDistance}
              onChange={(e) =>
                onUpdateStudent({
                  ...student,
                  conditions: { ...student.conditions, travelDistance: e.target.value },
                })
              }
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-[#14263E] dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cond-finance" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Khả năng tài chính gia đình (mô tả)
            </label>
            <input
              id="cond-finance"
              type="text"
              value={student.conditions.familyFinance}
              onChange={(e) =>
                onUpdateStudent({
                  ...student,
                  conditions: { ...student.conditions, familyFinance: e.target.value },
                })
              }
              placeholder="Ví dụ: Vừa phải / Cần tiết kiệm chi phí..."
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-[#14263E] dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cond-indep" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Mong muốn tự lập / phụ giúp gia đình
            </label>
            <input
              id="cond-indep"
              type="text"
              value={student.conditions.earlyIndependence}
              onChange={(e) =>
                onUpdateStudent({
                  ...student,
                  conditions: { ...student.conditions, earlyIndependence: e.target.value },
                })
              }
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-[#14263E] dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cond-health" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Sức khỏe & lưu ý riêng
            </label>
            <input
              id="cond-health"
              type="text"
              value={student.conditions.healthNote}
              onChange={(e) =>
                onUpdateStudent({
                  ...student,
                  conditions: { ...student.conditions, healthNote: e.target.value },
                })
              }
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-[#14263E] dark:text-slate-100"
            />
          </div>
        </div>

        {onGoToPathways && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onGoToPathways}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E0A030] hover:bg-[#d19225] text-[#14263E] font-semibold text-sm cursor-pointer"
            >
              Sang Bước THU: Xem bản đồ lộ trình
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
