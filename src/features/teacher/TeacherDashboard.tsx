import React, { useMemo, useState } from "react";
import {
  Users,
  MessageSquareText,
  BarChart2,
  Calendar,
  Settings2,
  AlertTriangle,
  Eye,
  ArrowLeft,
  CheckCircle2,
  Sun,
  Moon,
  Flag,
  Sparkles,
  BookOpenText,
  AlertCircle,
  FlaskConical,
  Settings,
  Columns3,
  Table2,
  RotateCcw,
  HeartHandshake,
} from "lucide-react";
import { CompassLogo } from "../../components/CompassLogo";
import { AccountMenu } from "../../components/AccountMenu";
import { SelfProfile } from "../self-profile/SelfProfile";
import { AIReviewQueue } from "./AIReviewQueue";
import { RubricAssessment } from "./RubricAssessment";
import { ThreePartyMeeting } from "./ThreePartyMeeting";
import { ThematicCodingStudio } from "./ThematicCodingStudio";
import { ContentAdmin } from "./ContentAdmin";
import { ResearchMode } from "./ResearchMode";
import { StudentTimeline } from "./StudentTimeline";
import { describeBehavioralSignals, JOURNEY_STEPS } from "../../data/mockData";
import {
  SCHOOL_CLASSES,
  DEFAULT_CLASS_ID,
  schoolClassLabel,
} from "../../data/schoolClasses";
import { requestTeacherJourneySummary } from "../../services/ai";
import type {
  AIMessage,
  AIModerationAction,
  AIModerationLog,
  AppState,
  AuthUser,
  Experience,
  JourneyStep,
  Meeting,
  Pathway,
  Student,
  ThematicCodeItem,
} from "../../types";

type TeacherTab =
  | "class"
  | "ai_queue"
  | "rubric"
  | "meetings"
  | "thematic"
  | "research"
  | "admin";

interface TeacherDashboardProps {
  appState: AppState;
  onUpdateStudent: (updated: Student) => void;
  onUpdateAIMessage: (
    updated: AIMessage,
    logMeta: {
      action: AIModerationAction;
      editedReply?: string;
      reason?: string;
    }
  ) => void;
  onUpdateThematicCodes: (next: ThematicCodeItem[]) => void;
  onToggleRequireApproval: () => void;
  onAddMeeting: (meeting: Meeting) => void;
  onUpdateMeeting: (meeting: Meeting) => void;
  onUpdatePathway: (updated: Pathway) => void;
  onAddPathway: (created: Pathway) => void;
  onAddExperience: (activity: Experience) => void;
  onDeleteExperience: (id: string) => void;
  onImportContent: (payload: {
    pathways: Pathway[];
    experiences: Experience[];
  }) => void;
  onOpenSettings: () => void;
  onToggleDarkMode: () => void;
  onExitRole: () => void;
  account?: AuthUser | null;
  offlineSession?: boolean;
  onLogout?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  appState,
  onUpdateStudent,
  onUpdateAIMessage,
  onUpdateThematicCodes,
  onToggleRequireApproval,
  onAddMeeting,
  onUpdateMeeting,
  onUpdatePathway,
  onAddPathway,
  onAddExperience,
  onDeleteExperience,
  onImportContent,
  onOpenSettings,
  onToggleDarkMode,
  onExitRole,
  account,
  offlineSession,
  onLogout,
}) => {
  const {
    students: allStudents,
    pathways,
    experiences,
    aiMessages,
    aiModerationLogs,
    thematicCodes,
    meetings,
    settings,
  } = appState;

  const [selectedClass, setSelectedClass] = useState<string>(
    account?.className ?? DEFAULT_CLASS_ID
  );
  const students = useMemo(
    () => allStudents.filter((s) => s.className === selectedClass),
    [allStudents, selectedClass]
  );

  const [activeTab, setActiveTab] = useState<TeacherTab>("class");
  const [classViewMode, setClassViewMode] = useState<"board" | "table">(
    "board"
  );

  // 3.1 Filters
  const [onlyFocusGroup, setOnlyFocusGroup] = useState(false);
  const [onlyAttentionSignals, setOnlyAttentionSignals] = useState(false);
  const [onlyMissingDeadline, setOnlyMissingDeadline] = useState(false);
  const [onlyOverdueDeadline, setOnlyOverdueDeadline] = useState(false);
  const [onlyPendingAI, setOnlyPendingAI] = useState(false);
  const [stepFilter, setStepFilter] = useState<"ALL" | JourneyStep>("ALL");

  // 3.1 Visual-only drag-and-drop map preview (NEVER mutates student data)
  const [visualPreviewSteps, setVisualPreviewSteps] = useState<
    Record<string, JourneyStep>
  >({});
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<JourneyStep | null>(
    null
  );

  const [openedStudentId, setOpenedStudentId] = useState<string | null>(null);
  const [rubricStudentId, setRubricStudentId] = useState<string>(
    students[0]?.id || "hs-01"
  );
  const effectiveRubricStudentId = students.some(
    (s) => s.id === rubricStudentId
  )
    ? rubricStudentId
    : students[0]?.id || "hs-01";

  // Journey Summary AI state (per opened student)
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryDraftMap, setSummaryDraftMap] = useState<
    Record<string, { summary: string; highlights: string[] }>
  >({});

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const pendingAIStudentIds = useMemo(
    () =>
      new Set(
        aiMessages
          .filter((m) => m.status === "chờ duyệt")
          .map((m) => m.studentId)
      ),
    [aiMessages]
  );

  const isStudentOverdue = (s: Student) =>
    !s.commitment.studentConfirmedAt &&
    Boolean(s.commitment.deadlineDate) &&
    s.commitment.deadlineDate < todayIso;

  const openedStudent = openedStudentId
    ? students.find((s) => s.id === openedStudentId) || null
    : null;

  const handleGenerateJourneySummary = async (stu: Student) => {
    setSummaryError(null);
    setSummaryLoading(true);
    try {
      const res = await requestTeacherJourneySummary(stu);
      setSummaryDraftMap((prev) => ({
        ...prev,
        [stu.id]: res,
      }));
    } catch (err) {
      setSummaryError(
        err instanceof Error
          ? err.message
          : "Không tạo được bản tóm tắt hành trình lúc này."
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (onlyFocusGroup && !s.isFocusGroup) return false;
    const signals = describeBehavioralSignals(s.signals);
    if (onlyAttentionSignals && signals.length === 0) return false;
    if (onlyMissingDeadline && Boolean(s.commitment.deadlineDate)) return false;
    if (onlyOverdueDeadline && !isStudentOverdue(s)) return false;
    if (onlyPendingAI && !pendingAIStudentIds.has(s.id)) return false;
    if (stepFilter !== "ALL" && s.currentStep !== stepFilter) return false;
    return true;
  });

  // 3.1: "Cần thầy/cô quan tâm hôm nay" (max 5 students with verbal reason)
  const attentionTodayList = useMemo(() => {
    const items: { student: Student; priority: number; reason: string }[] = [];
    for (const s of students) {
      const hasSensitiveMsg = aiMessages.some(
        (m) => m.studentId === s.id && m.nhayCam
      );
      if (s.signals.hasSensitiveAlert || hasSensitiveMsg) {
        items.push({
          student: s,
          priority: 100,
          reason:
            "Có chia sẻ dấu hiệu căng thẳng hoặc nội dung nhạy cảm cần thầy/cô hỏi thăm trực tiếp.",
        });
        continue;
      }
      if (pendingAIStudentIds.has(s.id)) {
        items.push({
          student: s,
          priority: 85,
          reason:
            "Có phản hồi của trợ lí AI đang chờ thầy/cô kiểm tra và duyệt hiển thị.",
        });
        continue;
      }
      if (isStudentOverdue(s)) {
        items.push({
          student: s,
          priority: 75,
          reason: `Đã qua hạn chốt dự kiến (${s.commitment.deadlineDate}) nhưng em chưa xác nhận lựa chọn.`,
        });
        continue;
      }
      if (s.signals.abandonedCommitStep || s.signals.addedAfterCommit) {
        items.push({
          student: s,
          priority: 65,
          reason: s.signals.abandonedCommitStep
            ? "Em từng mở mục Chốt quyết định nhưng tạm dừng giữa chừng."
            : "Em đã thêm phương án mới sau khi từng chốt hướng đi.",
        });
        continue;
      }
      if (s.signals.changeOptionCount >= 2 || (s.isFocusGroup && !s.commitment.deadlineDate)) {
        items.push({
          student: s,
          priority: 50,
          reason:
            s.signals.changeOptionCount >= 2
              ? `Em đã thay đổi phương án ${s.signals.changeOptionCount} lần và có câu băn khoăn trong nhật ký.`
              : "Thuộc nhóm trọng tâm nhưng chưa đặt hạn chốt cho hành trình.",
        });
      }
    }
    return items.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }, [students, aiMessages, pendingAIStudentIds, todayIso]);

  const pendingAICount = aiMessages.filter((m) => m.status === "chờ duyệt").length;
  const sensitiveCount = aiMessages.filter((m) => m.nhayCam).length;
  const hasVisualPreviewMoves = Object.keys(visualPreviewSteps).length > 0;

  const handleTeacherConfirmCommitment = (stu: Student) => {
    const now = new Date().toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    onUpdateStudent({
      ...stu,
      commitment: {
        ...stu.commitment,
        teacherConfirmedAt: now,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] dark:bg-[#0F171E] text-[#1D242B] dark:text-[#EDF2F7] flex flex-col">
      <header className="sticky top-0 z-30 h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#17222C]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setOpenedStudentId(null);
              setActiveTab("class");
            }}
            className="flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CompassLogo size={26} />
            <span className="text-base font-bold tracking-tight">
              La Bàn Lựa Chọn
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-4 text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-300">
            {[
              { id: "class", label: schoolClassLabel(selectedClass) },
              {
                id: "ai_queue",
                label:
                  pendingAICount > 0
                    ? `Duyệt AI (${pendingAICount})`
                    : "Duyệt AI",
              },
              { id: "rubric", label: "Đánh giá 4 mức" },
              { id: "meetings", label: "Họp ba bên" },
              { id: "thematic", label: "Mã hóa" },
              { id: "research", label: "Nghiên cứu" },
              { id: "admin", label: "Quản trị" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setOpenedStudentId(null);
                  setActiveTab(item.id as TeacherTab);
                }}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                  activeTab === item.id && !openedStudent
                    ? "border-[#E27396] text-[#1D242B] dark:text-white font-semibold"
                    : "border-transparent hover:text-[#1D242B] dark:hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
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

      <div className="border-b border-slate-200/70 dark:border-slate-800 bg-[#EAF2D7]/40 dark:bg-[#17222C]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200">
            <label
              htmlFor="teacher-class-select"
              className="text-xs font-semibold sr-only sm:not-sr-only"
            >
              Chọn lớp nhanh
            </label>
            <select
              id="teacher-class-select"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setOpenedStudentId(null);
                setStepFilter("ALL");
              }}
              className="min-h-[34px] rounded-lg border border-[#223A1E]/30 dark:border-slate-700 bg-white dark:bg-[#0F171E] px-2 py-1 text-xs font-semibold text-[#223A1E] dark:text-[#EAF2D7] focus:outline-none focus:ring-2 focus:ring-[#E27396]"
            >
              {SCHOOL_CLASSES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <span aria-hidden="true">·</span>
            <span>
              {allStudents.length} học sinh toàn khối · {students.length} em
              trong lớp này
            </span>
            {sensitiveCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setOpenedStudentId(null);
                    setActiveTab("ai_queue");
                  }}
                  className="text-rose-700 dark:text-rose-300 font-bold hover:underline cursor-pointer"
                >
                  Có cảnh báo nhạy cảm cần xem ({sensitiveCount})
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSettings}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Cài đặt</span>
            </button>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              {settings.darkMode ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
              <span>{settings.darkMode ? "Sáng" : "Tối"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C] px-4 py-2 flex overflow-x-auto gap-2">
        {[
          { id: "class", label: schoolClassLabel(selectedClass), icon: Users },
          { id: "ai_queue", label: "Duyệt AI", icon: MessageSquareText },
          { id: "rubric", label: "Đánh giá", icon: BarChart2 },
          { id: "meetings", label: "Họp 3 bên", icon: Calendar },
          { id: "thematic", label: "Mã hóa", icon: BookOpenText },
          { id: "research", label: "Nghiên cứu", icon: FlaskConical },
          { id: "admin", label: "Quản trị", icon: Settings2 },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setOpenedStudentId(null);
                setActiveTab(item.id as TeacherTab);
              }}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer ${
                active
                  ? "bg-[#B3DEE2] text-[#133C42]"
                  : "bg-slate-100 dark:bg-[#0F171E] text-slate-700 dark:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {openedStudent ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setOpenedStudentId(null)}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại danh sách {schoolClassLabel(selectedClass)}</span>
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStudent({
                      ...openedStudent,
                      isFocusGroup: !openedStudent.isFocusGroup,
                    })
                  }
                  className={`min-h-[42px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                    openedStudent.isFocusGroup
                      ? "bg-[#EFCFE3]/60 border-[#E27396] text-[#4A1A2C] dark:text-[#EFCFE3]"
                      : "bg-white dark:bg-[#17222C] border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  <span>
                    Nhóm trọng tâm: {openedStudent.isFocusGroup ? "Đang đánh dấu" : "Không"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRubricStudentId(openedStudent.id);
                    setOpenedStudentId(null);
                    setActiveTab("rubric");
                  }}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  Đánh giá 4 mức &amp; Minh chứng cho em này
                </button>
              </div>
            </div>

            <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="text-lg font-bold text-[#1D242B] dark:text-white">
                  Hồ sơ {openedStudent.code} ({openedStudent.anonymizedLabel})
                </span>
                <span aria-hidden="true">·</span>
                <span>Bước {openedStudent.currentStep}</span>
                <span aria-hidden="true">·</span>
                <span>
                  Chia sẻ với phụ huynh:{" "}
                  {openedStudent.shareWithParent ? "Đang bật" : "Đang tắt"}
                </span>
              </div>

              {openedStudent.caseStudySummary && (
                <p className="text-sm text-slate-700 dark:text-slate-200 bg-[#FAFBFD] dark:bg-[#0F171E] p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="font-semibold">Bối cảnh (dữ liệu mẫu): </span>
                  {openedStudent.caseStudySummary}
                </p>
              )}

              {openedStudent.dataDeletionRequestedAt && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-700 text-xs sm:text-sm text-rose-900 dark:text-rose-100">
                  <strong>Yêu cầu xóa dữ liệu cá nhân:</strong> {openedStudent.anonymizedLabel} đã gửi yêu cầu xóa dữ liệu vào lúc{" "}
                  <span className="tabular-nums font-semibold">
                    {openedStudent.dataDeletionRequestedAt}
                  </span>
                  . Thầy/cô vui lòng xử lí theo quy trình đạo đức nghiên cứu.
                </div>
              )}

              {describeBehavioralSignals(openedStudent.signals).length > 0 && (
                <div className="p-4 rounded-xl bg-[#EFCFE3]/40 dark:bg-[#E27396]/15 border border-[#EA9AB2] space-y-1.5">
                  <p className="text-xs font-bold text-[#9D2950] dark:text-[#EA9AB2] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Dấu hiệu cần chú ý (chỉ hiển thị cho giáo viên)</span>
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-slate-800 dark:text-slate-100">
                    {describeBehavioralSignals(openedStudent.signals).map(
                      (desc, i) => (
                        <li key={i}>{desc}</li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* 2.3: Teacher AI "Tóm tắt hành trình" */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#133C42] dark:text-[#B3DEE2]">
                      Tóm tắt hành trình (AI hỗ trợ giáo viên)
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Viết 4–5 câu mô tả bằng lời từ hồ sơ ẩn danh; thầy/cô kiểm tra và chỉnh sửa trước khi dùng.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={summaryLoading}
                    onClick={() => handleGenerateJourneySummary(openedStudent)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-50 text-[#1D1519] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {summaryLoading
                        ? "AI đang tóm tắt..."
                        : summaryDraftMap[openedStudent.id]
                        ? "Tạo lại tóm tắt hành trình"
                        : "Tóm tắt hành trình"}
                    </span>
                  </button>
                </div>

                {summaryError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-700 text-xs sm:text-sm text-rose-800 dark:text-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{summaryError}</span>
                  </div>
                )}

                {summaryDraftMap[openedStudent.id] && (
                  <div className="p-4 rounded-xl bg-[#EAF2D7]/55 dark:bg-[#EAF2D7]/10 border border-[#8FB37C] space-y-2.5">
                    <p className="text-xs font-bold text-[#223A1E] dark:text-[#EAF2D7]">
                      Bản nháp do AI viết – thầy/cô kiểm tra lại
                    </p>
                    <textarea
                      rows={4}
                      aria-label="Bản nháp tóm tắt hành trình do AI viết"
                      value={summaryDraftMap[openedStudent.id].summary}
                      onChange={(e) =>
                        setSummaryDraftMap((prev) => ({
                          ...prev,
                          [openedStudent.id]: {
                            ...prev[openedStudent.id],
                            summary: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F171E] p-3 text-sm leading-relaxed"
                    />
                    {summaryDraftMap[openedStudent.id].highlights.length > 0 && (
                      <div className="text-xs space-y-1 text-slate-700 dark:text-slate-200">
                        <p className="font-semibold">Điểm đáng chú ý:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {summaryDraftMap[openedStudent.id].highlights.map(
                            (h, idx) => (
                              <li key={idx}>{h}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* 3.2: Dòng thời gian đầy đủ */}
            <StudentTimeline
              student={openedStudent}
              experiences={experiences}
              aiMessages={aiMessages}
              meetings={meetings}
            />

            <SelfProfile
              student={openedStudent}
              isTeacherEditing={true}
              onUpdateStudent={onUpdateStudent}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold">
                  Tiêu chí &amp; Phương án em đang cân nhắc
                </h3>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Tiêu chí tối thiểu em đặt:
                  </p>
                  {openedStudent.criteria.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa đặt tiêu chí.</p>
                  ) : (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {openedStudent.criteria.map((c) => (
                        <li key={c.id}>{c.label}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Phương án đang xét / tạm gác:
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {openedStudent.consideredOptions.map((o) => (
                      <li
                        key={o.id}
                        className="p-2.5 rounded-lg bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between"
                      >
                        <span>{o.title}</span>
                        <span className="text-xs text-slate-500">{o.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Nhật ký lựa chọn ({openedStudent.journal.length})
                  </p>
                  {openedStudent.journal.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có ghi chép nhật ký.</p>
                  ) : (
                    <div className="space-y-2">
                      {openedStudent.journal.map((j) => (
                        <div
                          key={j.id}
                          className="p-3 rounded-lg bg-[#FAFBFD] dark:bg-[#0F171E] text-sm space-y-1"
                        >
                          <p className="text-xs text-slate-500">
                            {j.activityType} · {j.date}
                          </p>
                          <p>{j.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold">
                  Phiếu cam kết điện tử của {openedStudent.code}
                </h3>
                <div className="space-y-3 text-sm bg-[#FAFBFD] dark:bg-[#0F171E] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500">Lựa chọn đã chốt:</p>
                    <p className="font-semibold">
                      {openedStudent.commitment.chosenOption || "Chưa chốt"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">
                      Lí do viết bằng lời của em:
                    </p>
                    <p className="leading-relaxed">
                      {openedStudent.commitment.reasonInOwnWords || "Chưa viết"}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <p className="font-semibold">Học sinh:</p>
                      <p className="tabular-nums">
                        {openedStudent.commitment.studentConfirmedAt || "Chưa xác nhận"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Phụ huynh:</p>
                      <p className="tabular-nums">
                        {openedStudent.commitment.parentConfirmedAt || "Chờ xác nhận"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Giáo viên:</p>
                      <p className="tabular-nums">
                        {openedStudent.commitment.teacherConfirmedAt || "Chờ thầy/cô"}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTeacherConfirmCommitment(openedStudent)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {openedStudent.commitment.teacherConfirmedAt
                      ? "Cập nhật xác nhận của GVCN"
                      : "Xác nhận phiếu cam kết (GVCN)"}
                  </span>
                </button>
              </section>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "class" && (
              <div className="space-y-6">
                {/* 3.1: Cần thầy/cô quan tâm hôm nay (tối đa 5 HS) */}
                {attentionTodayList.length > 0 && (
                  <section className="bg-white dark:bg-[#17222C] border border-[#EA9AB2]/70 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <HeartHandshake className="w-5 h-5 text-[#9D2950] dark:text-[#EA9AB2]" />
                      <div>
                        <h2 className="text-base sm:text-lg font-bold">
                          Cần thầy/cô quan tâm hôm nay ({attentionTodayList.length} học sinh)
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Tối đa 5 gợi ý ưu tiên theo dấu hiệu nhạy cảm, AI chờ duyệt hoặc tiến độ chốt lựa chọn.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                      {attentionTodayList.map((item) => (
                        <button
                          key={item.student.id}
                          type="button"
                          onClick={() => setOpenedStudentId(item.student.id)}
                          className="text-left p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 hover:border-[#E27396] transition-colors flex flex-col justify-between gap-2 cursor-pointer"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-[#1D242B] dark:text-white">
                                {item.student.code}
                              </span>
                              <span className="text-[11px] font-semibold text-[#133C42] dark:text-[#B3DEE2]">
                                {item.student.currentStep}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {item.reason}
                            </p>
                          </div>
                          <span className="text-[11px] font-semibold text-[#9D2950] dark:text-[#EA9AB2]">
                            Mở hồ sơ →
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Filters + View Switcher */}
                <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-lg sm:text-xl font-bold">
                        Tổng quan {schoolClassLabel(selectedClass)} ({students.length} học sinh)
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                        Đang hiển thị {filteredStudents.length} học sinh theo bộ lọc. Kéo thẻ trên bản đồ chỉ để thầy/cô xem thử, không làm đổi dữ liệu học sinh.
                      </p>
                    </div>

                    <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#0F171E] self-start">
                      <button
                        type="button"
                        onClick={() => setClassViewMode("board")}
                        className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                          classViewMode === "board"
                            ? "bg-white dark:bg-[#17222C] text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <Columns3 className="w-3.5 h-3.5" />
                        <span>Bản đồ 5 bước</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setClassViewMode("table")}
                        className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                          classViewMode === "table"
                            ? "bg-white dark:bg-[#17222C] text-slate-900 dark:text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <Table2 className="w-3.5 h-3.5" />
                        <span>Bảng danh sách</span>
                      </button>
                    </div>
                  </div>

                  {/* 5 required filters */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setOnlyFocusGroup(!onlyFocusGroup)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        onlyFocusGroup
                          ? "bg-[#EFCFE3]/70 border-[#E27396] text-[#4A1A2C]"
                          : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      Nhóm trọng tâm ({students.filter((s) => s.isFocusGroup).length})
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOnlyAttentionSignals(!onlyAttentionSignals)
                      }
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        onlyAttentionSignals
                          ? "bg-[#B3DEE2] border-[#63AEB6] text-[#133C42]"
                          : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      Có dấu hiệu cần chú ý
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnlyMissingDeadline(!onlyMissingDeadline)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        onlyMissingDeadline
                          ? "bg-[#B3DEE2] border-[#63AEB6] text-[#133C42]"
                          : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      Chưa đặt hạn chốt
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnlyOverdueDeadline(!onlyOverdueDeadline)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        onlyOverdueDeadline
                          ? "bg-[#EFCFE3]/70 border-[#E27396] text-[#4A1A2C]"
                          : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      Quá hạn chốt
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnlyPendingAI(!onlyPendingAI)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        onlyPendingAI
                          ? "bg-[#EAF2D7] border-[#8FB37C] text-[#223A1E]"
                          : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      Có phản hồi AI chờ duyệt ({pendingAIStudentIds.size})
                    </button>
                  </div>

                  {classViewMode === "table" && (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setStepFilter("ALL")}
                        className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          stepFilter === "ALL"
                            ? "bg-[#1D242B] text-white dark:bg-[#B3DEE2] dark:text-[#133C42]"
                            : "bg-slate-100 dark:bg-[#0F171E] text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        Tất cả bước ({students.length})
                      </button>
                      {JOURNEY_STEPS.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setStepFilter(st.id)}
                          className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                            stepFilter === st.id
                              ? "bg-[#1D242B] text-white dark:bg-[#B3DEE2] dark:text-[#133C42]"
                              : "bg-slate-100 dark:bg-[#0F171E] text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {st.label} (
                          {students.filter((s) => s.currentStep === st.id).length})
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                {classViewMode === "board" ? (
                  <div className="space-y-3">
                    {hasVisualPreviewMoves && (
                      <div className="p-3.5 rounded-xl bg-[#EAF2D7]/70 dark:bg-[#EAF2D7]/15 border border-[#8FB37C] flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[#223A1E] dark:text-[#EAF2D7]">
                        <span>
                          Đang xem thử bố cục kéo-thả (chỉ hiển thị tạm thời để giáo viên hình dung, dữ liệu gốc của học sinh giữ nguyên).
                        </span>
                        <button
                          type="button"
                          onClick={() => setVisualPreviewSteps({})}
                          className="min-h-[34px] px-3 py-1 rounded-lg bg-white dark:bg-[#17222C] border border-[#8FB37C] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Đặt lại vị trí thực tế</span>
                        </button>
                      </div>
                    )}

                    {/* 5-Column Journey Map (THU - LỌC - THỬ - CHỐT - CAM KẾT) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {JOURNEY_STEPS.map((col) => {
                        const colStudents = filteredStudents.filter((s) => {
                          const displayStep =
                            visualPreviewSteps[s.id] || s.currentStep;
                          return displayStep === col.id;
                        });
                        const isDropTarget = dragOverColumn === col.id;

                        return (
                          <div
                            key={col.id}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverColumn(col.id);
                            }}
                            onDragLeave={() => setDragOverColumn(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              const droppedId =
                                e.dataTransfer.getData("text/plain") ||
                                draggedStudentId;
                              if (droppedId) {
                                setVisualPreviewSteps((prev) => ({
                                  ...prev,
                                  [droppedId]: col.id,
                                }));
                              }
                              setDragOverColumn(null);
                              setDraggedStudentId(null);
                            }}
                            className={`rounded-2xl border p-3.5 flex flex-col gap-3 min-h-[340px] transition-colors ${
                              isDropTarget
                                ? "border-[#E27396] bg-[#EFCFE3]/20 dark:bg-[#E27396]/10"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C]"
                            }`}
                          >
                            <div className="border-b border-slate-200/80 dark:border-slate-800 pb-2.5 flex items-center justify-between gap-2">
                              <div>
                                <h3 className="text-sm font-bold text-[#133C42] dark:text-[#B3DEE2]">
                                  {col.label}
                                </h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {col.shortDesc}
                                </p>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-700 text-xs font-bold tabular-nums shrink-0">
                                {colStudents.length} HS
                              </span>
                            </div>

                            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                              {colStudents.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-6">
                                  Không có học sinh nào ở bước này
                                </p>
                              ) : (
                                colStudents.map((stu) => {
                                  const hasSig =
                                    describeBehavioralSignals(stu.signals)
                                      .length > 0;
                                  const overdue = isStudentOverdue(stu);
                                  const pendingAI = pendingAIStudentIds.has(
                                    stu.id
                                  );
                                  const isMovedPreview = Boolean(
                                    visualPreviewSteps[stu.id]
                                  );
                                  return (
                                    <div
                                      key={stu.id}
                                      draggable
                                      onDragStart={(e) => {
                                        setDraggedStudentId(stu.id);
                                        e.dataTransfer.setData(
                                          "text/plain",
                                          stu.id
                                        );
                                      }}
                                      onDragEnd={() => {
                                        setDraggedStudentId(null);
                                        setDragOverColumn(null);
                                      }}
                                      onClick={() => setOpenedStudentId(stu.id)}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" ||
                                          e.key === " "
                                        ) {
                                          e.preventDefault();
                                          setOpenedStudentId(stu.id);
                                        }
                                      }}
                                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-grab active:cursor-grabbing hover:border-[#3A8F98] ${
                                        stu.signals.hasSensitiveAlert
                                          ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700"
                                          : isMovedPreview
                                          ? "bg-[#EAF2D7]/50 dark:bg-[#EAF2D7]/10 border-[#8FB37C]"
                                          : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200 dark:border-slate-800"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1.5">
                                        <span className="text-xs font-bold">
                                          {stu.code}
                                        </span>
                                        <span className="text-[11px] text-slate-500">
                                          {stu.isFocusGroup
                                            ? "Trọng tâm"
                                            : stu.anonymizedLabel}
                                        </span>
                                      </div>
                                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                                        {pendingAI && (
                                          <span className="text-[#133C42] dark:text-[#B3DEE2] font-semibold">
                                            · AI chờ duyệt
                                          </span>
                                        )}
                                        {overdue && (
                                          <span className="text-[#9D2950] dark:text-[#EA9AB2] font-semibold">
                                            · Quá hạn chốt
                                          </span>
                                        )}
                                        {stu.dataDeletionRequestedAt && (
                                          <span className="text-rose-700 dark:text-rose-300 font-semibold">
                                            · Yêu cầu xóa dữ liệu
                                          </span>
                                        )}
                                        {hasSig && !overdue && (
                                          <span className="text-slate-600 dark:text-slate-300">
                                            · Cần chú ý
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-[#FAFBFD] dark:bg-[#0F171E] text-xs text-slate-500 dark:text-slate-400">
                            <th className="py-3.5 px-4 font-semibold">Học sinh</th>
                            <th className="py-3.5 px-4 font-semibold">Bước hiện tại</th>
                            <th className="py-3.5 px-4 font-semibold">Hạn chốt &amp; Trạng thái</th>
                            <th className="py-3.5 px-4 font-semibold">Dấu hiệu cần chú ý</th>
                            <th className="py-3.5 px-4 font-semibold text-right">Hành động</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                          {filteredStudents.map((stu) => {
                            const signals = describeBehavioralSignals(stu.signals);
                            const isCommitted = Boolean(
                              stu.commitment.studentConfirmedAt
                            );
                            const overdue = isStudentOverdue(stu);
                            return (
                              <tr
                                key={stu.id}
                                className="hover:bg-[#FAFBFD] dark:hover:bg-[#0F171E]/60 transition-colors"
                              >
                                <td className="py-3.5 px-4 align-top">
                                  <div className="font-bold">
                                    {stu.code}
                                    {stu.isCaseStudy && (
                                      <span className="ml-2 text-xs font-medium text-[#9D2950] dark:text-[#EA9AB2]">
                                        · Minh họa chi tiết
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {stu.anonymizedLabel}
                                    {stu.isFocusGroup ? " · Nhóm trọng tâm" : ""}
                                  </div>
                                </td>

                                <td className="py-3.5 px-4 align-top font-semibold">
                                  {stu.currentStep}
                                </td>

                                <td className="py-3.5 px-4 align-top">
                                  {isCommitted ? (
                                    <div>
                                      <p className="font-medium text-[#223A1E] dark:text-[#EAF2D7]">
                                        Đã chốt
                                      </p>
                                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-xs">
                                        {stu.commitment.chosenOption}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-0.5">
                                      <span
                                        className={
                                          overdue
                                            ? "text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2]"
                                            : "text-xs text-slate-500 dark:text-slate-400"
                                        }
                                      >
                                        {overdue
                                          ? `Quá hạn (${stu.commitment.deadlineDate})`
                                          : stu.commitment.deadlineDate
                                          ? `Hạn: ${stu.commitment.deadlineDate}`
                                          : "Chưa đặt hạn chốt"}
                                      </span>
                                    </div>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 align-top max-w-sm">
                                  {signals.length === 0 ? (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      Ổn định
                                    </span>
                                  ) : (
                                    <div
                                      className={`inline-flex items-start gap-2 px-3 py-2 rounded-xl text-xs leading-relaxed ${
                                        stu.signals.hasSensitiveAlert
                                          ? "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-300"
                                          : "bg-[#EFCFE3]/45 text-[#4A1A2C] dark:bg-[#E27396]/15 dark:text-[#EFCFE3]"
                                      }`}
                                    >
                                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                      <span>{signals[0]}</span>
                                    </div>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 align-top text-right">
                                  <button
                                    type="button"
                                    onClick={() => setOpenedStudentId(stu.id)}
                                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#B3DEE2]/60 hover:bg-[#B3DEE2] text-[#133C42] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Xem hồ sơ</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === "ai_queue" && (
              <AIReviewQueue
                messages={aiMessages}
                logs={aiModerationLogs}
                requireApprovalBeforeDisplay={
                  settings.requireTeacherApprovalBeforeDisplay
                }
                onToggleRequireApproval={onToggleRequireApproval}
                onUpdateMessage={onUpdateAIMessage}
              />
            )}

            {activeTab === "rubric" && (
              <RubricAssessment
                mode="teacher"
                students={students}
                selectedStudentId={effectiveRubricStudentId}
                onSelectStudentId={setRubricStudentId}
                onUpdateStudent={onUpdateStudent}
              />
            )}

            {activeTab === "meetings" && (
              <ThreePartyMeeting
                students={students}
                meetings={meetings}
                onAddMeeting={onAddMeeting}
                onUpdateMeeting={onUpdateMeeting}
              />
            )}

            {activeTab === "thematic" && (
              <ThematicCodingStudio
                students={students}
                thematicCodes={thematicCodes}
                onUpdateThematicCodes={onUpdateThematicCodes}
              />
            )}

            {activeTab === "research" && (
              <ResearchMode
                appState={appState}
                onOpenSettings={onOpenSettings}
              />
            )}

            {activeTab === "admin" && (
              <ContentAdmin
                pathways={pathways}
                experiences={experiences}
                onUpdatePathway={onUpdatePathway}
                onAddPathway={onAddPathway}
                onAddExperience={onAddExperience}
                onDeleteExperience={onDeleteExperience}
                onImportContent={onImportContent}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

