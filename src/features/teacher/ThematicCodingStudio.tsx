import React, { useMemo, useState } from "react";
import {
  Sparkles,
  Check,
  X,
  Edit3,
  Download,
  BookOpenText,
  Plus,
  AlertCircle,
} from "lucide-react";
import { requestThematicCoding } from "../../services/ai";
import { exportThematicCodesCSV } from "../../services/export";
import type { Student, ThematicCodeItem } from "../../types";

interface ThematicCodingStudioProps {
  students: Student[];
  thematicCodes: ThematicCodeItem[];
  onUpdateThematicCodes: (next: ThematicCodeItem[]) => void;
}

export const ThematicCodingStudio: React.FC<ThematicCodingStudioProps> = ({
  students,
  thematicCodes,
  onUpdateThematicCodes,
}) => {
  const allJournalEntries = useMemo(() => {
    return students.flatMap((stu) =>
      stu.journal.map((j) => ({
        journalId: j.id,
        studentId: stu.id,
        studentName: stu.fullName,
        date: j.date,
        activityType: j.activityType,
        content: j.content,
      }))
    );
  }, [students]);

  const visibleEntries = allJournalEntries;
  const [selectedJournalIds, setSelectedJournalIds] = useState<string[]>(() =>
    allJournalEntries.slice(0, 6).map((e) => e.journalId)
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTheme, setDraftTheme] = useState("");
  const [draftCodeLabel, setDraftCodeLabel] = useState("");
  const [draftQuote, setDraftQuote] = useState("");

  // Manual addition state
  const [manualTheme, setManualTheme] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [manualQuote, setManualQuote] = useState("");
  const [manualSource, setManualSource] = useState("");

  const toggleSelectJournal = (journalId: string) => {
    setSelectedJournalIds((prev) =>
      prev.includes(journalId)
        ? prev.filter((id) => id !== journalId)
        : [...prev, journalId]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = visibleEntries.map((e) => e.journalId);
    const allSelected = visibleIds.every((id) =>
      selectedJournalIds.includes(id)
    );
    if (allSelected) {
      setSelectedJournalIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedJournalIds(Array.from(new Set([...selectedJournalIds, ...visibleIds])));
    }
  };

  const handleGenerateAICodes = async () => {
    const chosen = allJournalEntries.filter((e) =>
      selectedJournalIds.includes(e.journalId)
    );
    if (chosen.length === 0) {
      setErrorMsg("Thầy/cô hãy chọn ít nhất một mục nhật ký để phân tích.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      const suggestions = await requestThematicCoding(chosen);
      const newItems: ThematicCodeItem[] = suggestions.map((s, idx) => ({
        id: `tc-${Date.now()}-${idx}`,
        theme: s.suggestedTheme,
        codeLabel: s.codeLabel,
        evidenceQuote: s.evidenceQuote,
        sourceLabel: s.sourceLabel,
        journalId: s.journalId,
        studentName: s.studentName,
        status: "pending",
        aiGenerated: true,
      }));
      onUpdateThematicCodes([...newItems, ...thematicCodes]);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Không tạo được mã hóa gợi ý lúc này."
      );
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: ThematicCodeItem) => {
    setEditingId(item.id);
    setDraftTheme(item.theme);
    setDraftCodeLabel(item.codeLabel);
    setDraftQuote(item.evidenceQuote);
  };

  const saveEdit = (itemId: string) => {
    onUpdateThematicCodes(
      thematicCodes.map((item) =>
        item.id === itemId
          ? {
              ...item,
              theme: draftTheme.trim() || item.theme,
              codeLabel: draftCodeLabel.trim() || item.codeLabel,
              evidenceQuote: draftQuote.trim() || item.evidenceQuote,
              status: "accepted",
            }
          : item
      )
    );
    setEditingId(null);
  };

  const setItemStatus = (
    itemId: string,
    status: ThematicCodeItem["status"]
  ) => {
    onUpdateThematicCodes(
      thematicCodes.map((item) =>
        item.id === itemId ? { ...item, status } : item
      )
    );
  };

  const handleAddManualCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTheme.trim() || !manualCode.trim() || !manualQuote.trim()) return;
    const item: ThematicCodeItem = {
      id: `tc-man-${Date.now()}`,
      theme: manualTheme.trim(),
      codeLabel: manualCode.trim(),
      evidenceQuote: manualQuote.trim(),
      sourceLabel: manualSource.trim() || "Giáo viên ghi nhận",
      journalId: "manual",
      studentName: "Giáo viên ghi nhận",
      status: "accepted",
      aiGenerated: false,
    };
    onUpdateThematicCodes([item, ...thematicCodes]);
    setManualCode("");
    setManualQuote("");
  };

  const acceptedItems = thematicCodes.filter((i) => i.status === "accepted");
  const groupedThemes = useMemo(() => {
    const map = new Map<string, ThematicCodeItem[]>();
    acceptedItems.forEach((item) => {
      const list = map.get(item.theme) || [];
      list.push(item);
      map.set(item.theme, list);
    });
    return Array.from(map.entries());
  }, [acceptedItems]);

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFCFE3]/70 dark:bg-[#EFCFE3]/15 flex items-center justify-center text-[#4A1A2C] dark:text-[#EFCFE3] shrink-0">
              <BookOpenText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">
                Hỗ trợ mã hóa chủ đề (Braun &amp; Clarke, 2006)
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                Chọn các mục nhật ký để AI đề xuất mã ban đầu và câu minh chứng. Thầy/cô luôn là người Chấp nhận, Sửa hoặc Bỏ trước khi gom chủ đề và xuất CSV.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={acceptedItems.length === 0}
            onClick={() => exportThematicCodesCSV(thematicCodes)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] disabled:opacity-50 text-[#133C42] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              Xuất CSV mã đã chấp nhận ({acceptedItems.length})
            </span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Select journals */}
        <section className="lg:col-span-5 bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold">
              1. Chọn nhật ký học sinh ({selectedJournalIds.length} đã chọn)
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium cursor-pointer"
              >
                Chọn tất cả
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
            {visibleEntries.map((entry) => {
              const checked = selectedJournalIds.includes(entry.journalId);
              return (
                <label
                  key={entry.journalId}
                  className={`block p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-colors ${
                    checked
                      ? "bg-[#B3DEE2]/20 dark:bg-[#B3DEE2]/10 border-[#63AEB6]"
                      : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelectJournal(entry.journalId)}
                      className="mt-1 w-4 h-4 accent-[#E27396]"
                    />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {entry.studentName} · {entry.activityType} ·{" "}
                        <span className="tabular-nums">{entry.date}</span>
                      </p>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-700 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="button"
            disabled={loading || selectedJournalIds.length === 0}
            onClick={handleGenerateAICodes}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-50 text-[#1D1519] text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {loading
                ? "AI đang đề xuất mã ban đầu..."
                : "Đề xuất mã ban đầu bằng AI"}
            </span>
          </button>
        </section>

        {/* Step 2: Review / Accept / Edit / Reject proposed codes */}
        <section className="lg:col-span-7 bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">
                2. Duyệt mã hóa &amp; Gom chủ đề ({thematicCodes.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chỉ các mã ở trạng thái &ldquo;Đã chấp nhận&rdquo; mới được đưa vào tệp CSV nghiên cứu.
              </p>
            </div>
          </div>

          {thematicCodes.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
              Chọn nhật ký bên trái rồi bấm &ldquo;Đề xuất mã ban đầu bằng AI&rdquo;, hoặc tự thêm mã mới bên dưới.
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {thematicCodes.map((item) => (
                <article
                  key={item.id}
                  className={`p-4 rounded-xl border space-y-2.5 text-sm ${
                    item.status === "accepted"
                      ? "bg-[#EAF2D7]/35 dark:bg-[#EAF2D7]/10 border-[#8FB37C]"
                      : item.status === "rejected"
                      ? "bg-slate-50 dark:bg-[#0F171E]/60 border-slate-200 dark:border-slate-800 opacity-60"
                      : "bg-[#FAFBFD] dark:bg-[#0F171E] border-[#B3DEE2] dark:border-slate-700"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#133C42] dark:text-[#B3DEE2]">
                      {item.aiGenerated
                        ? "Bản nháp do AI gợi ý – thầy/cô kiểm tra lại"
                        : "Mã do giáo viên tự thêm"}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Nguồn: {item.sourceLabel}
                    </span>
                  </div>

                  {editingId === item.id ? (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          aria-label="Tên chủ đề"
                          value={draftTheme}
                          onChange={(e) => setDraftTheme(e.target.value)}
                          placeholder="Chủ đề..."
                          className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-1.5 text-xs font-medium"
                        />
                        <input
                          type="text"
                          aria-label="Tên mã hóa"
                          value={draftCodeLabel}
                          onChange={(e) => setDraftCodeLabel(e.target.value)}
                          placeholder="Mã ban đầu..."
                          className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-1.5 text-xs font-medium"
                        />
                      </div>
                      <textarea
                        rows={2}
                        aria-label="Câu minh chứng"
                        value={draftQuote}
                        onChange={(e) => setDraftQuote(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] p-2.5 text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(item.id)}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#EAF2D7] text-[#223A1E] text-xs font-semibold cursor-pointer"
                        >
                          Lưu &amp; Chấp nhận
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                        <p>
                          <span className="text-slate-500 dark:text-slate-400">
                            Chủ đề:{" "}
                          </span>
                          <strong className="text-[#9D2950] dark:text-[#EA9AB2]">
                            {item.theme}
                          </strong>
                        </p>
                        <p>
                          <span className="text-slate-500 dark:text-slate-400">
                            Mã hóa:{" "}
                          </span>
                          <strong>{item.codeLabel}</strong>
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm italic text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-[#17222C] p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800">
                        &ldquo;{item.evidenceQuote}&rdquo;
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setItemStatus(item.id, "accepted")}
                          className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                            item.status === "accepted"
                              ? "bg-[#223A1E] text-white"
                              : "bg-[#EAF2D7] text-[#223A1E]"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {item.status === "accepted"
                              ? "Đã chấp nhận"
                              : "Chấp nhận"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="min-h-[36px] px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setItemStatus(item.id, "rejected")}
                          className="min-h-[36px] px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-rose-700 dark:text-rose-300 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Bỏ</span>
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* Manual add */}
          <form
            onSubmit={handleAddManualCode}
            className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5"
          >
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Thêm mã thủ công do thầy/cô tự xác định:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={manualTheme}
                onChange={(e) => setManualTheme(e.target.value)}
                placeholder="Chủ đề..."
                className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-1.5 text-xs"
              />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Tên mã..."
                className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-1.5 text-xs"
              />
              <input
                type="text"
                value={manualSource}
                onChange={(e) => setManualSource(e.target.value)}
                placeholder="Nguồn (vd: Nguyễn Văn A · Nhật ký)"
                className="min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-1.5 text-xs"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={manualQuote}
                onChange={(e) => setManualQuote(e.target.value)}
                placeholder="Trích câu minh chứng từ nhật ký..."
                className="flex-1 min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-1.5 text-xs"
              />
              <button
                type="submit"
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-[#E27396] text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm &amp; Chấp nhận</span>
              </button>
            </div>
          </form>

          {/* Summary table grouped by Theme */}
          {groupedThemes.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 className="text-sm font-bold">
                Bảng tổng hợp theo Chủ đề (Chủ đề – Mã hóa – Minh chứng – Nguồn)
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAFBFD] dark:bg-[#0F171E] border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2.5 font-semibold">Chủ đề</th>
                      <th className="p-2.5 font-semibold">Mã hóa</th>
                      <th className="p-2.5 font-semibold">Minh chứng</th>
                      <th className="p-2.5 font-semibold">Nguồn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                    {groupedThemes.flatMap(([theme, list]) =>
                      list.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2.5 font-semibold text-[#9D2950] dark:text-[#EA9AB2]">
                            {theme}
                          </td>
                          <td className="p-2.5 font-medium">{item.codeLabel}</td>
                          <td className="p-2.5 italic">&ldquo;{item.evidenceQuote}&rdquo;</td>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400">
                            {item.sourceLabel}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
