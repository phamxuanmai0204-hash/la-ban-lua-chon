import React, { useState } from "react";
import {
  Download,
  BarChart3,
  CheckCircle2,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import { QUALITATIVE_LEVELS, RUBRIC_CRITERIA } from "../../data/mockData";
import { exportQualitativeAssessmentCSV } from "../../services/export";
import type {
  QualitativeLevel,
  RubricCriterionKey,
  Student,
} from "../../types";

interface RubricAssessmentProps {
  mode: "teacher" | "student";
  students: Student[];
  selectedStudentId: string;
  onSelectStudentId?: (id: string) => void;
  onUpdateStudent: (updated: Student) => void;
}

const LEVEL_HEIGHT_CLASS: Record<QualitativeLevel, string> = {
  "Hạn chế": "h-10",
  "Đang hình thành": "h-20",
  "Khá rõ nét": "h-32",
  "Vững vàng": "h-44",
};

export const RubricAssessment: React.FC<RubricAssessmentProps> = ({
  mode,
  students,
  selectedStudentId,
  onSelectStudentId,
  onUpdateStudent,
}) => {
  const student =
    students.find((s) => s.id === selectedStudentId) || students[0];
  const [periodTab, setPeriodTab] = useState<"before" | "after">("after");

  if (!student) return null;

  const handleTeacherLevelChange = (
    period: "before" | "after",
    key: RubricCriterionKey,
    level: QualitativeLevel
  ) => {
    onUpdateStudent({
      ...student,
      assessment: {
        ...student.assessment,
        [period]: {
          ...student.assessment[period],
          [key]: level,
        },
      },
    });
  };

  const handleCriterionEvidenceChange = (
    period: "before" | "after",
    key: RubricCriterionKey,
    evidenceText: string
  ) => {
    onUpdateStudent({
      ...student,
      assessment: {
        ...student.assessment,
        [period]: {
          ...student.assessment[period],
          criterionEvidence: {
            ...(student.assessment[period].criterionEvidence || {}),
            [key]: evidenceText,
          },
        },
      },
    });
  };

  const handleStudentSelfLevelChange = (
    key: RubricCriterionKey,
    level: QualitativeLevel
  ) => {
    onUpdateStudent({
      ...student,
      assessment: {
        ...student.assessment,
        studentSelf: {
          ...student.assessment.studentSelf,
          [key]: level,
        },
      },
    });
  };

  // Build quick-pick evidence sources from student's own timeline
  const quickEvidenceSuggestions: { label: string; text: string }[] = [
    ...student.journal.slice(0, 3).map((j) => ({
      label: `Nhật ký ${j.date}`,
      text: `Nhật ký (${j.date}): "${j.content.slice(0, 90)}${j.content.length > 90 ? "..." : ""}"`,
    })),
    ...(student.scenarioReflections || []).slice(0, 2).map((sr) => ({
      label: `Tình huống ${sr.pathwayTitle}`,
      text: `Suy ngẫm tình huống ${sr.pathwayTitle}: "${sr.reflection.slice(0, 80)}${sr.reflection.length > 80 ? "..." : ""}"`,
    })),
    ...(student.commitment.chosenOption
      ? [
          {
            label: "Phiếu cam kết",
            text: `Phiếu cam kết chốt "${student.commitment.chosenOption}" (HS kí: ${student.commitment.studentConfirmedAt || "chưa"})`,
          },
        ]
      : []),
    {
      label: "Quan sát GV",
      text: `Quan sát GVCN: ${student.profile.abilitiesTeacherNote.slice(0, 95)}`,
    },
  ];

  const activeEvidenceMap = student.assessment[periodTab].criterionEvidence || {};
  const linkedEvidenceCount = RUBRIC_CRITERIA.filter(
    (c) => (activeEvidenceMap[c.key] || "").trim().length > 0
  ).length;

  if (mode === "student") {
    return (
      <div className="space-y-6">
        <div className="bg-[#EAF2D7]/65 dark:bg-[#EAF2D7]/10 border border-[#EAF2D7] dark:border-slate-700 rounded-2xl p-5">
          <h2 className="text-base sm:text-lg font-bold text-[#223A1E] dark:text-[#EAF2D7]">
            Tự nhìn lại sự thay đổi của bản thân
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
            Không có điểm số hay xếp hạng. Em chỉ chọn mô tả đúng nhất với cảm nhận của mình hiện tại ở 5 khía cạnh bên dưới.
          </p>
        </div>

        <div className="space-y-4">
          {RUBRIC_CRITERIA.map((criterion) => {
            const currentLevel = student.assessment.studentSelf[criterion.key];
            return (
              <section
                key={criterion.key}
                className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
              >
                <h3 className="text-sm sm:text-base font-bold">
                  {criterion.title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {QUALITATIVE_LEVELS.map((lvl) => {
                    const selected = currentLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() =>
                          handleStudentSelfLevelChange(criterion.key, lvl)
                        }
                        className={`text-left p-3.5 rounded-xl border transition-colors flex flex-col justify-between gap-2 min-h-[44px] cursor-pointer ${
                          selected
                            ? "bg-[#B3DEE2]/45 dark:bg-[#B3DEE2]/15 border-[#3A8F98] dark:border-[#B3DEE2]"
                            : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200 dark:border-slate-800 hover:border-[#EA9AB2]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#133C42] dark:text-[#B3DEE2]">
                            {lvl}
                          </span>
                          {selected && (
                            <CheckCircle2 className="w-4 h-4 text-[#133C42] dark:text-[#B3DEE2] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {criterion.levels[lvl]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold">
            Đánh giá định tính theo thang mô tả 4 mức
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Thực hiện 2 lần (Trước &amp; Sau tác động) hoàn toàn bằng mức mô tả; mỗi tiêu chí cần gắn ít nhất một minh chứng cụ thể.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onSelectStudentId && (
            <select
              aria-label="Chọn học sinh để đánh giá"
              value={student.id}
              onChange={(e) => onSelectStudentId(e.target.value)}
              className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} ({s.anonymizedLabel}) · Bước {s.currentStep}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => exportQualitativeAssessmentCSV(students)}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất CSV ẩn danh (45 HS)</span>
          </button>
        </div>
      </div>

      {/* Qualitative Bar Chart (NO numeric axis) */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-[#133C42] dark:text-[#B3DEE2]" />
            <h3 className="text-base sm:text-lg font-bold">
              Biểu đồ đối chiếu Trước – Sau ({student.code}) · Đánh giá định tính theo thang mô tả
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-400 inline-block" />
              <span>Trước khi áp dụng</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#4DA6A9] inline-block" />
              <span>Sau khi áp dụng</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[600px] grid grid-cols-12 gap-4 items-end pt-4">
            <div className="col-span-3 flex flex-col-reverse justify-between h-48 pr-3 border-r border-slate-200 dark:border-slate-800 text-right text-xs font-medium text-slate-600 dark:text-slate-300">
              {QUALITATIVE_LEVELS.map((lvl) => (
                <div key={lvl} className="h-11 flex items-center justify-end">
                  <span>{lvl}</span>
                </div>
              ))}
            </div>

            <div className="col-span-9 grid grid-cols-5 gap-3 h-48 items-end border-b border-slate-200 dark:border-slate-800 pb-1">
              {RUBRIC_CRITERIA.map((c) => {
                const beforeLvl = student.assessment.before[c.key];
                const afterLvl = student.assessment.after[c.key];
                return (
                  <div
                    key={c.key}
                    className="flex flex-col items-center justify-end h-full gap-2"
                  >
                    <div className="flex items-end gap-2 h-44 w-full justify-center">
                      <div
                        title={`Trước: ${beforeLvl}`}
                        className={`w-6 sm:w-7 rounded-t-md bg-slate-400/85 dark:bg-slate-600 transition-all ${LEVEL_HEIGHT_CLASS[beforeLvl]}`}
                      />
                      <div
                        title={`Sau: ${afterLvl}`}
                        className={`w-6 sm:w-7 rounded-t-md bg-[#4DA6A9] dark:bg-[#B3DEE2] transition-all ${LEVEL_HEIGHT_CLASS[afterLvl]}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="col-span-3" />
            <div className="col-span-9 grid grid-cols-5 gap-3 text-center">
              {RUBRIC_CRITERIA.map((c) => (
                <p
                  key={c.key}
                  className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug"
                >
                  {c.title}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Verbal comparison table */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-base sm:text-lg font-bold">
          Bảng đối chiếu bằng lời (Trước tác động · Sau tác động · Học sinh tự đánh giá)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <th className="py-3 pr-4 font-semibold">Tiêu chí</th>
                <th className="py-3 px-4 font-semibold">Trước khi áp dụng</th>
                <th className="py-3 px-4 font-semibold">Sau khi áp dụng</th>
                <th className="py-3 pl-4 font-semibold">Học sinh tự nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {RUBRIC_CRITERIA.map((c) => {
                const beforeLvl = student.assessment.before[c.key];
                const afterLvl = student.assessment.after[c.key];
                const selfLvl = student.assessment.studentSelf[c.key];
                const afterEv =
                  student.assessment.after.criterionEvidence?.[c.key];
                return (
                  <tr key={c.key} className="align-top">
                    <td className="py-3.5 pr-4 font-semibold whitespace-nowrap">
                      {c.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-600 dark:text-slate-300">
                        {beforeLvl}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {c.levels[beforeLvl]}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 bg-[#EAF2D7]/25 dark:bg-[#EAF2D7]/5">
                      <p className="font-semibold text-[#133C42] dark:text-[#B3DEE2]">
                        {afterLvl}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                        {c.levels[afterLvl]}
                      </p>
                      {afterEv && (
                        <p className="text-xs text-[#223A1E] dark:text-[#EAF2D7] mt-1.5">
                          <span className="font-semibold">Minh chứng: </span>
                          {afterEv}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 pl-4">
                      <p className="font-semibold text-[#9D2950] dark:text-[#EA9AB2]">
                        {selfLvl}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive teacher rubric editor with mandatory per-criterion evidence */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold">
              Cập nhật đánh giá &amp; minh chứng cho {student.code}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tình trạng minh chứng ({periodTab === "before" ? "Lần Trước" : "Lần Sau"}): đã gắn cho {linkedEvidenceCount}/5 tiêu chí.
            </p>
          </div>
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#0F171E]">
            <button
              type="button"
              onClick={() => setPeriodTab("before")}
              className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                periodTab === "before"
                  ? "bg-white dark:bg-[#17222C] text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Lần 1: Trước tác động
            </button>
            <button
              type="button"
              onClick={() => setPeriodTab("after")}
              className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                periodTab === "after"
                  ? "bg-white dark:bg-[#17222C] text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Lần 2: Sau tác động
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {RUBRIC_CRITERIA.map((c) => {
            const activeRating = student.assessment[periodTab];
            const currentLvl = activeRating[c.key];
            const evValue = activeRating.criterionEvidence?.[c.key] || "";
            const hasEvidence = evValue.trim().length > 0;
            return (
              <div
                key={c.key}
                className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">{c.title}</p>
                  {hasEvidence ? (
                    <span className="text-xs font-semibold text-[#223A1E] dark:text-[#EAF2D7] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã gắn minh chứng</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2] inline-flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Cần gắn ít nhất 1 minh chứng</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {QUALITATIVE_LEVELS.map((lvl) => {
                    const selected = currentLvl === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() =>
                          handleTeacherLevelChange(periodTab, c.key, lvl)
                        }
                        className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                          selected
                            ? "bg-[#B3DEE2]/50 dark:bg-[#B3DEE2]/20 border-[#3A8F98] dark:border-[#B3DEE2]"
                            : "bg-white dark:bg-[#17222C] border-slate-200 dark:border-slate-800 hover:border-[#EA9AB2]"
                        }`}
                      >
                        <p className="text-xs font-bold">{lvl}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {c.levels[lvl]}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Mandatory per-criterion evidence input + quick-pick chips */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#133C42] dark:text-[#B3DEE2]" />
                    <span>
                      Minh chứng gắn với tiêu chí này (chọn từ nhật ký / quan sát hoặc ghi chú):
                    </span>
                  </label>
                  <input
                    type="text"
                    value={evValue}
                    onChange={(e) =>
                      handleCriterionEvidenceChange(
                        periodTab,
                        c.key,
                        e.target.value
                      )
                    }
                    placeholder="Ghi minh chứng cụ thể hoặc bấm chọn nhanh nguồn bên dưới..."
                    className={`w-full min-h-[40px] rounded-xl border bg-white dark:bg-[#17222C] px-3 py-2 text-xs sm:text-sm ${
                      hasEvidence
                        ? "border-slate-300 dark:border-slate-700"
                        : "border-[#E27396]"
                    }`}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {quickEvidenceSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          handleCriterionEvidenceChange(
                            periodTab,
                            c.key,
                            item.text
                          )
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:border-[#3A8F98] text-[11px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        + {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="rubric-notes" className="block text-sm font-semibold">
              Ghi chú tổng quát ({periodTab === "before" ? "Lần Trước" : "Lần Sau"})
            </label>
            <textarea
              id="rubric-notes"
              rows={2}
              value={student.assessment[periodTab].notes || ""}
              onChange={(e) =>
                onUpdateStudent({
                  ...student,
                  assessment: {
                    ...student.assessment,
                    [periodTab]: {
                      ...student.assessment[periodTab],
                      notes: e.target.value,
                    },
                  },
                })
              }
              placeholder="Ghi nhận quan sát bằng lời về quá trình thay đổi của học sinh..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rubric-evidence" className="block text-sm font-semibold">
              Minh chứng tổng hợp ({periodTab === "before" ? "Lần Trước" : "Lần Sau"})
            </label>
            <textarea
              id="rubric-evidence"
              rows={2}
              value={student.assessment[periodTab].evidence || ""}
              onChange={(e) =>
                onUpdateStudent({
                  ...student,
                  assessment: {
                    ...student.assessment,
                    [periodTab]: {
                      ...student.assessment[periodTab],
                      evidence: e.target.value,
                    },
                  },
                })
              }
              placeholder="Ví dụ: Bài nhật ký tham quan xưởng, bảng lọc tự loại phương án, phiếu cam kết..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

