import React, { useState } from "react";
import {
  Building2,
  Compass,
  GraduationCap,
  Users,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Sun,
  Moon,
  CheckCircle2,
  BookOpen,
  Database,
  Sparkles,
} from "lucide-react";
import { CompassLogo } from "./CompassLogo";
import { PWAInstallButton } from "./PWAInstallButton";
import { AccountMenu } from "./AccountMenu";
import type { AuthUser, Role, Student } from "../types";

interface RoleSelectProps {
  students: Student[];
  darkMode: boolean;
  storageKind: "local" | "firebase";
  onToggleDarkMode: () => void;
  onResetSampleData: () => void;
  onSelectRole: (role: Role, studentId: string) => void;
  onAcceptPrivacyConsent: (studentId: string) => void;
  onOpenProjectIntro: () => void;
  onOpenHowAIWorks: () => void;
  onOpenSettings: () => void;
  account?: AuthUser | null;
  offlineSession?: boolean;
  onLogout?: () => void;
  onOpenAuth: () => void;
}

export const RoleSelect: React.FC<RoleSelectProps> = ({
  students,
  darkMode,
  storageKind,
  onToggleDarkMode,
  onResetSampleData,
  onSelectRole,
  onAcceptPrivacyConsent,
  onOpenProjectIntro,
  onOpenHowAIWorks,
  onOpenSettings,
  account,
  offlineSession,
  onLogout,
  onOpenAuth,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || "hs-01"
  );
  const [selectedParentChildId, setSelectedParentChildId] = useState<string>(
    students[1]?.id || "hs-02"
  );
  const [consentStudentPending, setConsentStudentPending] =
    useState<Student | null>(null);
  const [imgError, setImgError] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(false);

  const caseStudyStudents = students.filter((s) => s.isCaseStudy);
  const otherStudents = students.filter((s) => !s.isCaseStudy);

  const handleEnterAsStudent = () => {
    const stu = students.find((s) => s.id === selectedStudentId);
    if (!stu) return;
    if (!stu.privacyConsentAccepted) {
      setConsentStudentPending(stu);
    } else {
      onSelectRole("student", stu.id);
    }
  };

  const handleConfirmConsent = () => {
    if (!consentStudentPending) return;
    onAcceptPrivacyConsent(consentStudentPending.id);
    onSelectRole("student", consentStudentPending.id);
    setConsentStudentPending(null);
  };

  const handleReset = () => {
    onResetSampleData();
    setResetFeedback(true);
    setTimeout(() => setResetFeedback(false), 2500);
  };

  if (consentStudentPending) {
    return (
      <div className="min-h-screen bg-[#FAFBFD] dark:bg-[#0F171E] flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-[#B3DEE2]/50 dark:bg-[#B3DEE2]/20 flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Đồng ý tham gia &amp; Quyền riêng tư · {consentStudentPending.code}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1D242B] dark:text-white">
                Không gian an toàn của riêng em
              </h1>
            </div>
          </div>

          <div className="space-y-4 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
            <div className="p-4 rounded-xl bg-[#EAF2D7]/60 dark:bg-[#EAF2D7]/10 border border-[#EAF2D7] dark:border-slate-700">
              <p className="font-semibold text-[#223A1E] dark:text-[#EAF2D7] mb-1">
                1. Không chấm điểm, không xếp hạng
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Ứng dụng không tính điểm số hay so sánh em với bất kì bạn nào khác. Mọi ghi nhận đều giúp em tự hiểu mình rõ hơn.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#B3DEE2]/30 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2]/60 dark:border-slate-700">
              <p className="font-semibold text-[#133C42] dark:text-[#B3DEE2] mb-1">
                2. Em làm chủ lựa chọn của mình
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Trợ lí chỉ đặt câu hỏi gợi mở, không quyết định thay em. Em tự đặt tiêu chí, tự thử trải nghiệm và tự viết lí do cho quyết định của mình.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#EFCFE3]/40 dark:bg-[#EFCFE3]/10 border border-[#EA9AB2]/50 dark:border-slate-700">
              <p className="font-semibold text-[#4A1A2C] dark:text-[#EFCFE3] mb-1">
                3. Quyền riêng tư dữ liệu
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Hồ sơ của em dùng kí hiệu ẩn danh ({consentStudentPending.anonymizedLabel}). Chỉ có em và thầy/cô phụ trách lớp xem được. Bố mẹ chỉ xem được khi em chủ động bật nút &ldquo;Chia sẻ với phụ huynh&rdquo;. Thời điểm đồng ý sẽ được lưu lại, và em luôn có quyền tải dữ liệu hoặc yêu cầu xóa dữ liệu của mình.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setConsentStudentPending(null)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={handleConfirmConsent}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Em đã hiểu và đồng ý tham gia</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFD] dark:bg-[#0F171E] text-[#1D242B] dark:text-[#EDF2F7] flex flex-col">
      {/* Clean 3-zone top bar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#17222C]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <CompassLogo size={28} />
            <span className="text-base sm:text-lg font-bold tracking-tight">
              La Bàn Lựa Chọn
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#gioi-thieu" className="hover:text-[#1D242B] dark:hover:text-white whitespace-nowrap shrink-0">
              Định hướng
            </a>
            <a href="#chon-vai-tro" className="hover:text-[#1D242B] dark:hover:text-white whitespace-nowrap shrink-0">
              Chọn vai trò
            </a>
            <a href="#quy-trinh-5-buoc" className="hover:text-[#1D242B] dark:hover:text-white whitespace-nowrap shrink-0">
              Quy trình 5 bước
            </a>
            <button
              type="button"
              onClick={onOpenProjectIntro}
              className="hover:text-[#1D242B] dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              Giới thiệu dự án
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {account && onLogout ? (
              <AccountMenu
                user={account}
                offline={offlineSession}
                onLogout={onLogout}
              />
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
            )}
            <button
              type="button"
              onClick={handleEnterAsStudent}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              Bắt đầu ngay
            </button>
          </div>
        </div>
      </header>

      {/* Workspace utility strip */}
      <div className="border-b border-slate-200/60 dark:border-slate-800/80 bg-[#B3DEE2]/20 dark:bg-[#17222C]/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <span className="text-slate-700 dark:text-slate-300">
            Dữ liệu mẫu – minh họa · 4 lớp (9A1 – 9A4) · 45 học sinh ẩn danh ·
            PIN phụ huynh mặc định 1234
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            <PWAInstallButton compact />
            <button
              type="button"
              onClick={onOpenProjectIntro}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Giới thiệu dự án</span>
            </button>
            <button
              type="button"
              onClick={onOpenHowAIWorks}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#133C42] dark:text-[#B3DEE2]" />
              <span>Cách app dùng AI</span>
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>
                Cài đặt ({storageKind === "firebase" ? "Firestore" : "Cục bộ"})
              </span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{resetFeedback ? "Đã khôi phục mẫu" : "Khôi phục dữ liệu mẫu"}</span>
            </button>
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{darkMode ? "Chế độ sáng" : "Chế độ tối"}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* Hero section */}
        <section
          id="gioi-thieu"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
        >
          <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
            <p className="text-xs sm:text-sm font-medium text-[#9D2950] dark:text-[#EA9AB2]">
              Hệ thống hỗ trợ ra quyết định hướng nghiệp cho học sinh lớp 9
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-tight">
              Tìm hướng đi phù hợp sau THCS từ chính những gì em hiểu về mình
            </h1>
            <blockquote className="font-editorial italic text-lg sm:text-xl text-slate-700 dark:text-slate-200 bg-[#EAF2D7]/65 dark:bg-[#EAF2D7]/10 border border-[#EAF2D7] dark:border-slate-700 rounded-2xl p-5">
              &ldquo;La bàn không đi thay người đi đường. Nó giúp em biết mình đang ở đâu và nên hướng về phía nào.&rdquo;
            </blockquote>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
              <span>Không chấm điểm</span>
              <span aria-hidden="true">·</span>
              <span>Không xếp hạng</span>
              <span aria-hidden="true">·</span>
              <span>Học nghề luôn có cửa liên thông</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex">
            <div className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#EFCFE3]/30 dark:bg-[#17222C] flex items-center justify-center">
              {!imgError ? (
                <img
                  src="/src/assets/images/hero_compass_journey_1795160462582.jpg"
                  alt="Minh họa chiếc la bàn và bản đồ hành trình hướng nghiệp sau lớp 9"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover min-h-[240px]"
                />
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-3 min-h-[240px]">
                  <Compass className="w-12 h-12 text-[#E27396]" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Hành trình 5 bước: Thu – Lọc – Thử – Chốt – Cam kết
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Role selection section */}
        <section id="chon-vai-tro" className="space-y-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              Chọn vai trò để trải nghiệm bản minh họa
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Phiên bản dùng thử không cần mật khẩu. Mọi thay đổi được lưu trực tiếp trên trình duyệt của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Student Card */}
            <div className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#B3DEE2]/60 dark:bg-[#B3DEE2]/20 flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2]">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Học sinh lớp 9</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Đi qua 5 bước · Nhật ký · Trợ lí AI
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Soi chiếu năng lực – sở thích, xem bản đồ lộ trình liên thông, đặt tiêu chí &ldquo;đủ tốt&rdquo; và viết lí do lựa chọn.
                </p>

                <div className="space-y-1.5">
                  <label
                    htmlFor="student-demo-select"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Chọn hồ sơ học sinh (dữ liệu mẫu)
                  </label>
                  <select
                    id="student-demo-select"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
                  >
                    <optgroup label="4 trường hợp minh họa chi tiết">
                      {caseStudyStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} ({s.anonymizedLabel}) · Bước {s.currentStep}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Các học sinh khác trong lớp (HS 05 – HS 45)">
                      {otherStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} · Bước {s.currentStep}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnterAsStudent}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Vào không gian Học sinh</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Teacher Card */}
            <div className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#EAF2D7] dark:bg-[#EAF2D7]/20 flex items-center justify-center text-[#223A1E] dark:text-[#EAF2D7]">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Giáo viên</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Chủ nhiệm · Tư vấn hướng nghiệp
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Chuyển nhanh giữa các lớp 9A1 – 9A4, xem dấu hiệu cần chú ý, duyệt phản hồi AI, đánh giá 4 mức trước – sau và cập nhật thông tin nhà trường.
                </p>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F171E] text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    Công cụ đồng hành theo từng lớp
                  </p>
                  <p>
                    Hàng chờ duyệt AI · Lịch họp ba bên · Xuất CSV ẩn danh
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectRole("teacher", selectedStudentId)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Vào bảng điều khiển Giáo viên</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Parent Card */}
            <div className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#EFCFE3] dark:bg-[#EFCFE3]/20 flex items-center justify-center text-[#4A1A2C] dark:text-[#EFCFE3]">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Phụ huynh</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Đồng hành cùng con · Họp ba bên
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Đọc hiểu về đường liên thông sau học nghề, xem hồ sơ khi con bật chia sẻ, xem lịch họp ba bên và xác nhận phiếu cam kết.
                </p>

                <div className="space-y-1.5">
                  <label
                    htmlFor="parent-demo-select"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Xem theo hồ sơ của con
                  </label>
                  <select
                    id="parent-demo-select"
                    value={selectedParentChildId}
                    onChange={(e) => setSelectedParentChildId(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
                  >
                    {caseStudyStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} ({s.shareWithParent ? "Đang chia sẻ" : "Chưa bật chia sẻ"})
                      </option>
                    ))}
                    {otherStudents.slice(0, 6).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} ({s.shareWithParent ? "Đang chia sẻ" : "Chưa bật chia sẻ"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectRole("parent", selectedParentChildId)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[#EA9AB2] bg-[#EFCFE3]/45 hover:bg-[#EFCFE3]/75 text-[#4A1A2C] dark:text-[#EDF2F7] dark:bg-[#EFCFE3]/15 dark:hover:bg-[#EFCFE3]/25 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Vào góc Phụ huynh</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* School manager Card */}
            <div className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#F3E7C9] dark:bg-[#F3E7C9]/20 flex items-center justify-center text-[#5A3A0E] dark:text-[#F3E7C9]">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Quản lý nhà trường</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tổng quan toàn trường · Mức độ tham gia
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Nhìn toàn cảnh 4 lớp: sĩ số, số giáo viên, phụ huynh đã liên
                  kết và mức độ tham gia hành trình của học sinh.
                </p>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F171E] text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    Bảng điều khiển nhà trường
                  </p>
                  <p>
                    Sĩ số theo lớp · Tiến độ 5 bước · Học sinh cần chú ý · Tài
                    khoản mới
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onSelectRole("school_admin", students[0]?.id || "hs-01")
                }
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F3E7C9] hover:bg-[#EBDCBB] text-[#5A3A0E] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Vào bảng điều khiển nhà trường</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* 5-step process overview */}
        <section
          id="quy-trinh-5-buoc"
          className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8"
        >
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold">
              Khung 5 bước đồng hành cùng học sinh lớp 9
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Giúp em từng bước gỡ rối phân vân, tìm ra phương án &ldquo;đủ tốt&rdquo; và tự tin bước tiếp.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {[
              { step: "1. THU", desc: "Tìm hiểu bản đồ các hướng đi mở và đường liên thông." },
              { step: "2. LỌC", desc: "Đặt tiêu chí vừa sức mình và lọc bớt phương án không hợp." },
              { step: "3. THỬ", desc: "Tham gia trải nghiệm thực tế và viết nhật ký cảm nhận." },
              { step: "4. CHỐT", desc: "Chọn hướng phù hợp nhất và viết lí do bằng lời của em." },
              { step: "5. CAM KẾT", desc: "Lên việc cần làm và cùng gia đình, thầy cô xác nhận." },
            ].map((item) => (
              <div
                key={item.step}
                className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-1.5"
              >
                <p className="text-sm font-bold text-[#9D2950] dark:text-[#EA9AB2]">
                  {item.step}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
