import { useEffect, useRef, useState } from "react";
import { RoleSelect } from "./components/RoleSelect";
import { AuthScreen } from "./components/AuthScreen";
import { ProjectIntro } from "./components/ProjectIntro";
import { SettingsModal } from "./components/SettingsModal";
import { HowAIWorksModal } from "./components/HowAIWorksModal";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { StudentJourney } from "./features/student-journey/StudentJourney";
import { TeacherDashboard } from "./features/teacher/TeacherDashboard";
import { ParentView } from "./features/parent/ParentView";
import { SchoolManagerDashboard } from "./features/school-manager/SchoolManagerDashboard";
import { createInitialAppState } from "./data/mockData";
import {
  buildLocalRoster,
  fetchSchoolRoster,
  fetchSchoolStats,
  addParentLink,
  changeParentPin,
  AuthError,
} from "./services/auth";
import {
  DEMO_PARENT_PIN,
  MAX_CHILDREN_PER_PARENT,
  schoolClassLabel,
  type SchoolRoster,
  type SchoolStats,
} from "./data/schoolClasses";
import {
  createActiveStorageService,
  FirebaseStorageAdapter,
  localBackupStorage,
  MAIN_STATE_KEY,
  migrateAppState,
  saveFirebaseSettings,
  type StorageService,
} from "./services/storage";
import {
  buildCompactAIContext,
  detectHesitancyPhrase,
  requestAIQuestion,
  requestAIQuestionStream,
} from "./services/ai";
import {
  clearStoredSession,
  getStoredSession,
  logoutAccount,
  validateStoredSession,
} from "./services/auth";
import type {
  AIMessage,
  AIModerationAction,
  AIModerationLog,
  AppState,
  AuthSession,
  Experience,
  FirebaseConfig,
  FontSizeScale,
  LinkedChild,
  Meeting,
  Pathway,
  Role,
  Student,
  ThematicCodeItem,
} from "./types";

function defaultStudentIdForRole(role: Role, students: Student[]): string {
  if (role === "parent") {
    const child =
      students.find((s) => s.isCaseStudy && s.shareWithParent) ??
      students.find((s) => s.shareWithParent) ??
      students[0];
    return child?.id ?? "hs-02";
  }
  const student = students.find((s) => s.isCaseStudy) ?? students[0];
  return student?.id ?? "hs-01";
}

/**
 * Con của phụ huynh có thể là học sinh mẫu (có sẵn hồ sơ) hoặc tài khoản học sinh
 * mới đăng ký (id dạng "acc:<id>"). Với tài khoản mới, dùng hồ sơ mẫu làm khung
 * hiển thị để phụ huynh vẫn thấy đúng cấu trúc không gian đồng hành.
 */
function resolveParentStudent(
  childId: string | undefined,
  students: Student[]
): Student | null {
  if (!childId) return null;
  const direct = students.find((s) => s.id === childId);
  if (direct) return direct;
  const template =
    students.find((s) => s.isCaseStudy && s.shareWithParent) ??
    students.find((s) => s.isCaseStudy) ??
    students[0];
  if (!template) return null;
  return { ...template, id: childId, shareWithParent: true };
}

function childOptionLabel(link: LinkedChild): string {
  return `${link.displayName} · ${schoolClassLabel(link.className)}`;
}

export default function App() {
  const [storageService, setStorageService] = useState<StorageService>(() =>
    createActiveStorageService()
  );
  const [appState, setAppState] = useState<AppState>(() =>
    createInitialAppState()
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredSession()
  );
  const [entryView, setEntryView] = useState<"auth" | "demo">(() =>
    getStoredSession() ? "demo" : "auth"
  );
  const [accountNotice, setAccountNotice] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<Role | null>(
    () => getStoredSession()?.user.role ?? null
  );
  const [activeStudentId, setActiveStudentId] = useState<string>(() =>
    getStoredSession()?.user.role === "parent" ? "hs-02" : "hs-01"
  );
  const [demoChildLinks, setDemoChildLinks] = useState<LinkedChild[]>([]);
  const [schoolRoster, setSchoolRoster] = useState<SchoolRoster | null>(null);
  const [schoolStats, setSchoolStats] = useState<SchoolStats | null>(null);
  const [showProjectIntro, setShowProjectIntro] = useState(false);
  const [showHowAIWorks, setShowHowAIWorks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const lastSerializedRef = useRef<string>("");
  const pendingOfflineSyncRef = useRef<boolean>(false);

  // Load state from active StorageService (with v1 -> v2 migration) and subscribe
  useEffect(() => {
    let active = true;
    setIsHydrated(false);

    const hydrate = async () => {
      try {
        const stored = await storageService.get<AppState>(MAIN_STATE_KEY);
        if (!active) return;

        if (stored) {
          const migrated = migrateAppState(stored);
          lastSerializedRef.current = JSON.stringify(migrated);
          setAppState(migrated);
          if (JSON.stringify(stored) !== lastSerializedRef.current) {
            await storageService.set(MAIN_STATE_KEY, migrated);
            await localBackupStorage.set(MAIN_STATE_KEY, migrated);
          }
        } else {
          // Fallback to local backup if switching to an empty remote store
          const localBackup = await localBackupStorage.get<AppState>(
            MAIN_STATE_KEY
          );
          if (!active) return;
          const initial = localBackup
            ? migrateAppState(localBackup)
            : createInitialAppState();
          lastSerializedRef.current = JSON.stringify(initial);
          setAppState(initial);
          await storageService.set(MAIN_STATE_KEY, initial);
        }
      } catch {
        // Keep in-memory initial state if storage read fails
      } finally {
        if (active) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate();

    const unsubscribe = storageService.subscribe<AppState>(
      MAIN_STATE_KEY,
      (remote) => {
        if (!active || !remote) return;
        const migrated = migrateAppState(remote);
        const serialized = JSON.stringify(migrated);
        if (serialized !== lastSerializedRef.current) {
          lastSerializedRef.current = serialized;
          setAppState(migrated);
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [storageService]);

  // Persist changes after hydration (always write localBackupStorage offline; flush when online)
  useEffect(() => {
    if (!isHydrated) return;
    const serialized = JSON.stringify(appState);
    if (serialized === lastSerializedRef.current) return;
    lastSerializedRef.current = serialized;

    if (storageService.kind === "local") {
      void storageService.set(MAIN_STATE_KEY, appState);
      return;
    }

    void localBackupStorage.set(MAIN_STATE_KEY, appState);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      pendingOfflineSyncRef.current = true;
      return;
    }

    void storageService
      .set(MAIN_STATE_KEY, appState)
      .then(() => {
        pendingOfflineSyncRef.current = false;
      })
      .catch(() => {
        pendingOfflineSyncRef.current = true;
      });
  }, [appState, storageService, isHydrated]);

  // Automatically sync pending offline edits when network returns
  useEffect(() => {
    const handleBackOnline = async () => {
      if (storageService.kind !== "firebase") return;
      if (!pendingOfflineSyncRef.current) return;
      try {
        const latestLocal = await localBackupStorage.get<AppState>(MAIN_STATE_KEY);
        if (latestLocal) {
          await storageService.set(MAIN_STATE_KEY, latestLocal);
          pendingOfflineSyncRef.current = false;
        }
      } catch {
        // Keep pending flag for next online retry
      }
    };
    window.addEventListener("online", handleBackOnline);
    return () => window.removeEventListener("online", handleBackOnline);
  }, [storageService]);

  useEffect(() => {
    const root = document.documentElement;
    if (appState.settings.darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.setAttribute("data-font-size", appState.settings.fontSize || "medium");
  }, [appState.settings.darkMode, appState.settings.fontSize]);

  const handleToggleDarkMode = () => {
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        darkMode: !prev.settings.darkMode,
      },
    }));
  };

  const handleChangeFontSize = (fontSize: FontSizeScale) => {
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        fontSize,
      },
    }));
  };

  const handleResetSampleData = () => {
    const fresh = createInitialAppState();
    setAppState(fresh);
  };

  const handleApplyFirebaseConfig = async (
    enabled: boolean,
    config: FirebaseConfig | null
  ) => {
    saveFirebaseSettings(enabled, config);
    if (enabled && config) {
      const nextAdapter = new FirebaseStorageAdapter(config);
      await nextAdapter.set(MAIN_STATE_KEY, appState);
      setStorageService(nextAdapter);
    } else {
      await FirebaseStorageAdapter.disposeCustomApps();
      setStorageService(createActiveStorageService());
    }
  };

  const handleAcceptPrivacyConsent = (studentId: string) => {
    const now = new Date().toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    setAppState((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId
          ? {
              ...s,
              privacyConsentAccepted: true,
              privacyConsentAcceptedAt: s.privacyConsentAcceptedAt || now,
            }
          : s
      ),
    }));
  };

  const handleUpdateStudent = (updated: Student) => {
    setAppState((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === updated.id ? updated : s)),
    }));
  };

  const handleTriggerAIQuestion = async ({
    student,
    studentMessage,
    triggerReason,
    onStreamPartial,
  }: {
    student: Student;
    studentMessage: string;
    triggerReason: string;
    onStreamPartial?: (partial: string) => void;
  }) => {
    const latestStudent =
      appState.students.find((s) => s.id === student.id) || student;

    const hesitancyMatch = detectHesitancyPhrase(studentMessage);
    const compactContext = buildCompactAIContext(
      latestStudent,
      studentMessage,
      triggerReason
    );

    let res;
    try {
      res = onStreamPartial
        ? await requestAIQuestionStream(compactContext, onStreamPartial)
        : await requestAIQuestion(compactContext);
    } catch (err) {
      // Interactive chat surfaces errors directly to student with retry; background triggers fail quietly
      if (onStreamPartial) {
        throw err;
      }
      return;
    }

    const now = new Date().toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const msgId = `ai-${Date.now()}`;
    const newMsg: AIMessage = {
      id: msgId,
      studentId: latestStudent.id,
      studentCode: latestStudent.code,
      createdAt: now,
      triggerReason,
      studentText: compactContext.studentMessage,
      aiReply: res.reply,
      originalAiReply: res.originalAiReply || res.reply,
      nhayCam: res.nhay_cam,
      dauHieu: res.dau_hieu,
      loaiCauHoi: res.loai_cau_hoi,
      layer1Triggered: res.layer1Triggered,
      layer2Filtered: res.layer2Filtered,
      layer2Reason: res.layer2Reason,
      status: "chờ duyệt",
      visibleToStudent: !appState.settings.requireTeacherApprovalBeforeDisplay,
    };

    const logEntry: AIModerationLog = {
      id: `log-${Date.now()}`,
      messageId: msgId,
      studentId: latestStudent.id,
      studentCode: latestStudent.code,
      action: res.layer1Triggered
        ? "lọc lớp 1"
        : res.layer2Filtered
        ? "lọc lớp 2"
        : "tạo mới",
      actor: res.layer1Triggered
        ? "Bộ lọc An toàn Lớp 1"
        : res.layer2Filtered
        ? "Bộ lọc An toàn Lớp 2"
        : "Trợ lí AI (Gemini)",
      timestamp: now,
      studentText: compactContext.studentMessage,
      originalReply: res.originalAiReply || res.reply,
      editedReply: res.layer2Filtered ? res.reply : undefined,
      reason: res.layer1Triggered
        ? res.dau_hieu
        : res.layer2Filtered
        ? res.layer2Reason
        : `Tạo phản hồi gợi mở (${res.loai_cau_hoi})`,
    };

    setAppState((prev) => ({
      ...prev,
      aiMessages: [...prev.aiMessages, newMsg],
      aiModerationLogs: [logEntry, ...(prev.aiModerationLogs || [])],
      students: prev.students.map((s) => {
        if (s.id !== latestStudent.id) return s;
        return {
          ...s,
          signals: {
            ...s.signals,
            hesitancyPhrasesCount: hesitancyMatch
              ? s.signals.hesitancyPhrasesCount + 1
              : s.signals.hesitancyPhrasesCount,
            recentPhrases: hesitancyMatch
              ? Array.from(new Set([...s.signals.recentPhrases, hesitancyMatch]))
              : s.signals.recentPhrases,
            hasSensitiveAlert: s.signals.hasSensitiveAlert || res.nhay_cam,
          },
        };
      }),
    }));
  };

  const handleUpdateAIMessage = (
    updated: AIMessage,
    logMeta: {
      action: AIModerationAction;
      editedReply?: string;
      reason?: string;
    }
  ) => {
    const now = new Date().toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const auditLog: AIModerationLog = {
      id: `log-${Date.now()}`,
      messageId: updated.id,
      studentId: updated.studentId,
      studentCode: updated.studentCode,
      action: logMeta.action,
      actor: "Giáo viên chủ nhiệm",
      timestamp: now,
      studentText: updated.studentText,
      originalReply: updated.originalAiReply || updated.aiReply,
      editedReply: logMeta.editedReply,
      reason: logMeta.reason,
    };

    setAppState((prev) => ({
      ...prev,
      aiMessages: prev.aiMessages.map((m) =>
        m.id === updated.id ? updated : m
      ),
      aiModerationLogs: [auditLog, ...(prev.aiModerationLogs || [])],
    }));
  };

  const handleUpdateThematicCodes = (next: ThematicCodeItem[]) => {
    setAppState((prev) => ({
      ...prev,
      thematicCodes: next,
    }));
  };

  const handleToggleRequireApproval = () => {
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        requireTeacherApprovalBeforeDisplay:
          !prev.settings.requireTeacherApprovalBeforeDisplay,
      },
    }));
  };

  const handleAddMeeting = (meeting: Meeting) => {
    setAppState((prev) => ({
      ...prev,
      meetings: [meeting, ...prev.meetings],
    }));
  };

  const handleUpdateMeeting = (meeting: Meeting) => {
    setAppState((prev) => ({
      ...prev,
      meetings: prev.meetings.map((m) => (m.id === meeting.id ? meeting : m)),
    }));
  };

  const handleUpdatePathway = (updated: Pathway) => {
    setAppState((prev) => ({
      ...prev,
      pathways: prev.pathways.map((p) => (p.id === updated.id ? updated : p)),
    }));
  };

  const handleAddPathway = (created: Pathway) => {
    setAppState((prev) => ({
      ...prev,
      pathways: [...prev.pathways, created],
    }));
  };

  const handleAddExperience = (activity: Experience) => {
    setAppState((prev) => ({
      ...prev,
      experiences: [activity, ...prev.experiences],
    }));
  };

  const handleDeleteExperience = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
    }));
  };

  const handleImportContent = (payload: {
    pathways: Pathway[];
    experiences: Experience[];
  }) => {
    setAppState((prev) => ({
      ...prev,
      pathways: payload.pathways,
      experiences: payload.experiences,
    }));
  };

  const handleUpdateGoogleFormSurveyUrl = (url: string) => {
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        googleFormSurveyUrl: url,
      },
    }));
  };

  // Revalidate a remembered session in the background; rendering never waits on the network.
  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) return;
    let active = true;

    void validateStoredSession(stored).then((state) => {
      if (!active || state !== "invalid") return;
      const current = getStoredSession();
      if (current && current.token !== stored.token) return;
      clearStoredSession();
      setSession(null);
      setActiveRole(null);
      setEntryView("auth");
      setAccountNotice(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục."
      );
    });

    return () => {
      active = false;
    };
  }, []);

  // Roster lớp/học sinh và thống kê trường cho chọn lớp + liên kết phụ huynh.
  useEffect(() => {
    let active = true;
    void fetchSchoolRoster(appState.students).then((roster) => {
      if (active) setSchoolRoster(roster);
    });
    void fetchSchoolStats().then((stats) => {
      if (active) setSchoolStats(stats);
    });
    return () => {
      active = false;
    };
  }, [session, appState.students.length]);

  // Quick-demo phụ huynh vào hồ sơ được chia sẻ; phụ huynh có liên kết thì giữ đúng con đang chọn.
  useEffect(() => {
    if (session?.user.role === "parent") return;
    if (activeRole !== "parent") return;
    if (demoChildLinks.some((link) => link.studentId === activeStudentId)) return;
    const current = appState.students.find((s) => s.id === activeStudentId);
    if (current?.shareWithParent) return;
    const child = appState.students.find(
      (s) => s.isCaseStudy && s.shareWithParent
    );
    if (child) setActiveStudentId(child.id);
  }, [session, activeRole, appState.students, activeStudentId, demoChildLinks]);

  // Quick-demo phụ huynh: mặc định mở hồ sơ mẫu đang chia sẻ và vẫn giữ con đó
  // trong danh sách "Chọn con" sau khi liên kết thêm con khác bằng mã PIN.
  useEffect(() => {
    if (session || activeRole !== "parent") return;
    if (demoChildLinks.length > 0) return;
    const initial =
      appState.students.find((s) => s.isCaseStudy && s.shareWithParent) ??
      appState.students.find((s) => s.shareWithParent) ??
      appState.students[0];
    if (!initial) return;
    setDemoChildLinks([
      {
        studentId: initial.id,
        className: initial.className,
        displayName: `${initial.code} (${initial.anonymizedLabel})`,
        linkedAt: new Date().toISOString(),
      },
    ]);
    setActiveStudentId(initial.id);
  }, [session, activeRole, demoChildLinks.length, appState.students]);

  useEffect(() => {
    if (!accountNotice) return;
    const timer = setTimeout(() => setAccountNotice(null), 7000);
    return () => clearTimeout(timer);
  }, [accountNotice]);

  const handleAuthenticated = (
    next: AuthSession,
    savedOffline: boolean
  ) => {
    setSession(next);
    const firstChild =
      next.user.role === "parent" ? next.user.linkedChildren?.[0]?.studentId : undefined;
    const sameClassProfile =
      next.user.role === "student" && next.user.className
        ? appState.students.find((s) => s.className === next.user.className)?.id
        : undefined;
    setActiveStudentId(
      firstChild ??
        sameClassProfile ??
        defaultStudentIdForRole(next.user.role, appState.students)
    );
    setActiveRole(next.user.role);
    setEntryView("demo");
    setAccountNotice(
      savedOffline
        ? "Tài khoản đã được lưu trên thiết bị này. Bạn vẫn có thể đăng nhập khi ngoại tuyến."
        : null
    );
  };

  const handleLinkChild = async (input: {
    classId: string;
    studentId: string;
    pin: string;
  }): Promise<void> => {
    if (session) {
      const result = await addParentLink(session, input);
      setSession(result.session);
      setActiveStudentId(input.studentId);
      setAccountNotice(
        result.savedOffline
          ? "Chưa kết nối được máy chủ nên liên kết chỉ lưu trên thiết bị này. Khi có mạng, hãy liên kết lại để đồng bộ."
          : "Đã liên kết con thành công. Bạn có thể chuyển đổi giữa các con ở thanh phía trên."
      );
      return;
    }

    // Chế độ xem thử: chỉ liên kết học sinh mẫu với mã PIN mặc định 1234.
    const entry = (schoolRoster ?? buildLocalRoster(appState.students)).classes
      .find((cls) => cls.id === input.classId)
      ?.students.find((student) => student.id === input.studentId);
    if (!entry) {
      throw new AuthError(
        "Không tìm thấy học sinh này trong lớp đã chọn. Vui lòng kiểm tra lại.",
        { code: "CHILD_NOT_FOUND", field: "childStudentId" }
      );
    }
    if (entry.source !== "demo") {
      throw new AuthError(
        "Học sinh này có tài khoản riêng. Hãy đăng nhập bằng tài khoản Phụ huynh để liên kết, hoặc chọn học sinh mẫu (mã PIN 1234).",
        { code: "DEMO_ONLY", field: "childStudentId" }
      );
    }
    if (demoChildLinks.length >= MAX_CHILDREN_PER_PARENT) {
      throw new AuthError(
        `Mỗi tài khoản phụ huynh chỉ liên kết tối đa ${MAX_CHILDREN_PER_PARENT} con.`,
        { code: "MAX_CHILDREN", field: "form" }
      );
    }
    if (demoChildLinks.some((link) => link.studentId === input.studentId)) {
      throw new AuthError("Học sinh này đã được liên kết rồi.", {
        code: "ALREADY_LINKED",
        field: "childStudentId",
      });
    }
    if (input.pin.trim() !== DEMO_PARENT_PIN) {
      throw new AuthError(
        "Mã PIN chưa đúng nên chưa thể liên kết. Học sinh mẫu có mã PIN mặc định 1234.",
        { code: "INVALID_PIN", field: "childPin" }
      );
    }
    setDemoChildLinks((prev) => [
      ...prev,
      {
        studentId: input.studentId,
        className: input.classId,
        displayName: entry.displayName,
        linkedAt: new Date().toISOString(),
      },
    ]);
    setActiveStudentId(input.studentId);
  };

  const handleChangeParentPin = async (pin: string): Promise<void> => {
    if (!session) return;
    const result = await changeParentPin(session, pin);
    setSession(result.session);
  };

  const handleLogout = () => {
    const current = session;
    setSession(null);
    setActiveRole(null);
    setEntryView("auth");
    setAccountNotice(null);
    setDemoChildLinks([]);
    void logoutAccount(current);
  };

  const offlineSession = Boolean(session?.token.startsWith("local-"));

  const activeParentLinks: LinkedChild[] =
    session?.user.role === "parent"
      ? session.user.linkedChildren ?? []
      : demoChildLinks;

  const activeStudent =
    activeRole === "parent"
      ? resolveParentStudent(activeStudentId, appState.students)
      : appState.students.find((s) => s.id === activeStudentId) ||
        appState.students[0];

  const parentChildOptions = activeParentLinks.map((link) => ({
    id: link.studentId,
    label: childOptionLabel(link),
  }));
  if (
    activeRole === "parent" &&
    activeStudent &&
    !parentChildOptions.some((option) => option.id === activeStudent.id)
  ) {
    parentChildOptions.unshift({
      id: activeStudent.id,
      label: `${activeStudent.code} (${activeStudent.anonymizedLabel}) · ${schoolClassLabel(
        activeStudent.className
      )}`,
    });
  }
  const parentRoster = schoolRoster ?? buildLocalRoster(appState.students);

  return (
    <>
      {showProjectIntro ? (
        <ProjectIntro onBack={() => setShowProjectIntro(false)} />
      ) : !activeRole ? (
        entryView === "auth" ? (
          <AuthScreen
            darkMode={appState.settings.darkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onAuthenticated={handleAuthenticated}
            onQuickDemo={() => setEntryView("demo")}
            onOpenProjectIntro={() => setShowProjectIntro(true)}
            students={appState.students}
            roster={schoolRoster}
          />
        ) : (
          <RoleSelect
            students={appState.students}
            darkMode={appState.settings.darkMode}
            storageKind={storageService.kind}
            account={session?.user ?? null}
            offlineSession={offlineSession}
            onLogout={session ? handleLogout : undefined}
            onOpenAuth={() => setEntryView("auth")}
            onToggleDarkMode={handleToggleDarkMode}
            onResetSampleData={handleResetSampleData}
            onSelectRole={(role, stuId) => {
              setActiveStudentId(stuId);
              setActiveRole(role);
            }}
            onAcceptPrivacyConsent={handleAcceptPrivacyConsent}
            onOpenProjectIntro={() => setShowProjectIntro(true)}
            onOpenHowAIWorks={() => setShowHowAIWorks(true)}
            onOpenSettings={() => setShowSettings(true)}
          />
        )
      ) : activeRole === "student" && activeStudent ? (
        <StudentJourney
          student={activeStudent}
          allStudents={appState.students}
          pathways={appState.pathways}
          experiences={appState.experiences}
          aiMessages={appState.aiMessages}
          meetings={appState.meetings}
          settings={appState.settings}
          onUpdateStudent={handleUpdateStudent}
          onTriggerAIQuestion={handleTriggerAIQuestion}
          onOpenHowAIWorks={() => setShowHowAIWorks(true)}
          onToggleDarkMode={handleToggleDarkMode}
          onChangeFontSize={handleChangeFontSize}
          onExitRole={() => setActiveRole(null)}
          account={session?.user ?? null}
          offlineSession={offlineSession}
          onLogout={session ? handleLogout : undefined}
          onChangeParentPin={session ? handleChangeParentPin : undefined}
        />
      ) : activeRole === "teacher" ? (
        <TeacherDashboard
          appState={appState}
          onUpdateStudent={handleUpdateStudent}
          onUpdateAIMessage={handleUpdateAIMessage}
          onUpdateThematicCodes={handleUpdateThematicCodes}
          onToggleRequireApproval={handleToggleRequireApproval}
          onAddMeeting={handleAddMeeting}
          onUpdateMeeting={handleUpdateMeeting}
          onUpdatePathway={handleUpdatePathway}
          onAddPathway={handleAddPathway}
          onAddExperience={handleAddExperience}
          onDeleteExperience={handleDeleteExperience}
          onImportContent={handleImportContent}
          onOpenSettings={() => setShowSettings(true)}
          onToggleDarkMode={handleToggleDarkMode}
          onExitRole={() => setActiveRole(null)}
          account={session?.user ?? null}
          offlineSession={offlineSession}
          onLogout={session ? handleLogout : undefined}
        />
      ) : activeRole === "parent" && activeStudent ? (
        <ParentView
          student={activeStudent}
          meetings={appState.meetings}
          settings={appState.settings}
          onUpdateStudent={handleUpdateStudent}
          onUpdateMeeting={handleUpdateMeeting}
          onOpenHowAIWorks={() => setShowHowAIWorks(true)}
          onToggleDarkMode={handleToggleDarkMode}
          onExitRole={() => setActiveRole(null)}
          account={session?.user ?? null}
          offlineSession={offlineSession}
          onLogout={session ? handleLogout : undefined}
          childOptions={parentChildOptions}
          selectedChildId={activeStudent.id}
          onSelectChild={setActiveStudentId}
          roster={parentRoster}
          demoLinkMode={!session}
          onLinkChild={handleLinkChild}
        />
      ) : activeRole === "school_admin" ? (
        <SchoolManagerDashboard
          appState={appState}
          roster={parentRoster}
          stats={schoolStats}
          account={session?.user ?? null}
          offlineSession={offlineSession}
          onLogout={session ? handleLogout : undefined}
          onExitRole={() => setActiveRole(null)}
          onToggleDarkMode={handleToggleDarkMode}
          onOpenHowAIWorks={() => setShowHowAIWorks(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      ) : null}

      {accountNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md rounded-xl border border-[#B3DEE2] dark:border-[#B3DEE2]/50 bg-white dark:bg-[#17222C] px-4 py-3 text-sm text-slate-700 dark:text-slate-200 shadow-lg text-center"
        >
          {accountNotice}
        </div>
      )}

      <HowAIWorksModal
        open={showHowAIWorks}
        onClose={() => setShowHowAIWorks(false)}
      />

      <SettingsModal
        open={showSettings}
        appState={appState}
        activeStorageKind={storageService.kind}
        schemaVersion={appState.schemaVersion}
        googleFormSurveyUrl={appState.settings.googleFormSurveyUrl}
        requireTeacherApprovalBeforeDisplay={
          appState.settings.requireTeacherApprovalBeforeDisplay
        }
        onToggleRequireApproval={handleToggleRequireApproval}
        onUpdateGoogleFormSurveyUrl={handleUpdateGoogleFormSurveyUrl}
        onResetSampleData={handleResetSampleData}
        onImportFullAppState={(next) => setAppState(next)}
        onClose={() => setShowSettings(false)}
        onApplyFirebaseConfig={handleApplyFirebaseConfig}
      />

      <OfflineIndicator />
    </>
  );
}
