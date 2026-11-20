import React, { useState } from "react";
import { PathwayItem, StudentProfileData } from "../types";
import { formatNowVi } from "../services/storage";
import { CalendarClock, CheckSquare, Square, FileCheck2, RefreshCw, Plus } from "lucide-react";

interface CommitFormProps {
  student: StudentProfileData;
  pathways: PathwayItem[];
  onUpdateStudent: (updated: StudentProfileData, eventNote?: { type: "lock" | "change_after_lock"; newLabel: string }) => void;
}

export const CommitForm: React.FC<CommitFormProps> = ({
  student,
  pathways,
  onUpdateStudent,
}) => {
  const [newTaskText, setNewTaskText] = useState("");
  const [changingAfterLock, setChangingAfterLock] = useState(false);
  const [pendingNewPathwayId, setPendingNewPathwayId] = useState(student.commitment.chosenPathwayId || pathways[0]?.id || "");
  const [pendingNewLabel, setPendingNewLabel] = useState("");
  const [confirmCheckCriteria, setConfirmCheckCriteria] = useState(false);

  const c = student.commitment;

  // Check gentle deadline reminder (within 7 days or past)
  const isNearDeadline = (() => {
    if (!c.deadlineDate || student.hasLockedChoice) return false;
    const target = new Date(c.deadlineDate).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 14;
  })();

  const toggleTask = (taskId: string) => {
    const nextPlan = c.actionPlan.map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    onUpdateStudent({
      ...student,
      commitment: { ...c, actionPlan: nextPlan },
    });
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    onUpdateStudent({
      ...student,
      commitment: {
        ...c,
        actionPlan: [...c.actionPlan, { id: `act-${Date.now()}`, text: trimmed, done: false }],
      },
    });
    setNewTaskText("");
  };

  const handleLockChoice = () => {
    if (!c.chosenOptionLabel.trim() || !c.reasonInOwnWords.trim()) return;
    const nowStr = formatNowVi();
    onUpdateStudent(
      {
        ...student,
        hasLockedChoice: true,
        currentStep: "CAM KẾT",
        commitment: {
          ...c,
          studentConfirmedAt: nowStr,
        },
      },
      { type: "lock", newLabel: c.chosenOptionLabel }
    );
  };

  const handleApplyChangeAfterLock = () => {
    if (!pendingNewLabel.trim() || !confirmCheckCriteria) return;
    const nowStr = formatNowVi();
    onUpdateStudent(
      {
        ...student,
        currentStep: "CAM KẾT",
        commitment: {
          ...c,
          chosenPathwayId: pendingNewPathwayId,
          chosenOptionLabel: pendingNewLabel.trim(),
          studentConfirmedAt: nowStr,
          parentConfirmedAt: undefined,
          teacherConfirmedAt: undefined,
        },
      },
      { type: "change_after_lock", newLabel: pendingNewLabel.trim() }
    );
    setChangingAfterLock(false);
    setPendingNewLabel("");
    setConfirmCheckCriteria(false);
  };

  return (
    <div className="space-y-6">
      {/* Gentle deadline reminder banner (non-pressuring) */}
      {isNearDeadline && (
        <div className="bg-[#E0A030]/12 border border-[#E0A030]/45 rounded-2xl p-4 flex items-start gap-3">
          <CalendarClock className="w-5 h-5 text-[#9a6708] dark:text-[#F0B44A] shrink-0 mt-0.5" />
          <p className="text-sm text-[#14263E] dark:text-slate-100 leading-relaxed">
            Nhắc nhẹ nhàng: Hạn chốt em tự đặt là <strong>{c.deadlineDate}</strong> (trước buổi họp ba bên). Em đã có đủ thông tin để viết lí do chọn bằng lời của mình chưa?
          </p>
        </div>
      )}

      {/* Deadline & Chosen Option + Reason */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
            Bước CHỐT · Viết lí do và lập kế hoạch ngắn hạn
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Chốt một phương án đủ tốt giúp em tập trung chuẩn bị, thay vì giữ mọi cửa mà chưa chuẩn bị cho cửa nào.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="commit-deadline" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              Hạn chốt em tự đặt (gợi ý: trước buổi họp ba bên)
            </label>
            <input
              id="commit-deadline"
              type="date"
              value={c.deadlineDate}
              onChange={(e) =>
                onUpdateStudent({
                  ...student,
                  commitment: { ...c, deadlineDate: e.target.value },
                })
              }
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-[#14263E] dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="commit-pathway" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              Nhóm lộ trình em chọn
            </label>
            <select
              id="commit-pathway"
              disabled={student.hasLockedChoice}
              value={c.chosenPathwayId}
              onChange={(e) => {
                const pw = pathways.find((p) => p.id === e.target.value);
                onUpdateStudent({
                  ...student,
                  commitment: {
                    ...c,
                    chosenPathwayId: e.target.value,
                    chosenOptionLabel: c.chosenOptionLabel || pw?.shortTitle || "",
                  },
                });
              }}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-[#14263E] dark:text-slate-100 disabled:opacity-70"
            >
              <option value="">-- Chọn nhánh lộ trình --</option>
              {pathways.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.shortTitle}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="commit-label" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Lựa chọn cụ thể của em
          </label>
          <input
            id="commit-label"
            type="text"
            disabled={student.hasLockedChoice}
            value={c.chosenOptionLabel}
            onChange={(e) =>
              onUpdateStudent({
                ...student,
                commitment: { ...c, chosenOptionLabel: e.target.value },
              })
            }
            placeholder="Ví dụ: Trung cấp nghề Điện (kết hợp văn hóa) hoặc THPT gần nhà..."
            className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-[#14263E] dark:text-slate-100 disabled:opacity-70"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="commit-reason" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Lí do em chọn – viết bằng lời của em (bắt buộc trước khi chốt)
          </label>
          <textarea
            id="commit-reason"
            rows={3}
            disabled={student.hasLockedChoice}
            value={c.reasonInOwnWords}
            onChange={(e) =>
              onUpdateStudent({
                ...student,
                commitment: { ...c, reasonInOwnWords: e.target.value },
              })
            }
            placeholder="Em chọn hướng đi này vì nó đáp ứng các tiêu chí của em như..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3.5 text-sm text-[#14263E] dark:text-slate-100 disabled:opacity-70"
          />
        </div>
      </section>

      {/* Action Plan */}
      <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-base font-bold text-[#1F3A5F] dark:text-slate-100">
          Kế hoạch hành động ngắn hạn của em
        </h3>

        <div className="space-y-2">
          {c.actionPlan.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => toggleTask(task.id)}
              className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FB] dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer min-h-[44px]"
            >
              {task.done ? (
                <CheckSquare className="w-5 h-5 text-[#2A7F7F] dark:text-[#6EE7E7] shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 shrink-0" />
              )}
              <span
                className={`text-sm ${
                  task.done
                    ? "line-through text-slate-500 dark:text-slate-400"
                    : "text-[#14263E] dark:text-slate-100"
                }`}
              >
                {task.text}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Thêm việc cần làm (ví dụ: ôn tập Toán, hỏi hồ sơ tuyển sinh)..."
            className="flex-1 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-[#14263E] dark:text-slate-100"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#1F3A5F] dark:border-slate-500 text-[#1F3A5F] dark:text-slate-100 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm việc</span>
          </button>
        </form>
      </section>

      {/* Electronic Commitment Form */}
      <section className="bg-white dark:bg-[#182334] border-2 border-[#1F3A5F]/25 dark:border-[#2A7F7F]/50 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-[#2A7F7F] dark:text-[#6EE7E7]" />
            <h3 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
              Phiếu cam kết điện tử (Bước CAM KẾT)
            </h3>
          </div>
          {student.hasLockedChoice && (
            <button
              type="button"
              onClick={() => setChangingAfterLock((v) => !v)}
              className="text-xs font-semibold text-[#1F3A5F] dark:text-[#F0B44A] underline underline-offset-4 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Em muốn cân nhắc đổi lựa chọn</span>
            </button>
          )}
        </div>

        {/* Non-blocking Change After Lock Prompt */}
        {changingAfterLock && (
          <div className="rounded-xl bg-[#E0A030]/12 border border-[#E0A030]/45 p-4 space-y-3">
            <p className="text-sm font-bold text-[#1F3A5F] dark:text-slate-100">
              “Phương án mới có đáp ứng các tiêu chí em đã tự đặt không?”
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Tiêu chí của em: {student.criteria.length > 0 ? student.criteria.join(" · ") : "Chưa đặt tiêu chí"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={pendingNewPathwayId}
                onChange={(e) => setPendingNewPathwayId(e.target.value)}
                className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
              >
                {pathways.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.shortTitle}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={pendingNewLabel}
                onChange={(e) => setPendingNewLabel(e.target.value)}
                placeholder="Nhập phương án mới cụ thể..."
                className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
              />
            </div>
            <label className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmCheckCriteria}
                onChange={(e) => setConfirmCheckCriteria(e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <span>Em đã tự đối chiếu phương án mới với các tiêu chí đủ tốt của mình và muốn cập nhật phiếu cam kết.</span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setChangingAfterLock(false)}
                className="min-h-[40px] px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-medium cursor-pointer"
              >
                Giữ lựa chọn cũ
              </button>
              <button
                type="button"
                disabled={!pendingNewLabel.trim() || !confirmCheckCriteria}
                onClick={handleApplyChangeAfterLock}
                className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#1F3A5F] text-white disabled:opacity-50 text-xs font-semibold cursor-pointer"
              >
                Cập nhật lựa chọn mới
              </button>
            </div>
          </div>
        )}

        {/* Commitment Summary */}
        <div className="rounded-xl bg-[#F7F9FB] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-2.5 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <p>
              <span className="text-slate-500 dark:text-slate-400">Học sinh (kí hiệu):</span>{" "}
              <strong className="text-[#1F3A5F] dark:text-slate-100">{c.studentDisplayName}</strong>
            </p>
            <p>
              <span className="text-slate-500 dark:text-slate-400">Lớp:</span>{" "}
              <strong className="text-[#1F3A5F] dark:text-slate-100">{c.className}</strong>
            </p>
          </div>
          <p>
            <span className="text-slate-500 dark:text-slate-400">Lựa chọn của em:</span>{" "}
            <strong className="text-[#2A7F7F] dark:text-[#6EE7E7]">
              {c.chosenOptionLabel || "Chưa điền lựa chọn"}
            </strong>
          </p>
          <p>
            <span className="text-slate-500 dark:text-slate-400">Lí do em chọn:</span>{" "}
            <span className="text-[#14263E] dark:text-slate-100">
              {c.reasonInOwnWords || "Chưa viết lí do bằng lời của em"}
            </span>
          </p>
        </div>

        {/* 3-Party Confirmations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-1">
            <p className="font-semibold text-[#1F3A5F] dark:text-slate-100">1. Học sinh</p>
            {c.studentConfirmedAt ? (
              <p className="text-xs text-[#2A7F7F] dark:text-[#6EE7E7] font-medium">
                Đã xác nhận · {c.studentConfirmedAt}
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">Chưa bấm xác nhận chốt</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-1">
            <p className="font-semibold text-[#1F3A5F] dark:text-slate-100">2. Phụ huynh</p>
            {c.parentConfirmedAt ? (
              <p className="text-xs text-[#2A7F7F] dark:text-[#6EE7E7] font-medium">
                Đã xác nhận · {c.parentConfirmedAt}
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">Chờ xác nhận ở góc Phụ huynh</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-1">
            <p className="font-semibold text-[#1F3A5F] dark:text-slate-100">3. Giáo viên chủ nhiệm</p>
            {c.teacherConfirmedAt ? (
              <p className="text-xs text-[#2A7F7F] dark:text-[#6EE7E7] font-medium">
                Đã xác nhận · {c.teacherConfirmedAt}
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">Chờ xác nhận ở bảng Giáo viên</p>
            )}
          </div>
        </div>

        {!student.hasLockedChoice && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cần điền đủ lựa chọn và lí do bằng lời của em trước khi kí cam kết.
            </p>
            <button
              type="button"
              disabled={!c.chosenOptionLabel.trim() || !c.reasonInOwnWords.trim()}
              onClick={handleLockChoice}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#E0A030] hover:bg-[#d19225] disabled:opacity-50 text-[#14263E] text-sm font-bold cursor-pointer"
            >
              Chốt lựa chọn & Kí phiếu cam kết
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
