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
  HeartHandshake,
  Quote,
  Lightbulb,
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

const PARENT_ARTICLE1_TIPS = [
  "Đặt những câu hỏi mở, không áp đặt hay dẫn dắt, và kiên nhẫn trao cho con khoảng lặng để suy nghĩ.",
  "Phản hồi lại điều con vừa chia sẻ để con cảm nhận trọn vẹn rằng mình đang được lắng nghe bằng cả tấm lòng.",
  "Không so sánh với “con nhà người ta” hay anh chị em trong nhà.",
  "Cùng con chọn thời gian chốt lựa chọn thật nhẹ nhàng, thay vì tạo áp lực.",
  "Cùng con hiện thực hóa từng bước trong kế hoạch chuẩn bị, biến áp lực chọn trường thành hành trình khám phá nhẹ nhàng.",
  "Đồng hành cùng con như một người bạn, cùng con tìm hiểu thông tin, gỡ rối âu lo và trân trọng từng bước trưởng thành của con.",
];

const PARENT_TIP_TONES = [
  "bg-[#E27396]/25 text-[#9D2950] dark:text-[#EA9AB2]",
  "bg-[#B3DEE2]/60 text-[#133C42] dark:text-[#B3DEE2]",
  "bg-[#EFCFE3] text-[#4A1A2C] dark:text-[#EFCFE3]",
  "bg-[#EAF2D7] text-[#223A1E] dark:text-[#EAF2D7]",
  "bg-[#EA9AB2]/40 text-[#4A1A2C] dark:text-[#EA9AB2]",
  "bg-[#B3DEE2]/60 text-[#133C42] dark:text-[#B3DEE2]",
];

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
                <span>Cách ứng dụng sử dụng AI</span>
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
          <article className="relative overflow-hidden bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#E27396] via-[#EA9AB2] to-[#B3DEE2]" />
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#EFCFE3]/70 dark:bg-[#EFCFE3]/15 text-[#4A1A2C] dark:text-[#EFCFE3] flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9D2950] dark:text-[#EA9AB2]">
                    Bài đọc ngắn 1 dành cho Phụ huynh
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold leading-snug mt-1">
                    VAI TRÒ CỦA SỰ ĐỒNG CẢM, THẤU HIỂU CỦA PHỤ HUYNH HỌC SINH
                  </h2>
                </div>
              </div>

              <div className="space-y-3.5 text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
                <p>
                  Khi con chạm ngưỡng năm cuối cấp, thứ con mong muốn đôi khi
                  không nằm ở những chồng tài liệu về trường lớp hay ngành nghề,
                  mà là cảm giác được thực sự lắng nghe. Ngay cả những học sinh
                  có học lực khá, thậm chí giỏi, vẫn có thể loay hoay hàng tháng
                  trời trước ngưỡng cửa các trường THPT công lập, đổi tới đổi
                  lui nguyện vọng chỉ vì nỗi sợ chọn nhầm hoặc ám ảnh đánh mất
                  một cơ hội rực rỡ hơn.
                </p>
                <p>
                  Đồng cảm với con không đồng nghĩa với việc gật đầu trước mọi
                  quyết định của con, mà là biết mở lòng lắng nghe khi con nói:
                </p>

                <div className="rounded-xl bg-[#EAF2D7]/60 dark:bg-[#EAF2D7]/10 border-l-4 border-[#8FB37C] px-4 py-3.5 space-y-1.5">
                  <Quote className="w-4 h-4 text-[#5F7F4E] dark:text-[#EAF2D7]" />
                  <p className="italic text-[#223A1E] dark:text-[#EAF2D7]">
                    “Con chưa biết nên chọn trường nào”,
                  </p>
                  <p className="text-xs font-semibold text-[#5F7F4E] dark:text-[#EAF2D7]/80">
                    bố mẹ có thể trả lời:
                  </p>
                  <p className="italic text-[#223A1E] dark:text-[#EAF2D7]">
                    “Bố/mẹ hiểu con đang đứng trước quá nhiều điều phải cân
                    nhắc. Mình cùng đi từng bước nhé.”
                  </p>
                </div>

                <p>
                  Một khi được thấu hiểu, con mới có thể giãi bày những tâm tư
                  thầm kín nhất — từ những nỗi niềm tưởng chừng nhỏ nhặt như
                  ngại cảnh xa nhà, lo hụt hơi trước bạn bè, cho đến nỗi sợ làm
                  bố mẹ buồn lòng. Khi đó, lòng con lắng lại, nhường chỗ cho sự
                  bình tĩnh và sáng suốt để đưa ra lựa chọn chín chắn.
                </p>
                <p>
                  Sự chần chừ chưa bao giờ là thước đo của yếu đuối; trái lại,
                  đó là minh chứng cho thấy con đang trân trọng và nghiêm túc
                  với tương lai của chính mình. Cũng đừng vội nghĩ rằng chỉ
                  những học sinh học lực chưa ổn định mới cần được định hướng:
                  những bạn học tốt cũng dễ rơi vào vòng xoáy “sợ bỏ lỡ lựa
                  chọn tốt hơn” và rất cần sự đồng hành từ phụ huynh.
                </p>

                <div className="rounded-2xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3">
                  <p className="flex items-center gap-2 font-bold text-[#1D242B] dark:text-white">
                    <Lightbulb className="w-4 h-4 text-[#9D2950] dark:text-[#EA9AB2]" />
                    <span>
                      Sáu việc nhỏ bố mẹ có thể bắt tay thực hiện ngay hôm nay:
                    </span>
                  </p>
                  <ol className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {PARENT_ARTICLE1_TIPS.map((tip, idx) => (
                      <li
                        key={tip}
                        className="flex items-start gap-2.5 rounded-xl bg-white dark:bg-[#17222C] border border-slate-200/80 dark:border-slate-800 p-3 text-sm leading-relaxed"
                      >
                        <span
                          className={`w-6 h-6 shrink-0 rounded-full text-[11px] font-bold flex items-center justify-center ${PARENT_TIP_TONES[idx % PARENT_TIP_TONES.length]}`}
                        >
                          {idx + 1}
                        </span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <p>
                  Bố mẹ hãy dành thời gian trò chuyện cởi mở và thấu cảm, nhẹ
                  nhàng khuyến khích con bật chế độ “Chia sẻ phụ huynh” bằng
                  lời nhắn nhủ chân thành:
                </p>

                <div className="flex items-start gap-3 rounded-xl bg-[#EFCFE3]/50 dark:bg-[#EFCFE3]/10 border-l-4 border-[#E27396] px-4 py-3.5">
                  <Quote className="w-4 h-4 mt-0.5 shrink-0 text-[#9D2950] dark:text-[#EA9AB2]" />
                  <p className="italic text-[#4A1A2C] dark:text-[#EFCFE3]">
                    “Nếu con sẵn sàng chia sẻ, bố mẹ sẽ có cơ hội hiểu con hơn
                    và đồng hành cùng con một cách vừa vặn nhất.”
                  </p>
                </div>

                <p>
                  Sự kết nối này cần được đặt trọn trên nền tảng của sự tôn
                  trọng, không mang sự kiểm soát hay áp đặt.
                </p>
                <p className="rounded-xl bg-[#B3DEE2]/35 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2]/60 dark:border-slate-700 px-4 py-3 font-medium text-[#133C42] dark:text-[#B3DEE2]">
                  Khi được thấu hiểu, con sẽ vững vàng cất lên tiếng nói của
                  riêng mình và dám chịu trách nhiệm cho ngã rẽ sắp tới. Chính
                  sự trưởng thành ấy mới là bệ phóng vững chắc hơn mọi quyết
                  định sắp đặt sẵn từ người lớn.
                </p>
              </div>
            </div>
          </article>

          <article className="relative overflow-hidden bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#B3DEE2] via-[#EAF2D7] to-[#EA9AB2]" />
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#B3DEE2]/60 dark:bg-[#B3DEE2]/15 text-[#133C42] dark:text-[#B3DEE2] flex items-center justify-center shrink-0">
                  <MessageSquareHeart className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9D2950] dark:text-[#EA9AB2]">
                    Bài đọc ngắn 2 dành cho Phụ huynh
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold leading-snug mt-1">
                    VÌ SAO NÊN ĐỂ CON TỰ NÓI LÍ DO LỰA CHỌN
                  </h2>
                </div>
              </div>

              <div className="space-y-3 text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
                <p>
                  Ở độ tuổi 14–15, khi đứng trước những ngã rẽ đầu bỡ ngỡ, nhiều
                  học sinh dễ chọn trường theo lời rủ rê của bạn bè hay nương
                  theo sự sắp đặt sẵn có của người lớn. Thế nhưng, nếu bước lên
                  một con đường mà bản thân chưa thể lý giải vì sao nó thuộc về
                  mình, con sẽ rất dễ chùn bước, nản lòng hoặc đổi hướng giữa
                  chừng ngay khi chạm trán những thử thách đầu tiên.
                </p>

                <div className="rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-[#E27396]/25 dark:bg-[#E27396]/25 text-[#9D2950] dark:text-[#EA9AB2] text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#9D2950] dark:text-[#EA9AB2]">
                      Điểm tựa tâm lý: Con vơi âu lo, bố mẹ nguôi sốt ruột
                    </h3>
                  </div>
                  <p>
                    Khi được tự mình nói lý do, con sẽ cảm nhận trọn vẹn rằng
                    quyết định này là của chính mình, chứ không phải một sự áp
                    đặt từ bên ngoài. Cảm giác được làm chủ hành trình giúp xoa
                    dịu những bất an, thắp lên sự tự tin và hóa giải những cuộc
                    tranh luận căng thẳng không đáng có. Về phía bố mẹ, lòng
                    cũng nhẹ nhõm và an tâm hơn khi thấu tỏ những thước đo mà
                    con đang thực sự dựa vào.
                  </p>
                </div>

                <div className="rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-[#B3DEE2]/60 dark:bg-[#B3DEE2]/20 text-[#133C42] dark:text-[#B3DEE2] text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#133C42] dark:text-[#B3DEE2]">
                      Tập dượt bản lĩnh tự chịu trách nhiệm với quyết định của
                      mình
                    </h3>
                  </div>
                  <p>
                    Một ngã rẽ do người lớn chọn thay thường vô tình gieo vào
                    lòng trẻ tâm thế đổ lỗi <em>“tại bố mẹ bắt con chọn”</em>{" "}
                    mỗi khi vấp ngã. Trái lại, khi tự tay viết xuống những lý do
                    của riêng mình, con hiểu rõ bản thân đã cân nhắc những gì và
                    sẵn sàng đón nhận phần trách nhiệm đi kèm. Đó không chỉ là
                    hành trang cho kỳ chuyển cấp trước mắt, mà còn là bản lĩnh
                    sống quý giá theo con suốt những lựa chọn lớn lao sau này.
                  </p>
                </div>

                <div className="rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-[#EFCFE3] dark:bg-[#EFCFE3]/20 text-[#4A1A2C] dark:text-[#EFCFE3] text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#4A1A2C] dark:text-[#EFCFE3]">
                      Khai mở khát vọng và những tiêu chí thầm kín nơi con
                    </h3>
                  </div>
                  <p>
                    Từng dòng lý do con viết ra chính là tấm gương phản chiếu
                    điều con thực sự trân trọng, có thể là quãng đường đến
                    trường vừa sức, một môi trường học tập cởi mở, tình bạn gắn
                    bó, cơ hội vươn xa hay một giấc mơ riêng chưa từng ngỏ lời.
                    Đôi khi, tiêu chí của con lại rất khác với những gì bố mẹ
                    mong muốn. Đây chính là khoảnh khắc quý giá để bố mẹ ngồi
                    lại, cùng con trò chuyện qua những câu hỏi gợi mở:
                  </p>
                  <div className="rounded-xl bg-[#EFCFE3]/50 dark:bg-[#EFCFE3]/10 border-l-4 border-[#E27396] px-4 py-3 space-y-1 text-sm italic text-[#4A1A2C] dark:text-[#EFCFE3]">
                    <p>
                      “Điều gì mới thực sự là quan trọng nhất với con?”
                    </p>
                    <p>
                      “Nếu chỉ được giữ lại một tiêu chí duy nhất, con sẽ chọn
                      điều gì?”
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-[#EAF2D7] dark:bg-[#EAF2D7]/20 text-[#223A1E] dark:text-[#EAF2D7] text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#223A1E] dark:text-[#EAF2D7]">
                      Tạo cơ sở để bố mẹ đồng hành cùng con đúng cách
                    </h3>
                  </div>
                  <p>
                    Khi con tự mình lý giải cho những lựa chọn của bản thân, bố
                    mẹ sẽ hiểu được những nguyện vọng, suy tư và cả những trăn
                    trở của con. Từ điểm chạm thấu hiểu ấy, bố mẹ có thể trao đi
                    những lời khuyên vừa vặn, bồi đắp thêm thông tin còn thiếu
                    và giúp con mở rộng tầm nhìn đa chiều, thay vì dùng mong
                    muốn để áp đặt lên bước đường của con. Sự lắng nghe và gợi
                    mở này không chỉ vun đắp nên nhịp cầu đồng thuận giữa hai
                    thế hệ, mà còn giữ sự tự chủ để con tự tin cầm lái trên hành
                    trình định hướng tương lai.
                  </p>
                </div>
              </div>
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
