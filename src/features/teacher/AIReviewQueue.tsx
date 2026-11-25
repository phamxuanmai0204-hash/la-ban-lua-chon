import React, { useState } from "react";
import {
  CheckCircle,
  Edit3,
  HeartHandshake,
  MessageSquarePlus,
  AlertTriangle,
  Shield,
  History,
  ShieldAlert,
} from "lucide-react";
import { AIModerationHistory } from "./AIModerationHistory";
import type {
  AIMessage,
  AIModerationAction,
  AIModerationLog,
  AIQuestionType,
} from "../../types";

interface AIReviewQueueProps {
  messages: AIMessage[];
  logs: AIModerationLog[];
  requireApprovalBeforeDisplay: boolean;
  onToggleRequireApproval: () => void;
  onUpdateMessage: (
    updated: AIMessage,
    logMeta: {
      action: AIModerationAction;
      editedReply?: string;
      reason?: string;
    }
  ) => void;
}

const QUESTION_TYPE_LABELS: Record<AIQuestionType, string> = {
  doi_chieu_tieu_chi: "Đối chiếu tiêu chí",
  phan_tu_cam_xuc: "Phản tư cảm xúc",
  goi_mo_thong_tin: "Gợi mở thông tin",
  dong_vien: "Động viên / Kết nối GV",
};

export const AIReviewQueue: React.FC<AIReviewQueueProps> = ({
  messages,
  logs,
  requireApprovalBeforeDisplay,
  onToggleRequireApproval,
  onUpdateMessage,
}) => {
  const [subView, setSubView] = useState<"queue" | "history">("queue");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftReply, setDraftReply] = useState("");
  const [draftEditReason, setDraftEditReason] = useState("");
  const [encouragementOpenId, setEncouragementOpenId] = useState<string | null>(
    null
  );
  const [draftEncouragement, setDraftEncouragement] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "sensitive"
  >("all");

  const filtered = messages.filter((m) => {
    if (filterStatus === "pending") return m.status === "chờ duyệt";
    if (filterStatus === "sensitive") return m.nhayCam;
    return true;
  });

  const startEdit = (m: AIMessage) => {
    setEditingId(m.id);
    setDraftReply(m.teacherEditedReply || m.aiReply);
    setDraftEditReason("");
  };

  const saveEdit = (m: AIMessage) => {
    const cleanReply = draftReply.trim();
    if (!cleanReply) return;
    onUpdateMessage(
      {
        ...m,
        originalAiReply: m.originalAiReply || m.aiReply,
        teacherEditedReply: cleanReply,
        status: "giáo viên đã sửa",
        visibleToStudent: true,
      },
      {
        action: "giáo viên đã sửa",
        editedReply: cleanReply,
        reason:
          draftEditReason.trim() ||
          "Giáo viên điều chỉnh câu hỏi sát hoàn cảnh học sinh.",
      }
    );
    setEditingId(null);
    setDraftEditReason("");
  };

  const saveEncouragement = (m: AIMessage) => {
    const cleanEnc = draftEncouragement.trim();
    if (!cleanEnc) return;
    onUpdateMessage(
      {
        ...m,
        teacherEncouragement: cleanEnc,
        status: m.status === "chờ duyệt" ? "giữ nguyên" : m.status,
        visibleToStudent: true,
      },
      {
        action: "thêm lời động viên",
        editedReply: cleanEnc,
        reason: "Bổ sung lời động viên trực tiếp của giáo viên.",
      }
    );
    setEncouragementOpenId(null);
    setDraftEncouragement("");
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg sm:text-xl font-bold">
            Kiểm duyệt Trợ lí AI &amp; Lịch sử an toàn
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Mọi câu hỏi AI đều qua bộ lọc an toàn 2 lớp và được lưu nhật ký kiểm duyệt. Giáo viên có toàn quyền giữ nguyên, chỉnh sửa hoặc chuyển tư vấn trực tiếp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div
            role="group"
            aria-label="Chuyển giữa hàng chờ duyệt và lịch sử kiểm duyệt"
            className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800"
          >
            <button
              type="button"
              onClick={() => setSubView("queue")}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                subView === "queue"
                  ? "bg-white dark:bg-[#17222C] text-[#1D242B] dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Hàng chờ duyệt ({messages.length})
            </button>
            <button
              type="button"
              onClick={() => setSubView("history")}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                subView === "history"
                  ? "bg-white dark:bg-[#17222C] text-[#1D242B] dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử kiểm duyệt ({logs.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleRequireApproval}
            className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
              requireApprovalBeforeDisplay
                ? "bg-[#EFCFE3]/60 dark:bg-[#E27396]/25 border-[#E27396] text-[#4A1A2C] dark:text-[#EFCFE3]"
                : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-300 dark:border-slate-700"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>
              Duyệt trước khi hiển thị:{" "}
              {requireApprovalBeforeDisplay ? "ĐANG BẬT" : "Đang tắt"}
            </span>
          </button>
        </div>
      </section>

      {subView === "history" ? (
        <AIModerationHistory logs={logs} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: `Tất cả (${messages.length})` },
              {
                id: "pending",
                label: `Chờ duyệt (${
                  messages.filter((m) => m.status === "chờ duyệt").length
                })`,
              },
              {
                id: "sensitive",
                label: `Cần chú ý nhạy cảm (${
                  messages.filter((m) => m.nhayCam).length
                })`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setFilterStatus(tab.id as "all" | "pending" | "sensitive")
                }
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                  filterStatus === tab.id
                    ? "bg-[#B3DEE2] dark:bg-[#B3DEE2]/20 border-[#63AEB6] text-[#133C42] dark:text-white"
                    : "bg-white dark:bg-[#17222C] border-slate-200 dark:border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-[#17222C] border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Không có mục nào trong danh sách này.
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((m) => (
                <article
                  key={m.id}
                  className={`bg-white dark:bg-[#17222C] rounded-2xl p-5 sm:p-6 border space-y-4 ${
                    m.nhayCam
                      ? "border-rose-500 dark:border-rose-400 bg-rose-50/40 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-sm text-[#1D242B] dark:text-white">
                        {m.studentName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{m.createdAt}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize font-medium">{m.status}</span>
                      {m.loaiCauHoi && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#133C42] dark:text-[#B3DEE2] font-semibold">
                            {QUESTION_TYPE_LABELS[m.loaiCauHoi]}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {m.layer1Triggered && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 text-xs font-bold">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Đã chặn ở Lớp 1 (không gọi AI)</span>
                        </span>
                      )}
                      {m.layer2Filtered && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#EFCFE3]/70 text-[#4A1A2C] text-xs font-bold">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Bộ lọc Lớp 2 đã thay thế</span>
                        </span>
                      )}
                      {m.nhayCam && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Báo đỏ: nội dung nhạy cảm, cần gặp trực tiếp</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                    <div className="p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Học sinh vừa viết
                      </p>
                      <p className="leading-relaxed">{m.studentText}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#B3DEE2]/20 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2]/60 dark:border-slate-700 space-y-1">
                      <p className="text-xs font-semibold text-[#133C42] dark:text-[#B3DEE2]">
                        {m.status === "giáo viên đã sửa" && m.teacherEditedReply
                          ? "Phiên bản giáo viên đã sửa"
                          : "Câu hỏi gợi mở từ Trợ lí"}
                      </p>
                      <p className="leading-relaxed">
                        {m.status === "giáo viên đã sửa" && m.teacherEditedReply
                          ? m.teacherEditedReply
                          : m.aiReply}
                      </p>
                      {m.layer2Filtered && m.originalAiReply && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/70 dark:border-slate-700">
                          <strong>Bản gốc AI bị Lớp 2 chặn ({m.layer2Reason}):</strong>{" "}
                          {m.originalAiReply}
                        </p>
                      )}
                    </div>
                  </div>

                  {m.dauHieu && (
                    <p className="text-xs sm:text-sm text-[#9D2950] dark:text-[#EA9AB2] font-medium">
                      Dấu hiệu cần chú ý: {m.dauHieu}
                    </p>
                  )}

                  {m.teacherEncouragement && (
                    <p className="text-sm text-[#223A1E] dark:text-[#EAF2D7] bg-[#EAF2D7]/50 dark:bg-[#EAF2D7]/10 p-3 rounded-xl">
                      <span className="font-semibold">
                        Lời động viên đã thêm:{" "}
                      </span>
                      {m.teacherEncouragement}
                    </p>
                  )}

                  {editingId === m.id && (
                    <div className="space-y-2.5 pt-2 p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800">
                      <label className="block text-xs font-semibold">
                        Nội dung phản hồi sau chỉnh sửa:
                      </label>
                      <textarea
                        rows={3}
                        value={draftReply}
                        onChange={(e) => setDraftReply(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] p-3 text-sm"
                      />
                      <input
                        type="text"
                        aria-label="Lí do chỉnh sửa để lưu nhật ký kiểm duyệt"
                        value={draftEditReason}
                        onChange={(e) => setDraftEditReason(e.target.value)}
                        placeholder="Lí do chỉnh sửa (tùy chọn, lưu vào Lịch sử kiểm duyệt)..."
                        className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-3 py-2 text-xs sm:text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(m)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-xs font-semibold cursor-pointer"
                        >
                          Lưu bản sửa (hiển thị cho HS)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}

                  {encouragementOpenId === m.id && (
                    <div className="space-y-2 pt-2">
                      <input
                        type="text"
                        aria-label="Viết thêm lời động viên ngắn gửi em"
                        value={draftEncouragement}
                        onChange={(e) => setDraftEncouragement(e.target.value)}
                        placeholder="Viết thêm lời động viên ngắn gửi em..."
                        className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEncouragement(m)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#EAF2D7] text-[#223A1E] text-xs font-semibold cursor-pointer"
                        >
                          Gửi lời động viên
                        </button>
                        <button
                          type="button"
                          onClick={() => setEncouragementOpenId(null)}
                          className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium cursor-pointer"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMessage(
                          {
                            ...m,
                            status: "giữ nguyên",
                            visibleToStudent: true,
                          },
                          {
                            action: "giữ nguyên",
                            reason: "Giáo viên duyệt giữ nguyên câu hỏi AI.",
                          }
                        )
                      }
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#EAF2D7]/70 hover:bg-[#EAF2D7] text-[#223A1E] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Giữ nguyên</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startEdit(m)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-[#E27396] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Sửa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEncouragementOpenId(m.id);
                        setDraftEncouragement(m.teacherEncouragement || "");
                      }}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-[#B3DEE2] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquarePlus className="w-4 h-4" />
                      <span>Thêm lời động viên</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const encText =
                          m.teacherEncouragement ||
                          "Thầy/cô mời em nán lại trao đổi trực tiếp 10 phút sau giờ học để thầy/cô lắng nghe em kĩ hơn nhé.";
                        onUpdateMessage(
                          {
                            ...m,
                            status: "chuyển tư vấn",
                            nhayCam: true,
                            visibleToStudent: true,
                            teacherEncouragement: encText,
                          },
                          {
                            action: "chuyển tư vấn",
                            editedReply: encText,
                            reason:
                              "Giáo viên chuyển sang tư vấn trực tiếp với học sinh.",
                          }
                        );
                      }}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#EFCFE3]/70 hover:bg-[#EA9AB2] text-[#4A1A2C] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <HeartHandshake className="w-4 h-4" />
                      <span>Chuyển tư vấn trực tiếp</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
