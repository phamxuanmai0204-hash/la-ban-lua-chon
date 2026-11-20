import React, { useState } from "react";
import {
  AIReviewItem,
  JourneyStep,
  MeetingRecord,
  PathwayItem,
  StudentProfileData,
  TryActivity,
} from "../types";
import { CompassJourneyBar } from "./CompassLogo";
import { SelfProfile } from "./SelfProfile";
import { PathwayMap } from "./PathwayMap";
import { GoodEnoughFilter } from "./GoodEnoughFilter";
import { TryAndJournal } from "./TryAndJournal";
import { AIChat } from "./AIChat";
import { CommitForm } from "./CommitForm";
import { RubricAssessment } from "./RubricAssessment";
import { detectHesitantPhrase, requestAIQuestion } from "../services/aiService";
import { formatNowVi, formatShortDateVi } from "../services/storage";
import {
  User,
  Map,
  Filter,
  Compass,
  MessageCircleQuestion,
  FileCheck2,
  ClipboardCheck,
  Eye,
  EyeOff,
  Sparkles,
  Calendar,
} from "lucide-react";

type StudentTab =
  | "profile"
  | "pathways"
  | "filter"
  | "try"
  | "chat"
  | "commit"
  | "self-eval";

interface StudentJourneyProps {
  student: StudentProfileData;
  allStudents: StudentProfileData[];
  pathways: PathwayItem[];
  tryActivities: TryActivity[];
  aiQueue: AIReviewItem[];
  meetings: MeetingRecord[];
  requireTeacherPreApproval: boolean;
  onSelectStudentId: (id: string) => void;
  onUpdateStudent: (updated: StudentProfileData) => void;
  onAddAIReview: (item: AIReviewItem) => void;
}

const STEP_TO_TAB: Record<JourneyStep, StudentTab> = {
  THU: "pathways",
  LỌC: "filter",
  THỬ: "try",
  CHỐT: "commit",
  "CAM KẾT": "commit",
};

export const StudentJourney: React.FC<StudentJourneyProps> = ({
  student,
  allStudents,
  pathways,
  tryActivities,
  aiQueue,
  meetings,
  requireTeacherPreApproval,
  onSelectStudentId,
  onUpdateStudent,
  onAddAIReview,
}) => {
  const [activeTab, setActiveTab] = useState<StudentTab>(
    STEP_TO_TAB[student.currentStep] ?? "profile"
  );
  const [recognitionBanner, setRecognitionBanner] = useState<string>("");

  const studentMeetings = meetings.filter((m) => m.studentId === student.id);

  const triggerAIAndSave = async (
    studentMessage: string,
    triggerReason: string,
    baseStudent: StudentProfileData,
    options?: { addToChat?: boolean; journalEntryId?: string }
  ) => {
    const currentOptionsLabels = pathways
      .filter((p) => baseStudent.consideredOptionIds.includes(p.id))
      .map((p) => p.shortTitle);

    const res = await requestAIQuestion({
      studentMessage,
      triggerReason,
      criteriaList: baseStudent.criteria,
      currentOptions: currentOptionsLabels,
      lockedOption: baseStudent.hasLockedChoice ? baseStudent.commitment.chosenOptionLabel : "",
      recentHistory: baseStudent.chatMessages,
    });

    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const nowStr = formatNowVi();

    const reviewItem: AIReviewItem = {
      id: reviewId,
      studentId: baseStudent.id,
      createdAt: nowStr,
      triggerReason,
      studentInput: studentMessage,
      aiReply: res.reply,
      nhayCam: res.nhay_cam,
      dauHieu: res.dau_hieu,
      status: "Chờ duyệt",
      visibleToStudent: !requireTeacherPreApproval,
    };

    onAddAIReview(reviewItem);

    const hasHesitant = detectHesitantPhrase(studentMessage);
    let nextStudent: StudentProfileData = {
      ...baseStudent,
      behaviorCounters: {
        ...baseStudent.behaviorCounters,
        hesitantPhrasesCount:
          baseStudent.behaviorCounters.hesitantPhrasesCount + (hasHesitant ? 1 : 0),
        sensitiveAlert: baseStudent.behaviorCounters.sensitiveAlert || res.nhay_cam,
      },
    };

    if (options?.journalEntryId) {
      nextStudent = {
        ...nextStudent,
        journal: nextStudent.journal.map((j) =>
          j.id === options.journalEntryId ? { ...j, aiPromptId: reviewId } : j
        ),
      };
    }

    if (options?.addToChat) {
      nextStudent = {
        ...nextStudent,
        chatMessages: [
          ...nextStudent.chatMessages,
          {
            id: `msg-s-${Date.now()}`,
            sender: "student",
            text: studentMessage,
            createdAt: nowStr,
          },
          {
            id: `msg-a-${Date.now() + 1}`,
            sender: "ai",
            text: res.reply,
            createdAt: nowStr,
            reviewId,
            nhayCam: res.nhay_cam,
          },
        ],
      };
    }

    onUpdateStudent(nextStudent);
  };

  const handleSelectJourneyStep = (step: JourneyStep) => {
    setActiveTab(STEP_TO_TAB[step]);
    if (!student.hasLockedChoice) {
      onUpdateStudent({ ...student, currentStep: step });
    }
  };

  const handleAddOption = async (pathwayId: string) => {
    if (student.consideredOptionIds.includes(pathwayId)) return;
    const pathwayTitle = pathways.find((p) => p.id === pathwayId)?.shortTitle ?? "phương án mới";
    const addedAfterLock = student.hasLockedChoice;
    const addedAfterFilter = Object.keys(student.filterMatrix).length > 0;

    const updated: StudentProfileData = {
      ...student,
      consideredOptionIds: [...student.consideredOptionIds, pathwayId],
      behaviorCounters: {
        ...student.behaviorCounters,
        addedAfterLockCount:
          student.behaviorCounters.addedAfterLockCount + (addedAfterLock ? 1 : 0),
      },
    };
    onUpdateStudent(updated);

    if (addedAfterLock || addedAfterFilter) {
      await triggerAIAndSave(
        `Em vừa thêm phương án "${pathwayTitle}" vào danh sách cân nhắc.`,
        addedAfterLock
          ? "Thêm phương án mới sau khi đã chốt"
          : "Thêm phương án mới sau khi đã lọc tiêu chí",
        updated,
        { addToChat: true }
      );
      setRecognitionBanner(
        `Em vừa thêm "${pathwayTitle}" vào danh sách. Trợ lí đã gửi một câu hỏi gợi mở trong mục Trò chuyện để em tự đối chiếu với tiêu chí của mình.`
      );
    } else {
      setRecognitionBanner(`Em đã đưa "${pathwayTitle}" vào danh sách cân nhắc.`);
    }
  };

  const handleRemoveOption = (pathwayId: string) => {
    const pathwayTitle = pathways.find((p) => p.id === pathwayId)?.shortTitle ?? "phương án";
    onUpdateStudent({
      ...student,
      consideredOptionIds: student.consideredOptionIds.filter((id) => id !== pathwayId),
    });
    setRecognitionBanner(
      `Em đã tự loại bỏ "${pathwayTitle}" khỏi danh sách – thu hẹp lựa chọn không phù hợp là một quyết định cần sự rõ ràng.`
    );
  };

  const handleRegisterTry = (activityId: string) => {
    const exists = student.tryRegistrations.some((r) => r.activityId === activityId);
    if (exists) return;
    onUpdateStudent({
      ...student,
      currentStep: student.currentStep === "THU" || student.currentStep === "LỌC" ? "THỬ" : student.currentStep,
      tryRegistrations: [
        ...student.tryRegistrations,
        { activityId, status: "Đã đăng kí" },
      ],
    });
    setRecognitionBanner("Em đã đăng kí một hoạt động trải nghiệm thực tế – việc thử trực tiếp giúp em bớt đoán mò.");
  };

  const handleSubmitTryReflection = async (activityId: string, reflection: string) => {
    const act = tryActivities.find((a) => a.id === activityId);
    const entryId = `j-${Date.now()}`;
    const updated: StudentProfileData = {
      ...student,
      tryRegistrations: student.tryRegistrations.map((r) =>
        r.activityId === activityId ? { ...r, status: "Đã tham gia", reflection } : r
      ),
      journal: [
        {
          id: entryId,
          date: formatShortDateVi(),
          activityType: act?.category ?? "Trải nghiệm THỬ",
          reflection,
        },
        ...student.journal,
      ],
    };
    onUpdateStudent(updated);
    setRecognitionBanner("Em đã hoàn thành trải nghiệm thực tế và ghi lại cảm nhận của chính mình.");
    await triggerAIAndSave(reflection, "Cảm nhận sau trải nghiệm THỬ", updated, {
      journalEntryId: entryId,
    });
  };

  const handleAddJournalEntry = async (activityType: string, reflection: string) => {
    const entryId = `j-${Date.now()}`;
    const updated: StudentProfileData = {
      ...student,
      currentStep:
        student.currentStep === "THU" || student.currentStep === "LỌC"
          ? "THỬ"
          : student.currentStep,
      journal: [
        {
          id: entryId,
          date: formatShortDateVi(),
          activityType,
          reflection,
        },
        ...student.journal,
      ],
    };
    onUpdateStudent(updated);
    const reason = detectHesitantPhrase(reflection)
      ? "Nhật ký có câu thể hiện sự phân vân"
      : `Nhật ký (${activityType})`;
    await triggerAIAndSave(reflection, reason, updated, { journalEntryId: entryId });
  };

  const handleSendChatMessage = async (messageText: string) => {
    const reason = detectHesitantPhrase(messageText)
      ? "Trò chuyện có cụm từ phân vân"
      : "Học sinh chủ động trao đổi";
    await triggerAIAndSave(messageText, reason, student, { addToChat: true });
  };

  const handleCommitUpdate = async (
    updated: StudentProfileData,
    eventNote?: { type: "lock" | "change_after_lock"; newLabel: string }
  ) => {
    if (eventNote?.type === "lock") {
      onUpdateStudent(updated);
      setRecognitionBanner(
        "Em đã tự viết lí do và chốt lựa chọn bằng lời của chính mình – đây là bước tiến lớn của sự tự chủ."
      );
    } else if (eventNote?.type === "change_after_lock") {
      const withCounters: StudentProfileData = {
        ...updated,
        behaviorCounters: {
          ...updated.behaviorCounters,
          optionChangesCount: updated.behaviorCounters.optionChangesCount + 1,
          addedAfterLockCount: updated.behaviorCounters.addedAfterLockCount + 1,
        },
      };
      onUpdateStudent(withCounters);
      await triggerAIAndSave(
        `Em vừa đổi lựa chọn sang "${eventNote.newLabel}" sau khi đã chốt.`,
        "Đổi nguyện vọng sau khi đã chốt",
        withCounters,
        { addToChat: true }
      );
      setRecognitionBanner(
        "Em đã cập nhật lựa chọn mới. Hãy ghé Trợ lí đặt câu hỏi để kiểm tra lại xem lựa chọn mới có thật sự giữ vững tiêu chí của em không nhé."
      );
    } else {
      onUpdateStudent(updated);
    }
  };

  const navItems: { id: StudentTab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Soi chiếu bản thân", shortLabel: "Bản thân", icon: <User className="w-4 h-4" /> },
    { id: "pathways", label: "Bản đồ lộ trình (THU)", shortLabel: "THU", icon: <Map className="w-4 h-4" /> },
    { id: "filter", label: "Bộ lọc Đủ tốt (LỌC)", shortLabel: "LỌC", icon: <Filter className="w-4 h-4" /> },
    { id: "try", label: "Trải nghiệm & Nhật ký (THỬ)", shortLabel: "THỬ", icon: <Compass className="w-4 h-4" /> },
    { id: "chat", label: "Trò chuyện Trợ lí", shortLabel: "Trợ lí", icon: <MessageCircleQuestion className="w-4 h-4" /> },
    { id: "commit", label: "Chốt & Cam kết", shortLabel: "CAM KẾT", icon: <FileCheck2 className="w-4 h-4" /> },
    { id: "self-eval", label: "Tự đánh giá", shortLabel: "Đánh giá", icon: <ClipboardCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 pb-24 lg:pb-10 space-y-5">
      {/* Top Student Bar: Profile Switcher & Parent Privacy Toggle */}
      <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="active-student-switch" className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Hồ sơ đang xem:
            </label>
            <select
              id="active-student-switch"
              value={student.id}
              onChange={(e) => {
                const next = allStudents.find((s) => s.id === e.target.value);
                onSelectStudentId(e.target.value);
                if (next) setActiveTab(STEP_TO_TAB[next.currentStep] ?? "profile");
              }}
              className="min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-600 bg-[#F7F9FB] dark:bg-slate-800 px-3 text-sm font-bold text-[#1F3A5F] dark:text-slate-100"
            >
              {allStudents.slice(0, 12).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · Lớp {s.className} {s.storyTag ? `(${s.storyTag})` : ""}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Dữ liệu mẫu – minh họa
          </span>
        </div>

        {/* Share with Parent Toggle */}
        <button
          type="button"
          onClick={() =>
            onUpdateStudent({ ...student, shareWithParent: !student.shareWithParent })
          }
          className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
            student.shareWithParent
              ? "bg-[#2A7F7F]/12 border-[#2A7F7F]/45 text-[#1f6262] dark:text-[#6EE7E7]"
              : "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200"
          }`}
        >
          {student.shareWithParent ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>
            Chia sẻ với phụ huynh: {student.shareWithParent ? "ĐANG BẬT" : "ĐANG TẮT"}
          </span>
        </button>
      </div>

      {/* Compass 5-Step Journey Bar */}
      <CompassJourneyBar
        currentStep={student.currentStep}
        onSelectStep={handleSelectJourneyStep}
      />

      {/* Specific Competence Feedback (SDT - Deci & Ryan) */}
      {recognitionBanner && (
        <div className="bg-[#2A7F7F]/10 dark:bg-[#2A7F7F]/20 border border-[#2A7F7F]/40 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm text-[#1F3A5F] dark:text-slate-100">
            <Sparkles className="w-4 h-4 text-[#E0A030] shrink-0 mt-0.5" />
            <span>{recognitionBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setRecognitionBanner("")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-300 cursor-pointer shrink-0"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* Main Split Layout: Desktop Left Sidebar + Content Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Navigation */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20">
          <nav className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer text-left ${
                    active
                      ? "bg-[#1F3A5F] text-white dark:bg-[#2A7F7F]"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Upcoming Three-Party Meeting Card if any */}
          {studentMeetings.length > 0 && (
            <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1F3A5F] dark:text-[#F0B44A]">
                <Calendar className="w-4 h-4" />
                <span>Lịch họp ba bên của em</span>
              </div>
              {studentMeetings.map((m) => (
                <div key={m.id} className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                  <p className="font-semibold text-[#14263E] dark:text-slate-100">{m.dateTime}</p>
                  <p>{m.locationOrChannel}</p>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Active Module Content */}
        <main className="lg:col-span-9 min-w-0">
          {activeTab === "profile" && (
            <SelfProfile
              student={student}
              onUpdateStudent={onUpdateStudent}
              onGoToPathways={() => handleSelectJourneyStep("THU")}
            />
          )}
          {activeTab === "pathways" && (
            <PathwayMap
              pathways={pathways}
              student={student}
              onAddOption={handleAddOption}
              onRemoveOption={handleRemoveOption}
              onGoToFilter={() => handleSelectJourneyStep("LỌC")}
            />
          )}
          {activeTab === "filter" && (
            <GoodEnoughFilter
              student={student}
              pathways={pathways}
              onUpdateStudent={onUpdateStudent}
              onGoToPathways={() => handleSelectJourneyStep("THU")}
              onGoToTry={() => handleSelectJourneyStep("THỬ")}
            />
          )}
          {activeTab === "try" && (
            <TryAndJournal
              student={student}
              tryActivities={tryActivities}
              aiQueue={aiQueue}
              requireTeacherPreApproval={requireTeacherPreApproval}
              onRegisterActivity={handleRegisterTry}
              onSubmitActivityReflection={handleSubmitTryReflection}
              onAddJournalEntry={handleAddJournalEntry}
              onGoToCommit={() => handleSelectJourneyStep("CHỐT")}
            />
          )}
          {activeTab === "chat" && (
            <AIChat
              student={student}
              aiQueue={aiQueue}
              requireTeacherPreApproval={requireTeacherPreApproval}
              onSendMessage={handleSendChatMessage}
            />
          )}
          {activeTab === "commit" && (
            <CommitForm
              student={student}
              pathways={pathways}
              onUpdateStudent={handleCommitUpdate}
            />
          )}
          {activeTab === "self-eval" && (
            <RubricAssessment
              mode="student"
              students={allStudents}
              activeStudentId={student.id}
              onUpdateStudent={onUpdateStudent}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Thumb Navigation (<= 15% height) */}
      <nav
        aria-label="Điều hướng học sinh"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#182334]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 px-1 py-1"
      >
        <div className="grid grid-cols-7 gap-0.5">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center min-h-[48px] px-1 py-1 rounded-lg transition-colors ${
                  active
                    ? "text-[#1F3A5F] dark:text-[#F0B44A] bg-[#1F3A5F]/8 dark:bg-[#2A7F7F]/25 font-semibold"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {item.icon}
                <span className="text-[10px] leading-tight mt-0.5 truncate max-w-full">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
