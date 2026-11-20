import React, { useState } from "react";
import { MeetingRecord, StudentProfileData } from "../types";
import { ThreePartyMeeting } from "./ThreePartyMeeting";
import { formatNowVi } from "../services/storage";
import { Lock, BookOpen, CheckCircle2, FileCheck2, Compass } from "lucide-react";

interface ParentViewProps {
  students: StudentProfileData[];
  meetings: MeetingRecord[];
  onUpdateStudent: (updated: StudentProfileData) => void;
  onUpdateMeeting: (updated: MeetingRecord) => void;
}

export const ParentView: React.FC<ParentViewProps> = ({
  students,
  meetings,
  onUpdateStudent,
  onUpdateMeeting,
}) => {
  const [selectedChildId, setSelectedChildId] = useState<string>("HS B");
  const child = students.find((s) => s.id === selectedChildId) ?? students[0];

  if (!child) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Child Selector */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1F3A5F] dark:text-slate-100">
            Góc đồng hành của Phụ huynh
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            Dữ liệu mẫu – minh họa · Nơi bố mẹ lắng nghe lựa chọn của con và đồng hành cùng thầy cô.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label htmlFor="parent-child-select" className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Hồ sơ của con:
          </label>
          <select
            id="parent-child-select"
            value={child.id}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-600 bg-[#F7F9FB] dark:bg-slate-800 px-3 text-sm font-semibold text-[#1F3A5F] dark:text-slate-100"
          >
            {students.slice(0, 6).map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.shareWithParent ? "Đã bật chia sẻ" : "Chưa bật chia sẻ"}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Child's Profile & Journal (Strictly gated by shareWithParent) */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-[#2A7F7F] dark:text-[#6EE7E7]" />
          <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
            Hồ sơ và Nhật ký của {child.id}
          </h2>
        </div>

        {!child.shareWithParent ? (
          <div className="rounded-xl bg-[#F7F9FB] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-6 flex items-start gap-3">
            <Lock className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-[#1F3A5F] dark:text-slate-100">
                Con chưa bật quyền “Chia sẻ với phụ huynh” cho hồ sơ này
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Để tôn trọng quyền riêng tư và sự tự chủ của con khi mới bắt đầu suy nghĩ, phụ huynh chỉ xem được hồ sơ chi tiết và nhật ký khi con chủ động bật nút chia sẻ (ví dụ, quý phụ huynh có thể thử chuyển sang hồ sơ <strong>HS B</strong> hoặc <strong>HS C</strong>, hoặc vào góc Học sinh bật chia sẻ cho {child.id}).
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-[#F7F9FB] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 space-y-1.5">
                <p className="text-xs font-semibold text-[#2A7F7F] dark:text-[#6EE7E7]">
                  Nhận xét năng lực của thầy cô
                </p>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  {child.teacherAbilityNote}
                </p>
              </div>
              <div className="rounded-xl bg-[#F7F9FB] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 space-y-1.5">
                <p className="text-xs font-semibold text-[#1F3A5F] dark:text-[#F0B44A]">
                  Điều con tự chia sẻ về mình & tiêu chí
                </p>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                  {child.studentAbilityNote}
                </p>
                {child.criteria.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                    Tiêu chí con tự đặt: {child.criteria.join(" · ")}
                  </p>
                )}
              </div>
            </div>

            {/* Journal reflections */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-[#1F3A5F] dark:text-slate-100">
                Nhật ký trải nghiệm con đã chia sẻ
              </h3>
              {child.journal.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Con chưa viết mục nhật ký nào.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {child.journal.map((j) => (
                    <div
                      key={j.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 text-sm space-y-1"
                    >
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {j.date} · {j.activityType}
                      </p>
                      <p className="text-[#14263E] dark:text-slate-100 leading-relaxed">
                        {j.reflection}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Parent Commitment Confirmation */}
            <div className="rounded-xl border-2 border-[#2A7F7F]/35 bg-[#2A7F7F]/8 dark:bg-[#2A7F7F]/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 font-bold text-[#1F3A5F] dark:text-slate-100">
                  <FileCheck2 className="w-5 h-5 text-[#2A7F7F] dark:text-[#6EE7E7]" />
                  <span>Phiếu cam kết lựa chọn của {child.id}</span>
                </div>
                {child.hasLockedChoice ? (
                  <>
                    <p className="text-slate-700 dark:text-slate-200">
                      Lựa chọn: <strong>{child.commitment.chosenOptionLabel}</strong>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Lí do con viết: “{child.commitment.reasonInOwnWords}”
                    </p>
                  </>
                ) : (
                  <p className="text-slate-600 dark:text-slate-300">
                    Con đang ở bước {child.currentStep}, chưa bấm chốt phiếu cam kết.
                  </p>
                )}
              </div>

              {child.hasLockedChoice && (
                <div className="shrink-0">
                  {child.commitment.parentConfirmedAt ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2A7F7F] dark:text-[#6EE7E7]">
                      <CheckCircle2 className="w-4 h-4" />
                      Phụ huynh đã xác nhận · {child.commitment.parentConfirmedAt}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStudent({
                          ...child,
                          commitment: {
                            ...child.commitment,
                            parentConfirmedAt: formatNowVi(),
                          },
                        })
                      }
                      className="min-h-[44px] px-5 py-2 rounded-xl bg-[#E0A030] hover:bg-[#d19225] text-[#14263E] text-sm font-semibold cursor-pointer"
                    >
                      Xác nhận đồng hành cùng con
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Short Parent Article: "Học nghề rồi vẫn học lên được" */}
      <article className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2.5 text-[#1F3A5F] dark:text-[#F0B44A]">
          <BookOpen className="w-5 h-5" />
          <h2 className="text-lg font-bold">
            Bài đọc ngắn cho phụ huynh: “Học nghề rồi vẫn học lên được”
          </h2>
        </div>
        <div className="space-y-2.5 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          <p>
            Nhiều bố mẹ lo rằng nếu con không vào lớp 10 THPT công lập mà chọn Trung cấp nghề sau lớp 9 thì tương lai của con sẽ khép lại. Thực tế, học nghề hiện nay là một <strong>lộ trình mở</strong> chứ không phải đường cụt.
          </p>
          <p>
            Học sinh tốt nghiệp THCS vào học Trung cấp nghề có thể học song song chương trình văn hóa THPT. Khi hoàn thành bậc Trung cấp và khối lượng kiến thức văn hóa theo quy định, các em vừa có tay nghề thực tế để đi làm sớm, vừa đủ điều kiện học liên thông lên <strong>Cao đẳng</strong> và <strong>Đại học</strong> ở bất cứ thời điểm nào các em sẵn sàng.
          </p>
          <p>
            Điều quan trọng nhất ở tuổi 15 là giúp con tìm một lựa chọn vừa sức, đỡ áp lực thi cử quá tải, có cơ hội thực hành đúng thế mạnh và vẫn giữ được niềm vui học tập lâu dài.
          </p>
        </div>
      </article>

      {/* Three-Party Meeting Schedule for Parent */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
          Lịch họp ba bên (Nhà trường – Gia đình – Học sinh)
        </h2>
        <ThreePartyMeeting
          role="parent"
          meetings={meetings}
          students={students}
          filterStudentId={child.id}
          onUpdateMeeting={onUpdateMeeting}
        />
      </section>
    </div>
  );
};
