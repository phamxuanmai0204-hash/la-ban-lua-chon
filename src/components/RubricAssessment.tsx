import React, { useState } from "react";
import { QUALITATIVE_LEVELS, RUBRIC_CRITERIA } from "../data/seedData";
import { QualitativeLevel, RubricCriterionScores, StudentProfileData } from "../types";
import { Download, BarChart3 } from "lucide-react";

interface RubricAssessmentProps {
  mode: "teacher" | "student";
  students: StudentProfileData[];
  activeStudentId: string;
  onSelectStudentId?: (id: string) => void;
  onUpdateStudent: (updated: StudentProfileData) => void;
}

const LEVEL_HEIGHT_STEP: Record<QualitativeLevel, number> = {
  "Hạn chế": 1,
  "Đang hình thành": 2,
  "Khá rõ nét": 3,
  "Vững vàng": 4,
};

export const RubricAssessment: React.FC<RubricAssessmentProps> = ({
  mode,
  students,
  activeStudentId,
  onSelectStudentId,
  onUpdateStudent,
}) => {
  const student = students.find((s) => s.id === activeStudentId) ?? students[0];
  const [period, setPeriod] = useState<"before" | "after">("after");

  if (!student) return null;

  const setLevel = (
    criterionKey: keyof RubricCriterionScores,
    level: QualitativeLevel
  ) => {
    if (mode === "student") {
      const currentSelf = student.rubric.studentSelf ?? {
        hieuBanThan: "Đang hình thành",
        hieuLoTrinh: "Đang hình thành",
        thuHepLuaChon: "Đang hình thành",
        chotQuyetDinh: "Đang hình thành",
        camKetHanhDong: "Đang hình thành",
      };
      onUpdateStudent({
        ...student,
        rubric: {
          ...student.rubric,
          studentSelf: {
            ...currentSelf,
            [criterionKey]: level,
          },
        },
      });
      return;
    }

    if (period === "before") {
      onUpdateStudent({
        ...student,
        rubric: {
          ...student.rubric,
          beforeTeacher: {
            ...student.rubric.beforeTeacher,
            [criterionKey]: level,
          },
        },
      });
    } else {
      onUpdateStudent({
        ...student,
        rubric: {
          ...student.rubric,
          afterTeacher: {
            ...student.rubric.afterTeacher,
            [criterionKey]: level,
          },
        },
      });
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Ma_hoc_sinh_an_danh",
      "Nhom_trong_tam",
      "Buoc_hien_tai",
      "Da_chot",
      "Truoc_Hieu_ban_than",
      "Sau_Hieu_ban_than",
      "Truoc_Hieu_lo_trinh",
      "Sau_Hieu_lo_trinh",
      "Truoc_Thu_hep_lua_chon",
      "Sau_Thu_hep_lua_chon",
      "Truoc_Chot_quyet_dinh",
      "Sau_Chot_quyet_dinh",
      "Truoc_Cam_ket_hanh_dong",
      "Sau_Cam_ket_hanh_dong",
      "Ghi_chu_dinh_tinh",
    ];

    const escapeCsv = (val: string) => `"${String(val).replace(/"/g, '""')}"`;

    const rows = students.map((s) =>
      [
        s.id,
        s.isFocusGroup ? "Nhóm trọng tâm" : "Phổ thông",
        s.currentStep,
        s.hasLockedChoice ? "Đã chốt" : "Chưa chốt",
        s.rubric.beforeTeacher.hieuBanThan,
        s.rubric.afterTeacher.hieuBanThan,
        s.rubric.beforeTeacher.hieuLoTrinh,
        s.rubric.afterTeacher.hieuLoTrinh,
        s.rubric.beforeTeacher.thuHepLuaChon,
        s.rubric.afterTeacher.thuHepLuaChon,
        s.rubric.beforeTeacher.chotQuyetDinh,
        s.rubric.afterTeacher.chotQuyetDinh,
        s.rubric.beforeTeacher.camKetHanhDong,
        s.rubric.afterTeacher.camKetHanhDong,
        s.rubric.teacherNote,
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "la-ban-lua-chon-danh-gia-an-danh.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const chartWidth = 680;
  const chartHeight = 260;
  const leftPad = 128;
  const bottomPad = 48;
  const topPad = 24;
  const plotHeight = chartHeight - topPad - bottomPad;
  const plotWidth = chartWidth - leftPad - 24;

  const activeScores =
    mode === "student"
      ? student.rubric.studentSelf ?? {
          hieuBanThan: "Đang hình thành",
          hieuLoTrinh: "Đang hình thành",
          thuHepLuaChon: "Đang hình thành",
          chotQuyetDinh: "Đang hình thành",
          camKetHanhDong: "Đang hình thành",
        }
      : period === "before"
      ? student.rubric.beforeTeacher
      : student.rubric.afterTeacher;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
              {mode === "student"
                ? "Tự đánh giá năng lực ra quyết định của em"
                : "Đánh giá định tính theo thang mô tả 4 mức (Trước – Sau tác động)"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Không chấm điểm, không dùng số hay xếp hạng. Mọi tiêu chí được mô tả theo 4 mức: Hạn chế – Đang hình thành – Khá rõ nét – Vững vàng.
            </p>
          </div>

          {mode === "teacher" && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1F3A5F] hover:bg-[#162b47] dark:bg-[#2A7F7F] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Xuất bảng so sánh (CSV ẩn danh)</span>
            </button>
          )}
        </div>

        {mode === "teacher" && onSelectStudentId && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <label htmlFor="rubric-student" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Chọn học sinh:
              </label>
              <select
                id="rubric-student"
                value={student.id}
                onChange={(e) => onSelectStudentId(e.target.value)}
                className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-[#F7F9FB] dark:bg-slate-800 px-3 py-2 text-sm text-[#14263E] dark:text-slate-100"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} {s.isFocusGroup ? "(Nhóm trọng tâm)" : ""} · Bước {s.currentStep}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setPeriod("before")}
                className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  period === "before"
                    ? "bg-white dark:bg-slate-700 text-[#1F3A5F] dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Trước tác động
              </button>
              <button
                type="button"
                onClick={() => setPeriod("after")}
                className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  period === "after"
                    ? "bg-[#2A7F7F] text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Sau tác động
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 5 Criteria × 4 Levels Interactive Rubric */}
      <section className="space-y-4">
        {RUBRIC_CRITERIA.map((criterion) => {
          const selectedLevel = activeScores[criterion.key];
          return (
            <div
              key={criterion.key}
              className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-base font-bold text-[#1F3A5F] dark:text-slate-100">
                  {criterion.title}
                </h3>
                {mode === "student" && (
                  <span className="text-xs text-[#2A7F7F] dark:text-[#6EE7E7]">
                    Nhận xét của thầy/cô hiện tại: <strong>{student.rubric.afterTeacher[criterion.key]}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {QUALITATIVE_LEVELS.map((lvl) => {
                  const active = selectedLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(criterion.key, lvl)}
                      className={`text-left rounded-xl border p-3.5 transition-colors cursor-pointer flex flex-col justify-between space-y-1.5 ${
                        active
                          ? "bg-[#2A7F7F]/12 border-[#2A7F7F] dark:bg-[#2A7F7F]/30 dark:border-[#6EE7E7]"
                          : "bg-[#F7F9FB] dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span
                        className={`text-xs font-bold ${
                          active
                            ? "text-[#2A7F7F] dark:text-[#6EE7E7]"
                            : "text-[#1F3A5F] dark:text-slate-200"
                        }`}
                      >
                        {lvl}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {criterion.levels[lvl]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {mode === "teacher" && (
          <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-2">
            <label htmlFor="rubric-teacher-note" className="block text-sm font-semibold text-[#1F3A5F] dark:text-slate-100">
              Ghi chú định tính bằng lời của giáo viên
            </label>
            <textarea
              id="rubric-teacher-note"
              rows={2}
              value={student.rubric.teacherNote}
              onChange={(e) =>
                onUpdateStudent({
                  ...student,
                  rubric: { ...student.rubric, teacherNote: e.target.value },
                })
              }
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-[#F7F9FB] dark:bg-slate-800 p-3 text-sm text-[#14263E] dark:text-slate-100"
            />
          </div>
        )}
      </section>

      {/* Before / After Qualitative Comparison Table & Non-numeric Bar Chart */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-5 h-5 text-[#2A7F7F] dark:text-[#6EE7E7]" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
              Đối chiếu trước – sau (đánh giá định tính theo thang mô tả)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Học sinh: {student.id} · Trục đứng biểu diễn 4 mức mô tả bằng chữ, không quy đổi điểm số.
            </p>
          </div>
        </div>

        {/* Qualitative Double-Bar Chart (NO NUMBERS on axes) */}
        <div className="overflow-x-auto">
          <div className="min-w-[580px]">
            <div className="flex items-center gap-6 text-xs mb-2 pl-32">
              <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="w-3.5 h-3.5 rounded-sm bg-slate-400 inline-block" />
                <span>{mode === "student" ? "Trước khi tham gia" : "Trước khi áp dụng"}</span>
              </span>
              <span className="inline-flex items-center gap-2 text-[#1F3A5F] dark:text-slate-100 font-medium">
                <span className="w-3.5 h-3.5 rounded-sm bg-[#2A7F7F] inline-block" />
                <span>{mode === "student" ? "Em tự đánh giá hiện tại" : "Sau khi áp dụng"}</span>
              </span>
            </div>

            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto max-h-[290px]"
              role="img"
              aria-label="Biểu đồ cột đôi đối chiếu trước và sau theo 4 mức mô tả định tính"
            >
              {/* Horizontal grid lines for the 4 qualitative text levels */}
              {QUALITATIVE_LEVELS.map((lvl, idx) => {
                const step = idx + 1;
                const y = topPad + plotHeight - (step / 4) * plotHeight;
                return (
                  <g key={lvl}>
                    <line
                      x1={leftPad}
                      y1={y}
                      x2={chartWidth - 16}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-700"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={leftPad - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-600 dark:fill-slate-300 text-[11px] font-medium"
                    >
                      {lvl}
                    </text>
                  </g>
                );
              })}

              {/* Baseline */}
              <line
                x1={leftPad}
                y1={topPad + plotHeight}
                x2={chartWidth - 16}
                y2={topPad + plotHeight}
                stroke="currentColor"
                className="text-slate-300 dark:text-slate-600"
              />

              {/* Double Bars per criterion */}
              {RUBRIC_CRITERIA.map((criterion, i) => {
                const groupWidth = plotWidth / RUBRIC_CRITERIA.length;
                const centerX = leftPad + groupWidth * i + groupWidth / 2;
                const beforeLvl = student.rubric.beforeTeacher[criterion.key];
                const afterLvl =
                  mode === "student"
                    ? student.rubric.studentSelf?.[criterion.key] ?? student.rubric.afterTeacher[criterion.key]
                    : student.rubric.afterTeacher[criterion.key];

                const beforeH = (LEVEL_HEIGHT_STEP[beforeLvl] / 4) * plotHeight;
                const afterH = (LEVEL_HEIGHT_STEP[afterLvl] / 4) * plotHeight;

                const barW = 24;
                const shortLabel = criterion.title.replace(/^\d+\.\s*/, "");

                return (
                  <g key={criterion.key}>
                    <rect
                      x={centerX - barW - 3}
                      y={topPad + plotHeight - beforeH}
                      width={barW}
                      height={beforeH}
                      rx={5}
                      className="fill-slate-400 dark:fill-slate-500"
                    />
                    <rect
                      x={centerX + 3}
                      y={topPad + plotHeight - afterH}
                      width={barW}
                      height={afterH}
                      rx={5}
                      fill="#2A7F7F"
                    />
                    <text
                      x={centerX}
                      y={topPad + plotHeight + 20}
                      textAnchor="middle"
                      className="fill-[#1F3A5F] dark:fill-slate-200 text-[11px] font-medium"
                    >
                      {shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Verbal Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4">Tiêu chí</th>
                <th className="py-2.5 px-3">Trước khi áp dụng</th>
                <th className="py-2.5 px-3">
                  {mode === "student" ? "Em tự đánh giá / Hiện tại" : "Sau khi áp dụng"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {RUBRIC_CRITERIA.map((criterion) => {
                const beforeLvl = student.rubric.beforeTeacher[criterion.key];
                const afterLvl =
                  mode === "student"
                    ? student.rubric.studentSelf?.[criterion.key] ?? student.rubric.afterTeacher[criterion.key]
                    : student.rubric.afterTeacher[criterion.key];
                return (
                  <tr key={criterion.key}>
                    <td className="py-3 pr-4 font-semibold text-[#1F3A5F] dark:text-slate-100">
                      {criterion.title}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <span className="font-medium block">{beforeLvl}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {criterion.levels[beforeLvl]}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#2A7F7F] dark:text-[#6EE7E7]">
                      <span className="font-semibold block">{afterLvl}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {criterion.levels[afterLvl]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
