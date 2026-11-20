import React, { useState } from "react";
import {
  AIReviewItem,
  JourneyStep,
  MeetingRecord,
  PathwayItem,
  StudentProfileData,
  TryActivity,
} from "../types";
import { formatNowVi, getVerbalAttentionSignals } from "../services/storage";
import { SelfProfile } from "./SelfProfile";
import { AIReviewQueue } from "./AIReviewQueue";
import { RubricAssessment } from "./RubricAssessment";
import { ThreePartyMeeting } from "./ThreePartyMeeting";
import { ContentAdmin } from "./ContentAdmin";
import {
  Users,
  MessageSquareText,
  BarChart3,
  Calendar,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Star,
  Eye,
  EyeOff,
} from "lucide-react";

type TeacherTab = "class" | "ai-queue" | "rubric" | "meetings" | "admin";

interface TeacherDashboardProps {
  students: StudentProfileData[];
  pathways: PathwayItem[];
  tryActivities: TryActivity[];
  aiQueue: AIReviewItem[];
  meetings: MeetingRecord[];
  requireTeacherPreApproval: boolean;
  onUpdateStudent: (updated: StudentProfileData) => void;
  onUpdateAIReview: (updated: AIReviewItem) => void;
  onTogglePreApproval: (val: boolean) => void;
  onAddMeeting: (meeting: MeetingRecord) => void;
  onUpdateMeeting: (meeting: MeetingRecord) => void;
  onUpdatePathway: (updated: PathwayItem) => void;
  onAddTryActivity: (activity: TryActivity) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  pathways,
  tryActivities,
  aiQueue,
  meetings,
  requireTeacherPreApproval,
  onUpdateStudent,
  onUpdateAIReview,
  onTogglePreApproval,
  onAddMeeting,
  onUpdateMeeting,
  onUpdatePathway,
  onAddTryActivity,
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>("class");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [rubricStudentId, setRubricStudentId] = useState<string>(students[0]?.id ?? "HS A");
  const [filterMode, setFilterMode] = useState<"all" | "focus" | "attention" | "locked" | "unlocked">("all");
  const [stepFilter, setStepFilter] = useState<"ALL" | JourneyStep>("ALL");
  const [searchCode, setSearchCode] = useState("");
  const [showTeacherPrivateSignals, setShowTeacherPrivateSignals] = useState(true);

  const pendingAICount = aiQueue.filter((i) => i.status === "Chờ duyệt").length;
  const sensitiveAICount = aiQueue.filter((i) => i.nhayCam).length;

  const filteredStudents = students.filter((s) => {
    const signals = getVerbalAttentionSignals(s);
    if (filterMode === "focus" && !s.isFocusGroup) return false;
    if (filterMode === "attention" && !signals.hasAttentionNeeded) return false;
    if (filterMode === "locked" && !s.hasLockedChoice) return false;
    if (filterMode === "unlocked" && s.hasLockedChoice) return false;
    if (stepFilter !== "ALL" && s.currentStep !== stepFilter) return false;
    if (searchCode.trim() && !s.id.toLowerCase().includes(searchCode.trim().toLowerCase())) {
      return false;
    }
    return true;
  });

  const activeDetailStudent = selectedStudentId
    ? students.find((s) => s.id === selectedStudentId) ?? null
    : null;

  const tabs: { id: TeacherTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "class", label: "Theo dõi lớp (45 HS)", icon: <Users className="w-4 h-4" /> },
    {
      id: "ai-queue",
      label: "Hàng chờ AI",
      icon: <MessageSquareText className="w-4 h-4" />,
      count: pendingAICount,
    },
    { id: "rubric", label: "Đánh giá trước – sau", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "meetings", label: "Họp ba bên", icon: <Calendar className="w-4 h-4" /> },
    { id: "admin", label: "Quản trị nội dung", icon: <Settings2 className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-6">
      {/* Teacher Header & Navigation Tabs */}
      <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-[#1F3A5F] dark:text-slate-100">
              Bảng theo dõi của Giáo viên · Lớp 9A1 (45 học sinh)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Dữ liệu mẫu – minh họa · Theo dõi hành trình ra quyết định không chấm điểm, chỉ dùng mô tả định tính.
            </p>
          </div>
          {sensitiveAICount > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedStudentId(null);
                setActiveTab("ai-queue");
              }}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#C0504D]/12 border border-[#C0504D]/40 text-[#C0504D] dark:text-[#FCA5A5] text-xs font-semibold flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Có {sensitiveAICount} chia sẻ nhạy cảm cần chú ý</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {tabs.map((t) => {
            const active = activeTab === t.id && !activeDetailStudent;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedStudentId(null);
                  setActiveTab(t.id);
                }}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-[#1F3A5F] text-white dark:bg-[#2A7F7F]"
                    : "bg-[#F7F9FB] dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
                {typeof t.count === "number" && t.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#E0A030] text-[#14263E] text-[11px] font-bold">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Student Detail (Reading Together Mode) */}
      {activeDetailStudent ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedStudentId(null)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Danh sách lớp</span>
              </button>
              <div>
                <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
                  Hồ sơ {activeDetailStudent.id} · Bước {activeDetailStudent.currentStep}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chế độ đọc hồ sơ cùng học sinh
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateStudent({
                    ...activeDetailStudent,
                    isFocusGroup: !activeDetailStudent.isFocusGroup,
                  })
                }
                className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  activeDetailStudent.isFocusGroup
                    ? "bg-[#E0A030]/15 border-[#E0A030] text-[#9a6708] dark:text-[#F0B44A]"
                    : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>
                  {activeDetailStudent.isFocusGroup ? "Thuộc Nhóm trọng tâm" : "Đánh dấu Nhóm trọng tâm"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowTeacherPrivateSignals((v) => !v)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {showTeacherPrivateSignals ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>
                  {showTeacherPrivateSignals ? "Ẩn ghi chú riêng của GV (khi ngồi cùng HS)" : "Hiện dấu hiệu cần chú ý"}
                </span>
              </button>
            </div>
          </div>

          {/* Teacher-Only Verbal Attention Signals */}
          {showTeacherPrivateSignals && (() => {
            const signals = getVerbalAttentionSignals(activeDetailStudent);
            if (!signals.hasAttentionNeeded) return null;
            return (
              <div className="bg-[#C0504D]/10 border border-[#C0504D]/40 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-[#9b3936] dark:text-[#FCA5A5]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Dấu hiệu cần chú ý (Chỉ giáo viên nhìn thấy)</span>
                </div>
                <ul className="space-y-1 text-sm text-[#14263E] dark:text-slate-100 list-disc pl-5">
                  {signals.descriptions.map((desc, idx) => (
                    <li key={idx}>{desc}</li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Editable SelfProfile (with Teacher Ability Note editable) */}
          <SelfProfile
            student={activeDetailStudent}
            isTeacherReadingTogether={true}
            onUpdateStudent={onUpdateStudent}
          />

          {/* Student's Commitment & Teacher Sign-off */}
          <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#1F3A5F] dark:text-slate-100">
                  Trạng thái Chốt & Phiếu cam kết của {activeDetailStudent.id}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Lựa chọn: <strong>{activeDetailStudent.commitment.chosenOptionLabel || "Chưa chốt"}</strong>
                </p>
                {activeDetailStudent.commitment.reasonInOwnWords && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Lí do em viết: “{activeDetailStudent.commitment.reasonInOwnWords}”
                  </p>
                )}
              </div>

              {activeDetailStudent.hasLockedChoice && (
                <div>
                  {activeDetailStudent.commitment.teacherConfirmedAt ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2A7F7F] dark:text-[#6EE7E7]">
                      <CheckCircle2 className="w-4 h-4" />
                      GVCN đã xác nhận · {activeDetailStudent.commitment.teacherConfirmedAt}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateStudent({
                          ...activeDetailStudent,
                          commitment: {
                            ...activeDetailStudent.commitment,
                            teacherConfirmedAt: formatNowVi(),
                          },
                        })
                      }
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-[#2A7F7F] hover:bg-[#236a6a] text-white text-xs font-semibold cursor-pointer"
                    >
                      Xác nhận của Giáo viên chủ nhiệm
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <>
          {/* Class List View */}
          {activeTab === "class" && (
            <div className="space-y-4">
              {/* Summary Strip (Qualitative counts, NO percentages/scores) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sĩ số lớp</p>
                  <p className="text-2xl font-bold text-[#1F3A5F] dark:text-slate-100 mt-1 tabular-nums">
                    {students.length} học sinh
                  </p>
                </div>
                <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Nhóm trọng tâm</p>
                  <p className="text-2xl font-bold text-[#E0A030] mt-1 tabular-nums">
                    {students.filter((s) => s.isFocusGroup).length} em
                  </p>
                </div>
                <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Có dấu hiệu cần chú ý</p>
                  <p className="text-2xl font-bold text-[#C0504D] mt-1 tabular-nums">
                    {students.filter((s) => getVerbalAttentionSignals(s).hasAttentionNeeded).length} em
                  </p>
                </div>
                <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Đã chốt lựa chọn</p>
                  <p className="text-2xl font-bold text-[#2A7F7F] dark:text-[#6EE7E7] mt-1 tabular-nums">
                    {students.filter((s) => s.hasLockedChoice).length} em
                  </p>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "Tất cả (45)" },
                    { id: "focus", label: "Nhóm trọng tâm" },
                    { id: "attention", label: "Dấu hiệu cần chú ý" },
                    { id: "locked", label: "Đã chốt" },
                    { id: "unlocked", label: "Chưa chốt" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterMode(f.id as typeof filterMode)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                        filterMode === f.id
                          ? "bg-[#1F3A5F] text-white border-[#1F3A5F] dark:bg-[#2A7F7F] dark:border-[#2A7F7F]"
                          : "bg-[#F7F9FB] dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Lọc theo bước hành trình"
                    value={stepFilter}
                    onChange={(e) => setStepFilter(e.target.value as typeof stepFilter)}
                    className="min-h-[38px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-xs font-medium"
                  >
                    <option value="ALL">Mọi bước (THU → CAM KẾT)</option>
                    <option value="THU">Bước THU</option>
                    <option value="LỌC">Bước LỌC</option>
                    <option value="THỬ">Bước THỬ</option>
                    <option value="CHỐT">Bước CHỐT</option>
                    <option value="CAM KẾT">Bước CAM KẾT</option>
                  </select>

                  <input
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    placeholder="Tìm mã HS (ví dụ: HS A, HS 12)..."
                    className="min-h-[38px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-xs"
                  />
                </div>
              </div>

              {/* Student Table */}
              <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[740px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-[#F7F9FB] dark:bg-slate-800/70 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <th className="py-3 px-4">Kí hiệu HS</th>
                        <th className="py-3 px-3">Bước hiện tại</th>
                        <th className="py-3 px-3">Trạng thái chốt</th>
                        <th className="py-3 px-3">Dấu hiệu cần chú ý (mô tả hành vi)</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {filteredStudents.map((s) => {
                        const signals = getVerbalAttentionSignals(s);
                        return (
                          <tr
                            key={s.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#1F3A5F] dark:text-slate-100">
                                {s.id}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Lớp {s.className}
                                {s.isFocusGroup ? " · Nhóm trọng tâm" : ""}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-medium text-[#1F3A5F] dark:text-slate-200">
                              {s.currentStep}
                            </td>
                            <td className="py-3 px-3">
                              {s.hasLockedChoice ? (
                                <span className="text-xs font-semibold text-[#2A7F7F] dark:text-[#6EE7E7]">
                                  Đã chốt · {s.commitment.chosenOptionLabel.slice(0, 34)}
                                  {s.commitment.chosenOptionLabel.length > 34 ? "..." : ""}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  Chưa chốt
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 max-w-xs">
                              {signals.hasAttentionNeeded ? (
                                <div className="space-y-1">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                                      signals.isSensitive
                                        ? "bg-[#C0504D] text-white"
                                        : "bg-[#C0504D]/15 text-[#9b3936] dark:text-[#FCA5A5]"
                                    }`}
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>
                                      {signals.isSensitive ? "Cần gặp trực tiếp" : "Dấu hiệu cần chú ý"}
                                    </span>
                                  </span>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                                    {signals.descriptions[0]}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">Ổn định</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedStudentId(s.id)}
                                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#1F3A5F]/8 hover:bg-[#1F3A5F] hover:text-white dark:bg-slate-800 dark:hover:bg-[#2A7F7F] text-[#1F3A5F] dark:text-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Xem & đọc cùng HS
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai-queue" && (
            <AIReviewQueue
              queue={aiQueue}
              requireTeacherPreApproval={requireTeacherPreApproval}
              onTogglePreApproval={onTogglePreApproval}
              onUpdateItem={onUpdateAIReview}
            />
          )}

          {activeTab === "rubric" && (
            <RubricAssessment
              mode="teacher"
              students={students}
              activeStudentId={rubricStudentId}
              onSelectStudentId={setRubricStudentId}
              onUpdateStudent={onUpdateStudent}
            />
          )}

          {activeTab === "meetings" && (
            <ThreePartyMeeting
              role="teacher"
              meetings={meetings}
              students={students}
              onAddMeeting={onAddMeeting}
              onUpdateMeeting={onUpdateMeeting}
            />
          )}

          {activeTab === "admin" && (
            <ContentAdmin
              pathways={pathways}
              tryActivities={tryActivities}
              onUpdatePathway={onUpdatePathway}
              onAddTryActivity={onAddTryActivity}
            />
          )}
        </>
      )}
    </div>
  );
};
