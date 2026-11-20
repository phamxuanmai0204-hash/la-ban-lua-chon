import React, { useState } from "react";
import { CompassMark } from "./CompassLogo";
import { ShieldCheck, GraduationCap, Users, HeartHandshake, ArrowRight, Check } from "lucide-react";
import { StudentProfileData, UserRole } from "../types";

interface RoleSelectProps {
  students: StudentProfileData[];
  consentAccepted: boolean;
  onAcceptConsent: () => void;
  onSelectRole: (role: UserRole, studentId?: string) => void;
}

export const RoleSelect: React.FC<RoleSelectProps> = ({
  students,
  consentAccepted,
  onAcceptConsent,
  onSelectRole,
}) => {
  const featuredStudents = students.slice(0, 4); // HS A, HS B, HS C, HS D
  const [selectedStudentId, setSelectedStudentId] = useState<string>("HS A");
  const [pendingAction, setPendingAction] = useState<{ role: UserRole; studentId?: string } | null>(null);
  const [imgError, setImgError] = useState(false);

  const handleEnterRole = (role: UserRole, studentId?: string) => {
    if (!consentAccepted) {
      setPendingAction({ role, studentId });
      return;
    }
    onSelectRole(role, studentId);
  };

  const confirmConsentAndContinue = () => {
    onAcceptConsent();
    if (pendingAction) {
      onSelectRole(pendingAction.role, pendingAction.studentId);
      setPendingAction(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 sm:py-10">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 space-y-10">
        {/* Hero Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="flex items-center gap-2.5 text-sm font-medium text-[#2A7F7F] dark:text-[#6EE7E7]">
              <CompassMark className="w-6 h-6 text-[#1F3A5F] dark:text-[#F0B44A]" />
              <span>Hệ thống hỗ trợ ra quyết định cho học sinh lớp 9</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#1F3A5F] dark:text-slate-50 leading-tight">
              La Bàn Lựa Chọn
            </h1>

            <blockquote className="font-editorial text-lg sm:text-xl italic text-slate-700 dark:text-slate-200 leading-relaxed max-w-xl">
              “La bàn không đi thay người đi đường. Nó giúp em biết mình đang ở đâu và nên hướng về phía nào.”
            </blockquote>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Không chấm điểm, không xếp hạng, không quyết định thay. Ứng dụng đồng hành cùng học sinh, gia đình và thầy cô qua quy trình 5 bước:{" "}
              <span className="font-semibold text-[#1F3A5F] dark:text-[#F0B44A]">
                THU · LỌC · THỬ · CHỐT · CAM KẾT
              </span>
              .
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span>Dữ liệu mẫu – minh họa (45 học sinh lớp 9A1)</span>
              <span aria-hidden="true">·</span>
              <span>Kí hiệu ẩn danh HS A, HS B…</span>
              <span aria-hidden="true">·</span>
              <span>Bản demo không cần mật khẩu</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="h-full min-h-[240px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#182334] shadow-sm">
              {!imgError ? (
                <img
                  src="/src/assets/images/compass_welcome_hero_1795158414664.jpg"
                  alt="Minh họa chiếc la bàn bằng đồng đặt trên cuốn sổ hành trình hướng nghiệp"
                  className="w-full h-full object-cover min-h-[240px] max-h-[360px] lg:max-h-none"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#1F3A5F]/10 via-[#2A7F7F]/10 to-[#E0A030]/15 text-center">
                  <CompassMark className="w-16 h-16 text-[#1F3A5F] dark:text-[#F0B44A] mb-3" />
                  <p className="text-sm font-medium text-[#1F3A5F] dark:text-slate-200">
                    La Bàn Lựa Chọn · 5 bước định hướng sau THCS
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Role Selector */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#1F3A5F] dark:text-slate-100">
                Chọn vai trò để bắt đầu trải nghiệm
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Chọn hồ sơ mẫu hoặc vai trò tương ứng để xem đầy đủ quy trình phối hợp ba bên.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Student Role Card */}
            <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#1F3A5F]/10 dark:bg-[#2A7F7F]/25 text-[#1F3A5F] dark:text-[#6EE7E7] flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">Học sinh lớp 9</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tự soi chiếu năng lực, khám phá bản đồ lộ trình, đặt tiêu chí đủ tốt, ghi nhật ký trải nghiệm và trò chuyện cùng trợ lí đặt câu hỏi.
                </p>

                <div className="pt-2 space-y-2">
                  <label
                    htmlFor="demo-student-select"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-300"
                  >
                    Chọn hồ sơ học sinh mẫu:
                  </label>
                  <select
                    id="demo-student-select"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-[#F7F9FB] dark:bg-slate-800 px-3 py-2 text-sm text-[#14263E] dark:text-slate-100 focus-visible:outline-2 focus-visible:outline-[#1F3A5F]"
                  >
                    {featuredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} · Bước {s.currentStep} {s.id === "HS A" ? "(Đang phân vân)" : s.id === "HS B" ? "(Đã chốt nghề Điện)" : s.id === "HS C" ? "(Đã chốt May thiết kế)" : "(Đã chốt THPT)"}
                      </option>
                    ))}
                    {students.slice(4, 15).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} · Bước {s.currentStep}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleEnterRole("student", selectedStudentId)}
                className="w-full min-h-[44px] rounded-xl bg-[#E0A030] hover:bg-[#d19225] text-[#14263E] font-semibold text-sm px-4 py-2.5 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Vào góc Học sinh</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Teacher Role Card */}
            <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#2A7F7F]/12 dark:bg-[#2A7F7F]/25 text-[#2A7F7F] dark:text-[#6EE7E7] flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">Giáo viên</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Theo dõi 45 học sinh, duyệt câu hỏi từ trợ lí AI, đánh giá định tính 4 mức trước – sau, xếp lịch họp ba bên và cập nhật thông tin nhà trường.
                </p>
                <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p>• Quản lí nhóm trọng tâm & dấu hiệu cần chú ý</p>
                  <p>• Xuất bảng đánh giá ẩn danh ra file CSV</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleEnterRole("teacher")}
                className="w-full min-h-[44px] rounded-xl bg-[#1F3A5F] hover:bg-[#162b47] dark:bg-[#2A7F7F] dark:hover:bg-[#236a6a] text-white font-semibold text-sm px-4 py-2.5 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Vào bảng Giáo viên</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Parent Role Card */}
            <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#E0A030]/15 text-[#9a6708] dark:text-[#F0B44A] flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">Phụ huynh</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Xem hồ sơ và nhật ký của con (khi con bật chia sẻ), đọc thông tin về đường liên thông sau học nghề, xem lịch họp ba bên và xác nhận phiếu cam kết.
                </p>
                <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p>• Tôn trọng quyền riêng tư của học sinh</p>
                  <p>• Đồng hành cùng con và giáo viên chủ nhiệm</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleEnterRole("parent")}
                className="w-full min-h-[44px] rounded-xl border border-[#1F3A5F] dark:border-slate-500 text-[#1F3A5F] dark:text-slate-100 hover:bg-[#1F3A5F]/5 dark:hover:bg-slate-800 font-semibold text-sm px-4 py-2.5 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Vào góc Phụ huynh</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Privacy Notice Inline Summary */}
        <section className="bg-white/70 dark:bg-[#182334]/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2A7F7F] dark:text-[#6EE7E7] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-[#1F3A5F] dark:text-slate-100">Nguyên tắc bảo vệ quyền riêng tư:</strong>{" "}
              Học sinh dùng kí hiệu ẩn danh (HS A, HS B…) khi xuất dữ liệu. Phụ huynh chỉ xem được hồ sơ khi học sinh chủ động bật quyền chia sẻ. Ứng dụng không chấm điểm và không so sánh học sinh với nhau.
            </div>
          </div>
          {consentAccepted ? (
            <span className="text-xs font-medium text-[#2A7F7F] dark:text-[#6EE7E7] whitespace-nowrap shrink-0 flex items-center gap-1">
              <Check className="w-4 h-4" /> Đã đồng ý tham gia
            </span>
          ) : (
            <button
              type="button"
              onClick={onAcceptConsent}
              className="text-xs font-semibold text-[#1F3A5F] dark:text-[#F0B44A] underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Xem & đồng ý quy tắc
            </button>
          )}
        </section>
      </div>

      {/* First-time Consent & Privacy Modal */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-dialog-title"
        >
          <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2A7F7F]/15 text-[#2A7F7F] dark:text-[#6EE7E7] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 id="consent-dialog-title" className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
                Đồng ý tham gia & Quyền riêng tư
              </h2>
            </div>

            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Chào mừng bạn đến với <strong>La Bàn Lựa Chọn</strong>. Trước khi bắt đầu, hãy cùng thống nhất 4 cam kết an toàn sau:
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <strong>Không chấm điểm, không phán xét:</strong> Mọi đánh giá chỉ dùng câu chữ mô tả sự tiến bộ, không có điểm số hay xếp hạng.
                </li>
                <li>
                  <strong>Quyền tự chủ của học sinh:</strong> Trợ lí và người lớn chỉ đặt câu hỏi gợi mở, không chọn thay em.
                </li>
                <li>
                  <strong>Quyền riêng tư:</strong> Dữ liệu hiển thị dưới kí hiệu ẩn danh (HS A, HS B…). Phụ huynh chỉ xem hồ sơ khi em bật nút “Chia sẻ với phụ huynh”.
                </li>
                <li>
                  <strong>Dữ liệu mẫu minh họa:</strong> Bản demo đang hiển thị dữ liệu mẫu của lớp 9A1 và lưu thay đổi ngay trên trình duyệt này.
                </li>
              </ul>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={confirmConsentAndContinue}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#E0A030] hover:bg-[#d19225] text-[#14263E] text-sm font-semibold cursor-pointer"
              >
                Tôi hiểu và đồng ý tham gia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
