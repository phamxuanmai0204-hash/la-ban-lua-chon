import React, { useMemo, useState } from "react";
import {
  BarChart3,
  Copy,
  Check,
  ExternalLink,
  FileArchive,
  FileText,
  Settings,
  Sparkles,
} from "lucide-react";
import { QUALITATIVE_LEVELS, RUBRIC_CRITERIA } from "../../data/mockData";
import { exportResearchZipPackage } from "../../services/export";
import type {
  AppState,
  Meeting,
  QualitativeLevel,
  RubricCriterionKey,
  Student,
} from "../../types";

interface ResearchModeProps {
  appState: AppState;
  onOpenSettings: () => void;
}

const LEVEL_RANK: Record<QualitativeLevel, number> = {
  "Hạn chế": 0,
  "Đang hình thành": 1,
  "Khá rõ nét": 2,
  "Vững vàng": 3,
};

const LEVEL_HEIGHT_CLASS: Record<QualitativeLevel, string> = {
  "Hạn chế": "h-10",
  "Đang hình thành": "h-20",
  "Khá rõ nét": "h-32",
  "Vững vàng": "h-44",
};

function computeMedianLevel(
  list: Student[],
  period: "before" | "after",
  key: RubricCriterionKey
): QualitativeLevel {
  if (list.length === 0) return "Hạn chế";
  const sorted = [...list]
    .map((s) => s.assessment[period][key])
    .sort((a, b) => LEVEL_RANK[a] - LEVEL_RANK[b]);
  return sorted[Math.floor(sorted.length / 2)];
}

function summarizeGroupShift(
  list: Student[],
  key: RubricCriterionKey
): {
  beforeDominant: QualitativeLevel;
  afterDominant: QualitativeLevel;
  beforeBreakdown: string;
  afterBreakdown: string;
  verbalShift: string;
} {
  const beforeDominant = computeMedianLevel(list, "before", key);
  const afterDominant = computeMedianLevel(list, "after", key);

  const fmtDist = (period: "before" | "after") =>
    QUALITATIVE_LEVELS.map((lvl) => {
      const cnt = list.filter((s) => s.assessment[period][key] === lvl).length;
      return cnt > 0 ? `${lvl}: ${cnt} HS` : null;
    })
      .filter(Boolean)
      .join(" · ");

  const shiftDelta = LEVEL_RANK[afterDominant] - LEVEL_RANK[beforeDominant];
  let verbalShift = "Giữ mức ổn định giữa hai thời điểm.";
  if (shiftDelta >= 2) {
    verbalShift = `Chuyển biến rõ rệt từ mức "${beforeDominant}" lên "${afterDominant}".`;
  } else if (shiftDelta === 1) {
    verbalShift = `Tiến bộ tích cực từ mức "${beforeDominant}" lên "${afterDominant}".`;
  }

  return {
    beforeDominant,
    afterDominant,
    beforeBreakdown: fmtDist("before"),
    afterBreakdown: fmtDist("after"),
    verbalShift,
  };
}

function buildCaseStudyNarrative(
  stu: Student,
  meetings: Meeting[]
): string {
  const pausedOptions = stu.consideredOptions
    .filter((o) => o.status === "Tạm gác lại")
    .map((o) => o.title);
  const chosenOpt =
    stu.commitment.chosenOption ||
    stu.consideredOptions.find((o) => o.status === "Đã chọn")?.title ||
    "đang tiếp tục cân nhắc";
  const stuMeetings = meetings.filter((m) => m.studentId === stu.id);

  const p1 = `[Trường hợp ${stu.fullName}, Lớp ${stu.className}]`;
  const p2 = `1. Bối cảnh ban đầu: ${stu.profile.abilitiesTeacherNote} Khi tự soi chiếu, em chia sẻ: "${stu.profile.abilitiesStudentSelf}".`;
  const p3 = `2. Quá trình đặt tiêu chí và thu hẹp lựa chọn: Em tự xác định ${stu.criteria.length} tiêu chí cá nhân (${stu.criteria.map((c) => c.label).join(", ") || "chưa bổ sung"}). ${
    pausedOptions.length > 0
      ? `Sau khi đối chiếu bảng tiêu chí, em đã chủ động tạm gác phương án: ${pausedOptions.join(", ")}.`
      : `Hiện em đang xem xét ${stu.consideredOptions.length} phương án trong danh sách.`
  }`;
  const p4 = `3. Trải nghiệm thực tế & nhật ký: Em đã tham gia ${stu.joinedExperienceIds.length} hoạt động trải nghiệm và ghi ${stu.journal.length} mục nhật ký${
    stu.journal[stu.journal.length - 1]
      ? ` (mục gần nhất viết: "${stu.journal[stu.journal.length - 1].content}")`
      : ""
  }.`;
  const p5 =
    stuMeetings.length > 0
      ? `4. Phối hợp gia đình – nhà trường: Đã tổ chức ${stuMeetings.length} buổi trao đổi ba bên (${stuMeetings[0].agreedChoice ? `thống nhất hướng "${stuMeetings[0].agreedChoice}"` : "đang tiếp tục đồng hành"}).`
      : "4. Phối hợp gia đình – nhà trường: Tiếp tục duy trì kết nối định kì cùng gia đình.";
  const p6 = `5. Kết quả cam kết & đối chiếu Trước – Sau: Hiện em ở bước ${stu.currentStep}, lựa chọn chốt: "${chosenOpt}". Đánh giá định tính của giáo viên ghi nhận sự chuyển biến từ mức phổ biến "${stu.assessment.before.narrowingOptions}" (Trước) sang "${stu.assessment.after.narrowingOptions}" (Sau) ở năng lực thu hẹp lựa chọn, và "${stu.assessment.after.decidingOnTime}" ở năng lực chốt quyết định.`;

  return [p1, p2, p3, p4, p5, p6].join("\n\n");
}

export const ResearchMode: React.FC<ResearchModeProps> = ({
  appState,
  onOpenSettings,
}) => {
  const [subTab, setSubTab] = useState<"before_after" | "case_study">(
    "before_after"
  );
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    appState.students[0]?.id || ""
  );
  const [draftsByStudent, setDraftsByStudent] = useState<
    Record<string, string>
  >({});
  const [copied, setCopied] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);
  const [zipMessage, setZipMessage] = useState<string | null>(null);

  const chartStudents = appState.students;

  const selectedCaseStudent =
    appState.students.find((s) => s.id === selectedCaseId) ||
    appState.students[0];

  const activeDraft = selectedCaseStudent
    ? draftsByStudent[selectedCaseStudent.id] ??
      buildCaseStudyNarrative(selectedCaseStudent, appState.meetings)
    : "";

  const handleRegenerateCaseDraft = () => {
    if (!selectedCaseStudent) return;
    setDraftsByStudent((prev) => ({
      ...prev,
      [selectedCaseStudent.id]: buildCaseStudyNarrative(
        selectedCaseStudent,
        appState.meetings
      ),
    }));
  };

  const handleCopyNarrative = async () => {
    try {
      await navigator.clipboard.writeText(activeDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard blocked
    }
  };

  const handleExportZip = async () => {
    setZipMessage(null);
    setExportingZip(true);
    try {
      await exportResearchZipPackage(appState);
      setZipMessage(
        "Đã xuất gói ZIP gồm 3 tệp CSV và 1 bản PDF tóm tắt tiếng Việt."
      );
    } catch (err) {
      setZipMessage(
        err instanceof Error
          ? err.message
          : "Không tạo được gói dữ liệu lúc này."
      );
    } finally {
      setExportingZip(false);
    }
  };

  const surveyUrl = appState.settings.googleFormSurveyUrl?.trim();

  return (
    <div className="space-y-6">
      {/* Research Action Banner */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold">
              Chế độ Nghiên cứu · Báo cáo định tính Trước – Sau
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Toàn bộ bảng đối chiếu, biểu đồ và gói dữ liệu xuất theo thang 4 mức mô tả bằng lời (không dùng thang số, không xếp hạng).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={exportingZip}
              onClick={handleExportZip}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-50 text-[#1D1519] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <FileArchive className="w-4 h-4" />
              <span>
                {exportingZip
                  ? "Đang nén gói dữ liệu..."
                  : "Xuất gói dữ liệu nghiên cứu (.ZIP)"}
              </span>
            </button>

            {surveyUrl ? (
              <a
                href={surveyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] text-xs sm:text-sm font-semibold inline-flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Phiếu khảo sát Google Form</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={onOpenSettings}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Gắn link Google Form trong Cài đặt</span>
              </button>
            )}
          </div>
        </div>

        {zipMessage && (
          <p className="p-3 rounded-xl bg-[#EAF2D7] text-[#223A1E] text-xs sm:text-sm font-medium">
            {zipMessage}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setSubTab("before_after")}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
              subTab === "before_after"
                ? "bg-[#1D242B] text-white dark:bg-[#B3DEE2] dark:text-[#133C42]"
                : "bg-slate-100 dark:bg-[#0F171E] text-slate-700 dark:text-slate-300"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Kết quả Trước – Sau</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("case_study")}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
              subTab === "case_study"
                ? "bg-[#1D242B] text-white dark:bg-[#B3DEE2] dark:text-[#133C42]"
                : "bg-slate-100 dark:bg-[#0F171E] text-slate-700 dark:text-slate-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Trường hợp điển hình</span>
          </button>
        </div>
      </section>

      {subTab === "before_after" ? (
        <div className="space-y-6">
          {/* Dual Bar Chart with 4 verbal levels ONLY (no numeric Y-axis) */}
          <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  Biểu đồ cột đôi đối chiếu Trước – Sau (trục 4 mức chữ)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thể hiện mức độ phổ biến (trung vị định tính) của nhóm học sinh ở 5 tiêu chí năng lực.
                </p>
              </div>

              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#0F171E]">
                <span className="min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#17222C] text-slate-900 dark:text-white shadow-sm inline-flex items-center">
                  Cả lớp ({appState.students.length} HS)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-400 inline-block" />
                <span>Trước tác động</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#4DA6A9] dark:bg-[#B3DEE2] inline-block" />
                <span>Sau tác động</span>
              </span>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="min-w-[620px] grid grid-cols-12 gap-4 items-end pt-3">
                <div className="col-span-3 flex flex-col-reverse justify-between h-48 pr-3 border-r border-slate-200 dark:border-slate-800 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {QUALITATIVE_LEVELS.map((lvl) => (
                    <div
                      key={lvl}
                      className="h-11 flex items-center justify-end"
                    >
                      <span>{lvl}</span>
                    </div>
                  ))}
                </div>

                <div className="col-span-9 grid grid-cols-5 gap-3 h-48 items-end border-b border-slate-200 dark:border-slate-800 pb-1">
                  {RUBRIC_CRITERIA.map((c) => {
                    const beforeLvl = computeMedianLevel(
                      chartStudents,
                      "before",
                      c.key
                    );
                    const afterLvl = computeMedianLevel(
                      chartStudents,
                      "after",
                      c.key
                    );
                    return (
                      <div
                        key={c.key}
                        className="flex flex-col items-center justify-end h-full gap-2"
                      >
                        <div className="flex items-end gap-2 h-44 w-full justify-center">
                          <div
                            title={`Trước: ${beforeLvl}`}
                            className={`w-7 rounded-t-md bg-slate-400/85 dark:bg-slate-600 transition-all ${LEVEL_HEIGHT_CLASS[beforeLvl]}`}
                          />
                          <div
                            title={`Sau: ${afterLvl}`}
                            className={`w-7 rounded-t-md bg-[#4DA6A9] dark:bg-[#B3DEE2] transition-all ${LEVEL_HEIGHT_CLASS[afterLvl]}`}
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
          {[
            {
              title: `Bảng so sánh bằng lời · Cả lớp (${appState.students.length} HS)`,
              list: appState.students,
            },
          ].map((block) => (
            <section
              key={block.title}
              className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4"
            >
              <h3 className="text-base sm:text-lg font-bold">{block.title}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      <th className="py-3 pr-4 font-semibold">Tiêu chí</th>
                      <th className="py-3 px-4 font-semibold">
                        Trước tác động
                      </th>
                      <th className="py-3 px-4 font-semibold">Sau tác động</th>
                      <th className="py-3 pl-4 font-semibold">
                        Nhận xét chuyển biến bằng lời
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                    {RUBRIC_CRITERIA.map((c) => {
                      const summary = summarizeGroupShift(block.list, c.key);
                      return (
                        <tr key={c.key} className="align-top">
                          <td className="py-3.5 pr-4 font-semibold whitespace-nowrap">
                            {c.title}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-700 dark:text-slate-200">
                              Mức phổ biến: {summary.beforeDominant}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {summary.beforeBreakdown}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 bg-[#EAF2D7]/25 dark:bg-[#EAF2D7]/5">
                            <p className="font-semibold text-[#133C42] dark:text-[#B3DEE2]">
                              Mức phổ biến: {summary.afterDominant}
                            </p>
                            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                              {summary.afterBreakdown}
                            </p>
                          </td>
                          <td className="py-3.5 pl-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                            {summary.verbalShift}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* Trường hợp điển hình */
        <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                Tổng hợp đoạn mô tả &ldquo;Trường hợp điển hình&rdquo;
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Chọn một học sinh để hệ thống ghép nối dòng thời gian, nhật ký, họp ba bên và rubric thành đoạn kể mạch lạc cho báo cáo nghiên cứu.
              </p>
            </div>

            <select
              aria-label="Chọn học sinh viết trường hợp điển hình"
              value={selectedCaseStudent?.id || ""}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm"
            >
              {appState.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} · {s.currentStep}
                </option>
              ))}
            </select>
          </div>

          <textarea
            rows={13}
            aria-label="Đoạn mô tả trường hợp điển hình có thể chỉnh sửa"
            value={activeDraft}
            onChange={(e) => {
              if (!selectedCaseStudent) return;
              setDraftsByStudent((prev) => ({
                ...prev,
                [selectedCaseStudent.id]: e.target.value,
              }));
            }}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#E27396]"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRegenerateCaseDraft}
              className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tạo lại bản ghép từ dữ liệu hiện tại</span>
            </button>

            <button
              type="button"
              onClick={handleCopyNarrative}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã sao chép đoạn mô tả</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép vào báo cáo Word</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
