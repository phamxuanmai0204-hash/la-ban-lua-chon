import React, { useState } from "react";
import {
  Filter,
  Check,
  X,
  HelpCircle,
  Plus,
  Trash2,
  Compass,
  Archive,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Columns3,
  LayoutList,
} from "lucide-react";
import { STARTER_CRITERIA_SUGGESTIONS } from "../../data/mockData";
import { ChoiceOverloadModal } from "./ChoiceOverloadModal";
import type {
  CriterionMatch,
  JourneyStep,
  OptionEvaluation,
  Student,
} from "../../types";

interface GoodEnoughFilterProps {
  student: Student;
  onUpdateStudent: (updated: Student) => void;
  onNavigateToPathways: (pathwayId?: string) => void;
  onConfirmGoodEnough: (option: OptionEvaluation) => void;
  onRecognitionMessage: (msg: string) => void;
  onStepCompleted: (step: JourneyStep, message: string) => void;
}

export const GoodEnoughFilter: React.FC<GoodEnoughFilterProps> = ({
  student,
  onUpdateStudent,
  onNavigateToPathways,
  onConfirmGoodEnough,
  onRecognitionMessage,
  onStepCompleted,
}) => {
  const [newCriterion, setNewCriterion] = useState("");
  const [customOptionTitle, setCustomOptionTitle] = useState("");
  const [viewMode, setViewMode] = useState<"compare" | "cards">("compare");
  const [overloadPending, setOverloadPending] = useState<{
    type: "custom" | "restore";
    title: string;
    restoreId?: string;
  } | null>(null);
  const [satisficingConfirmOpt, setSatisficingConfirmOpt] =
    useState<OptionEvaluation | null>(null);

  const activeOptions = student.consideredOptions.filter(
    (o) => o.status !== "Tạm gác lại"
  );
  const archivedOptions = student.consideredOptions.filter(
    (o) => o.status === "Tạm gác lại"
  );

  const handleAddCriterion = (label: string) => {
    const clean = label.trim();
    if (!clean) return;
    const exists = student.criteria.some(
      (c) => c.label.toLowerCase() === clean.toLowerCase()
    );
    if (exists) {
      setNewCriterion("");
      return;
    }
    const id = `c-${Date.now()}`;
    onUpdateStudent({
      ...student,
      currentStep: student.currentStep === "THU" ? "LỌC" : student.currentStep,
      criteria: [...student.criteria, { id, label: clean }],
    });
    setNewCriterion("");
  };

  const handleRemoveCriterion = (criterionId: string) => {
    onUpdateStudent({
      ...student,
      criteria: student.criteria.filter((c) => c.id !== criterionId),
    });
  };

  const addNewCustomOptionDirect = (title: string) => {
    const newOpt: OptionEvaluation = {
      id: `opt-${Date.now()}`,
      pathwayId: "custom",
      title,
      status: "Đang cân nhắc",
      evaluations: {},
    };
    const isAlreadyCommitted = Boolean(student.commitment.studentConfirmedAt);
    onUpdateStudent({
      ...student,
      currentStep: student.currentStep === "THU" ? "LỌC" : student.currentStep,
      consideredOptions: [...student.consideredOptions, newOpt],
      signals: isAlreadyCommitted
        ? { ...student.signals, addedAfterCommit: true }
        : student.signals,
    });
    setCustomOptionTitle("");
  };

  const handleAddCustomOption = () => {
    const clean = customOptionTitle.trim();
    if (!clean) return;
    if (activeOptions.length >= 3) {
      setOverloadPending({ type: "custom", title: clean });
      return;
    }
    addNewCustomOptionDirect(clean);
  };

  const handleSetEvaluation = (
    optionId: string,
    criterionId: string,
    nextVal: CriterionMatch
  ) => {
    const updatedOptions = student.consideredOptions.map((opt) => {
      if (opt.id !== optionId) return opt;
      return {
        ...opt,
        evaluations: {
          ...opt.evaluations,
          [criterionId]: nextVal,
        },
      };
    });
    onUpdateStudent({
      ...student,
      currentStep: student.currentStep === "THU" ? "LỌC" : student.currentStep,
      consideredOptions: updatedOptions,
    });
  };

  const handleToggleOptionStatus = (optionId: string) => {
    const target = student.consideredOptions.find((o) => o.id === optionId);
    if (!target) return;

    if (target.status === "Tạm gác lại" && activeOptions.length >= 3) {
      setOverloadPending({
        type: "restore",
        title: target.title,
        restoreId: target.id,
      });
      return;
    }

    const nextStatus: OptionEvaluation["status"] =
      target.status === "Tạm gác lại" ? "Đang cân nhắc" : "Tạm gác lại";

    const updatedOptions = student.consideredOptions.map((opt) =>
      opt.id === optionId ? { ...opt, status: nextStatus } : opt
    );

    onUpdateStudent({
      ...student,
      consideredOptions: updatedOptions,
    });

    if (nextStatus === "Tạm gác lại") {
      onRecognitionMessage(
        "Em đã tự loại được một phương án không phù hợp – đó là một quyết định khó."
      );
    }
  };

  const handleConfirmOverloadSwap = (
    optionIdToArchive: string,
    comparisonReason: string
  ) => {
    if (!overloadPending) return;
    const isAlreadyCommitted = Boolean(student.commitment.studentConfirmedAt);

    let nextOptions = student.consideredOptions.map((opt) =>
      opt.id === optionIdToArchive
        ? { ...opt, status: "Tạm gác lại" as const }
        : opt
    );

    if (overloadPending.type === "custom") {
      nextOptions = [
        ...nextOptions,
        {
          id: `opt-${Date.now()}`,
          pathwayId: "custom",
          title: overloadPending.title,
          status: "Đang cân nhắc",
          evaluations: {},
        },
      ];
      setCustomOptionTitle("");
    } else if (
      overloadPending.type === "restore" &&
      overloadPending.restoreId
    ) {
      nextOptions = nextOptions.map((opt) =>
        opt.id === overloadPending.restoreId
          ? { ...opt, status: "Đang cân nhắc" as const }
          : opt
      );
    }

    const updatedJournal = comparisonReason
      ? [
          {
            id: `j-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            step: "LỌC" as const,
            pathwayTitle: overloadPending.title,
            activityType: "Đối chiếu tiêu chí",
            content: `Em chọn đưa "${overloadPending.title}" vào thay một phương án cũ vì: ${comparisonReason}`,
          },
          ...student.journal,
        ]
      : student.journal;

    onUpdateStudent({
      ...student,
      consideredOptions: nextOptions,
      journal: updatedJournal,
      signals: isAlreadyCommitted
        ? { ...student.signals, addedAfterCommit: true }
        : student.signals,
    });

    setOverloadPending(null);
    onRecognitionMessage(
      "Em đã tự loại được một phương án không phù hợp – đó là một quyết định khó."
    );
  };

  const handleConfirmSatisficing = () => {
    if (!satisficingConfirmOpt) return;
    const chosen = satisficingConfirmOpt;
    setSatisficingConfirmOpt(null);
    onStepCompleted(
      "LỌC",
      `Em đã chọn "${chosen.title}" là phương án ĐỦ TỐT với mình để bước sang trải nghiệm THỬ.`
    );
    onConfirmGoodEnough(chosen);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#EFCFE3]/45 dark:bg-[#EFCFE3]/10 border border-[#EA9AB2] dark:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2] mb-1">
            Nguyên tắc bước LỌC · Tối đa 3 phương án cùng lúc
          </p>
          <p className="text-base sm:text-lg font-bold text-[#1D242B] dark:text-white">
            &ldquo;Mục tiêu là tìm phương án ĐỦ TỐT với chính em, không phải phương án tốt nhất trong tưởng tượng.&rdquo;
          </p>
        </div>
        <div className="text-xs font-semibold text-[#133C42] dark:text-[#B3DEE2] shrink-0 tabular-nums">
          Đang cân nhắc: {activeOptions.length}/3 phương án
        </div>
      </div>

      {/* Step 1: Criteria */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B3DEE2]/50 dark:bg-[#B3DEE2]/15 flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2]">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              1. Tiêu chí tối thiểu do chính em đặt
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Một phương án cần đáp ứng những điều tối thiểu nào để phù hợp với em và gia đình?
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Gợi ý nhanh (chạm để thêm):
          </p>
          <div className="flex flex-wrap gap-2">
            {STARTER_CRITERIA_SUGGESTIONS.map((sug) => {
              const alreadyAdded = student.criteria.some(
                (c) => c.label.toLowerCase() === sug.toLowerCase()
              );
              return (
                <button
                  key={sug}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => handleAddCriterion(sug)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm border transition-colors cursor-pointer ${
                    alreadyAdded
                      ? "bg-[#EAF2D7]/60 dark:bg-[#EAF2D7]/15 border-[#EAF2D7] text-[#223A1E] dark:text-[#EAF2D7] cursor-default"
                      : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-300 dark:border-slate-700 hover:border-[#E27396]"
                  }`}
                >
                  {alreadyAdded ? `✓ ${sug}` : `+ ${sug}`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={newCriterion}
            onChange={(e) => setNewCriterion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCriterion(newCriterion);
              }
            }}
            aria-label="Nhập tiêu chí mới bằng lời của em"
            placeholder="Hoặc viết tiêu chí bằng lời của riêng em..."
            className="flex-1 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
          />
          <button
            type="button"
            onClick={() => handleAddCriterion(newCriterion)}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tiêu chí</span>
          </button>
        </div>

        {student.criteria.length > 0 && (
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
            {student.criteria.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-[#FAFBFD] dark:bg-[#0F171E]"
              >
                <span className="text-sm font-medium tabular-nums">
                  {idx + 1}. {c.label}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveCriterion(c.id)}
                  aria-label={`Xóa tiêu chí ${c.label}`}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Step 2: Side-by-side comparison & Satisficing */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              2. So sánh song song (tối đa 3 phương án × tiêu chí)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Tự đánh dấu ✓ (Đáp ứng), ✗ (Chưa đáp ứng) hoặc ? (Chưa rõ). Khi thấy vừa đủ, bấm &ldquo;Phương án này ĐỦ TỐT với em&rdquo;.
            </p>
          </div>

          <div
            role="group"
            aria-label="Chọn kiểu hiển thị bảng so sánh"
            className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 self-start sm:self-auto"
          >
            <button
              type="button"
              onClick={() => setViewMode("compare")}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                viewMode === "compare"
                  ? "bg-white dark:bg-[#17222C] text-[#1D242B] dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>So sánh song song</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                viewMode === "cards"
                  ? "bg-white dark:bg-[#17222C] text-[#1D242B] dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Xem từng thẻ</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={customOptionTitle}
            onChange={(e) => setCustomOptionTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomOption();
              }
            }}
            aria-label="Thêm tên phương án mới"
            placeholder="Thêm tên một phương án em đang nghĩ tới (tối đa 3 phương án cùng lúc)..."
            className="flex-1 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
          />
          <button
            type="button"
            onClick={handleAddCustomOption}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] hover:border-[#E27396] text-sm font-semibold shrink-0 cursor-pointer"
          >
            + Thêm phương án
          </button>
        </div>

        {student.consideredOptions.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3 bg-[#FAFBFD] dark:bg-[#0F171E]">
            <Compass className="w-10 h-10 text-[#E27396] mx-auto" />
            <p className="text-base font-semibold">
              Em chưa thêm phương án nào – hãy bắt đầu ở Bản đồ lộ trình
            </p>
            <button
              type="button"
              onClick={() => onNavigateToPathways()}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Mở Bản đồ lộ trình</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {activeOptions.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-sm text-slate-600 dark:text-slate-300">
                Em đang tạm gác tất cả phương án. Em có thể khôi phục một phương án bên dưới hoặc chọn lại ở Bản đồ lộ trình.
              </div>
            ) : viewMode === "compare" ? (
              /* Side-by-side matrix: up to 3 columns × criteria rows */
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full min-w-[680px] text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#FAFBFD] dark:bg-[#0F171E] border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 w-56 align-top text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Tiêu chí của em
                      </th>
                      {activeOptions.slice(0, 3).map((opt) => (
                        <th key={opt.id} className="p-4 align-top border-l border-slate-200/80 dark:border-slate-800">
                          <div className="space-y-2.5">
                            <div>
                              <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                {opt.status}
                              </p>
                              <p className="text-sm font-bold text-[#1D242B] dark:text-white leading-snug">
                                {opt.title}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSatisficingConfirmOpt(opt)}
                                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#EAF2D7] hover:bg-[#DCEAC0] text-[#223A1E] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Phương án này ĐỦ TỐT với em</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleOptionStatus(opt.id)}
                                aria-label={`Tạm gác phương án ${opt.title}`}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-[#E27396] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>Tạm gác</span>
                              </button>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {student.criteria.length === 0 ? (
                      <tr>
                        <td
                          colSpan={activeOptions.slice(0, 3).length + 1}
                          className="p-6 text-center text-sm text-slate-500 dark:text-slate-400"
                        >
                          Hãy thêm ít nhất một tiêu chí ở mục 1 để bắt đầu đánh dấu ✓ ✗ ? cho từng phương án.
                        </td>
                      </tr>
                    ) : (
                      student.criteria.map((c) => (
                        <tr key={c.id} className="bg-white dark:bg-[#17222C]">
                          <td className="p-4 align-top font-medium text-slate-800 dark:text-slate-100">
                            {c.label}
                          </td>
                          {activeOptions.slice(0, 3).map((opt) => {
                            const val: CriterionMatch =
                              opt.evaluations[c.id] || "Chưa rõ";
                            return (
                              <td
                                key={opt.id}
                                className="p-3.5 align-top border-l border-slate-200/80 dark:border-slate-800 space-y-2"
                              >
                                <div
                                  role="group"
                                  aria-label={`Đánh giá ${opt.title} theo tiêu chí ${c.label}`}
                                  className="flex items-center gap-1.5"
                                >
                                  {(
                                    [
                                      {
                                        value: "Đáp ứng",
                                        symbol: "✓",
                                        title: "Đáp ứng",
                                        activeClass:
                                          "bg-[#EAF2D7] text-[#223A1E] border-[#7FA870] font-bold",
                                      },
                                      {
                                        value: "Chưa đáp ứng",
                                        symbol: "✗",
                                        title: "Chưa đáp ứng",
                                        activeClass:
                                          "bg-[#EFCFE3] text-[#4A1A2C] border-[#D95B86] font-bold",
                                      },
                                      {
                                        value: "Chưa rõ",
                                        symbol: "?",
                                        title: "Chưa rõ",
                                        activeClass:
                                          "bg-[#B3DEE2]/80 text-[#133C42] border-[#4CA2AB] font-bold",
                                      },
                                    ] as const
                                  ).map((btn) => {
                                    const isActive = val === btn.value;
                                    return (
                                      <button
                                        key={btn.value}
                                        type="button"
                                        aria-label={`${btn.title} cho ${opt.title} ở tiêu chí ${c.label}`}
                                        aria-pressed={isActive}
                                        onClick={() =>
                                          handleSetEvaluation(
                                            opt.id,
                                            c.id,
                                            btn.value
                                          )
                                        }
                                        className={`min-h-[38px] min-w-[44px] px-2.5 py-1 rounded-lg border text-xs inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                                          isActive
                                            ? btn.activeClass
                                            : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#E27396]"
                                        }`}
                                      >
                                        <span>{btn.symbol}</span>
                                        <span className="hidden lg:inline">
                                          {btn.value === "Đáp ứng"
                                            ? "Hợp"
                                            : btn.value === "Chưa đáp ứng"
                                            ? "Chưa"
                                            : "Rõ?"}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {val === "Chưa rõ" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onNavigateToPathways(
                                        opt.pathwayId !== "custom"
                                          ? opt.pathwayId
                                          : undefined
                                      )
                                    }
                                    className="text-xs font-semibold text-[#133C42] dark:text-[#B3DEE2] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Tìm hiểu thêm ở bước THU</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Stacked cards view */
              <div className="space-y-4">
                {activeOptions.slice(0, 3).map((opt) => {
                  const hasUnclear = student.criteria.some(
                    (c) => (opt.evaluations[c.id] || "Chưa rõ") === "Chưa rõ"
                  );

                  return (
                    <div
                      key={opt.id}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#FAFBFD] dark:bg-[#0F171E] space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {opt.status}
                          </p>
                          <h3 className="text-base font-bold">{opt.title}</h3>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSatisficingConfirmOpt(opt)}
                            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#EAF2D7] hover:bg-[#DCEAC0] text-[#223A1E] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Phương án này ĐỦ TỐT với em</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleOptionStatus(opt.id)}
                            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] hover:border-[#E27396] text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Archive className="w-4 h-4" />
                            <span>Tạm gác</span>
                          </button>
                        </div>
                      </div>

                      {student.criteria.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Hãy thêm ít nhất một tiêu chí ở mục 1 để đối chiếu phương án này.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {student.criteria.map((c) => {
                            const val: CriterionMatch =
                              opt.evaluations[c.id] || "Chưa rõ";
                            return (
                              <div
                                key={c.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-white dark:bg-[#17222C] border border-slate-200/70 dark:border-slate-800"
                              >
                                <span className="text-sm font-medium">
                                  {c.label}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {(
                                    [
                                      {
                                        value: "Đáp ứng",
                                        icon: <Check className="w-3.5 h-3.5" />,
                                        activeClass:
                                          "bg-[#EAF2D7] text-[#223A1E] border-[#8FB37C]",
                                      },
                                      {
                                        value: "Chưa đáp ứng",
                                        icon: <X className="w-3.5 h-3.5" />,
                                        activeClass:
                                          "bg-[#EFCFE3] text-[#4A1A2C] border-[#E27396]",
                                      },
                                      {
                                        value: "Chưa rõ",
                                        icon: (
                                          <HelpCircle className="w-3.5 h-3.5" />
                                        ),
                                        activeClass:
                                          "bg-[#B3DEE2]/70 text-[#133C42] border-[#63AEB6]",
                                      },
                                    ] as const
                                  ).map((btn) => {
                                    const isActive = val === btn.value;
                                    return (
                                      <button
                                        key={btn.value}
                                        type="button"
                                        onClick={() =>
                                          handleSetEvaluation(
                                            opt.id,
                                            c.id,
                                            btn.value
                                          )
                                        }
                                        className={`min-h-[38px] px-2.5 py-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                          isActive
                                            ? btn.activeClass
                                            : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        }`}
                                      >
                                        {btn.icon}
                                        <span>{btn.value}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {hasUnclear && (
                        <div className="p-3.5 rounded-xl bg-[#B3DEE2]/30 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2] dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
                          <span className="text-[#133C42] dark:text-[#B3DEE2] font-medium">
                            Phương án này còn tiêu chí &ldquo;Chưa rõ&rdquo; — Em có thể tìm hiểu thêm ở bước THU.
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onNavigateToPathways(
                                opt.pathwayId !== "custom"
                                  ? opt.pathwayId
                                  : undefined
                              )
                            }
                            className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2] hover:underline self-start sm:self-auto cursor-pointer"
                          >
                            Tìm hiểu thêm ở bước THU →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Gentle Satisficing Confirmation Panel */}
            {satisficingConfirmOpt && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="satisficing-confirm-title"
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <div className="w-full max-w-lg bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#223A1E] dark:text-[#EAF2D7]">
                      Xác nhận nhẹ nhàng · Nguyên tắc Đủ Tốt
                    </p>
                    <h3
                      id="satisficing-confirm-title"
                      className="text-lg font-bold"
                    >
                      &ldquo;{satisficingConfirmOpt.title}&rdquo; đã đủ tốt với em?
                    </h3>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Em không cần tìm một con đường hoàn hảo tuyệt đối. Khi phương án này đã đáp ứng các điều cốt lõi em cần, mình sẽ chuyển sang bước <strong>THỬ</strong> để em trực tiếp kiểm chứng thực tế trước khi chốt cuối cùng nhé.
                  </p>

                  {student.criteria.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        Đối chiếu tiêu chí hiện tại:
                      </p>
                      {student.criteria.map((c) => (
                        <p
                          key={c.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span>· {c.label}</span>
                          <span className="font-semibold">
                            {satisficingConfirmOpt.evaluations[c.id] ||
                              "Chưa rõ"}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setSatisficingConfirmOpt(null)}
                      className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium cursor-pointer"
                    >
                      Để em xem lại thêm
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSatisficing}
                      className="min-h-[42px] px-5 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Đúng rồi, chuyển sang bước THỬ</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {archivedOptions.length > 0 && (
              <div className="pt-2 space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Phương án em đã tạm gác lại ({archivedOptions.length})
                </p>
                <div className="space-y-2">
                  {archivedOptions.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0F171E]/60"
                    >
                      <span className="text-sm text-slate-600 dark:text-slate-400 line-through">
                        {opt.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleOptionStatus(opt.id)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-white dark:hover:bg-[#17222C] cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Cân nhắc lại</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <ChoiceOverloadModal
        open={Boolean(overloadPending)}
        pendingOptionTitle={overloadPending?.title || ""}
        activeOptions={activeOptions.slice(0, 3)}
        criteria={student.criteria}
        onConfirmSwap={handleConfirmOverloadSwap}
        onCancel={() => setOverloadPending(null)}
      />
    </div>
  );
};
