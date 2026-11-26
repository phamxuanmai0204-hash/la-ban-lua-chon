import React, { useEffect, useState } from "react";
import {
  Lock,
  BookOpen,
  Calendar,
  FileCheck2,
  CheckCircle2,
  Sun,
  Moon,
  MessageSquareHeart,
  Sparkles,
  Compass,
  Plus,
  KeyRound,
  X,
  Loader2,
  AlertCircle,
  UserRound,
  FileText,
} from "lucide-react";
import { CompassLogo } from "../../components/CompassLogo";
import { AccountMenu } from "../../components/AccountMenu";
import { StudentSummaryReport } from "../student-journey/StudentSummaryReport";
import { MAX_CHILDREN_PER_PARENT, type SchoolRoster } from "../../data/schoolClasses";
import type {
  AppSettings,
  AuthUser,
  JourneyStep,
  Meeting,
  Student,
} from "../../types";

interface ParentChildOption {
  id: string;
  label: string;
}

interface ParentViewProps {
  student: Student;
  meetings: Meeting[];
  settings: AppSettings;
  onUpdateStudent: (updated: Student) => void;
  onUpdateMeeting?: (meeting: Meeting) => void;
  onOpenHowAIWorks?: () => void;
  onToggleDarkMode: () => void;
  onExitRole: () => void;
  account?: AuthUser | null;
  offlineSession?: boolean;
  onLogout?: () => void;
  childOptions: ParentChildOption[];
  selectedChildId: string;
  onSelectChild: (studentId: string) => void;
  roster: SchoolRoster;
  onLinkChild?: (input: {
    studentId: string;
    pin: string;
  }) => Promise<void>;
}

const STEP_VERBAL_DESC: Record<
  JourneyStep,
  { title: string; meaning: string }
> = {
  THU: {
    title: "Bước 1 – THU (Thu thập thông tin)",
    meaning:
      "Con đang tìm hiểu bức tranh các hướng đi mở sau lớp 9 (THPT công lập, THPT tư thục, GDTX, Trung cấp nghề kết hợp văn hóa và Sơ cấp nghề) thay vì chỉ nghe lời đồn. Việc phân vân giữa nhiều trường THPT công lập cũng là một phần bình thường của bước này, kể cả khi con có học lực khá.",
  },
  LỌC: {
    title: "Bước 2 – LỌC (Đặt tiêu chí vừa sức)",
    meaning:
      "Con đang tự xác định những tiêu chí quan trọng với bản thân và gia đình (sức học, khoảng cách, chi phí, đường học lên) để thu hẹp xuống tối đa 3 phương án.",
  },
  THỬ: {
    title: "Bước 3 – THỬ (Trải nghiệm thực tế)",
    meaning:
      "Con đang trực tiếp tham quan, thử tình huống nghề hoặc lắng nghe người làm nghề rồi viết nhật ký cảm nhận xem mình hợp và chưa hợp ở điểm nào.",
  },
  CHỐT: {
    title: "Bước 4 – CHỐT (Chọn phương án đủ tốt)",
    meaning:
      "Con đang tổng hợp trải nghiệm để chọn một hướng đi phù hợp nhất và tự viết lí do lựa chọn bằng chính lời của mình.",
  },
  "CAM KẾT": {
    title: "Bước 5 – CAM KẾT (Lên kế hoạch hành động)",
    meaning:
      "Con đã chốt lựa chọn, lập danh sách các việc cần làm trong thời gian tới và chờ bố mẹ, thầy cô cùng xác nhận đồng hành.",
  },
};

const STEP_CONVERSATION_PROMPTS: Record<JourneyStep, string[]> = {
  THU: [
    "Con đang so sánh những trường THPT công lập nào, và điều gì khiến con khó chọn một trường?",
    "Ngoài THPT công lập, con đã tìm hiểu thêm hướng đi nào và điều gì làm con phân vân?",
    "Bố mẹ có thể cùng con hỏi thêm thầy/cô thông tin gì còn chưa rõ không?",
  ],
  LỌC: [
    "Con đặt tiêu chí gì khi chọn trường hoặc hướng đi cho mình?",
    "Trong các tiêu chí con chọn, điều nào con thấy quan trọng nhất với nhịp sống của con?",
    "Có phương án nào con vừa tự gác lại không, và điều gì giúp con nhận ra phương án đó chưa hợp?",
  ],
  THỬ: [
    "Sau buổi trải nghiệm vừa rồi, con thấy khoảnh khắc nào mình làm tự nhiên và thoải mái nhất?",
    "Có phần việc nào khi thử làm khiến con thấy ngại hoặc mất nhiều sức hơn dự tính không?",
    "Trải nghiệm vừa rồi giúp con nhìn rõ thêm điều gì về môi trường học sắp tới?",
  ],
  CHỐT: [
    "Điều gì khiến con yên tâm nhất khi chọn hướng đi này bằng chính lí do của con?",
    "Nếu thời gian đầu học tập gặp một môn hay kĩ năng khó, con dự định sẽ tìm ai hỗ trợ?",
    "Con mong gia đình đồng hành cùng con thế nào trong những tháng tới?",
  ],
  "CAM KẾT": [
    "Trong những việc nhỏ con vừa lên kế hoạch cho tuần tới, việc nào con thấy hứng thú bắt đầu nhất?",
    "Có việc nào con cần bố mẹ nhắc nhẹ hoặc cùng sắp xếp thời gian giúp con không?",
    "Khi thấy bạn bè chọn hướng khác, điều gì sẽ giúp con nhớ lại lí do ban đầu của mình?",
  ],
};

type ParentTab =
  | "progress"
  | "summary"
  | "profile"
  | "conversation"
  | "articles"
  | "meetings"
  | "commitment";

const PARENT_TABS: {
  id: ParentTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "progress", label: "Tiến trình của con", shortLabel: "Tiến trình", icon: Compass },
  { id: "summary", label: "Hồ sơ tổng hợp", shortLabel: "Hồ sơ tổng hợp", icon: FileText },
  { id: "profile", label: "Hồ sơ & nhật ký của con", shortLabel: "Hồ sơ của con", icon: UserRound },
  { id: "conversation", label: "Gợi ý trò chuyện", shortLabel: "Trò chuyện", icon: MessageSquareHeart },
  { id: "articles", label: "Bài đọc dành cho phụ huynh", shortLabel: "Bài đọc", icon: BookOpen },
  { id: "meetings", label: "Lịch họp ba bên", shortLabel: "Họp ba bên", icon: Calendar },
  { id: "commitment", label: "Phiếu cam kết", shortLabel: "Phiếu cam kết", icon: FileCheck2 },
];

export const ParentView: React.FC<ParentViewProps> = ({
  student,
  meetings,
  settings,
  onUpdateStudent,
  onUpdateMeeting,
  onOpenHowAIWorks,
  onToggleDarkMode,
  onExitRole,
  account,
  offlineSession,
  onLogout,
  childOptions,
  selectedChildId,
  onSelectChild,
  roster,
  onLinkChild,
}) => {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkChildId, setLinkChildId] = useState("");
  const [linkPin, setLinkPin] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<ParentTab>("progress");

  useEffect(() => {
    setActiveTab("progress");
  }, [selectedChildId]);

  const linkClassStudents = roster.classes.flatMap((item) => item.students);
  const linkedCount = account?.linkedChildren?.length ?? 0;

  const openLinkDialog = () => {
    setLinkOpen(true);
    setLinkError("");
    setLinkPin("");
    setLinkChildId("");
  };

  const handleLinkSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onLinkChild || linkBusy) return;
    if (!linkChildId) {
      setLinkError("Vui lòng chọn họ tên con trong danh sách.");
      return;
    }
    if (!/^\d{4}$/.test(linkPin)) {
      setLinkError("Mã PIN phải gồm đúng 4 chữ số do con chia sẻ.");
      return;
    }
    setLinkBusy(true);
    setLinkError("");
    try {
      await onLinkChild({
        studentId: linkChildId,
        pin: linkPin,
      });
      onSelectChild(linkChildId);
      setLinkOpen(false);
      setLinkPin("");
      setLinkChildId("");
    } catch (err) {
      setLinkError(
        err instanceof Error
          ? err.message
          : "Không thể liên kết. Vui lòng kiểm tra lại mã PIN."
      );
    } finally {
      setLinkBusy(false);
    }
  };

  const childMeetings = meetings.filter((m) => m.studentId === student.id);
  const stepInfo = STEP_VERBAL_DESC[student.currentStep];
  const openQuestions = STEP_CONVERSATION_PROMPTS[student.currentStep];

  const handleParentConfirmSlip = () => {
    const now = new Date().toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    onUpdateStudent({
      ...student,
      commitment: {
        ...student.commitment,
        parentConfirmedAt: now,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] dark:bg-[#0F171E] text-[#1D242B] dark:text-[#EDF2F7] flex flex-col">
      <header className="sticky top-0 z-30 h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#17222C]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <CompassLogo size={26} />
            <span className="text-base font-bold tracking-tight">
              La Bàn Lựa Chọn
            </span>
          </div>

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
                onClick={onExitRole}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Đổi vai trò
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200/70 dark:border-slate-800 bg-gradient-to-r from-[#EFCFE3]/50 via-white to-[#B3DEE2]/30 dark:from-[#17222C] dark:via-[#17222C] dark:to-[#17222C]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">
              Góc Phụ huynh · {student.fullName} (Lớp {student.className})
            </span>
            <span aria-hidden="true" className="text-slate-400">
              ·
            </span>
            <div className="flex items-center gap-1.5">
              <UserRound className="w-4 h-4 text-[#9D2950] dark:text-[#EA9AB2]" />
              <label
                htmlFor="parent-child-select"
                className="text-xs font-semibold sr-only sm:not-sr-only"
              >
                Chọn con
              </label>
              <select
                id="parent-child-select"
                value={selectedChildId}
                onChange={(e) => onSelectChild(e.target.value)}
                className="min-h-[38px] max-w-[240px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#E27396]"
              >
                {childOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {onLinkChild && (
                <button
                  type="button"
                  onClick={openLinkDialog}
                  disabled={linkedCount >= MAX_CHILDREN_PER_PARENT}
                  title={
                    linkedCount >= MAX_CHILDREN_PER_PARENT
                      ? `Mỗi tài khoản chỉ liên kết tối đa ${MAX_CHILDREN_PER_PARENT} con`
                      : "Thêm con bằng mã PIN"
                  }
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-[#EA9AB2] bg-[#EFCFE3]/45 hover:bg-[#EFCFE3]/75 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-[#4A1A2C] dark:text-[#EFCFE3] dark:bg-[#EFCFE3]/15 inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm con</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onOpenHowAIWorks && (
              <button
                type="button"
                onClick={onOpenHowAIWorks}
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#133C42] dark:text-[#B3DEE2]" />
                <span>Cách app dùng AI</span>
              </button>
            )}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              {settings.darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{settings.darkMode ? "Sáng" : "Tối"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#17222C]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex gap-2 overflow-x-auto">
          {PARENT_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? "page" : undefined}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                  active
                    ? "bg-[#E27396] text-[#2B111A] shadow-sm"
                    : "bg-[#F1F4F8] dark:bg-[#0F171E] text-slate-700 dark:text-slate-300 hover:bg-[#EFCFE3]/50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {activeTab === "progress" && (
        <>
        {/* Trang chủ phụ huynh: Con đang ở bước nào (bằng lời) */}
        <section
          id="trang-chu-phu-huynh"
          className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B3DEE2]/50 dark:bg-[#B3DEE2]/20 flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2] shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#133C42] dark:text-[#B3DEE2]">
                Chặng hành trình hiện tại của con ({student.fullName})
              </p>
              <h1 className="text-lg sm:text-xl font-bold">{stepInfo.title}</h1>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {stepInfo.meaning}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lịch họp ba bên sắp tới / đã ghi nhận
              </p>
              <p className="font-semibold mt-1">
                {childMeetings.length > 0
                  ? `${childMeetings.length} buổi họp (${childMeetings[0].dateTime})`
                  : "Chưa có lịch hẹn mới"}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trạng thái phiếu cam kết
              </p>
              <p className="font-semibold mt-1">
                {!student.shareWithParent
                  ? "Chờ con bật chia sẻ hồ sơ"
                  : student.commitment.parentConfirmedAt
                  ? `Phụ huynh đã xác nhận (${student.commitment.parentConfirmedAt})`
                  : student.commitment.chosenOption
                  ? "Đang chờ phụ huynh xác nhận đồng hành"
                  : "Con đang ở các bước tìm hiểu trước khi chốt"}
              </p>
            </div>
          </div>
        </section>
        </>
        )}

        {activeTab === "summary" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFCFE3]/60 dark:bg-[#EFCFE3]/20 flex items-center justify-center text-[#9D2950] dark:text-[#EA9AB2] shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">
                  Hồ sơ tổng hợp của con
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  Khi con hoàn thành đủ 5 bước, hệ thống tự biên soạn Hồ sơ tổng
                  hợp 6 phần và gửi tới tài khoản phụ huynh để bố mẹ nắm được
                  toàn bộ hành trình của con.
                </p>
              </div>
            </div>

            {!student.shareWithParent ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#17222C] border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                <Lock className="w-9 h-9 mx-auto text-[#9D2950] dark:text-[#EA9AB2]" />
                <h2 className="text-lg font-bold">
                  Con chưa bật quyền chia sẻ hồ sơ với phụ huynh
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Khi con bật &ldquo;Chia sẻ với phụ huynh&rdquo; trong tài khoản
                  của mình, Hồ sơ tổng hợp và nhật ký của con sẽ hiển thị tại
                  đây. Con có thể tắt chia sẻ bất cứ lúc nào.
                </p>
              </div>
            ) : student.summary ? (
              <StudentSummaryReport summary={student.summary} audience="parent" />
            ) : (
              <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <FileText className="w-9 h-9 mx-auto text-[#133C42] dark:text-[#B3DEE2]" />
                <h2 className="text-lg font-bold">
                  Hồ sơ tổng hợp chưa sẵn sàng
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Con đang ở bước {student.currentStep}. Hồ sơ tổng hợp sẽ được
                  hệ thống biên soạn và gửi tới bố mẹ ngay khi con hoàn thành đủ
                  5 bước Thu – Lọc – Thử – Chốt – Cam kết.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "conversation" && (
        <section
          id="goi-y-tro-chuyen"
          className="bg-white dark:bg-[#17222C] border border-[#EA9AB2]/60 dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFCFE3]/60 dark:bg-[#EFCFE3]/20 flex items-center justify-center text-[#9D2950] dark:text-[#EA9AB2] shrink-0">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Gợi ý trò chuyện với con (theo bước {student.currentStep})
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                3 câu hỏi mở giúp bố mẹ lắng nghe suy nghĩ thật của con mà không tạo áp lực hay áp đặt lựa chọn.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {openQuestions.map((q, idx) => (
              <div
                key={q}
                className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-1.5"
              >
                <p className="text-xs font-bold text-[#9D2950] dark:text-[#EA9AB2]">
                  Gợi ý {idx + 1}
                </p>
                <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                  &ldquo;{q}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </section>
        )}

        {activeTab === "profile" && (
        <section
          id="ho-so-cua-con"
          className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5"
        >
          {!student.shareWithParent ? (
            <div className="p-6 sm:p-8 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
              <Lock className="w-9 h-9 mx-auto text-[#9D2950] dark:text-[#EA9AB2]" />
              <h2 className="text-lg font-bold">
                Con chưa bật quyền chia sẻ hồ sơ và nhật ký với phụ huynh
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
                Để tạo không gian an toàn giúp con suy nghĩ thật thà, hệ thống tôn trọng quyền riêng tư của con. Khi con sẵn sàng và bật nút &ldquo;Chia sẻ với phụ huynh&rdquo; trong tài khoản của mình, bố mẹ sẽ xem được hồ sơ, tiêu chí và nhật ký tại đây. Con có thể tắt chia sẻ bất cứ lúc nào.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2]">
                  Con đã bật chia sẻ hồ sơ cùng bố mẹ
                </p>
                <h2 className="text-xl font-bold mt-0.5">
                  Hồ sơ tự soi chiếu của {student.fullName} · Bước {student.currentStep}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Năng lực &amp; điểm mạnh của con
                  </p>
                  <p className="leading-relaxed">
                    {student.profile.abilitiesTeacherNote}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                    Con tự nhận: {student.profile.abilitiesStudentSelf}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Sở thích &amp; tiêu chí con tự đặt
                  </p>
                  <p className="leading-relaxed">
                    {student.profile.hollandSummaryText}
                  </p>
                  {student.criteria.length > 0 && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                      Tiêu chí ưu tiên: {student.criteria.map((c) => c.label).join(" · ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold">
                  Nhật ký trải nghiệm của con ({student.journal.length})
                </h3>
                {student.journal.length === 0 ? (
                  <p className="text-sm text-slate-500">Con chưa ghi trang nhật ký nào.</p>
                ) : (
                  <div className="space-y-2.5">
                    {student.journal.map((j) => (
                      <div
                        key={j.id}
                        className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/70 dark:border-slate-800 text-sm space-y-1"
                      >
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {j.activityType} · {j.date}
                        </p>
                        <p className="leading-relaxed">{j.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
        )}

        {activeTab === "articles" && (
        /* 2 Bài đọc ngắn dành cho Phụ huynh */
        <section id="bai-doc-lien-thong" className="space-y-6">
          <article className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <p className="text-xs font-semibold text-[#223A1E] dark:text-[#EAF2D7]">
              Bài đọc ngắn 1 dành cho Phụ huynh
            </p>
            <h2 className="text-xl sm:text-2xl font-bold">
              Vai trò của sự đồng cảm, thấu hiểu của phụ huynh học sinh
            </h2>
            <div className="space-y-3.5 text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
              <p>
                Khi con bước vào năm cuối cấp, điều con cần không chỉ là thêm
                thông tin về trường hay ngành nghề, mà còn là cảm giác được
                hiểu. Nhiều em học lực khá, thậm chí rất tốt, vẫn có thể phân
                vân hàng tháng trời giữa vài trường THPT công lập, liên tục đổi
                nguyện vọng vì sợ chọn sai hoặc sợ bỏ lỡ một lựa chọn tốt hơn.
              </p>
              <p>
                Sự đồng cảm của bố mẹ không có nghĩa là đồng ý với mọi lựa chọn
                của con, mà là lắng nghe trước khi phán xét. Khi con nói
                &ldquo;con chưa biết chọn trường nào&rdquo;, thay vì đáp lại
                bằng áp lực hay lời trách, bố mẹ có thể ghi nhận cảm xúc của
                con: &ldquo;Bố/mẹ hiểu là con đang cân nhắc rất nhiều thứ.
                Mình cùng xem từng bước nhé.&rdquo;
              </p>
              <p>
                Được thấu hiểu, con sẽ dám nói ra điều thật lòng — kể cả những
                lo lắng tưởng như &ldquo;không đáng nói&rdquo; như sợ xa nhà,
                sợ không theo kịp bạn bè hay sợ làm bố mẹ thất vọng. Khi cảm xúc
                được gọi tên, con bớt căng thẳng và có thể quay lại việc so sánh
                các lựa chọn một cách bình tĩnh hơn.
              </p>
              <p>
                Hãy nhớ rằng phân vân không phải là dấu hiệu của sự yếu kém. Đó
                là dấu hiệu con đang nghiêm túc với tương lai của mình. Cũng
                đừng cho rằng chỉ những bạn học lực chưa tốt mới cần được tư
                vấn: những bạn học khá cũng có thể mắc kẹt trong vòng xoáy
                &ldquo;sợ bỏ lỡ lựa chọn tốt hơn&rdquo; và cần người lớn đồng
                hành.
              </p>
              <div className="p-4 rounded-xl bg-[#EAF2D7]/60 dark:bg-[#EAF2D7]/10 border border-[#EAF2D7] dark:border-slate-700 space-y-2">
                <p className="font-semibold text-[#223A1E] dark:text-[#EAF2D7]">
                  Bốn việc nhỏ bố mẹ có thể làm ngay:
                </p>
                <ul className="list-disc list-inside space-y-1.5">
                  <li>Hỏi câu mở, không dẫn dắt, và cho con thời gian trả lời.</li>
                  <li>Nhắc lại điều con vừa nói để con biết mình đang được lắng nghe.</li>
                  <li>Tránh so sánh con với &ldquo;con nhà người ta&rdquo; hay với anh chị em.</li>
                  <li>Giúp con đặt một mốc thời gian chốt nhẹ nhàng, thay vì thúc ép.</li>
                </ul>
              </div>
              <p className="font-medium text-[#133C42] dark:text-[#B3DEE2]">
                Khi được thấu hiểu, con sẽ tự tin nói ra lí do và tự chịu trách
                nhiệm với lựa chọn của mình. Đó là nền tảng bền vững hơn bất kỳ
                quyết định nào do người lớn chọn thay.
              </p>
            </div>
          </article>

          <article className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
            <p className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2]">
              Bài đọc ngắn 2 dành cho Phụ huynh
            </p>
            <h2 className="text-xl sm:text-2xl font-bold">
              Vì sao nên để con tự nói lí do lựa chọn
            </h2>
            <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
              <p>
                Ở tuổi 14–15, khi đứng trước nhiều ngã rẽ, nhiều em dễ chọn
                trường theo lời bạn rủ hoặc làm theo sắp xếp của người lớn để
                cho xong. Tuy nhiên, nếu con chọn một hướng đi mà chưa tự giải
                thích được vì sao hợp với mình, con rất dễ nản lòng hoặc đổi ý
                giữa chừng khi gặp môn học khó hoặc khi thấy bạn bè chọn hướng
                khác.
              </p>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#133C42] dark:text-[#B3DEE2]">
                  1. Lợi ích tâm lý: con bớt lo, bố mẹ bớt sốt ruột
                </h3>
                <p>
                  Khi được tự nói ra lí do, con cảm thấy lựa chọn này là của
                  mình chứ không phải bị áp đặt. Cảm giác &ldquo;mình được kiểm
                  soát&rdquo; giúp giảm lo âu, tăng tự tin và giảm hẳn những
                  cuộc tranh luận lặp đi lặp lại trong gia đình. Bố mẹ cũng có
                  thể yên tâm hơn vì hiểu rõ con đang dựa trên tiêu chí nào.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#133C42] dark:text-[#B3DEE2]">
                  2. Học cách tự chịu trách nhiệm với quyết định
                </h3>
                <p>
                  Một lựa chọn do người lớn chọn thay thường đi kèm tâm thế
                  &ldquo;tại bố mẹ bắt con chọn&rdquo; mỗi khi gặp khó khăn.
                  Ngược lại, khi con tự viết lí do, con biết mình đã cân nhắc
                  điều gì và sẵn sàng nhận phần trách nhiệm của mình. Đây là kĩ
                  năng quan trọng không chỉ cho việc chọn trường mà còn cho
                  nhiều quyết định sau này.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#133C42] dark:text-[#B3DEE2]">
                  3. Nhận diện mong muốn và tiêu chí thật sự của con
                </h3>
                <p>
                  Khi con viết ra lí do, bố mẹ sẽ thấy điều con thật sự quan
                  tâm — có thể là học phí, khoảng cách, môi trường bạn bè, cơ
                  hội học tiếp hay một ước mơ riêng. Đôi khi tiêu chí của con
                  khác với điều bố mẹ tưởng. Đây là lúc để cùng con làm rõ:
                  &ldquo;Điều gì là quan trọng nhất với con?&rdquo;,
                  &ldquo;Con sẵn sàng đánh đổi điều gì?&rdquo;,
                  &ldquo;Nếu chỉ được giữ một tiêu chí, con sẽ giữ tiêu chí
                  nào?&rdquo;
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#133C42] dark:text-[#B3DEE2]">
                  4. Lắng nghe thay vì nói thay hoặc áp đặt
                </h3>
                <p>
                  Lắng nghe không có nghĩa là im lặng hoàn toàn. Bố mẹ vẫn có
                  thể chia sẻ hiểu biết và mối lo của mình, nhưng nên tách phần
                  &ldquo;thông tin&rdquo; khỏi phần &ldquo;quyết định thay
                  con&rdquo;. Một vài phản xạ nên tránh:
                </p>
                <ul className="list-disc list-inside space-y-1.5">
                  <li>
                    Nói thay: &ldquo;Con phải chọn trường này, bố mẹ đã tính
                    rồi.&rdquo;
                  </li>
                  <li>
                    Phủ nhận cảm xúc: &ldquo;Có gì mà phải phân vân, chuyện nhỏ
                    thôi.&rdquo;
                  </li>
                  <li>
                    So sánh: &ldquo;Sao con không được như bạn A?&rdquo;
                  </li>
                  <li>
                    Dọa dẫm: &ldquo;Chọn sai là đời con hỏng đấy.&rdquo;
                  </li>
                </ul>
                <p>
                  Thay vào đó, bố mẹ có thể phản hồi theo hướng đồng hành:
                  &ldquo;Bố/mẹ nghe con nói là con thích trường này vì gần nhà
                  và có môn con giỏi. Mình thử so thêm với trường kia xem sao,
                  rồi con quyết định nhé.&rdquo;
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#133C42] dark:text-[#B3DEE2]">
                  5. Khi con đổi ý, hãy coi đó là một bước học
                </h3>
                <p>
                  Việc con thay đổi nguyện vọng vài lần không nhất thiết là dấu
                  hiệu xấu. Đó có thể là quá trình con đang học cách so sánh và
                  tự điều chỉnh. Điều quan trọng là bố mẹ giúp con nhận ra vì
                  sao mình đổi ý, điều gì mới được khám phá, và cuối cùng con
                  chốt dựa trên tiêu chí nào. Như vậy, mỗi lần đổi ý đều trở
                  thành một bước tiến thay vì một thất bại.
                </p>
              </div>

              <p className="font-medium text-[#133C42] dark:text-[#B3DEE2]">
                Sự đồng thuận từ bên trong giúp con đi bền hơn nhiều so với một
                lựa chọn bị ép buộc. Khi con được tự nói lí do, con không chỉ
                chọn được trường phù hợp mà còn học được cách tin vào chính
                mình.
              </p>
            </div>
          </article>
        </section>
        )}

        {activeTab === "meetings" && (
        <section
          id="hop-ba-ben"
          className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B3DEE2]/50 dark:bg-[#B3DEE2]/15 flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Lịch họp ba bên (Gia đình – Nhà trường – Học sinh)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Thông tin lịch hẹn và biên bản thống nhất do giáo viên cập nhật.
              </p>
            </div>
          </div>

          {childMeetings.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hiện chưa có lịch họp ba bên nào được tạo cho {student.fullName}.
            </p>
          ) : (
            <div className="space-y-3">
              {childMeetings.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold tabular-nums">{m.dateTime}</span>
                    <span className="text-xs font-semibold text-[#133C42] dark:text-[#B3DEE2]">
                      {m.status} · {m.locationOrChannel}
                    </span>
                  </div>
                  {m.keyPoints && (
                    <p className="text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">Ý chính: </span>
                      {m.keyPoints}
                    </p>
                  )}
                  {m.agreedChoice && (
                    <p className="text-[#223A1E] dark:text-[#EAF2D7] font-medium">
                      Thống nhất: {m.agreedChoice}
                    </p>
                  )}
                  {m.nextSteps && (
                    <p className="text-slate-700 dark:text-slate-200">
                      <span className="font-semibold">Việc tiếp theo: </span>
                      {m.nextSteps}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                    <div className="flex flex-wrap gap-3 text-slate-600 dark:text-slate-300">
                      <span>
                        Học sinh: {m.confirmations?.student ? "Đã xác nhận" : "Chờ"}
                      </span>
                      <span>
                        Phụ huynh: {m.confirmations?.parent ? "Đã xác nhận" : "Chưa xác nhận"}
                      </span>
                      <span>
                        Giáo viên: {m.confirmations?.teacher ? "Đã xác nhận" : "Chờ"}
                      </span>
                    </div>
                    {onUpdateMeeting && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateMeeting({
                            ...m,
                            confirmations: {
                              ...(m.confirmations || {}),
                              parent: !m.confirmations?.parent,
                            },
                          })
                        }
                        className="min-h-[34px] px-3 py-1 rounded-lg bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] font-semibold cursor-pointer"
                      >
                        {m.confirmations?.parent
                          ? "Đã xác nhận biên bản"
                          : "Phụ huynh xác nhận biên bản"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        {activeTab === "commitment" && (
        <section
          id="xac-nhan-cam-ket"
          className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF2D7] dark:bg-[#EAF2D7]/15 flex items-center justify-center text-[#223A1E] dark:text-[#EAF2D7]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Xác nhận Phiếu cam kết cùng con
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Bố mẹ xem lựa chọn của con và bấm xác nhận đồng hành.
              </p>
            </div>
          </div>

          {!student.shareWithParent ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Khi con bật chia sẻ hồ sơ và hoàn thành bước Chốt, nội dung phiếu cam kết sẽ hiển thị tại đây để bố mẹ xác nhận.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-sm">
                <p>
                  <span className="text-slate-500">Lựa chọn của con: </span>
                  <span className="font-bold">
                    {student.commitment.chosenOption || "Con chưa chốt phương án"}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">Lí do con viết: </span>
                  <span>
                    {student.commitment.reasonInOwnWords || "Chưa có"}
                  </span>
                </p>
                <div className="flex flex-wrap gap-6 pt-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800">
                  <span>
                    Học sinh: {student.commitment.studentConfirmedAt || "Chưa xác nhận"}
                  </span>
                  <span>
                    Phụ huynh: {student.commitment.parentConfirmedAt || "Chưa xác nhận"}
                  </span>
                  <span>
                    Giáo viên: {student.commitment.teacherConfirmedAt || "Chờ xác nhận"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={!student.commitment.chosenOption}
                onClick={handleParentConfirmSlip}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-50 text-[#1D1519] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {student.commitment.parentConfirmedAt
                    ? "Đã xác nhận đồng hành cùng con"
                    : "Phụ huynh xác nhận phiếu cam kết"}
                </span>
              </button>
            </div>
          )}
        </section>
        )}
      </main>

      {linkOpen && onLinkChild && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => !linkBusy && setLinkOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="link-child-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C] shadow-xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="link-child-title"
                  className="text-lg font-bold inline-flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-[#9D2950] dark:text-[#EA9AB2]" />
                  Thêm con vào tài khoản
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Chọn họ tên con, sau đó nhập mã PIN 4 số do con chia sẻ để
                  liên kết hồ sơ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !linkBusy && setLinkOpen(false)}
                aria-label="Đóng hộp thoại"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-3.5" noValidate>
              <div>
                <label
                  htmlFor="link-child-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Họ tên con
                </label>
                <select
                  id="link-child-name"
                  value={linkChildId}
                  onChange={(e) => {
                    setLinkChildId(e.target.value);
                    setLinkError("");
                  }}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
                >
                  <option value="">— Chọn họ tên con —</option>
                  {linkClassStudents.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="link-child-pin"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
                >
                  Mã PIN của con
                </label>
                <input
                  id="link-child-pin"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  value={linkPin}
                  onChange={(e) => {
                    setLinkPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                    setLinkError("");
                  }}
                  placeholder="4 chữ số do con chia sẻ"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-center text-lg tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#E27396]"
                />
              </div>

              {linkError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-200"
                >
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{linkError}</span>
                </div>
              )}

              <p className="text-xs text-slate-600 dark:text-slate-300">
                Sai mã PIN sẽ bị từ chối liên kết. Mỗi tài khoản liên kết tối đa{" "}
                {MAX_CHILDREN_PER_PARENT} con và có thể chuyển đổi bằng mục
                &ldquo;Chọn con&rdquo; ở thanh trên.
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => !linkBusy && setLinkOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={linkBusy}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-60 disabled:cursor-not-allowed text-[#1D1519] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {linkBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>{linkBusy ? "Đang liên kết..." : "Xác nhận liên kết"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
