import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Sparkles,
  AlertCircle,
  Settings,
  Columns3,
  Table2,
  RotateCcw,
  HeartHandshake,
  FileText,
  Search,
  ClipboardCheck,
  Clock3,
  X,
  UserPlus,
} from "lucide-react";
import { CompassLogo } from "../../components/CompassLogo";
import { AccountMenu } from "../../components/AccountMenu";
import { AIReviewQueue } from "./AIReviewQueue";
import { RubricAssessment } from "./RubricAssessment";
import { ThreePartyMeeting } from "./ThreePartyMeeting";
import { StudentTimeline } from "./StudentTimeline";
import { StudentAccountsManager } from "./StudentAccountsManager";
import { StudentSummaryReport } from "../student-journey/StudentSummaryReport";
import { describeBehavioralSignals, JOURNEY_STEPS, createStudentProfile } from "../../data/mockData";
import {
  SCHOOL_CLASSES,
  DEFAULT_CLASS_ID,
  schoolClassLabel,
} from "../../data/schoolClasses";
import { requestTeacherJourneySummary } from "../../services/ai";
import { fetchStudentRecords } from "../../services/studentRecords";
import {
  listStudentAccounts,
  type StudentAccountSummary,
} from "../../services/auth";
import type {
  AIMessage,
  AIModerationAction,
  AIModerationLog,
  AppState,
  AuthSession,
  AuthUser,
  JourneyStep,
  Meeting,
  Student,
} from "../../types";

type TeacherTab =
  | "class"
  | "accounts"
  | "ai_queue"
  | "rubric"
  | "meetings"
  | "summaries";

const STEP_ACCENTS: Record<
  JourneyStep,
  { bar: string; soft: string; chip: string; text: string }
> = {
  THU: {
    bar: "bg-[#B3DEE2]",
    soft: "bg-[#B3DEE2]/25 dark:bg-[#B3DEE2]/10",
    chip: "bg-[#B3DEE2]/70 text-[#133C42]",
    text: "text-[#133C42] dark:text-[#B3DEE2]",
  },
  LỌC: {
    bar: "bg-[#EAF2D7]",
    soft: "bg-[#EAF2D7]/55 dark:bg-[#EAF2D7]/10",
    chip: "bg-[#EAF2D7] text-[#223A1E]",
    text: "text-[#223A1E] dark:text-[#EAF2D7]",
  },
  THỬ: {
    bar: "bg-[#EFCFE3]",
    soft: "bg-[#EFCFE3]/50 dark:bg-[#EFCFE3]/10",
    chip: "bg-[#EFCFE3] text-[#4A1A2C]",
    text: "text-[#4A1A2C] dark:text-[#EFCFE3]",
  },
  CHỐT: {
    bar: "bg-[#EA9AB2]",
    soft: "bg-[#EA9AB2]/25 dark:bg-[#EA9AB2]/10",
    chip: "bg-[#EA9AB2]/45 text-[#4A1A2C]",
    text: "text-[#9D2950] dark:text-[#EA9AB2]",
  },
  "CAM KẾT": {
    bar: "bg-[#E27396]",
    soft: "bg-[#E27396]/12 dark:bg-[#E27396]/10",
    chip: "bg-[#E27396]/20 text-[#9D2950]",
    text: "text-[#9D2950] dark:text-[#E27396]",
  },
};

const AVATAR_ACCENTS = [
  "bg-[#B3DEE2]/70 text-[#133C42]",
  "bg-[#EAF2D7] text-[#223A1E]",
  "bg-[#EFCFE3] text-[#4A1A2C]",
  "bg-[#EA9AB2]/50 text-[#4A1A2C]",
  "bg-[#E27396]/25 text-[#9D2950]",
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (
    parts[parts.length - 2][0] + parts[parts.length - 1][0]
  ).toUpperCase();
}

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
  onToggleRequireApproval: () => void;
  onAddMeeting: (meeting: Meeting) => void;
  onUpdateMeeting: (meeting: Meeting) => void;
  onOpenSettings: () => void;
  onToggleDarkMode: () => void;
  onExitRole: () => void;
  account?: AuthUser | null;
  authSession?: AuthSession | null;
  offlineSession?: boolean;
  onLogout?: () => void;
  onStudentAccountRenamed?: (accountId: string, fullName: string) => void;
  onStudentAccountDeleted?: (accountId: string) => void;
  onEnsureStudentProfiles?: (
    accounts: { id: string; fullName: string; className: string }[]
  ) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  appState,
  onUpdateStudent,
  onUpdateAIMessage,
  onToggleRequireApproval,
  onAddMeeting,
  onUpdateMeeting,
  onOpenSettings,
  onToggleDarkMode,
  onExitRole,
  account,
  authSession,
  offlineSession,
  onLogout,
  onStudentAccountRenamed,
  onStudentAccountDeleted,
  onEnsureStudentProfiles,
}) => {
  const {
    students: allStudents,
    experiences,
    aiMessages,
    aiModerationLogs,
    meetings,
    settings,
  } = appState;

  const [selectedClass, setSelectedClass] = useState<string>(
    account?.className ?? DEFAULT_CLASS_ID
  );

  // Dữ liệu do thiết bị của từng học sinh gửi lên cho giáo viên chủ nhiệm CoThuy912.
  const [remoteStudents, setRemoteStudents] = useState<Student[]>([]);
  useEffect(() => {
    if (!authSession || authSession.user.role !== "teacher") return;
    if (offlineSession || authSession.token.startsWith("local-")) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    let active = true;
    void fetchStudentRecords(authSession).then((records) => {
      if (active) setRemoteStudents(records.map((record) => record.student));
    });
    return () => {
      active = false;
    };
  }, [authSession, offlineSession]);

  // Nguồn duy nhất cho danh sách Lớp 9 là tài khoản học sinh trên hệ thống.
  const [accountList, setAccountList] = useState<StudentAccountSummary[] | null>(
    null
  );
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const reloadAccounts = useCallback(async () => {
    if (!authSession || authSession.user.role !== "teacher") {
      setAccountList([]);
      setAccountsLoading(false);
      return;
    }
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const list = await listStudentAccounts(authSession);
      setAccountList(list);
      onEnsureStudentProfiles?.(
        list.map((item) => ({
          id: item.id,
          fullName: item.fullName,
          className: item.className,
        }))
      );
    } catch (err) {
      setAccountsError(
        err instanceof Error
          ? err.message
          : "Không tải được danh sách tài khoản học sinh."
      );
      setAccountList([]);
    } finally {
      setAccountsLoading(false);
    }
  }, [authSession, onEnsureStudentProfiles]);

  useEffect(() => {
    void reloadAccounts();
  }, [reloadAccounts]);

  const students = useMemo(() => {
    if (!accountList) return [];
    const byId = new Map<string, Student>();
    for (const student of allStudents) byId.set(student.id, student);
    for (const remote of remoteStudents) byId.set(remote.id, remote);
    return accountList
      .filter((item) => item.className === selectedClass)
      .map((item) => {
        const id = `acc:${item.id}`;
        return (
          byId.get(id) ??
          createStudentProfile(id, item.fullName, item.className)
        );
      });
  }, [accountList, allStudents, remoteStudents, selectedClass]);

  const [activeTab, setActiveTab] = useState<TeacherTab>("class");
  const [classViewMode, setClassViewMode] = useState<"board" | "table">(
    "board"
  );

  // 3.1 Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [summaryFilter, setSummaryFilter] = useState<
    "all" | "ready" | "pending"
  >("all");
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
    students[0]?.id || ""
  );
  const effectiveRubricStudentId = students.some(
    (s) => s.id === rubricStudentId
  )
    ? rubricStudentId
    : students[0]?.id || "";

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

  const handleAccountSaved = (saved: StudentAccountSummary) => {
    setAccountList((prev) =>
      [...(prev ?? []).filter((item) => item.id !== saved.id), saved].sort(
        (a, b) => a.fullName.localeCompare(b.fullName, "vi")
      )
    );
    onEnsureStudentProfiles?.([
      { id: saved.id, fullName: saved.fullName, className: saved.className },
    ]);
  };

  const handleAccountUpdated = (saved: StudentAccountSummary) => {
    handleAccountSaved(saved);
    onStudentAccountRenamed?.(saved.id, saved.fullName);
  };

  const handleAccountDeleted = (removed: StudentAccountSummary) => {
    setAccountList((prev) =>
      (prev ?? []).filter((item) => item.id !== removed.id)
    );
    onStudentAccountDeleted?.(removed.id);
  };

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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredStudents = students.filter((s) => {
    const signals = describeBehavioralSignals(s.signals);
    if (
      normalizedQuery &&
      !s.fullName.toLowerCase().includes(normalizedQuery)
    )
      return false;
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
      if (s.signals.changeOptionCount >= 2) {
        items.push({
          student: s,
          priority: 50,
          reason: `Em đã thay đổi phương án ${s.signals.changeOptionCount} lần và có câu băn khoăn trong nhật ký.`,
        });
      }
    }
    return items.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }, [students, aiMessages, pendingAIStudentIds, todayIso]);

  const pendingAICount = aiMessages.filter((m) => m.status === "chờ duyệt").length;
  const sensitiveCount = aiMessages.filter((m) => m.nhayCam).length;
  const hasVisualPreviewMoves = Object.keys(visualPreviewSteps).length > 0;
  const summaryStudents = students.filter((s) => Boolean(s.summary));
  const committedCount = students.filter((s) =>
    Boolean(s.commitment.studentConfirmedAt)
  ).length;
  const overdueCount = students.filter(isStudentOverdue).length;
  const attentionCount = students.filter(
    (s) => describeBehavioralSignals(s.signals).length > 0
  ).length;
  const summarySearchStudents = students
    .filter((s) =>
      summaryFilter === "all"
        ? true
        : summaryFilter === "ready"
        ? Boolean(s.summary)
        : !s.summary
    )
    .filter(
      (s) => !normalizedQuery || s.fullName.toLowerCase().includes(normalizedQuery)
    );

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

          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full border border-slate-200/80 dark:border-slate-700 bg-[#F6F8FA] dark:bg-[#0F171E]">
            {[
              { id: "class", label: schoolClassLabel(selectedClass) },
              { id: "accounts", label: "Tài khoản học sinh" },
              {
                id: "ai_queue",
                label:
                  pendingAICount > 0
                    ? `Duyệt AI (${pendingAICount})`
                    : "Duyệt AI",
              },
              { id: "rubric", label: "Đánh giá 4 mức" },
              { id: "meetings", label: "Họp ba bên" },
              { id: "summaries", label: "Hồ sơ tổng hợp" },
            ].map((item) => {
              const active = activeTab === item.id && !openedStudent;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    setOpenedStudentId(null);
                    setActiveTab(item.id as TeacherTab);
                  }}
                  className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-[#E27396] text-[#2B111A] shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-[#EFCFE3]/60 dark:hover:bg-slate-800"
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

      <div className="border-b border-slate-200/70 dark:border-slate-800 bg-gradient-to-r from-[#EAF2D7]/60 via-white to-[#B3DEE2]/35 dark:from-[#17222C] dark:via-[#17222C] dark:to-[#17222C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200">
            <label
              htmlFor="teacher-class-select"
              className="text-xs font-semibold sr-only sm:not-sr-only text-slate-600 dark:text-slate-300"
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
                setSearchQuery("");
              }}
              className="min-h-[34px] rounded-full border border-[#223A1E]/20 dark:border-slate-700 bg-white dark:bg-[#0F171E] pl-3 pr-8 py-1 text-xs font-semibold text-[#223A1E] dark:text-[#EAF2D7] focus:outline-none focus:ring-2 focus:ring-[#E27396] cursor-pointer"
            >
              {SCHOOL_CLASSES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-[#0F171E] border border-slate-200 dark:border-slate-700 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              <Users className="w-3.5 h-3.5 text-[#133C42] dark:text-[#B3DEE2]" />
              {accountList?.length ?? 0} học sinh Lớp 9 · {students.length} em
              đang hiển thị
            </span>
            {sensitiveCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setOpenedStudentId(null);
                  setActiveTab("ai_queue");
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E27396]/15 border border-[#E27396]/60 px-3 py-1 text-[11px] font-bold text-[#9D2950] hover:bg-[#E27396]/25 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Cảnh báo nhạy cảm cần xem ({sensitiveCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSettings}
              className="min-h-[34px] px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-[#17222C] text-xs font-medium inline-flex items-center gap-1.5 hover:border-[#EA9AB2] transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Cài đặt</span>
            </button>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className="min-h-[34px] px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-[#17222C] text-xs font-medium inline-flex items-center gap-1.5 hover:border-[#EA9AB2] transition-colors cursor-pointer"
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
      <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C] px-4 py-2 flex overflow-x-auto gap-1.5">
        {[
          { id: "class", label: schoolClassLabel(selectedClass), icon: Users },
          {
            id: "accounts",
            label: "Tài khoản học sinh",
            icon: UserPlus,
          },
          { id: "ai_queue", label: "Duyệt AI", icon: MessageSquareText },
          { id: "rubric", label: "Đánh giá", icon: BarChart2 },
          { id: "meetings", label: "Họp 3 bên", icon: Calendar },
          { id: "summaries", label: "Hồ sơ tổng hợp", icon: FileText },
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
              className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                active
                  ? "bg-[#E27396] text-[#2B111A] shadow-sm"
                  : "bg-[#F1F4F8] dark:bg-[#0F171E] text-slate-700 dark:text-slate-300"
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
                className="min-h-[40px] px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#17222C] text-sm font-semibold inline-flex items-center gap-2 hover:border-[#EA9AB2] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại danh sách {schoolClassLabel(selectedClass)}</span>
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setRubricStudentId(openedStudent.id);
                    setOpenedStudentId(null);
                    setActiveTab("rubric");
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-full bg-[#B3DEE2]/70 hover:bg-[#B3DEE2] text-[#133C42] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Đánh giá 4 mức &amp; Minh chứng cho em này
                </button>
              </div>
            </div>

            <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 sm:p-6 flex flex-wrap items-center gap-4 bg-gradient-to-r from-[#EFCFE3]/55 via-white to-[#B3DEE2]/45 dark:from-[#17222C] dark:via-[#17222C] dark:to-[#17222C] border-b border-slate-200/70 dark:border-slate-800">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${
                    AVATAR_ACCENTS[
                      Math.max(
                        0,
                        students.findIndex((s) => s.id === openedStudent.id)
                      ) % AVATAR_ACCENTS.length
                    ]
                  }`}
                  aria-hidden="true"
                >
                  {initialsOf(openedStudent.fullName)}
                </div>
                <div className="min-w-0 space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9D2950] dark:text-[#EA9AB2]">
                    Hồ sơ học sinh
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                    {openedStudent.fullName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 dark:bg-[#0F171E] border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-slate-600 dark:text-slate-300">
                      Lớp {openedStudent.className}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
                        STEP_ACCENTS[openedStudent.currentStep].chip
                      }`}
                    >
                      Bước {openedStudent.currentStep}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
                        openedStudent.shareWithParent
                          ? "bg-[#EAF2D7] text-[#223A1E]"
                          : "bg-slate-100 text-slate-600 dark:bg-[#0F171E] dark:text-slate-300"
                      }`}
                    >
                      Chia sẻ với phụ huynh:{" "}
                      {openedStudent.shareWithParent ? "bật" : "tắt"}
                    </span>
                    {openedStudent.summary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#E27396]/18 text-[#9D2950] dark:bg-[#E27396]/20 dark:text-[#EA9AB2] px-2.5 py-1">
                        <FileText className="w-3 h-3" />
                        Đã có hồ sơ tổng hợp
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
              {openedStudent.dataDeletionRequestedAt && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-700 text-xs sm:text-sm text-rose-900 dark:text-rose-100">
                  <strong>Yêu cầu xóa dữ liệu cá nhân:</strong> {openedStudent.fullName} đã gửi yêu cầu xóa dữ liệu vào lúc{" "}
                  <span className="tabular-nums font-semibold">
                    {openedStudent.dataDeletionRequestedAt}
                  </span>
                  . Thầy/cô vui lòng xử lí theo quy trình bảo vệ dữ liệu học sinh.
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
                      Viết 4–5 câu mô tả bằng lời từ hồ sơ của em; thầy/cô kiểm tra và chỉnh sửa trước khi dùng.
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
              </div>
            </section>

            {openedStudent.summary && (
              <StudentSummaryReport
                summary={openedStudent.summary}
                audience="teacher"
              />
            )}

            {/* 3.2: Dòng thời gian đầy đủ */}
            <StudentTimeline
              student={openedStudent}
              experiences={experiences}
              aiMessages={aiMessages}
              meetings={meetings}
            />

            <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold">
                  Phiếu cam kết điện tử của {openedStudent.fullName}
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
        ) : (
          <>
            {activeTab === "class" && (
              <div className="space-y-6">
                <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#17222C] p-4">
                    <span className="w-9 h-9 rounded-xl bg-[#B3DEE2]/45 text-[#133C42] dark:text-[#B3DEE2] flex items-center justify-center">
                      <Users className="w-4.5 h-4.5" />
                    </span>
                    <p className="mt-3 text-2xl font-bold tabular-nums leading-none">
                      {students.length}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Học sinh trong lớp
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {allStudents.length} em toàn khối
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#17222C] p-4">
                    <span className="w-9 h-9 rounded-xl bg-[#EAF2D7] text-[#223A1E] flex items-center justify-center">
                      <ClipboardCheck className="w-4.5 h-4.5" />
                    </span>
                    <p className="mt-3 text-2xl font-bold tabular-nums leading-none">
                      {committedCount}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Đã kí phiếu cam kết
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {students.length - committedCount} em còn lại
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenedStudentId(null);
                      setActiveTab("summaries");
                    }}
                    className="text-left rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#17222C] p-4 hover:border-[#EA9AB2] hover:shadow-sm transition-all cursor-pointer"
                  >
                    <span className="w-9 h-9 rounded-xl bg-[#EFCFE3]/80 text-[#4A1A2C] flex items-center justify-center">
                      <FileText className="w-4.5 h-4.5" />
                    </span>
                    <p className="mt-3 text-2xl font-bold tabular-nums leading-none">
                      {summaryStudents.length}
                      <span className="text-sm font-semibold text-slate-400">
                        /{students.length}
                      </span>
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Hồ sơ tổng hợp
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      AI biên soạn sau 5 bước
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenedStudentId(null);
                      setActiveTab("ai_queue");
                    }}
                    className="text-left rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#17222C] p-4 hover:border-[#EA9AB2] hover:shadow-sm transition-all cursor-pointer"
                  >
                    <span className="w-9 h-9 rounded-xl bg-[#EA9AB2]/40 text-[#4A1A2C] flex items-center justify-center">
                      <MessageSquareText className="w-4.5 h-4.5" />
                    </span>
                    <p className="mt-3 text-2xl font-bold tabular-nums leading-none">
                      {pendingAICount}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Phản hồi AI chờ duyệt
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {pendingAIStudentIds.size} học sinh liên quan
                    </p>
                  </button>

                  <div className="rounded-2xl border border-[#E27396]/40 bg-[#E27396]/10 dark:bg-[#E27396]/10 p-4">
                    <span className="w-9 h-9 rounded-xl bg-[#E27396]/25 text-[#9D2950] dark:text-[#EA9AB2] flex items-center justify-center">
                      <AlertTriangle className="w-4.5 h-4.5" />
                    </span>
                    <p className="mt-3 text-2xl font-bold tabular-nums leading-none text-[#9D2950] dark:text-[#EA9AB2]">
                      {attentionCount}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Cần thầy/cô chú ý
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {overdueCount} em quá hạn chốt
                    </p>
                  </div>
                </section>

                {/* 3.1: Cần thầy/cô quan tâm hôm nay (tối đa 5 HS) */}
                {attentionTodayList.length > 0 && (
                  <section className="bg-white dark:bg-[#17222C] border border-[#EA9AB2]/60 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#EFCFE3]/70 via-[#EFCFE3]/25 to-transparent dark:from-[#E27396]/15 dark:via-transparent dark:to-transparent border-b border-[#EA9AB2]/40 dark:border-slate-800 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-white/80 dark:bg-[#0F171E] text-[#9D2950] dark:text-[#EA9AB2] flex items-center justify-center shrink-0">
                        <HeartHandshake className="w-4.5 h-4.5" />
                      </span>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold">
                          Cần thầy/cô quan tâm hôm nay
                          <span className="ml-2 inline-flex items-center rounded-full bg-[#E27396] text-[#2B111A] text-[11px] font-bold px-2 py-0.5 align-middle">
                            {attentionTodayList.length} học sinh
                          </span>
                        </h2>
                        <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          Tối đa 5 gợi ý ưu tiên theo dấu hiệu nhạy cảm, AI chờ duyệt hoặc tiến độ chốt lựa chọn.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                      {attentionTodayList.map((item) => (
                        <button
                          key={item.student.id}
                          type="button"
                          onClick={() => setOpenedStudentId(item.student.id)}
                          className="group text-left p-3.5 rounded-xl bg-white dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 hover:border-[#E27396] hover:shadow-sm transition-all flex flex-col justify-between gap-2.5 cursor-pointer"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-bold text-[#1D242B] dark:text-white leading-snug">
                                {item.student.fullName}
                              </span>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  STEP_ACCENTS[item.student.currentStep].chip
                                }`}
                              >
                                {item.student.currentStep}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                              {item.reason}
                            </p>
                          </div>
                          <span className="text-[11px] font-semibold text-[#9D2950] dark:text-[#EA9AB2] group-hover:underline">
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
                      <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="h-6 w-1.5 rounded-full bg-gradient-to-b from-[#E27396] to-[#EA9AB2]"
                        />
                        <span>
                          Tổng quan {schoolClassLabel(selectedClass)}
                          <span className="ml-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            {students.length} học sinh
                          </span>
                        </span>
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                        Đang hiển thị {filteredStudents.length} học sinh theo bộ
                        lọc. Kéo thẻ trên bản đồ chỉ để thầy/cô xem thử, không
                        làm đổi dữ liệu học sinh.
                      </p>
                    </div>

                    <div className="inline-flex p-1 rounded-full bg-[#F1F4F8] dark:bg-[#0F171E] border border-slate-200/70 dark:border-slate-700 self-start">
                      <button
                        type="button"
                        onClick={() => setClassViewMode("board")}
                        className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                          classViewMode === "board"
                            ? "bg-[#B3DEE2] text-[#133C42] shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        <Columns3 className="w-3.5 h-3.5" />
                        <span>Bản đồ 5 bước</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setClassViewMode("table")}
                        className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                          classViewMode === "table"
                            ? "bg-[#B3DEE2] text-[#133C42] shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        <Table2 className="w-3.5 h-3.5" />
                        <span>Bảng danh sách</span>
                      </button>
                    </div>
                  </div>

                  {/* Tìm kiếm + bộ lọc trạng thái */}
                  <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                    <div className="relative w-full xl:max-w-xs">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm học sinh theo họ tên..."
                        aria-label="Tìm học sinh theo họ tên"
                        className="w-full min-h-[38px] rounded-full border border-slate-200 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] pl-10 pr-9 py-1.5 text-xs font-medium text-[#1D242B] dark:text-[#EDF2F7] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E27396] focus:border-transparent"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          aria-label="Xóa từ khóa tìm kiếm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setOnlyAttentionSignals(!onlyAttentionSignals)
                        }
                        className={`min-h-[34px] px-3 py-1 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer ${
                          onlyAttentionSignals
                            ? "bg-[#EFCFE3] border-[#EA9AB2] text-[#4A1A2C]"
                            : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#EA9AB2]"
                        }`}
                      >
                        Có dấu hiệu cần chú ý ({attentionCount})
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setOnlyMissingDeadline(!onlyMissingDeadline)
                        }
                        className={`min-h-[34px] px-3 py-1 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer ${
                          onlyMissingDeadline
                            ? "bg-[#B3DEE2]/70 border-[#63AEB6] text-[#133C42]"
                            : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#EA9AB2]"
                        }`}
                      >
                        Chưa đặt hạn chốt
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setOnlyOverdueDeadline(!onlyOverdueDeadline)
                        }
                        className={`min-h-[34px] px-3 py-1 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer ${
                          onlyOverdueDeadline
                            ? "bg-[#E27396]/20 border-[#E27396] text-[#9D2950]"
                            : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#EA9AB2]"
                        }`}
                      >
                        Quá hạn chốt ({overdueCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => setOnlyPendingAI(!onlyPendingAI)}
                        className={`min-h-[34px] px-3 py-1 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer ${
                          onlyPendingAI
                            ? "bg-[#EAF2D7] border-[#8FB37C] text-[#223A1E]"
                            : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#EA9AB2]"
                        }`}
                      >
                        AI chờ duyệt ({pendingAIStudentIds.size})
                      </button>
                    </div>
                  </div>

                  {classViewMode === "table" && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
                      <button
                        type="button"
                        onClick={() => setStepFilter("ALL")}
                        className={`min-h-[32px] px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                          stepFilter === "ALL"
                            ? "bg-[#E27396] text-[#2B111A] shadow-sm"
                            : "bg-[#F1F4F8] dark:bg-[#0F171E] text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        Tất cả bước ({students.length})
                      </button>
                      {JOURNEY_STEPS.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setStepFilter(st.id)}
                          className={`min-h-[32px] px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                            stepFilter === st.id
                              ? "bg-[#E27396] text-[#2B111A] shadow-sm"
                              : "bg-[#F1F4F8] dark:bg-[#0F171E] text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
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
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                      {JOURNEY_STEPS.map((col, colIndex) => {
                        const colStudents = filteredStudents.filter((s) => {
                          const displayStep =
                            visualPreviewSteps[s.id] || s.currentStep;
                          return displayStep === col.id;
                        });
                        const isDropTarget = dragOverColumn === col.id;
                        const accent = STEP_ACCENTS[col.id];
                        const avatarTint =
                          AVATAR_ACCENTS[colIndex % AVATAR_ACCENTS.length];

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
                            className={`rounded-2xl border overflow-hidden flex flex-col min-h-[340px] transition-all ${
                              isDropTarget
                                ? "border-[#E27396] ring-2 ring-[#E27396]/25 bg-[#EFCFE3]/20 dark:bg-[#E27396]/10"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C]"
                            }`}
                          >
                            <div
                              className={`px-3.5 py-3 border-b border-slate-200/70 dark:border-slate-800 ${accent.soft}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    aria-hidden="true"
                                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${accent.bar}`}
                                  />
                                  <h3 className="text-sm font-bold truncate">
                                    {col.label}
                                  </h3>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${accent.chip}`}
                                >
                                  {colStudents.length}
                                </span>
                              </div>
                              <p className="mt-1 pl-4.5 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                {col.shortDesc}
                              </p>
                            </div>

                            <div className="p-2.5 space-y-2 flex-1 max-h-[500px] overflow-y-auto">
                              {colStudents.length === 0 ? (
                                <p className="text-[11px] text-slate-400 text-center py-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
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
                                      className={`p-2.5 rounded-xl border text-left transition-all cursor-grab active:cursor-grabbing hover:shadow-sm ${
                                        stu.signals.hasSensitiveAlert
                                          ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 hover:border-rose-400"
                                          : isMovedPreview
                                          ? "bg-[#EAF2D7]/55 dark:bg-[#EAF2D7]/10 border-[#8FB37C] hover:border-[#8FB37C]"
                                          : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200/90 dark:border-slate-800 hover:border-[#EA9AB2]"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          aria-hidden="true"
                                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarTint}`}
                                        >
                                          {initialsOf(stu.fullName)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-xs font-bold truncate">
                                            {stu.fullName}
                                          </p>
                                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                            Lớp {stu.className}
                                          </p>
                                        </div>
                                      </div>
                                      {(stu.summary ||
                                        pendingAI ||
                                        overdue ||
                                        stu.dataDeletionRequestedAt ||
                                        hasSig) && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                          {stu.summary && (
                                            <span className="rounded-full bg-[#B3DEE2]/65 text-[#133C42] px-1.5 py-0.5 text-[10px] font-semibold">
                                              Hồ sơ tổng hợp
                                            </span>
                                          )}
                                          {pendingAI && (
                                            <span className="rounded-full bg-[#EA9AB2]/40 text-[#4A1A2C] px-1.5 py-0.5 text-[10px] font-semibold">
                                              AI chờ duyệt
                                            </span>
                                          )}
                                          {overdue && (
                                            <span className="rounded-full bg-[#E27396]/20 text-[#9D2950] px-1.5 py-0.5 text-[10px] font-semibold">
                                              Quá hạn chốt
                                            </span>
                                          )}
                                          {stu.dataDeletionRequestedAt && (
                                            <span className="rounded-full bg-rose-100 text-rose-800 px-1.5 py-0.5 text-[10px] font-semibold">
                                              Yêu cầu xóa dữ liệu
                                            </span>
                                          )}
                                          {hasSig && !overdue && (
                                            <span className="rounded-full bg-[#EFCFE3]/70 text-[#4A1A2C] px-1.5 py-0.5 text-[10px] font-semibold">
                                              Cần chú ý
                                            </span>
                                          )}
                                        </div>
                                      )}
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
                    {filteredStudents.length === 0 ? (
                      <div className="p-10 text-center space-y-2">
                        <Search className="w-8 h-8 mx-auto text-[#EA9AB2]" />
                        <p className="text-sm font-bold">
                          Không tìm thấy học sinh phù hợp
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Thầy/cô thử xóa từ khóa tìm kiếm hoặc bỏ bớt bộ lọc
                          trạng thái.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setOnlyAttentionSignals(false);
                            setOnlyMissingDeadline(false);
                            setOnlyOverdueDeadline(false);
                            setOnlyPendingAI(false);
                            setStepFilter("ALL");
                          }}
                          className="mt-1 min-h-[34px] px-4 py-1.5 rounded-full bg-[#E27396] hover:bg-[#EA9AB2] text-[#2B111A] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Xóa tất cả bộ lọc
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-[#F6F8FA] dark:bg-[#0F171E] text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              <th className="py-3 px-4 font-semibold">Học sinh</th>
                              <th className="py-3 px-4 font-semibold">Bước</th>
                              <th className="py-3 px-4 font-semibold">
                                Hạn chốt &amp; trạng thái
                              </th>
                              <th className="py-3 px-4 font-semibold">Dấu hiệu</th>
                              <th className="py-3 px-4 font-semibold text-right">
                                Hành động
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                            {filteredStudents.map((stu, rowIndex) => {
                              const signals = describeBehavioralSignals(
                                stu.signals
                              );
                              const isCommitted = Boolean(
                                stu.commitment.studentConfirmedAt
                              );
                              const overdue = isStudentOverdue(stu);
                              return (
                                <tr
                                  key={stu.id}
                                  className="hover:bg-[#EFCFE3]/12 dark:hover:bg-[#0F171E]/60 transition-colors"
                                >
                                  <td className="py-3 px-4 align-top">
                                    <div className="flex items-center gap-2.5">
                                      <span
                                        aria-hidden="true"
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                          AVATAR_ACCENTS[
                                            rowIndex % AVATAR_ACCENTS.length
                                          ]
                                        }`}
                                      >
                                        {initialsOf(stu.fullName)}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="font-bold leading-snug">
                                          {stu.fullName}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Lớp {stu.className}
                                          </span>
                                          {stu.summary && (
                                            <span className="rounded-full bg-[#B3DEE2]/65 text-[#133C42] px-1.5 py-0.5 text-[10px] font-semibold">
                                              Đã có hồ sơ tổng hợp
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="py-3 px-4 align-top">
                                    <span
                                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                        STEP_ACCENTS[stu.currentStep].chip
                                      }`}
                                    >
                                      {stu.currentStep}
                                    </span>
                                  </td>

                                  <td className="py-3 px-4 align-top">
                                    {isCommitted ? (
                                      <div>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF2D7] text-[#223A1E] px-2 py-0.5 text-[11px] font-bold">
                                          <CheckCircle2 className="w-3 h-3" />
                                          Đã chốt
                                        </span>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xs">
                                          {stu.commitment.chosenOption}
                                        </p>
                                      </div>
                                    ) : (
                                      <span
                                        className={`inline-flex items-center gap-1 text-xs ${
                                          overdue
                                            ? "font-semibold text-[#9D2950] dark:text-[#EA9AB2]"
                                            : "text-slate-500 dark:text-slate-400"
                                        }`}
                                      >
                                        <Clock3 className="w-3.5 h-3.5" />
                                        {overdue
                                          ? `Quá hạn (${stu.commitment.deadlineDate})`
                                          : stu.commitment.deadlineDate
                                          ? `Hạn: ${stu.commitment.deadlineDate}`
                                          : "Chưa đặt hạn chốt"}
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 align-top max-w-sm">
                                    {signals.length === 0 ? (
                                      <span className="inline-flex rounded-full bg-slate-100 dark:bg-[#0F171E] px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        Ổn định
                                      </span>
                                    ) : (
                                      <div
                                        className={`inline-flex items-start gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] leading-relaxed ${
                                          stu.signals.hasSensitiveAlert
                                            ? "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-300"
                                            : "bg-[#EFCFE3]/50 text-[#4A1A2C] dark:bg-[#E27396]/15 dark:text-[#EFCFE3]"
                                        }`}
                                      >
                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                        <span>{signals[0]}</span>
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 align-top text-right">
                                    <button
                                      type="button"
                                      onClick={() => setOpenedStudentId(stu.id)}
                                      className="min-h-[34px] px-3 py-1.5 rounded-full bg-[#B3DEE2]/60 hover:bg-[#B3DEE2] text-[#133C42] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
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
                    )}
                  </section>
                )}
              </div>
            )}

            {activeTab === "accounts" && (
              <StudentAccountsManager
                session={authSession ?? null}
                students={students}
                accounts={accountList ?? []}
                loading={accountsLoading}
                loadError={accountsError}
                onReload={() => void reloadAccounts()}
                onStudentCreated={handleAccountSaved}
                onStudentUpdated={handleAccountUpdated}
                onStudentDeleted={handleAccountDeleted}
              />
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

            {activeTab === "summaries" && (
              <section className="space-y-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17222C] overflow-hidden">
                  <div className="p-5 sm:p-6 bg-gradient-to-r from-[#B3DEE2]/45 via-white to-[#EAF2D7]/70 dark:from-[#17222C] dark:via-[#17222C] dark:to-[#17222C] border-b border-slate-200/70 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/80 dark:bg-[#0F171E] border border-[#B3DEE2] flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2] shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h1 className="text-lg sm:text-xl font-bold">
                          Hồ sơ tổng hợp ·{" "}
                          {schoolClassLabel(selectedClass)}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl">
                          Khi học sinh hoàn thành đủ 5 bước, hệ thống tự biên
                          soạn Hồ sơ tổng hợp 6 phần và gửi tới tài khoản giáo
                          viên. Bấm vào từng em để xem đầy đủ nội dung tổng hợp
                          và tiến trình.
                        </p>
                      </div>
                    </div>

                    <div className="w-full lg:w-64 shrink-0">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          Đã nhận hồ sơ
                        </span>
                        <span className="tabular-nums font-bold text-[#133C42] dark:text-[#B3DEE2]">
                          {summaryStudents.length}/{students.length}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2.5 rounded-full bg-white/80 dark:bg-[#0F171E] border border-slate-200/70 dark:border-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#B3DEE2] via-[#EAF2D7] to-[#E27396] transition-all"
                          style={{
                            width: `${
                              students.length === 0
                                ? 0
                                : Math.round(
                                    (summaryStudents.length / students.length) *
                                      100
                                  )
                            }%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {students.length - summaryStudents.length} em đang chờ
                        hoàn thành đủ 5 bước
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="relative w-full lg:max-w-xs">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm học sinh theo họ tên..."
                        aria-label="Tìm học sinh theo họ tên trong hồ sơ tổng hợp"
                        className="w-full min-h-[38px] rounded-full border border-slate-200 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] pl-10 pr-9 py-1.5 text-xs font-medium text-[#1D242B] dark:text-[#EDF2F7] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E27396] focus:border-transparent"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          aria-label="Xóa từ khóa tìm kiếm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: "all" as const, label: `Tất cả (${students.length})` },
                        {
                          id: "ready" as const,
                          label: `Đã có hồ sơ (${summaryStudents.length})`,
                        },
                        {
                          id: "pending" as const,
                          label: `Chờ tổng hợp (${students.length - summaryStudents.length})`,
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSummaryFilter(item.id)}
                          className={`min-h-[34px] px-3 py-1 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer ${
                            summaryFilter === item.id
                              ? "bg-[#E27396] border-[#E27396] text-[#2B111A] shadow-sm"
                              : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#EA9AB2]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {students.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Chưa có học sinh trong lớp này.
                  </p>
                ) : summarySearchStudents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-1">
                    <p className="text-sm font-semibold">
                      Không có hồ sơ phù hợp bộ lọc
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Thầy/cô thử chọn &ldquo;Tất cả&rdquo; hoặc xóa từ khóa tìm
                      kiếm.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {summarySearchStudents.map((stu) => (
                      <button
                        key={stu.id}
                        type="button"
                        onClick={() => setOpenedStudentId(stu.id)}
                        className="group text-left rounded-2xl bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 hover:border-[#E27396] hover:shadow-md transition-all overflow-hidden cursor-pointer"
                      >
                        <div
                          aria-hidden="true"
                          className={`h-1.5 w-full ${
                            stu.summary ? "bg-[#EAF2D7]" : "bg-[#EFCFE3]"
                          }`}
                        />
                        <div className="p-4 space-y-3">
                          <div className="flex items-start gap-2.5">
                            <span
                              aria-hidden="true"
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                AVATAR_ACCENTS[
                                  Math.max(
                                    0,
                                    students.findIndex((s) => s.id === stu.id)
                                  ) % AVATAR_ACCENTS.length
                                ]
                              }`}
                            >
                              {initialsOf(stu.fullName)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold truncate">
                                {stu.fullName}
                              </p>
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Lớp {stu.className}
                                </span>
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                    STEP_ACCENTS[stu.currentStep].chip
                                  }`}
                                >
                                  {stu.currentStep}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                stu.summary
                                  ? "bg-[#EAF2D7] text-[#223A1E]"
                                  : "bg-[#EFCFE3]/80 text-[#4A1A2C]"
                              }`}
                            >
                              {stu.summary ? "Đã có hồ sơ" : "Chưa có hồ sơ"}
                            </span>
                          </div>

                          <div className="rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/70 dark:border-slate-800 px-3 py-2 text-[11px] text-slate-600 dark:text-slate-300">
                            {stu.summary
                              ? `Biên soạn: ${stu.summary.generatedAt}`
                              : "Cần hoàn thành đủ 5 bước để hệ thống tổng hợp"}
                          </div>

                          <p className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2] group-hover:underline">
                            {stu.summary
                              ? "Xem hồ sơ tổng hợp đầy đủ →"
                              : "Mở hồ sơ theo dõi tiến trình →"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

