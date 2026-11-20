import React, { useState } from "react";
import { Archive, HelpCircle, X } from "lucide-react";
import type { Criterion, OptionEvaluation } from "../../types";

interface ChoiceOverloadModalProps {
  open: boolean;
  pendingOptionTitle: string;
  activeOptions: OptionEvaluation[];
  criteria: Criterion[];
  onConfirmSwap: (optionIdToArchive: string, comparisonReason: string) => void;
  onCancel: () => void;
}

export const ChoiceOverloadModal: React.FC<ChoiceOverloadModalProps> = ({
  open,
  pendingOptionTitle,
  activeOptions,
  criteria,
  onConfirmSwap,
  onCancel,
}) => {
  const [selectedArchiveId, setSelectedArchiveId] = useState<string>(
    activeOptions[0]?.id || ""
  );
  const [reason, setReason] = useState("");

  if (!open) return null;

  const chosenToArchive =
    activeOptions.find((o) => o.id === selectedArchiveId) || activeOptions[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="choice-overload-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2]">
              Giữ gọn tối đa 3 phương án để dễ chọn
            </p>
            <h2 id="choice-overload-title" className="text-lg font-bold">
              Em muốn thêm &ldquo;{pendingOptionTitle}&rdquo;?
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Đóng hộp thoại"
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Danh sách cân nhắc hiện đã có đủ <strong>3 phương án</strong>. Khi giữ quá nhiều lựa chọn cùng lúc, mình dễ bị rối và khó so sánh. Để thêm phương án mới, em hãy cân nhắc bỏ bớt một phương án cũ nhé.
        </p>

        {/* Reflective comparison question */}
        <div className="p-4 rounded-xl bg-[#B3DEE2]/30 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2] dark:border-slate-700 space-y-2.5">
          <label
            htmlFor="overload-reason-input"
            className="text-sm font-bold text-[#133C42] dark:text-[#B3DEE2] flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>
              Phương án mới hơn phương án cũ ở tiêu chí nào em đã đặt?
            </span>
          </label>
          {criteria.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {criteria.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setReason((prev) =>
                      prev.trim()
                        ? `${prev.trim()}, tốt hơn ở tiêu chí "${c.label}"`
                        : `Hơn ở tiêu chí "${c.label}"`
                    )
                  }
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white dark:bg-[#17222C] border border-slate-300 dark:border-slate-700 text-xs font-medium hover:border-[#E27396] cursor-pointer"
                >
                  + {c.label}
                </button>
              ))}
            </div>
          )}
          <input
            id="overload-reason-input"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Viết ngắn gọn lí do phương án mới đáng cân nhắc hơn..."
            className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F171E] px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
          />
        </div>

        {/* Select 1 of 3 active options to set aside */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            Chọn 1 phương án em muốn tạm gác lại:
          </p>
          <div className="space-y-2">
            {activeOptions.map((opt) => {
              const checked = chosenToArchive?.id === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedArchiveId(opt.id)}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors min-h-[44px] cursor-pointer ${
                    checked
                      ? "bg-[#EFCFE3]/45 dark:bg-[#E27396]/20 border-[#E27396] font-semibold"
                      : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200 dark:border-slate-800 hover:border-[#EA9AB2]"
                  }`}
                >
                  <span className="text-sm">{opt.title}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 inline-flex items-center gap-1 shrink-0">
                    <Archive className="w-3.5 h-3.5" />
                    <span>{checked ? "Sẽ tạm gác" : "Chọn"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Giữ nguyên 3 phương án cũ
          </button>
          <button
            type="button"
            disabled={!chosenToArchive}
            onClick={() => {
              if (!chosenToArchive) return;
              onConfirmSwap(chosenToArchive.id, reason.trim());
              setReason("");
            }}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-50 text-[#1D1519] text-xs sm:text-sm font-semibold cursor-pointer"
          >
            Tạm gác phương án đã chọn &amp; Thêm phương án mới
          </button>
        </div>
      </div>
    </div>
  );
};
