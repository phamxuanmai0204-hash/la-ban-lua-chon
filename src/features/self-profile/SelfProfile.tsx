import React from "react";
import { User, Home } from "lucide-react";
import type { Student } from "../../types";
import { InterestQuiz } from "./InterestQuiz";

interface SelfProfileProps {
  student: Student;
  isTeacherEditing?: boolean;
  onUpdateStudent: (updated: Student) => void;
}

export const SelfProfile: React.FC<SelfProfileProps> = ({
  student,
  isTeacherEditing = false,
  onUpdateStudent,
}) => {
  const { profile } = student;

  const handleConditionChange = (
    field: keyof Student["profile"]["conditions"],
    value: string
  ) => {
    onUpdateStudent({
      ...student,
      profile: {
        ...profile,
        conditions: {
          ...profile.conditions,
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#B3DEE2]/35 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2] dark:border-slate-700 rounded-2xl p-5 sm:p-6">
        <p className="text-xs font-semibold text-[#133C42] dark:text-[#B3DEE2] mb-1">
          Câu hỏi then chốt để soi chiếu bản thân
        </p>
        <h2 className="text-lg sm:text-xl font-bold text-[#1D242B] dark:text-white leading-snug">
          &ldquo;Em thực sự giỏi ở việc gì, thích việc gì, và gia đình em có thể hỗ trợ đến đâu?&rdquo;
        </h2>
      </div>

      {/* Layer 1: Abilities */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF2D7] dark:bg-[#EAF2D7]/15 flex items-center justify-center text-[#223A1E] dark:text-[#EAF2D7]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold">Lớp 1. Năng lực của em</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Diễn đạt bằng lời những việc em làm tốt và những phần còn gặp khó khăn — không dùng điểm số.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
              Nhận xét của thầy/cô
            </label>
            {isTeacherEditing ? (
              <textarea
                rows={4}
                value={profile.abilitiesTeacherNote}
                onChange={(e) =>
                  onUpdateStudent({
                    ...student,
                    profile: { ...profile, abilitiesTeacherNote: e.target.value },
                  })
                }
                placeholder="Nhập nhận xét bằng lời về điểm mạnh, nhịp độ tiếp thu và thao tác thực hành của em..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#E27396]"
              />
            ) : (
              <div className="rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200 min-h-[108px]">
                {profile.abilitiesTeacherNote ||
                  "Thầy/cô sẽ cập nhật nhận xét bằng lời tại đây."}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="student-abilities-self"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Em tự nhìn nhận về mình
            </label>
            <textarea
              id="student-abilities-self"
              rows={4}
              value={profile.abilitiesStudentSelf}
              onChange={(e) =>
                onUpdateStudent({
                  ...student,
                  profile: { ...profile, abilitiesStudentSelf: e.target.value },
                })
              }
              placeholder="Ví dụ: Em làm tốt các việc cần đôi tay khéo léo, hoặc em thấy mình học ổn hơn khi được thực hành..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#E27396]"
            />
          </div>
        </div>
      </section>

      <InterestQuiz student={student} onUpdateStudent={onUpdateStudent} />

      {/* Layer 3: Practical Conditions */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B3DEE2]/50 dark:bg-[#B3DEE2]/15 flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2]">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold">
              Lớp 3. Điều kiện thực tế của em và gia đình
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Mô tả chân thực giúp em chọn hướng đi bền vững và nhẹ gánh cho gia đình.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="cond-commute"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Khoảng cách đi lại phù hợp
            </label>
            <input
              id="cond-commute"
              type="text"
              value={profile.conditions.commuteDistance}
              onChange={(e) => handleConditionChange("commuteDistance", e.target.value)}
              placeholder="Ví dụ: Gần nhà, đi xe đạp hoặc xe buýt ngắn"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cond-finance"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Khả năng tài chính gia đình (mô tả)
            </label>
            <input
              id="cond-finance"
              type="text"
              value={profile.conditions.familyFinance}
              onChange={(e) => handleConditionChange("familyFinance", e.target.value)}
              placeholder="Ví dụ: Vừa phải / Cần tiết kiệm chi phí"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cond-indep"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Mong muốn sớm tự lập
            </label>
            <input
              id="cond-indep"
              type="text"
              value={profile.conditions.earlyIndependence}
              onChange={(e) => handleConditionChange("earlyIndependence", e.target.value)}
              placeholder="Ví dụ: Muốn sớm có nghề đi làm phụ gia đình"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cond-health"
              className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Lưu ý về sức khỏe
            </label>
            <input
              id="cond-health"
              type="text"
              value={profile.conditions.healthNote}
              onChange={(e) => handleConditionChange("healthNote", e.target.value)}
              placeholder="Ví dụ: Sức khỏe ổn định, không đi xa giờ cao điểm"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
