import React, { useEffect, useState } from "react";
import {
  AIReviewItem,
  AppState,
  MeetingRecord,
  PathwayItem,
  StudentProfileData,
  TryActivity,
  UserRole,
} from "./types";
import { dataRepository } from "./services/storage";
import { CompassMark } from "./components/CompassLogo";
import { RoleSelect } from "./components/RoleSelect";
import { StudentJourney } from "./components/StudentJourney";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { ParentView } from "./components/ParentView";
import { Moon, Sun, RotateCcw } from "lucide-react";

export default function App() {
  const [state, setState] = useState<AppState>(() => dataRepository.loadState());
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeStudentId, setActiveStudentId] = useState<string>("HS A");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    dataRepository.saveState(state);
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  const activeStudent =
    state.students.find((s) => s.id === activeStudentId) ?? state.students[0];

  const handleUpdateStudent = (updated: StudentProfileData) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === updated.id ? updated : s)),
    }));
  };

  const handleAddAIReview = (item: AIReviewItem) => {
    setState((prev) => ({
      ...prev,
      aiQueue: [item, ...prev.aiQueue],
    }));
  };

  const handleUpdateAIReview = (updated: AIReviewItem) => {
    setState((prev) => ({
      ...prev,
      aiQueue: prev.aiQueue.map((item) => (item.id === updated.id ? updated : item)),
    }));
  };

  const handleAddMeeting = (meeting: MeetingRecord) => {
    setState((prev) => ({
      ...prev,
      meetings: [meeting, ...prev.meetings],
    }));
  };

  const handleUpdateMeeting = (updated: MeetingRecord) => {
    setState((prev) => ({
      ...prev,
      meetings: prev.meetings.map((m) => (m.id === updated.id ? updated : m)),
    }));
  };

  const handleUpdatePathway = (updated: PathwayItem) => {
    setState((prev) => ({
      ...prev,
      pathways: prev.pathways.map((p) => (p.id === updated.id ? updated : p)),
    }));
  };

  const handleAddTryActivity = (activity: TryActivity) => {
    setState((prev) => ({
      ...prev,
      tryActivities: [activity, ...prev.tryActivities],
    }));
  };

  const handleResetDemo = () => {
    const fresh = dataRepository.resetState();
    setState(fresh);
    setActiveStudentId("HS A");
    setConfirmReset(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] dark:bg-[#0F172A] text-[#14263E] dark:text-[#F1F5F9] transition-colors">
      {/* Clean Top Bar (3 zones) */}
      <header className="sticky top-0 z-40 h-16 bg-white/95 dark:bg-[#182334]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/80">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => setRole(null)}
            className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-[#1F3A5F] dark:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CompassMark className="w-7 h-7 text-[#1F3A5F] dark:text-[#F0B44A]" />
            <span>La Bàn Lựa Chọn</span>
          </button>

          {/* Zone 2: Concise Role Switch Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setRole(null)}
              className={`whitespace-nowrap shrink-0 hover:text-[#1F3A5F] dark:hover:text-white cursor-pointer ${
                role === null ? "text-[#1F3A5F] dark:text-[#F0B44A] font-semibold underline underline-offset-8" : ""
              }`}
            >
              Màn hình chào
            </button>
            <button
              type="button"
              onClick={() => {
                if (!state.consentAccepted) {
                  setState((p) => ({ ...p, consentAccepted: true }));
                }
                setRole("student");
              }}
              className={`whitespace-nowrap shrink-0 hover:text-[#1F3A5F] dark:hover:text-white cursor-pointer ${
                role === "student" ? "text-[#1F3A5F] dark:text-[#F0B44A] font-semibold underline underline-offset-8" : ""
              }`}
            >
              Học sinh
            </button>
            <button
              type="button"
              onClick={() => {
                if (!state.consentAccepted) {
                  setState((p) => ({ ...p, consentAccepted: true }));
                }
                setRole("teacher");
              }}
              className={`whitespace-nowrap shrink-0 hover:text-[#1F3A5F] dark:hover:text-white cursor-pointer ${
                role === "teacher" ? "text-[#1F3A5F] dark:text-[#F0B44A] font-semibold underline underline-offset-8" : ""
              }`}
            >
              Giáo viên
            </button>
            <button
              type="button"
              onClick={() => {
                if (!state.consentAccepted) {
                  setState((p) => ({ ...p, consentAccepted: true }));
                }
                setRole("parent");
              }}
              className={`whitespace-nowrap shrink-0 hover:text-[#1F3A5F] dark:hover:text-white cursor-pointer ${
                role === "parent" ? "text-[#1F3A5F] dark:text-[#F0B44A] font-semibold underline underline-offset-8" : ""
              }`}
            >
              Phụ huynh
            </button>
          </nav>

          {/* Zone 3: Utility Actions (Dark Mode & Reset Demo / Switch Role) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
              className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Khôi phục dữ liệu mẫu</span>
            </button>

            {role !== null && (
              <button
                type="button"
                onClick={() => setRole(null)}
                className="md:hidden min-h-[40px] px-3 py-2 rounded-xl bg-[#1F3A5F] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                Đổi vai
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      {role === null && (
        <RoleSelect
          students={state.students}
          consentAccepted={state.consentAccepted}
          onAcceptConsent={() => setState((prev) => ({ ...prev, consentAccepted: true }))}
          onSelectRole={(selectedRole, studentId) => {
            if (studentId) setActiveStudentId(studentId);
            setRole(selectedRole);
          }}
        />
      )}

      {role === "student" && activeStudent && (
        <StudentJourney
          student={activeStudent}
          allStudents={state.students}
          pathways={state.pathways}
          tryActivities={state.tryActivities}
          aiQueue={state.aiQueue}
          meetings={state.meetings}
          requireTeacherPreApproval={state.requireTeacherPreApproval}
          onSelectStudentId={setActiveStudentId}
          onUpdateStudent={handleUpdateStudent}
          onAddAIReview={handleAddAIReview}
        />
      )}

      {role === "teacher" && (
        <TeacherDashboard
          students={state.students}
          pathways={state.pathways}
          tryActivities={state.tryActivities}
          aiQueue={state.aiQueue}
          meetings={state.meetings}
          requireTeacherPreApproval={state.requireTeacherPreApproval}
          onUpdateStudent={handleUpdateStudent}
          onUpdateAIReview={handleUpdateAIReview}
          onTogglePreApproval={(val) =>
            setState((prev) => ({ ...prev, requireTeacherPreApproval: val }))
          }
          onAddMeeting={handleAddMeeting}
          onUpdateMeeting={handleUpdateMeeting}
          onUpdatePathway={handleUpdatePathway}
          onAddTryActivity={handleAddTryActivity}
        />
      )}

      {role === "parent" && (
        <ParentView
          students={state.students}
          meetings={state.meetings}
          onUpdateStudent={handleUpdateStudent}
          onUpdateMeeting={handleUpdateMeeting}
        />
      )}

      {/* Reset Confirmation Dialog (No window.confirm / window.alert) */}
      {confirmReset && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
        >
          <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 id="reset-dialog-title" className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
              Khôi phục dữ liệu mẫu?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Thao tác này sẽ đưa toàn bộ 45 hồ sơ học sinh, nhật ký, lịch họp và đánh giá trở về trạng thái ban đầu để trình diễn lại từ đầu.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleResetDemo}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#E0A030] hover:bg-[#d19225] text-[#14263E] text-sm font-semibold cursor-pointer"
              >
                Khôi phục ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
