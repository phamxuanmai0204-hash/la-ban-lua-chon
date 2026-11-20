import React, { useState } from "react";
import { AIReviewItem } from "../types";
import { formatNowVi } from "../services/storage";
import { ShieldAlert, Check, Edit3, Heart, PhoneForwarded } from "lucide-react";

interface AIReviewQueueProps {
  queue: AIReviewItem[];
  requireTeacherPreApproval: boolean;
  onTogglePreApproval: (val: boolean) => void;
  onUpdateItem: (updated: AIReviewItem) => void;
}

export const AIReviewQueue: React.FC<AIReviewQueueProps> = ({
  queue,
  requireTeacherPreApproval,
  onTogglePreApproval,
  onUpdateItem,
}) => {
  const [filter, setFilter] = useState<"all" | "pending" | "sensitive" | "done">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [encouragementInputs, setEncouragementInputs] = useState<Record<string, string>>({});

  const filtered = queue.filter((item) => {
    if (filter === "pending") return item.status === "Chờ duyệt";
    if (filter === "sensitive") return item.nhayCam;
    if (filter === "done") return item.status !== "Chờ duyệt";
    return true;
  });

  const handleKeepOriginal = (item: AIReviewItem) => {
    onUpdateItem({
      ...item,
      status: "Đã giữ nguyên",
      visibleToStudent: true,
      teacherEncouragement: encouragementInputs[item.id]?.trim() || item.teacherEncouragement,
      reviewedAt: formatNowVi(),
    });
  };

  const handleSaveEdit = (item: AIReviewItem) => {
    if (!editText.trim()) return;
    onUpdateItem({
      ...item,
      teacherEditedReply: editText.trim(),
      teacherEncouragement: encouragementInputs[item.id]?.trim() || item.teacherEncouragement,
      status: "Đã sửa",
      visibleToStudent: true,
      reviewedAt: formatNowVi(),
    });
    setEditingId(null);
  };

  const handleDirectCounseling = (item: AIReviewItem) => {
    onUpdateItem({
      ...item,
      status: "Chuyển tư vấn trực tiếp",
      visibleToStudent: true,
      teacherEncouragement:
        encouragementInputs[item.id]?.trim() ||
        "Thầy/cô đã đọc chia sẻ của em và muốn hẹn gặp riêng để lắng nghe em kĩ hơn nhé.",
      reviewedAt: formatNowVi(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
            Hàng chờ duyệt phản hồi từ Trợ lí AI
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Giáo viên xem lại câu hỏi gợi mở của AI, giữ nguyên, chỉnh sửa hoặc thêm lời động viên cho học sinh.
          </p>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FB] dark:bg-slate-800/70 px-4 py-2.5 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={requireTeacherPreApproval}
            onChange={(e) => onTogglePreApproval(e.target.checked)}
            className="w-4 h-4 accent-[#1F3A5F]"
          />
          <span className="text-xs sm:text-sm font-medium text-[#1F3A5F] dark:text-slate-100">
            Duyệt trước khi hiển thị (mặc định TẮT)
          </span>
        </label>
      </section>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: `Tất cả (${queue.length})` },
          { id: "pending", label: `Chờ duyệt (${queue.filter((i) => i.status === "Chờ duyệt").length})` },
          { id: "sensitive", label: `Nhạy cảm (${queue.filter((i) => i.nhayCam).length})` },
          { id: "done", label: `Đã xem (${queue.filter((i) => i.status !== "Chờ duyệt").length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
              filter === tab.id
                ? "bg-[#1F3A5F] text-white border-[#1F3A5F] dark:bg-[#2A7F7F] dark:border-[#2A7F7F]"
                : "bg-white dark:bg-[#182334] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Không có mục nào trong danh sách này.
          </div>
        ) : (
          filtered.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-[#182334] border rounded-2xl p-5 space-y-4 ${
                  item.nhayCam
                    ? "border-[#C0504D] dark:border-[#C0504D]"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-sm text-[#1F3A5F] dark:text-slate-100">{item.studentId}</strong>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-500 dark:text-slate-400">{item.createdAt}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-600 dark:text-slate-300">{item.triggerReason}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.nhayCam && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C0504D]/15 text-[#C0504D] dark:text-[#FCA5A5] font-semibold">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Cờ nhạy cảm
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-lg font-semibold ${
                        item.status === "Chờ duyệt"
                          ? "bg-[#E0A030]/15 text-[#9a6708] dark:text-[#F0B44A]"
                          : "bg-[#2A7F7F]/15 text-[#2A7F7F] dark:text-[#6EE7E7]"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-xl bg-[#F7F9FB] dark:bg-slate-800/60 p-3.5 space-y-1">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Học sinh đã viết:
                    </p>
                    <p className="text-[#14263E] dark:text-slate-100 leading-relaxed">
                      “{item.studentInput}”
                    </p>
                    {item.dauHieu && (
                      <p className="text-xs text-[#C0504D] dark:text-[#FCA5A5] pt-1.5">
                        Dấu hiệu cần chú ý: {item.dauHieu}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl bg-[#2A7F7F]/8 dark:bg-[#2A7F7F]/20 p-3.5 space-y-2">
                    <p className="text-xs font-semibold text-[#2A7F7F] dark:text-[#6EE7E7]">
                      {item.teacherEditedReply ? "Nội dung thầy/cô đã chỉnh sửa:" : "Câu hỏi gợi mở của Trợ lí AI:"}
                    </p>
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2.5 text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="min-h-[36px] px-3 py-1 rounded-lg border border-slate-300 text-xs cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item)}
                            className="min-h-[36px] px-3 py-1 rounded-lg bg-[#2A7F7F] text-white text-xs font-semibold cursor-pointer"
                          >
                            Lưu bản sửa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[#14263E] dark:text-slate-100 leading-relaxed">
                        {item.teacherEditedReply ?? item.aiReply}
                      </p>
                    )}
                  </div>
                </div>

                {/* Encouragement Input + Action Buttons */}
                <div className="flex flex-col md:flex-row md:items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex-1 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#E0A030] shrink-0" />
                    <input
                      type="text"
                      value={encouragementInputs[item.id] ?? item.teacherEncouragement ?? ""}
                      onChange={(e) =>
                        setEncouragementInputs({ ...encouragementInputs, [item.id]: e.target.value })
                      }
                      placeholder="Thêm lời động viên ngắn của thầy/cô (tùy chọn)..."
                      className="flex-1 min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleKeepOriginal(item)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#2A7F7F] hover:bg-[#226868] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Giữ nguyên</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditText(item.teacherEditedReply ?? item.aiReply);
                      }}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDirectCounseling(item)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#C0504D] hover:bg-[#a64240] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <PhoneForwarded className="w-3.5 h-3.5" />
                      <span>Chuyển tư vấn trực tiếp</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
