import React, { useState } from "react";
import { SUGGESTED_CRITERIA } from "../data/seedData";
import { FilterCellStatus, PathwayItem, StudentProfileData } from "../types";
import { Check, X, HelpCircle, Plus, Trash2, Compass } from "lucide-react";

interface GoodEnoughFilterProps {
  student: StudentProfileData;
  pathways: PathwayItem[];
  onUpdateStudent: (updated: StudentProfileData) => void;
  onGoToPathways: () => void;
  onGoToTry: () => void;
}

const STATUS_OPTIONS: FilterCellStatus[] = ["Đáp ứng", "Chưa đáp ứng", "Chưa rõ"];

export const GoodEnoughFilter: React.FC<GoodEnoughFilterProps> = ({
  student,
  pathways,
  onUpdateStudent,
  onGoToPathways,
  onGoToTry,
}) => {
  const [newCriterion, setNewCriterion] = useState("");

  const consideredPathways = pathways.filter((p) =>
    student.consideredOptionIds.includes(p.id)
  );

  const addCriterion = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || student.criteria.includes(trimmed)) return;
    onUpdateStudent({
      ...student,
      criteria: [...student.criteria, trimmed],
    });
    setNewCriterion("");
  };

  const removeCriterion = (criterion: string) => {
    const nextCriteria = student.criteria.filter((c) => c !== criterion);
    const nextMatrix = { ...student.filterMatrix };
    for (const pid of Object.keys(nextMatrix)) {
      const row = { ...nextMatrix[pid] };
      delete row[criterion];
      nextMatrix[pid] = row;
    }
    onUpdateStudent({
      ...student,
      criteria: nextCriteria,
      filterMatrix: nextMatrix,
    });
  };

  const setCellStatus = (pathwayId: string, criterion: string, status: FilterCellStatus) => {
    const currentRow = student.filterMatrix[pathwayId] ?? {};
    onUpdateStudent({
      ...student,
      filterMatrix: {
        ...student.filterMatrix,
        [pathwayId]: {
          ...currentRow,
          [criterion]: status,
        },
      },
    });
  };

  const hasAnyUnknown = consideredPathways.some((p) =>
    student.criteria.some(
      (c) => (student.filterMatrix[p.id]?.[c] ?? "Chưa rõ") === "Chưa rõ"
    )
  );

  const getCellBadgeStyle = (status: FilterCellStatus) => {
    if (status === "Đáp ứng") {
      return "bg-[#2A7F7F]/15 text-[#1f6262] border-[#2A7F7F]/40 dark:bg-[#2A7F7F]/30 dark:text-[#6EE7E7] dark:border-[#6EE7E7]/50";
    }
    if (status === "Chưa đáp ứng") {
      return "bg-[#C0504D]/12 text-[#9b3936] border-[#C0504D]/35 dark:bg-[#C0504D]/25 dark:text-[#FCA5A5] dark:border-[#C0504D]/50";
    }
    return "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
  };

  return (
    <div className="space-y-6">
      {/* Guiding Philosophy Banner (Satisficing - Simon, 1956) */}
      <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 flex items-start gap-3">
        <Compass className="w-6 h-6 text-[#E0A030] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
            Bộ lọc “Đủ tốt”
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            “Mục tiêu là tìm phương án <strong>ĐỦ TỐT</strong> với chính em, không phải phương án tốt nhất trong tưởng tượng.”
          </p>
        </div>
      </div>

      {/* Criteria Builder */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#1F3A5F] dark:text-slate-100">
            1. Tự đặt tiêu chí tối thiểu bằng lời của em
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Chạm chọn gợi ý hoặc tự viết điều quan trọng nhất với em và gia đình lúc này.
          </p>
        </div>

        {/* Suggestion buttons */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_CRITERIA.map((sug) => {
            const added = student.criteria.includes(sug);
            return (
              <button
                key={sug}
                type="button"
                onClick={() => (added ? removeCriterion(sug) : addCriterion(sug))}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  added
                    ? "bg-[#1F3A5F] text-white border-[#1F3A5F] dark:bg-[#2A7F7F] dark:border-[#2A7F7F]"
                    : "bg-[#F7F9FB] text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                }`}
              >
                {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{sug}</span>
              </button>
            );
          })}
        </div>

        {/* Custom criterion input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addCriterion(newCriterion);
          }}
          className="flex flex-col sm:flex-row gap-2.5 pt-1"
        >
          <input
            type="text"
            value={newCriterion}
            onChange={(e) => setNewCriterion(e.target.value)}
            placeholder="Thêm tiêu chí riêng của em (ví dụ: có thời gian phụ mẹ buổi tối)..."
            className="flex-1 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-[#14263E] dark:text-slate-100"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#E0A030] hover:bg-[#d19225] text-[#14263E] text-sm font-semibold whitespace-nowrap cursor-pointer"
          >
            Thêm tiêu chí
          </button>
        </form>

        {student.criteria.length > 0 && (
          <div className="pt-2 space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Danh sách tiêu chí em đang dùng để đối chiếu:
            </p>
            <div className="flex flex-wrap gap-2">
              {student.criteria.map((c) => (
                <div
                  key={c}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FB] dark:bg-slate-800 px-3 py-1.5 text-sm text-[#14263E] dark:text-slate-100"
                >
                  <span>{c}</span>
                  <button
                    type="button"
                    onClick={() => removeCriterion(c)}
                    aria-label={`Xóa tiêu chí ${c}`}
                    className="text-slate-400 hover:text-[#C0504D] cursor-pointer p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Matrix: Phương án × Tiêu chí */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#1F3A5F] dark:text-slate-100">
            2. Bảng đối chiếu Phương án × Tiêu chí
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Tự đánh dấu từng ô là <strong>Đáp ứng (✓)</strong>, <strong>Chưa đáp ứng (✗)</strong> hoặc <strong>Chưa rõ (?)</strong>.
          </p>
        </div>

        {consideredPathways.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Em chưa thêm phương án nào – hãy bắt đầu ở Bản đồ lộ trình.
            </p>
            <button
              type="button"
              onClick={onGoToPathways}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#E0A030] hover:bg-[#d19225] text-[#14263E] text-sm font-semibold cursor-pointer"
            >
              Mở Bản đồ lộ trình (Bước THU)
            </button>
          </div>
        ) : student.criteria.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-sm text-slate-600 dark:text-slate-300">
            Em hãy chọn ít nhất một tiêu chí ở mục 1 phía trên để bắt đầu đối chiếu.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop & Mobile responsive cards/table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[540px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Phương án đang cân nhắc
                    </th>
                    {student.criteria.map((c) => (
                      <th
                        key={c}
                        className="py-3 px-2 text-xs font-semibold text-[#1F3A5F] dark:text-slate-200"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {consideredPathways.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3.5 pr-4 align-top">
                        <p className="text-sm font-bold text-[#1F3A5F] dark:text-slate-100">
                          {p.shortTitle}
                        </p>
                      </td>
                      {student.criteria.map((c) => {
                        const status: FilterCellStatus =
                          student.filterMatrix[p.id]?.[c] ?? "Chưa rõ";
                        return (
                          <td key={c} className="py-3 px-2 align-top">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1">
                                {STATUS_OPTIONS.map((opt) => {
                                  const isSelected = status === opt;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => setCellStatus(p.id, c, opt)}
                                      title={opt}
                                      aria-label={`${p.shortTitle} - ${c}: ${opt}`}
                                      className={`min-h-[36px] min-w-[36px] px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                                        isSelected
                                          ? getCellBadgeStyle(opt)
                                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                      }`}
                                    >
                                      {opt === "Đáp ứng" && <Check className="w-3.5 h-3.5" />}
                                      {opt === "Chưa đáp ứng" && <X className="w-3.5 h-3.5" />}
                                      {opt === "Chưa rõ" && <HelpCircle className="w-3.5 h-3.5" />}
                                    </button>
                                  );
                                })}
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {status}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasAnyUnknown && (
              <div className="rounded-xl bg-[#E0A030]/12 border border-[#E0A030]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-[#14263E] dark:text-slate-100">
                  Có ô em đang đánh dấu <strong>Chưa rõ (?)</strong> — Em cần tìm hiểu thêm điều này ở bước THU trước khi loại bỏ hay chọn.
                </p>
                <button
                  type="button"
                  onClick={onGoToPathways}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-semibold text-[#1F3A5F] dark:text-slate-100 whitespace-nowrap cursor-pointer"
                >
                  Quay lại Bước THU
                </button>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onGoToTry}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1F3A5F] hover:bg-[#162b47] dark:bg-[#2A7F7F] text-white text-sm font-semibold cursor-pointer"
              >
                Sang Bước THỬ: Trải nghiệm & Ghi nhật ký
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
