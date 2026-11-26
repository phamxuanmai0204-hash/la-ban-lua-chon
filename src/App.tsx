import { useEffect, useMemo, useRef, useState } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { ProjectIntro } from "./components/ProjectIntro";
import { SettingsModal } from "./components/SettingsModal";
import { HowAIWorksModal } from "./components/HowAIWorksModal";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { StudentJourney } from "./features/student-journey/StudentJourney";
import { TeacherDashboard } from "./features/teacher/TeacherDashboard";
import { ParentView } from "./features/parent/ParentView";
import { createInitialAppState, createStudentProfile } from "./data/mockData";
import {
  buildLocalRoster,
  fetchSchoolRoster,
  addParentLink,
  changeParentPin,
} from "./services/auth";
import {
  schoolClassLabel,
  type SchoolRoster,
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
import { publishStudentRecord } from "./services/studentRecords";
import type {
  AIMessage,
  AIModerationAction,
  AIModerationLog,
  AppState,
  AuthSession,
  FirebaseConfig,
  FontSizeScale,
  LinkedChild,
  Meeting,
  Student,
} from "./types";

function accountStudentId(accountId: string): string {
  return `acc:${accountId}`;
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
  const [accountNotice, setAccountNotice] = useState<string | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(() => {
    const stored = getStoredSession();
    return stored?.user.role === "parent"
      ? stored.user.linkedChildren?.[0]?.studentId ?? null
      : null;
  });
  const [schoolRoster, setSchoolRoster] = useState<SchoolRoster | null>(null);
  const [showProjectIntro, setShowProjectIntro] = useState(false);
  const [showHowAIWorks, setShowHowAIWorks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const lastSerializedRef = useRef<string>("");
  const pendingOfflineSyncRef = useRef<boolean>(false);

  // Load state from active StorageService (with schema migration) and subscribe
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

  // Học sinh tự đăng ký: hồ sơ được tạo từ chính tài khoản, không có dữ liệu mẫu.
  useEffect(() => {
    if (!isHydrated) return;
    if (!session) return;

    const desiredProfiles: Student[] = [];
    if (session.user.role === "student") {
      const studentId = accountStudentId(session.user.id);
      if (!appState.students.some((s) => s.id === studentId)) {
        desiredProfiles.push(
          createStudentProfile(
            studentId,
            session.user.fullName,
            session.user.className
          )
        );
      }
    } else if (session.user.role === "parent") {
      for (const link of session.user.linkedChildren ?? []) {
        if (!appState.students.some((s) => s.id === link.studentId)) {
          desiredProfiles.push(
            createStudentProfile(link.studentId, link.displayName, link.className)
          );
        }
      }
    }

    if (desiredProfiles.length === 0) return;
    setAppState((prev) => {
      const missing = desiredProfiles.filter(
        (profile) => !prev.students.some((s) => s.id === profile.id)
      );
      if (missing.length === 0) return prev;
      return { ...prev, students: [...prev.students, ...missing] };
    });
  }, [isHydrated, session, appState.students]);

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

  const handleUpdateStudent = (updated: Student) => {
    setAppState((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === updated.id ? updated : s)),
    }));
  };

  const handleStudentAccountRenamed = (
    accountId: string,
    fullName: string
  ) => {
    const studentId = accountStudentId(accountId);
    setAppState((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId
          ? {
              ...s,
              fullName,
              commitment: { ...s.commitment, studentFullName: fullName },
            }
          : s
      ),
      aiMessages: prev.aiMessages.map((m) =>
        m.studentId === studentId ? { ...m, studentName: fullName } : m
      ),
      meetings: prev.meetings.map((m) =>
        m.studentId === studentId ? { ...m, studentName: fullName } : m
      ),
    }));
  };

  const handleStudentAccountDeleted = (accountId: string) => {
    const studentId = accountStudentId(accountId);
    setAppState((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== studentId),
      aiMessages: prev.aiMessages.filter((m) => m.studentId !== studentId),
      aiModerationLogs: prev.aiModerationLogs.filter(
        (log) => log.studentId !== studentId
      ),
      meetings: prev.meetings.filter((m) => m.studentId !== studentId),
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
      studentName: latestStudent.fullName,
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
      studentName: latestStudent.fullName,
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
      studentName: updated.studentName,
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
      setAccountNotice(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục."
      );
    });

    return () => {
      active = false;
    };
  }, []);

  // Roster lớp/học sinh (từ tài khoản đã đăng ký) dùng cho liên kết phụ huynh.
  useEffect(() => {
    let active = true;
    void fetchSchoolRoster().then((roster) => {
      if (active) setSchoolRoster(roster);
    });
    return () => {
      active = false;
    };
  }, [session]);

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
    setActiveChildId(
      next.user.role === "parent"
        ? next.user.linkedChildren?.[0]?.studentId ?? null
        : null
    );
    setAccountNotice(
      savedOffline
        ? "Tài khoản đã được lưu trên thiết bị này. Bạn vẫn có thể đăng nhập khi ngoại tuyến."
        : null
    );
  };

  const handleLinkChild = async (input: {
    studentId: string;
    pin: string;
  }): Promise<void> => {
    if (!session) return;
    const result = await addParentLink(session, {
      classId: "",
      studentId: input.studentId,
      pin: input.pin,
    });
    setSession(result.session);
    setActiveChildId(input.studentId);
    setAccountNotice(
      result.savedOffline
        ? "Chưa kết nối được máy chủ nên liên kết chỉ lưu trên thiết bị này. Khi có mạng, hãy liên kết lại để đồng bộ."
        : "Đã liên kết con thành công. Bạn có thể chuyển đổi giữa các con ở thanh phía trên."
    );
  };

  const handleChangeParentPin = async (pin: string): Promise<void> => {
    if (!session) return;
    const result = await changeParentPin(session, pin);
    setSession(result.session);
  };

  const handleLogout = () => {
    const current = session;
    setSession(null);
    setActiveChildId(null);
    setAccountNotice(null);
    setShowSettings(false);
    void logoutAccount(current);
  };

  const offlineSession = Boolean(session?.token.startsWith("local-"));

  const parentLinks = useMemo<LinkedChild[]>(
    () =>
      session?.user.role === "parent"
        ? session.user.linkedChildren ?? []
        : [],
    [session]
  );

  const activeStudent: Student | null = useMemo(() => {
    if (!session) return null;
    if (session.user.role === "student") {
      return (
        appState.students.find(
          (s) => s.id === accountStudentId(session.user.id)
        ) ?? null
      );
    }
    if (session.user.role === "parent" && activeChildId) {
      return appState.students.find((s) => s.id === activeChildId) ?? null;
    }
    return null;
  }, [session, appState.students, activeChildId]);

  // Mỗi thay đổi của học sinh được gửi lên máy chủ để giáo viên chủ nhiệm
  // (tài khoản cố định CoThuy912) nhận được hồ sơ từ thiết bị của em.
  const lastPublishedRef = useRef<string>("");
  useEffect(() => {
    if (!isHydrated || !session || !activeStudent) return;
    if (session.user.role !== "student") return;
    if (session.token.startsWith("local-")) return;

    const serialized = JSON.stringify(activeStudent);
    let cancelled = false;
    const publish = () => {
      if (serialized === lastPublishedRef.current) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      void publishStudentRecord(session, activeStudent).then((ok) => {
        if (!cancelled && ok) lastPublishedRef.current = serialized;
      });
    };

    const timer = setTimeout(publish, 800);
    window.addEventListener("online", publish);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("online", publish);
    };
  }, [isHydrated, session, activeStudent]);

  const parentChildOptions = parentLinks.map((link) => ({
    id: link.studentId,
    label: childOptionLabel(link),
  }));
  if (
    activeStudent &&
    !parentChildOptions.some((option) => option.id === activeStudent.id)
  ) {
    parentChildOptions.unshift({
      id: activeStudent.id,
      label: `${activeStudent.fullName} · ${schoolClassLabel(
        activeStudent.className
      )}`,
    });
  }
  const parentRoster = schoolRoster ?? buildLocalRoster();

  const role = session?.user.role ?? null;
  const isProfilePending =
    Boolean(session) && (role === "student" || role === "parent") && !activeStudent;

  return (
    <>
      {showProjectIntro ? (
        <ProjectIntro onBack={() => setShowProjectIntro(false)} />
      ) : !session || !role ? (
        <AuthScreen
          darkMode={appState.settings.darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onAuthenticated={handleAuthenticated}
          onOpenProjectIntro={() => setShowProjectIntro(true)}
          roster={schoolRoster}
        />
      ) : isProfilePending ? (
        <div className="min-h-screen bg-[#FAFBFD] dark:bg-[#0F171E] flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Đang tải hồ sơ của em…
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2] underline cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      ) : role === "student" && activeStudent ? (
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
          onExitRole={handleLogout}
          account={session.user}
          offlineSession={offlineSession}
          onLogout={handleLogout}
          onChangeParentPin={handleChangeParentPin}
        />
      ) : role === "teacher" ? (
        <TeacherDashboard
          appState={appState}
          onUpdateStudent={handleUpdateStudent}
          onUpdateAIMessage={handleUpdateAIMessage}
          onToggleRequireApproval={handleToggleRequireApproval}
          onAddMeeting={handleAddMeeting}
          onUpdateMeeting={handleUpdateMeeting}
          onOpenSettings={() => setShowSettings(true)}
          onToggleDarkMode={handleToggleDarkMode}
          onExitRole={handleLogout}
          account={session.user}
          authSession={session}
          offlineSession={offlineSession}
          onLogout={handleLogout}
          onStudentAccountRenamed={handleStudentAccountRenamed}
          onStudentAccountDeleted={handleStudentAccountDeleted}
        />
      ) : role === "parent" && activeStudent ? (
        <ParentView
          student={activeStudent}
          meetings={appState.meetings}
          settings={appState.settings}
          onUpdateStudent={handleUpdateStudent}
          onUpdateMeeting={handleUpdateMeeting}
          onOpenHowAIWorks={() => setShowHowAIWorks(true)}
          onToggleDarkMode={handleToggleDarkMode}
          onExitRole={handleLogout}
          account={session.user}
          offlineSession={offlineSession}
          onLogout={handleLogout}
          childOptions={parentChildOptions}
          selectedChildId={activeStudent.id}
          onSelectChild={setActiveChildId}
          roster={parentRoster}
          onLinkChild={handleLinkChild}
        />
      ) : (
        <div className="min-h-screen bg-[#FAFBFD] dark:bg-[#0F171E] flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Vai trò của tài khoản này không còn được hỗ trợ trong phiên bản
            hiện tại. Vui lòng đăng xuất và đăng nhập bằng tài khoản Học sinh,
            Phụ huynh hoặc Giáo viên.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-semibold cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      )}

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
        requireTeacherApprovalBeforeDisplay={
          appState.settings.requireTeacherApprovalBeforeDisplay
        }
        onToggleRequireApproval={handleToggleRequireApproval}
        onResetSampleData={handleResetSampleData}
        onImportFullAppState={(next) => setAppState(next)}
        onClose={() => setShowSettings(false)}
        onApplyFirebaseConfig={handleApplyFirebaseConfig}
      />

      <OfflineIndicator />
    </>
  );
}
