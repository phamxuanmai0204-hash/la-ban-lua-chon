import React, { useEffect, useMemo, useState } from "react";
import {
  Compass,
  User,
  Map,
  Filter,
  BookOpen,
  FileCheck2,
  MessageCircle,
  ClipboardCheck,
  Share2,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  Type,
  Bell,
  ShieldCheck,
  Download,
  Trash2,
  X,
  KeyRound,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { CompassLogo } from "../../components/CompassLogo";
import { PWAInstallButton } from "../../components/PWAInstallButton";
import { AccountMenu } from "../../components/AccountMenu";
import { exportStudentPersonalDataJSON } from "../../services/export";
import { SelfProfile } from "../self-profile/SelfProfile";
import { PathwayMap } from "../pathway-map/PathwayMap";
import { GoodEnoughFilter } from "../good-enough-filter/GoodEnoughFilter";
import { ChoiceOverloadModal } from "../good-enough-filter/ChoiceOverloadModal";
import { TryAndJournal } from "../try-and-journal/TryAndJournal";
import { AIChat } from "../ai-assistant/AIChat";
import { CommitForm } from "../commit/CommitForm";
import { RubricAssessment } from "../teacher/RubricAssessment";
import { JourneyCompassSVG } from "./JourneyCompassSVG";
import { StudentSummaryReport } from "./StudentSummaryReport";
import {
  allStepsCompleted,
  buildStudentSummary,
} from "../../utils/studentSummary";
import type {
  AIMessage,
  AppSettings,
  AuthUser,
  Experience,
  FontSizeScale,
  JourneyStep,
  Meeting,
  OptionEvaluation,
  Pathway,
  Student,
} from "../../types";

type StudentTab =
  | "overview"
  | "profile"
  | "pathways"
  | "filter"
  | "try_journal"
  | "commit"
  | "ai_chat"
  | "self_eval";

interface StudentJourneyProps {
  student: Student;
  allStudents: Student[];
  pathways: Pathway[];
  experiences: Experience[];
  aiMessages: AIMessage[];
  meetings: Meeting[];
  settings: AppSettings;
  onUpdateStudent: (updated: Student) => void;
  onTriggerAIQuestion: (params: {
    student: Student;
    studentMessage: string;
    triggerReason: string;
    onStreamPartial?: (partial: string) => void;
  }) => Promise<void>;
  onOpenHowAIWorks: () => void;
  onToggleDarkMode: () => void;
  onChangeFontSize: (scale: FontSizeScale) => void;
  onExitRole: () => void;
  account?: AuthUser | null;
  offlineSession?: boolean;
  onLogout?: () => void;
  onChangeParentPin?: (pin: string) => Promise<void>;
}

export const StudentJourney: React.FC<StudentJourneyProps> = ({
  student,
  allStudents,
  pathways,
  experiences,
  aiMessages,
  meetings,
  settings,
  onUpdateStudent,
  onTriggerAIQuestion,
  onOpenHowAIWorks,
  onToggleDarkMode,
  onChangeFontSize,
  onExitRole,
  account,
  offlineSession,
  onLogout,
  onChangeParentPin,
}) => {
  const [activeTab, setActiveTab] = useState<StudentTab>("overview");
  const [commitFocus, setCommitFocus] = useState<"choice" | "plan" | "sheet">(
    "choice"
  );
  const [pinCopied, setPinCopied] = useState(false);
  const [editingPin, setEditingPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinNotice, setPinNotice] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [recognitionBanner, setRecognitionBanner] = useState<string | null>(
    null
  );
  const [celebrateStep, setCelebrateStep] = useState<JourneyStep | null>(null);
  const [focusedPathwayId, setFocusedPathwayId] = useState<string | null>(null);
  const [pendingPathwayToAdd, setPendingPathwayToAdd] =
    useState<Pathway | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [privacyStatusMsg, setPrivacyStatusMsg] = useState<string | null>(null);

  const showRecognition = (msg: string) => {
    setRecognitionBanner(msg);
    setTimeout(() => setRecognitionBanner(null), 6500);
  };

  const isStudentAccount = account?.role === "student";
  const parentPin = account?.parentPin ?? "";
  const canChangePin = Boolean(isStudentAccount && onChangeParentPin);

  const handleCopyPin = async () => {
    try {
      await navigator.clipboard.writeText(parentPin);
      setPinCopied(true);
      setTimeout(() => setPinCopied(false), 2000);
    } catch {
      setPinError("Trình duyệt không cho phép sao chép tự động. Em hãy ghi lại mã PIN.");
    }
  };

  const handleSavePin = async () => {
    if (!onChangeParentPin || pinBusy) return;
    if (!/^\d{4}$/.test(newPin)) {
      setPinError("Mã PIN phải gồm đúng 4 chữ số.");
      return;
    }
    setPinBusy(true);
    setPinError("");
    try {
      await onChangeParentPin(newPin);
      setEditingPin(false);
      setNewPin("");
      setPinNotice("Đã cập nhật mã PIN mới. Hãy chia sẻ lại cho ba mẹ.");
      setTimeout(() => setPinNotice(""), 5000);
    } catch (err) {
      setPinError(
        err instanceof Error ? err.message : "Không thể cập nhật mã PIN."
      );
    } finally {
      setPinBusy(false);
    }
  };

  const handleStepCompleted = (step: JourneyStep, message: string) => {
    const existing = student.completedSteps || [];
    if (!existing.includes(step)) {
      onUpdateStudent({
        ...student,
        completedSteps: [...existing, step],
      });
    }
    setCelebrateStep(step);
    setTimeout(() => setCelebrateStep(null), 2600);
    showRecognition(message);
  };

  const activeOptions = student.consideredOptions.filter(
    (o) => o.status !== "Tạm gác lại"
  );

  // AI auto-compiles the 6-part summary once every journey step is finished
  useEffect(() => {
    if (student.summary) return;
    if (!allStepsCompleted(student)) return;
    const summary = buildStudentSummary(student, aiMessages, experiences);
    onUpdateStudent({
      ...student,
      currentStep: "CAM KẾT",
      summary,
    });
  }, [student, aiMessages, experiences, onUpdateStudent]);

  const dueTasks = useMemo(() => {
    const todayMs = new Date().setHours(0, 0, 0, 0);
    return student.commitment.actionPlan.filter((t) => {
      if (t.done || !t.dueDate) return false;
      const dMs = new Date(t.dueDate).setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((dMs - todayMs) / (1000 * 60 * 60 * 24));
      return diffDays <= 2;
    });
  }, [student.commitment.actionPlan]);

  // Exactly ONE concrete next action under the compass
  const nextSingleAction = useMemo<{
    title: string;
    detail: string;
    buttonLabel: string;
    targetTab: StudentTab;
  }>(() => {
    if (student.criteria.length === 0) {
      return {
        title: "Đặt ít nhất 2 tiêu chí tối thiểu của riêng em",
        detail:
          "Trước khi xem nhiều trường, hãy tự xác định điều gì là quan trọng nhất với em và gia đình.",
        buttonLabel: "Đặt tiêu chí ngay",
        targetTab: "filter",
      };
    }

    if (activeOptions.length === 0) {
      return {
        title: "Chọn tối đa 3 hướng đi đưa vào danh sách cân nhắc",
        detail:
          "Mở Bản đồ lộ trình để đọc điều kiện đầu vào và cơ hội học tiếp rồi chọn ra các phương án vừa sức.",
        buttonLabel: "Mở Bản đồ lộ trình",
        targetTab: "pathways",
      };
    }

    const hasUnclear = activeOptions.some((opt) =>
      student.criteria.some(
        (c) => (opt.evaluations[c.id] || "Chưa rõ") === "Chưa rõ"
      )
    );
    if (student.currentStep === "THU" || hasUnclear) {
      return {
        title: "Tìm hiểu thêm các điểm còn 'Chưa rõ' ở bước THU",
        detail:
          "Vẫn còn tiêu chí chưa rõ trên bảng so sánh. Xem kĩ thẻ lộ trình để biết chắc thông tin trước khi lọc.",
        buttonLabel: "Tìm hiểu thêm",
        targetTab: "pathways",
      };
    }

    if (student.currentStep === "LỌC") {
      return {
        title: "So sánh song song và chọn phương án ĐỦ TỐT với em",
        detail:
          "Đối chiếu tối đa 3 phương án theo tiêu chí em tự đặt và chọn một hướng đi đủ tốt để thử nghiệm.",
        buttonLabel: "Mở bảng so sánh",
        targetTab: "filter",
      };
    }

    if (
      student.currentStep === "THỬ" ||
      (student.journal.length === 0 && !student.commitment.studentConfirmedAt)
    ) {
      return {
        title: "Thử 'Một ngày làm nghề' và viết phiếu cảm nhận 3 câu",
        detail:
          "Trải nghiệm tình huống thực tế hoặc xem chia sẻ người làm nghề để kiểm chứng cảm giác thật của mình.",
        buttonLabel: "Vào bước THỬ",
        targetTab: "try_journal",
      };
    }

    if (!student.commitment.studentConfirmedAt) {
      return {
        title: "Viết 'Thư gửi chính mình' và xác nhận lựa chọn",
        detail:
          "Ghi lại lí do bằng lời của chính em, chuẩn bị trước tình huống khó khăn và xác nhận phiếu cam kết.",
        buttonLabel: "Đi tới Chốt & Cam kết",
        targetTab: "commit",
      };
    }

    if (dueTasks.length > 0) {
      return {
        title: `Kiểm tra việc sắp tới hạn: "${dueTasks[0].title}"`,
        detail: `Hạn em đặt là ${dueTasks[0].dueDate}. Mở kế hoạch ngắn hạn để đánh dấu khi hoàn thành nhé.`,
        buttonLabel: "Xem kế hoạch",
        targetTab: "commit",
      };
    }

    return {
      title: "Theo dõi kế hoạch ngắn hạn và chia sẻ cùng gia đình",
      detail:
        "Em đã hoàn thành các bước cốt lõi. Hãy giữ nhịp thực hiện từng việc nhỏ trong kế hoạch của mình.",
      buttonLabel: "Xem phiếu cam kết",
      targetTab: "commit",
    };
  }, [
    student.criteria,
    student.currentStep,
    student.journal.length,
    student.commitment.studentConfirmedAt,
    activeOptions,
    dueTasks,
  ]);

  const commitAddPathwayOption = async (
    pathway: Pathway,
    archiveOptionId?: string,
    comparisonReason?: string
  ) => {
    const alreadyCommitted = Boolean(student.commitment.studentConfirmedAt);
    const baseOptions = archiveOptionId
      ? student.consideredOptions.map((o) =>
          o.id === archiveOptionId
            ? { ...o, status: "Tạm gác lại" as const }
            : o
        )
      : student.consideredOptions;

    // Restore if previously archived, or add new
    const existingArchived = baseOptions.find(
      (o) => o.pathwayId === pathway.id && o.status === "Tạm gác lại"
    );

    const nextOptions: OptionEvaluation[] = existingArchived
      ? baseOptions.map((o) =>
          o.id === existingArchived.id
            ? { ...o, status: "Đang cân nhắc" }
            : o
        )
      : [
          ...baseOptions,
          {
            id: `opt-${Date.now()}`,
            pathwayId: pathway.id,
            title: pathway.title,
            status: "Đang cân nhắc",
            evaluations: {},
          },
        ];

    const completedSet = new Set(student.completedSteps || []);
    completedSet.add("THU");

    const updatedJournal = comparisonReason
      ? [
          {
            id: `j-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            step: "LỌC" as const,
            pathwayId: pathway.id,
            pathwayTitle: pathway.title,
            activityType: "Đối chiếu tiêu chí",
            content: `Em chọn đưa "${pathway.title}" vào danh sách cân nhắc vì: ${comparisonReason}`,
          },
          ...student.journal,
        ]
      : student.journal;

    const updated: Student = {
      ...student,
      currentStep: student.currentStep === "THU" ? "LỌC" : student.currentStep,
      completedSteps: Array.from(completedSet),
      consideredOptions: nextOptions,
      journal: updatedJournal,
      signals: alreadyCommitted
        ? { ...student.signals, addedAfterCommit: true }
        : student.signals,
    };

    onUpdateStudent(updated);
    setCelebrateStep("THU");
    setTimeout(() => setCelebrateStep(null), 2600);
    showRecognition(
      archiveOptionId
        ? "Em đã tự loại được một phương án không phù hợp – đó là một quyết định khó."
        : `Em đã đưa "${pathway.title}" vào danh sách cân nhắc ở bước LỌC.`
    );

    if (alreadyCommitted) {
      await onTriggerAIQuestion({
        student: updated,
        studentMessage: `Em vừa thêm phương án mới "${pathway.title}" vào danh sách cân nhắc dù trước đó em đã chốt lựa chọn.`,
        triggerReason: "add_after_commit",
      });
    }
  };

  const handleAddOptionToFilter = async (pathway: Pathway) => {
    const alreadyActive = activeOptions.some((o) => o.pathwayId === pathway.id);
    if (alreadyActive) return;

    if (activeOptions.length >= 3) {
      setPendingPathwayToAdd(pathway);
      return;
    }

    await commitAddPathwayOption(pathway);
  };

  const handleConfirmGoodEnough = (option: OptionEvaluation) => {
    const completedSet = new Set(student.completedSteps || []);
    completedSet.add("THU");
    completedSet.add("LỌC");

    onUpdateStudent({
      ...student,
      currentStep:
        student.currentStep === "CAM KẾT" || student.currentStep === "CHỐT"
          ? student.currentStep
          : "THỬ",
      completedSteps: Array.from(completedSet),
      consideredOptions: student.consideredOptions.map((o) =>
        o.id === option.id
          ? { ...o, status: "Đã chọn" }
          : o.status === "Đã chọn"
          ? { ...o, status: "Đang cân nhắc" }
          : o
      ),
      commitment: {
        ...student.commitment,
        chosenOption:
          student.commitment.studentConfirmedAt &&
          student.commitment.chosenOption
            ? student.commitment.chosenOption
            : option.title,
      },
    });

    if (option.pathwayId !== "custom") {
      setFocusedPathwayId(option.pathwayId);
    }
    setActiveTab("try_journal");
  };

  const handleCompassStepSelect = (step: JourneyStep) => {
    if (step === "CHỐT") setCommitFocus("choice");
    if (step === "CAM KẾT") setCommitFocus("plan");
    const targetTab: StudentTab =
      step === "THU"
        ? "pathways"
        : step === "LỌC"
        ? "filter"
        : step === "THỬ"
        ? "try_journal"
        : "commit";
    setActiveTab(targetTab);
  };

  const studentAIMessagesCount = aiMessages.filter(
    (m) => m.studentId === student.id
  ).length;

  const fontSize: FontSizeScale = settings.fontSize || "medium";

  return (
    <div className="min-h-screen bg-[#FAFBFD] dark:bg-[#0F171E] text-[#1D242B] dark:text-[#EDF2F7] flex flex-col pb-20 md:pb-10">
      {/* 3-zone top bar */}
      <header className="no-print sticky top-0 z-30 h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#17222C]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className="flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CompassLogo size={26} />
            <span className="text-base font-bold tracking-tight">
              La Bàn Lựa Chọn
            </span>
          </button>

          <nav
            aria-label="Điều hướng hành trình học sinh"
            className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            {[
              { id: "profile", label: "Soi chiếu bản thân" },
              { id: "pathways", label: "Lộ trình 5 bước" },
              { id: "commit", label: "Phiếu cam kết" },
            ].map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === "commit") setCommitFocus("sheet");
                    setActiveTab(item.id as StudentTab);
                  }}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                    active
                      ? "border-[#E27396] text-[#1D242B] dark:text-white font-semibold"
                      : "border-transparent hover:text-[#1D242B] dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
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
                onClick={onExitRole}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Đổi vai trò
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Workspace Utility Strip (Privacy Share, Font Size 3 levels, Dark Mode) */}
      <div className="no-print border-b border-slate-200/70 dark:border-slate-800 bg-[#B3DEE2]/20 dark:bg-[#17222C]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200">
            <span className="font-semibold">
              {student.fullName}
            </span>
            <span aria-hidden="true">·</span>
            <span>Lớp {student.className}</span>
            <span aria-hidden="true">·</span>
            <span>Bước hiện tại: {student.currentStep}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PWAInstallButton compact />

            {/* Share with Parent toggle */}
            <button
              type="button"
              aria-pressed={student.shareWithParent}
              onClick={() =>
                onUpdateStudent({
                  ...student,
                  shareWithParent: !student.shareWithParent,
                })
              }
              className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                student.shareWithParent
                  ? "bg-[#EAF2D7] dark:bg-[#EAF2D7]/20 border-[#8FB37C] text-[#223A1E] dark:text-[#EAF2D7]"
                  : "bg-white dark:bg-[#17222C] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>
                Chia sẻ phụ huynh: {student.shareWithParent ? "Bật" : "Tắt"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPrivacyStatusMsg(null);
                setConfirmDeleteOpen(false);
                setShowPrivacyModal(true);
              }}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#133C42] dark:text-[#B3DEE2]" />
              <span>Quyền riêng tư &amp; Dữ liệu</span>
            </button>

            <button
              type="button"
              onClick={onOpenHowAIWorks}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#9D2950] dark:text-[#EA9AB2]" />
              <span className="hidden sm:inline">Cách app dùng AI</span>
              <span className="sm:hidden">Dùng AI</span>
            </button>

            {/* 3-level Font Size switcher */}
            <div
              role="group"
              aria-label="Chọn cỡ chữ hiển thị"
              className="inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] p-0.5"
            >
              <span className="px-2 text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                <Type className="w-3.5 h-3.5" />
                <span className="sr-only">Cỡ chữ</span>
              </span>
              {(
                [
                  { id: "small", label: "Nhỏ" },
                  { id: "medium", label: "Vừa" },
                  { id: "large", label: "Lớn" },
                ] as const
              ).map((sz) => {
                const active = fontSize === sz.id;
                return (
                  <button
                    key={sz.id}
                    type="button"
                    aria-pressed={active}
                    aria-label={`Cỡ chữ ${sz.label}`}
                    onClick={() => onChangeFontSize(sz.id)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      active
                        ? "bg-[#B3DEE2] text-[#133C42]"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {sz.label}
                  </button>
                );
              })}
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={
                settings.darkMode
                  ? "Chuyển sang giao diện sáng"
                  : "Chuyển sang giao diện tối"
              }
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              {settings.darkMode ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {settings.darkMode ? "Sáng" : "Tối"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Thanh công cụ: Soi chiếu bản thân → Lộ trình 5 bước → Phiếu cam kết & A4 */}
        <div className="no-print space-y-2.5">
          <div
            role="tablist"
            aria-label="Thanh công cụ hành trình học sinh"
            className="flex flex-wrap gap-2"
          >
            <button
              role="tab"
              aria-selected={activeTab === "profile"}
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#B3DEE2] dark:bg-[#B3DEE2]/20 border-[#63AEB6] text-[#133C42] dark:text-white"
                  : "bg-white dark:bg-[#17222C] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#EA9AB2]"
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">1. Soi chiếu bản thân</span>
            </button>

            <button
              role="tab"
              aria-selected={
                activeTab === "pathways" ||
                activeTab === "filter" ||
                activeTab === "try_journal" ||
                activeTab === "commit"
              }
              type="button"
              onClick={() => {
                if (
                  activeTab !== "pathways" &&
                  activeTab !== "filter" &&
                  activeTab !== "try_journal" &&
                  activeTab !== "commit"
                ) {
                  setActiveTab("pathways");
                }
              }}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
                activeTab === "pathways" ||
                activeTab === "filter" ||
                activeTab === "try_journal" ||
                activeTab === "commit"
                  ? "bg-[#B3DEE2] dark:bg-[#B3DEE2]/20 border-[#63AEB6] text-[#133C42] dark:text-white"
                  : "bg-white dark:bg-[#17222C] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#EA9AB2]"
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">
                2. Lộ trình 5 bước (THU–LỌC–THỬ–CHỐT–CAM KẾT)
              </span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "commit" && commitFocus === "sheet"}
              type="button"
              onClick={() => {
                setCommitFocus("sheet");
                setActiveTab("commit");
              }}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
                activeTab === "commit" && commitFocus === "sheet"
                  ? "bg-[#EFCFE3]/70 dark:bg-[#EFCFE3]/15 border-[#E27396] text-[#4A1A2C] dark:text-[#EFCFE3]"
                  : "bg-white dark:bg-[#17222C] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#EA9AB2]"
              }`}
            >
              <FileCheck2 className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">
                3. Phiếu cam kết điện tử &amp; Bản in A4
              </span>
            </button>
          </div>

          {(activeTab === "pathways" ||
            activeTab === "filter" ||
            activeTab === "try_journal" ||
            activeTab === "commit") && (
            <div
              role="tablist"
              aria-label="Năm bước của lộ trình"
              className="flex flex-wrap items-center gap-2 pl-1"
            >
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Lộ trình 5 bước:
              </span>
              {[
                {
                  id: "THU" as JourneyStep,
                  tab: "pathways" as StudentTab,
                  label: "THU · Thu thập",
                  icon: Map,
                  focus: null,
                },
                {
                  id: "LỌC" as JourneyStep,
                  tab: "filter" as StudentTab,
                  label: "LỌC · Đủ tốt",
                  icon: Filter,
                  focus: null,
                },
                {
                  id: "THỬ" as JourneyStep,
                  tab: "try_journal" as StudentTab,
                  label: "THỬ · Trải nghiệm",
                  icon: BookOpen,
                  focus: null,
                },
                {
                  id: "CHỐT" as JourneyStep,
                  tab: "commit" as StudentTab,
                  label: "CHỐT · Chọn hướng",
                  icon: FileCheck2,
                  focus: "choice" as const,
                },
                {
                  id: "CAM KẾT" as JourneyStep,
                  tab: "commit" as StudentTab,
                  label: "CAM KẾT · Ký cam kết",
                  icon: ClipboardCheck,
                  focus: "plan" as const,
                },
              ].map((step) => {
                const Icon = step.icon;
                const active =
                  activeTab === step.tab &&
                  (step.tab !== "commit" || commitFocus === step.focus);
                return (
                  <button
                    key={step.id}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => {
                      if (step.focus) setCommitFocus(step.focus);
                      setActiveTab(step.tab);
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
                      active
                        ? "bg-[#EAF2D7] dark:bg-[#EAF2D7]/20 border-[#8FB37C] text-[#223A1E] dark:text-[#EAF2D7]"
                        : "bg-white dark:bg-[#17222C] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#EA9AB2]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{step.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pl-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("ai_chat")}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === "ai_chat"
                  ? "border-[#8FB37C] bg-[#EAF2D7] dark:bg-[#EAF2D7]/20 text-[#223A1E] dark:text-[#EAF2D7] font-semibold"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C] text-slate-600 dark:text-slate-300"
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Trợ lí đặt câu hỏi ({studentAIMessagesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("self_eval")}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === "self_eval"
                  ? "border-[#8FB37C] bg-[#EAF2D7] dark:bg-[#EAF2D7]/20 text-[#223A1E] dark:text-[#EAF2D7] font-semibold"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C] text-slate-600 dark:text-slate-300"
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Tự đánh giá 4 mức</span>
            </button>
          </div>
        </div>

        {/* Specific competence-supporting recognition banner */}
        {recognitionBanner && (
          <div
            role="status"
            aria-live="polite"
            className="no-print p-4 rounded-2xl bg-[#EAF2D7] dark:bg-[#EAF2D7]/15 border border-[#8FB37C] text-[#223A1E] dark:text-[#EAF2D7] flex items-center gap-2.5 text-sm font-medium"
          >
            <Sparkles className="w-5 h-5 shrink-0" />
            <span>{recognitionBanner}</span>
          </div>
        )}

        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 1.1: SVG Journey Compass + Single Next Action Card */}
            <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 flex flex-col items-center">
                <JourneyCompassSVG
                  currentStep={student.currentStep}
                  completedSteps={student.completedSteps || []}
                  celebrateStep={celebrateStep}
                  onSelectStep={handleCompassStepSelect}
                />
              </div>

              <div className="lg:col-span-7 space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2]">
                    La bàn của {student.fullName} · Bấm vào từng cung để mở bước tương ứng
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold leading-snug">
                    Em đang ở bước {student.currentStep}. Đi từng bước vừa sức để chọn điều phù hợp với mình.
                  </h1>
                </div>

                {/* Single concrete next action */}
                <div className="p-5 rounded-2xl bg-[#EAF2D7]/65 dark:bg-[#EAF2D7]/10 border border-[#8FB37C] space-y-3">
                  <p className="text-xs font-bold text-[#223A1E] dark:text-[#EAF2D7]">
                    Việc tiếp theo của em
                  </p>
                  <h2 className="text-base sm:text-lg font-bold text-[#1D242B] dark:text-white">
                    {nextSingleAction.title}
                  </h2>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {nextSingleAction.detail}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (nextSingleAction.targetTab === "commit") {
                        setCommitFocus(
                          student.commitment.studentConfirmedAt
                            ? "plan"
                            : "choice"
                        );
                      }
                      setActiveTab(nextSingleAction.targetTab);
                    }}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>{nextSingleAction.buttonLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {dueTasks.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#B3DEE2]/30 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2] dark:border-slate-700 flex items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#133C42] dark:text-[#B3DEE2] shrink-0" />
                      <span>
                        Nhắc nhẹ: Em có <strong>{dueTasks.length}</strong> việc trong kế hoạch ngắn hạn sắp tới hạn.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCommitFocus("plan");
                        setActiveTab("commit");
                      }}
                      className="font-semibold text-[#133C42] dark:text-[#B3DEE2] hover:underline shrink-0 cursor-pointer"
                    >
                      Xem ngay
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold">Các góc hỗ trợ của em</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className="min-h-[48px] p-4 rounded-xl bg-[#B3DEE2]/35 dark:bg-[#B3DEE2]/15 border border-[#B3DEE2] dark:border-slate-700 text-left flex items-center justify-between gap-2 hover:bg-[#B3DEE2]/50 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-bold">1. Soi chiếu bản thân</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Năng lực · Hứng thú · Điều kiện
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("pathways")}
                    className="min-h-[48px] p-4 rounded-xl bg-[#EAF2D7]/60 dark:bg-[#EAF2D7]/10 border border-[#B3DEE2] dark:border-slate-700 text-left flex items-center justify-between gap-2 hover:bg-[#EAF2D7] transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-bold">
                        2. Lộ trình 5 bước (THU–LỌC–THỬ–CHỐT–CAM KẾT)
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Đang ở bước {student.currentStep} · {activeOptions.length}/3 phương án
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCommitFocus("sheet");
                      setActiveTab("commit");
                    }}
                    className="sm:col-span-2 min-h-[48px] p-4 rounded-xl bg-[#EFCFE3]/45 dark:bg-[#EFCFE3]/10 border border-[#EA9AB2] dark:border-slate-700 text-left flex items-center justify-between gap-2 hover:bg-[#EFCFE3]/70 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-bold">
                        3. Phiếu cam kết điện tử &amp; Bản in A4
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {student.commitment.studentConfirmedAt
                          ? `Em đã xác nhận lúc ${student.commitment.studentConfirmedAt}`
                          : "Tự động tổng hợp từ hành trình, sẵn sàng in A4 để kí tay"}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold">Tóm tắt hiện tại của em</h2>
                <div className="space-y-3 text-sm">
                  <div className="p-3.5 rounded-xl bg-[#EAF2D7]/60 dark:bg-[#EAF2D7]/10 border border-[#EAF2D7] dark:border-slate-700 space-y-2.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[#223A1E] dark:text-[#EAF2D7]">
                      <KeyRound className="w-3.5 h-3.5" />
                      Mã PIN kết nối Phụ huynh
                    </p>

                    <p
                      className="text-2xl font-bold tracking-[0.4em] text-[#133C42] dark:text-[#EDF2F7]"
                      aria-label={`Mã PIN kết nối Phụ huynh là ${parentPin}`}
                    >
                      {parentPin}
                    </p>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Chia sẻ mã này cho ba mẹ để liên kết hồ sơ của em ở vai Phụ
                      huynh.
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyPin}
                        aria-label="Sao chép mã PIN"
                        className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#223A1E]/30 dark:border-[#EAF2D7]/40 text-xs font-semibold text-[#223A1E] dark:text-[#EAF2D7] hover:bg-white/70 dark:hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        {pinCopied ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{pinCopied ? "Đã sao chép" : "Sao chép"}</span>
                      </button>
                      {canChangePin && !editingPin && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPin(true);
                            setNewPin("");
                            setPinError("");
                            setPinNotice("");
                          }}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#223A1E]/30 dark:border-[#EAF2D7]/40 text-xs font-semibold text-[#223A1E] dark:text-[#EAF2D7] hover:bg-white/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Đổi mã PIN
                        </button>
                      )}
                    </div>

                    {pinNotice && (
                      <p className="text-xs font-medium text-[#223A1E] dark:text-[#EAF2D7]">
                        {pinNotice}
                      </p>
                    )}
                    {pinError && (
                      <p
                        role="alert"
                        className="flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-300"
                      >
                        <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{pinError}</span>
                      </p>
                    )}

                    {editingPin && (
                      <div className="space-y-2 pt-1">
                        <label
                          htmlFor="student-new-pin"
                          className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                          Mã PIN mới (4 chữ số)
                        </label>
                        <input
                          id="student-new-pin"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={4}
                          value={newPin}
                          onChange={(e) => {
                            setNewPin(
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            );
                            setPinError("");
                          }}
                          placeholder="••••"
                          className="w-full min-h-[42px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F171E] px-3 py-2 text-center text-lg tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#E27396]"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSavePin}
                            disabled={pinBusy}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-60 text-[#1D1519] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {pinBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>{pinBusy ? "Đang lưu..." : "Lưu PIN"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPin(false);
                              setNewPin("");
                              setPinError("");
                            }}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Điểm sáng sở thích
                    </p>
                    <p className="mt-1 leading-relaxed">
                      {student.profile.hollandSummaryText}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Phương án đang cân nhắc ({activeOptions.length}/3)
                    </p>
                    {activeOptions.length === 0 ? (
                      <p className="mt-1 text-slate-500 dark:text-slate-400">
                        Chưa có — hãy mở Bản đồ lộ trình để thêm nhé.
                      </p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {activeOptions.map((o) => (
                          <li key={o.id} className="font-medium">
                            · {o.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Hỏi đáp cùng Trợ lí đặt câu hỏi
                      </p>
                      <p className="mt-0.5 font-medium">
                        {studentAIMessagesCount} trao đổi gợi mở
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("ai_chat")}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-xs font-semibold cursor-pointer"
                    >
                      Trò chuyện
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {student.summary && (
              <StudentSummaryReport
                summary={student.summary}
                audience="student"
              />
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <SelfProfile student={student} onUpdateStudent={onUpdateStudent} />
        )}

        {activeTab === "pathways" && (
          <PathwayMap
            pathways={pathways}
            student={student}
            focusedPathwayId={focusedPathwayId}
            onAddOptionToFilter={handleAddOptionToFilter}
            onTryScenarioForPathway={(pwId) => {
              setFocusedPathwayId(pwId);
              setActiveTab("try_journal");
            }}
          />
        )}

        {activeTab === "filter" && (
          <GoodEnoughFilter
            student={student}
            onUpdateStudent={onUpdateStudent}
            onNavigateToPathways={(pwId) => {
              if (pwId) setFocusedPathwayId(pwId);
              setActiveTab("pathways");
            }}
            onConfirmGoodEnough={handleConfirmGoodEnough}
            onRecognitionMessage={showRecognition}
            onStepCompleted={handleStepCompleted}
          />
        )}

        {activeTab === "try_journal" && (
          <TryAndJournal
            student={student}
            pathways={pathways}
            experiences={experiences}
            focusedPathwayId={focusedPathwayId}
            onUpdateStudent={onUpdateStudent}
            onJournalSubmittedWithAI={async (text, actType) => {
              await onTriggerAIQuestion({
                student,
                studentMessage: `[Nhật ký - ${actType}]: ${text}`,
                triggerReason: "journal_entry",
              });
            }}
            onStepCompleted={handleStepCompleted}
          />
        )}

        {activeTab === "commit" && (
          <CommitForm
            student={student}
            focusSection={commitFocus}
            onUpdateStudent={onUpdateStudent}
            onTriggerAIChangeCheck={async (newChoice) => {
              await onTriggerAIQuestion({
                student,
                studentMessage: `Em muốn đổi lựa chọn đã chốt sang "${newChoice}".`,
                triggerReason: "change_option",
              });
            }}
            onRecognitionMessage={showRecognition}
            onStepCompleted={handleStepCompleted}
          />
        )}

        {activeTab === "ai_chat" && (
          <AIChat
            student={student}
            messages={aiMessages}
            requireApproval={settings.requireTeacherApprovalBeforeDisplay}
            onSendMessage={async (text, onStreamPartial) => {
              await onTriggerAIQuestion({
                student,
                studentMessage: text,
                triggerReason: "student_chat",
                onStreamPartial,
              });
            }}
          />
        )}

        {activeTab === "self_eval" && (
          <RubricAssessment
            mode="student"
            students={allStudents}
            selectedStudentId={student.id}
            onUpdateStudent={onUpdateStudent}
          />
        )}
      </main>

      {/* Choice Overload Modal when adding 4th option from PathwayMap */}
      <ChoiceOverloadModal
        open={Boolean(pendingPathwayToAdd)}
        pendingOptionTitle={pendingPathwayToAdd?.title || ""}
        activeOptions={activeOptions.slice(0, 3)}
        criteria={student.criteria}
        onConfirmSwap={async (archiveId, reason) => {
          if (!pendingPathwayToAdd) return;
          const pw = pendingPathwayToAdd;
          setPendingPathwayToAdd(null);
          await commitAddPathwayOption(pw, archiveId, reason);
        }}
        onCancel={() => setPendingPathwayToAdd(null)}
      />

      {/* Student Privacy & Personal Data Controls Modal */}
      {showPrivacyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-privacy-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#133C42] dark:text-[#B3DEE2]" />
                <h2 id="student-privacy-title" className="text-lg font-bold">
                  Quyền riêng tư &amp; Dữ liệu của em
                </h2>
              </div>
              <button
                type="button"
                aria-label="Đóng cửa sổ quyền riêng tư"
                onClick={() => setShowPrivacyModal(false)}
                className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <p>
                  <span className="text-slate-500 dark:text-slate-400">
                    Họ và tên:
                  </span>{" "}
                  <strong className="text-[#133C42] dark:text-[#B3DEE2]">
                    {student.fullName}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500 dark:text-slate-400">
                    Thời điểm em đồng ý tham gia:
                  </span>{" "}
                  <strong className="tabular-nums">
                    {student.privacyConsentAcceptedAt || "Đã xác nhận"}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500 dark:text-slate-400">
                    Chia sẻ với phụ huynh:
                  </span>{" "}
                  <strong>
                    {student.shareWithParent
                      ? "Đang bật (em có thể tắt bất cứ lúc nào)"
                      : "Đang tắt (riêng tư)"}
                  </strong>
                </p>
              </div>

              {student.dataDeletionRequestedAt && (
                <div className="p-3.5 rounded-xl bg-[#EFCFE3]/45 dark:bg-[#4A1A2C]/40 border border-[#E27396] text-xs sm:text-sm text-[#4A1A2C] dark:text-[#EFCFE3]">
                  Em đã gửi yêu cầu xóa dữ liệu lúc{" "}
                  <strong className="tabular-nums">
                    {student.dataDeletionRequestedAt}
                  </strong>
                  . Giáo viên phụ trách đã nhận được thông báo để xóa bản ghi của em khỏi hệ thống.
                </div>
              )}

              {privacyStatusMsg && (
                <div className="p-3.5 rounded-xl bg-[#EAF2D7] text-xs sm:text-sm text-[#223A1E]">
                  {privacyStatusMsg}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    exportStudentPersonalDataJSON(student, aiMessages, meetings);
                    setPrivacyStatusMsg(
                      `Đã tải xuống tệp dữ liệu cá nhân của ${student.fullName}.`
                    );
                  }}
                  className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải dữ liệu của em</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={Boolean(student.dataDeletionRequestedAt)}
                  className="flex-1 min-h-[42px] px-4 py-2 rounded-xl border border-[#EA9AB2] bg-[#EFCFE3]/40 hover:bg-[#EFCFE3]/70 disabled:opacity-50 text-[#4A1A2C] dark:text-[#EFCFE3] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {student.dataDeletionRequestedAt
                      ? "Đã gửi yêu cầu xóa"
                      : "Yêu cầu xóa dữ liệu"}
                  </span>
                </button>
              </div>

              {confirmDeleteOpen && !student.dataDeletionRequestedAt && (
                <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-[#E27396] space-y-3 text-xs sm:text-sm">
                  <p className="font-semibold text-[#4A1A2C] dark:text-[#EFCFE3]">
                    Em muốn gửi yêu cầu xóa dữ liệu cá nhân trong hệ thống?
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Nếu em xác nhận, nhật ký và dữ liệu hành trình của {student.fullName} sẽ được đánh dấu chờ thầy/cô xóa hẳn khỏi hệ thống. Em có thể tải dữ liệu về trước khi xác nhận.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteOpen(false)}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-medium cursor-pointer"
                    >
                      Để sau
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date().toLocaleString("vi-VN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        onUpdateStudent({
                          ...student,
                          shareWithParent: false,
                          dataDeletionRequestedAt: now,
                        });
                        setConfirmDeleteOpen(false);
                        setPrivacyStatusMsg(
                          "Đã ghi nhận yêu cầu xóa dữ liệu của em và tắt chia sẻ với phụ huynh."
                        );
                      }}
                      className="min-h-[36px] px-4 py-1.5 rounded-lg bg-[#E27396] text-[#1D1519] font-semibold cursor-pointer"
                    >
                      Xác nhận yêu cầu xóa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav
        aria-label="Điều hướng nhanh trên điện thoại"
        className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-[#17222C]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center"
      >
        {[
          { id: "overview", label: "La bàn", icon: Compass, focus: null },
          { id: "profile", label: "Soi chiếu", icon: User, focus: null },
          { id: "pathways", label: "Lộ trình", icon: Map, focus: null },
          {
            id: "commit",
            label: "Chốt",
            icon: FileCheck2,
            focus: "choice" as const,
          },
          {
            id: "commit",
            label: "Phiếu A4",
            icon: ClipboardCheck,
            focus: "sheet" as const,
          },
        ].map((item) => {
          const Icon = item.icon;
          const active =
            activeTab === item.id &&
            (item.id !== "commit" || commitFocus === item.focus);
          return (
            <button
              key={`${item.id}-${item.label}`}
              type="button"
              onClick={() => {
                if (item.focus) setCommitFocus(item.focus);
                setActiveTab(item.id as StudentTab);
              }}
              className={`flex flex-col items-center justify-center h-full gap-0.5 text-[11px] font-medium cursor-pointer ${
                active
                  ? "text-[#9D2950] dark:text-[#EA9AB2] font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
