import React, { useMemo, useState } from "react";
import {
  CheckSquare,
  Square,
  CalendarClock,
  FileCheck2,
  Plus,
  RefreshCw,
  AlertCircle,
  Mail,
  ShieldAlert,
  Printer,
  Bell,
} from "lucide-react";
import type { JourneyStep, Student } from "../../types";

interface CommitFormProps {
  student: Student;
  onUpdateStudent: (updated: Student) => void;
  onTriggerAIChangeCheck: (newChoice: string) => Promise<void>;
  onRecognitionMessage: (msg: string) => void;
  onStepCompleted: (step: JourneyStep, message: string) => void;
}

export const CommitForm: React.FC<CommitFormProps> = ({
  student,
  onUpdateStudent,
  onTriggerAIChangeCheck,
  onRecognitionMessage,
  onStepCompleted,
}) => {
  const { commitment } = student;
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [showChangePrompt, setShowChangePrompt] = useState(false);
  const [pendingNewChoice, setPendingNewChoice] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const activeConsidered = student.consideredOptions.filter(
    (o) => o.status !== "Tạm gác lại"
  );

  const isNearDeadline = (() => {
    if (!commitment.deadlineDate || commitment.studentConfirmedAt) return false;
    const target = new Date(commitment.deadlineDate);
    const today = new Date();
    const diffDays = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 7;
  })();

  const dueTasks = useMemo(() => {
    const todayMs = new Date().setHours(0, 0, 0, 0);
    return commitment.actionPlan.filter((t) => {
      if (t.done || !t.dueDate) return false;
      const dMs = new Date(t.dueDate).setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((dMs - todayMs) / (1000 * 60 * 60 * 24));
      return diffDays <= 2;
    });
  }, [commitment.actionPlan]);

  const handleSelectChosenOption = (title: string) => {
    if (
      commitment.studentConfirmedAt &&
      commitment.chosenOption &&
      commitment.chosenOption !== title
    ) {
      setPendingNewChoice(title);
      setShowChangePrompt(true);
      return;
    }

    onUpdateStudent({
      ...student,
      currentStep: student.currentStep === "CAM KẾT" ? "CAM KẾT" : "CHỐT",
      commitment: {
        ...commitment,
        chosenOption: title,
      },
    });
  };

  const handleConfirmChangeAfterCommit = async () => {
    const updated: Student = {
      ...student,
      commitment: {
        ...commitment,
        chosenOption: pendingNewChoice,
        studentConfirmedAt: null,
        parentConfirmedAt: null,
        teacherConfirmedAt: null,
      },
      signals: {
        ...student.signals,
        changeOptionCount: student.signals.changeOptionCount + 1,
        addedAfterCommit: true,
      },
    };
    onUpdateStudent(updated);
    setShowChangePrompt(false);
    await onTriggerAIChangeCheck(pendingNewChoice);
    setPendingNewChoice("");
  };

  const handleToggleTask = (taskId: string) => {
    onUpdateStudent({
      ...student,
      commitment: {
        ...commitment,
        actionPlan: commitment.actionPlan.map((t) =>
          t.id === taskId ? { ...t, done: !t.done } : t
        ),
      },
    });
  };

  const handleAddTask = () => {
    const clean = newTaskTitle.trim();
    if (!clean) return;
    onUpdateStudent({
      ...student,
      commitment: {
        ...commitment,
        actionPlan: [
          ...commitment.actionPlan,
          {
            id: `t-${Date.now()}`,
            title: clean,
            dueDate: newTaskDueDate || undefined,
            done: false,
          },
        ],
      },
    });
    setNewTaskTitle("");
    setNewTaskDueDate("");
  };

  const handleUpdateTaskDueDate = (taskId: string, dueDate: string) => {
    onUpdateStudent({
      ...student,
      commitment: {
        ...commitment,
        actionPlan: commitment.actionPlan.map((t) =>
          t.id === taskId ? { ...t, dueDate: dueDate || undefined } : t
        ),
      },
    });
  };

  const handleStudentConfirmSlip = () => {
    if (!commitment.chosenOption.trim()) {
      setValidationError("Em hãy chọn một phương án trước khi xác nhận nhé.");
      return;
    }
    if (!commitment.reasonInOwnWords.trim()) {
      setValidationError(
        "Em hãy viết lá thư gửi chính mình nêu lí do lựa chọn ở mục 1 trước khi kí cam kết nhé."
      );
      return;
    }
    setValidationError(null);
    const now = new Date().toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    onUpdateStudent({
      ...student,
      currentStep: "CAM KẾT",
      consideredOptions: student.consideredOptions.map((o) =>
        o.title === commitment.chosenOption ? { ...o, status: "Đã chọn" } : o
      ),
      commitment: {
        ...commitment,
        studentConfirmedAt: now,
      },
    });

    onStepCompleted(
      "CHỐT",
      "Em đã tự viết lá thư lí do cho chính mình và chốt phương án rõ ràng."
    );
    onRecognitionMessage(
      "Em đã tự viết được lá thư cho chính mình và kí xác nhận lựa chọn — đây là bước tiến rất vững vàng."
    );
  };

  const handlePrintA4 = () => {
    document.body.classList.add("printing-commitment");
    const cleanup = () => {
      document.body.classList.remove("printing-commitment");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    setTimeout(cleanup, 1000);
  };

  return (
    <div className="space-y-6">
      {isNearDeadline && (
        <div className="no-print bg-[#EFCFE3]/45 dark:bg-[#EFCFE3]/10 border border-[#EA9AB2] dark:border-slate-700 rounded-2xl p-4 flex items-start gap-3">
          <CalendarClock className="w-5 h-5 text-[#9D2950] dark:text-[#EA9AB2] shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold text-[#4A1A2C] dark:text-[#EFCFE3]">
              Nhắc nhẹ về hạn chốt em đã đặt ({commitment.deadlineDate})
            </p>
            <p className="text-slate-700 dark:text-slate-300 mt-0.5">
              Nếu em vẫn còn điều chưa rõ, em có thể xem lại bảng tiêu chí hoặc hẹn nói chuyện nhanh với thầy/cô trước buổi họp ba bên nhé.
            </p>
          </div>
        </div>
      )}

      {dueTasks.length > 0 && (
        <div className="no-print bg-[#B3DEE2]/35 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2] dark:border-slate-700 rounded-2xl p-4 flex items-start gap-3">
          <Bell className="w-5 h-5 text-[#133C42] dark:text-[#B3DEE2] shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold text-[#133C42] dark:text-[#B3DEE2]">
              Nhắc nhẹ kế hoạch ngắn hạn ({dueTasks.length} việc sắp hoặc đã tới hạn)
            </p>
            <ul className="mt-1 space-y-0.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
              {dueTasks.map((t) => (
                <li key={t.id}>
                  · {t.title} (hạn: <span className="tabular-nums font-medium">{t.dueDate}</span>)
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 1.5A: Choose option + Letter to Self + Pre-mortem */}
      <section className="no-print bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              1. Chốt phương án &amp; Thư gửi chính mình
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Tự đặt hạn chốt (gợi ý: trước buổi họp ba bên cùng bố mẹ và thầy/cô).
            </p>
          </div>

          <div className="space-y-1 shrink-0">
            <label
              htmlFor="self-deadline"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Hạn chốt do em đặt
            </label>
            <input
              id="self-deadline"
              type="date"
              value={commitment.deadlineDate}
              onChange={(e) =>
                onUpdateStudent({
                  ...student,
                  commitment: { ...commitment, deadlineDate: e.target.value },
                })
              }
              className="min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E27396]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Phương án em chọn chốt:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeConsidered.map((opt) => {
              const selected = commitment.chosenOption === opt.title;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectChosenOption(opt.title)}
                  className={`text-left p-3.5 rounded-xl border transition-colors min-h-[44px] cursor-pointer ${
                    selected
                      ? "bg-[#EAF2D7]/70 dark:bg-[#EAF2D7]/15 border-[#6E9E63] font-semibold"
                      : "bg-[#FAFBFD] dark:bg-[#0F171E] border-slate-200 dark:border-slate-800 hover:border-[#EA9AB2]"
                  }`}
                >
                  <p className="text-sm">{opt.title}</p>
                </button>
              );
            })}
          </div>

          <div className="pt-1">
            <label
              htmlFor="chosen-option-custom"
              className="block text-xs text-slate-500 dark:text-slate-400 mb-1"
            >
              Hoặc ghi rõ tên phương án cụ thể em muốn chốt:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="chosen-option-custom"
                type="text"
                value={commitment.chosenOption}
                onChange={(e) => {
                  const val = e.target.value;
                  if (
                    commitment.studentConfirmedAt &&
                    val !== commitment.chosenOption
                  ) {
                    setPendingNewChoice(val);
                    setShowChangePrompt(true);
                  } else {
                    onUpdateStudent({
                      ...student,
                      commitment: { ...commitment, chosenOption: val },
                    });
                  }
                }}
                placeholder="Ví dụ: Trung cấp nghề Điện (kết hợp văn hóa THPT)"
                className="flex-1 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
              />
              {commitment.studentConfirmedAt && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingNewChoice("");
                    setShowChangePrompt(true);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Đổi phương án đã chốt</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Display Letter to Self before allowing post-commit change */}
        {showChangePrompt && (
          <div className="p-4 sm:p-5 rounded-xl bg-[#EFCFE3]/45 dark:bg-[#E27396]/15 border border-[#E27396] space-y-3.5">
            <p className="text-sm font-bold text-[#4A1A2C] dark:text-[#EFCFE3]">
              Khoan đã — hãy đọc lại &ldquo;Thư gửi chính mình&rdquo; trước khi đổi ý nhé
            </p>

            {commitment.reasonInOwnWords && (
              <div className="p-3.5 rounded-xl bg-white/90 dark:bg-[#0F171E] border border-[#EA9AB2]/60 dark:border-slate-700 space-y-1">
                <p className="text-xs font-semibold text-[#9D2950] dark:text-[#EA9AB2] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Lá thư em từng viết cho chính mình khi chốt:</span>
                </p>
                <p className="text-sm italic text-slate-800 dark:text-slate-100 leading-relaxed">
                  &ldquo;{commitment.reasonInOwnWords}&rdquo;
                </p>
              </div>
            )}

            <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
              &ldquo;Phương án mới có đáp ứng tốt hơn các tiêu chí em đã tự đặt không?&rdquo; (Em vẫn toàn quyền thay đổi nếu thực sự thấy phù hợp hơn.)
            </p>
            <input
              type="text"
              aria-label="Nhập phương án mới em muốn chuyển sang"
              value={pendingNewChoice}
              onChange={(e) => setPendingNewChoice(e.target.value)}
              placeholder="Nhập phương án mới em muốn chuyển sang..."
              className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F171E] px-3.5 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleConfirmChangeAfterCommit}
                disabled={!pendingNewChoice.trim()}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] disabled:opacity-50 text-[#1D1519] text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Vẫn chuyển sang phương án mới
              </button>
              <button
                type="button"
                onClick={() => setShowChangePrompt(false)}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-xs sm:text-sm font-medium cursor-pointer"
              >
                Giữ nguyên phương án hiện tại
              </button>
            </div>
          </div>
        )}

        {/* Thư gửi chính mình */}
        <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 space-y-2">
          <label
            htmlFor="reason-own-words"
            className="text-sm font-bold flex items-center gap-2 text-[#1D242B] dark:text-white"
          >
            <Mail className="w-4 h-4 text-[#9D2950] dark:text-[#EA9AB2]" />
            <span>
              Thư gửi chính mình – Lí do em chọn hướng đi này (bắt buộc trước khi chốt)
            </span>
          </label>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Hãy viết như một lá thư ngắn gửi cho chính mình để sau này khi dao động, em nhớ lại vì sao hôm nay mình chọn con đường này.
          </p>
          <textarea
            id="reason-own-words"
            rows={3}
            value={commitment.reasonInOwnWords}
            onChange={(e) =>
              onUpdateStudent({
                ...student,
                commitment: { ...commitment, reasonInOwnWords: e.target.value },
              })
            }
            placeholder="Gửi chính mình của vài tháng tới: Hôm nay mình chọn hướng đi này vì..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] p-3.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#E27396]"
          />
        </div>

        {/* Thử nghĩ trước (Pre-mortem) */}
        <div className="p-4 rounded-xl bg-[#B3DEE2]/20 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2] dark:border-slate-700 space-y-2">
          <label
            htmlFor="premortem-input"
            className="text-sm font-bold flex items-center gap-2 text-[#133C42] dark:text-[#B3DEE2]"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>
              Thử nghĩ trước (Chuẩn bị tâm thế cho cam kết bền vững)
            </span>
          </label>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
            &ldquo;Nếu sau này con đường này gặp khó, điều gì có thể xảy ra và em sẽ làm gì?&rdquo;
          </p>
          <textarea
            id="premortem-input"
            rows={2}
            value={commitment.preMortemNote || ""}
            onChange={(e) =>
              onUpdateStudent({
                ...student,
                commitment: { ...commitment, preMortemNote: e.target.value },
              })
            }
            placeholder="Ví dụ: Nếu học thực hành thời gian đầu thấy khó hoặc nghe bạn rủ đổi trường, em sẽ..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F171E] p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#E27396]"
          />
        </div>
      </section>

      {/* 1.5B: Short-term action plan with due dates */}
      <section className="no-print bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold">
            2. Kế hoạch ngắn hạn – Những việc cần làm kèm hạn ngày
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            Chia nhỏ thành từng việc cụ thể có ngày hoàn thành để ứng dụng nhắc nhẹ em khi tới hạn.
          </p>
        </div>

        <div className="space-y-2">
          {commitment.actionPlan.map((task) => (
            <div
              key={task.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800"
            >
              <button
                type="button"
                onClick={() => handleToggleTask(task.id)}
                className="flex items-center gap-3 text-left min-h-[36px] flex-1 cursor-pointer"
              >
                {task.done ? (
                  <CheckSquare className="w-5 h-5 text-[#223A1E] dark:text-[#EAF2D7] shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    task.done
                      ? "line-through text-slate-500 dark:text-slate-400"
                      : "text-slate-800 dark:text-slate-100"
                  }`}
                >
                  {task.title}
                </span>
              </button>

              <div className="flex items-center gap-2 pl-8 sm:pl-0 shrink-0">
                <label
                  htmlFor={`due-${task.id}`}
                  className="text-xs text-slate-500 dark:text-slate-400"
                >
                  Hạn:
                </label>
                <input
                  id={`due-${task.id}`}
                  type="date"
                  value={task.dueDate || ""}
                  onChange={(e) =>
                    handleUpdateTaskDueDate(task.id, e.target.value)
                  }
                  className="min-h-[36px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] px-2.5 py-1 text-xs tabular-nums"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            aria-label="Nội dung việc mới cần làm"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTask();
              }
            }}
            placeholder="Thêm một việc cụ thể cần làm (ví dụ: Hỏi hồ sơ tuyển sinh, ôn Toán...)..."
            className="flex-1 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E27396]"
          />
          <input
            type="date"
            aria-label="Hạn ngày cho việc mới"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
            className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm tabular-nums"
          />
          <button
            type="button"
            onClick={handleAddTask}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] text-[#133C42] text-sm font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm việc</span>
          </button>
        </div>
      </section>

      {/* 1.5C: Electronic & Printable A4 Commitment Slip */}
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF2D7] dark:bg-[#EAF2D7]/15 flex items-center justify-center text-[#223A1E] dark:text-[#EAF2D7]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                3. Phiếu cam kết điện tử &amp; Bản in A4
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Lưu lại lựa chọn chung và có thể in khổ A4 để ba bên cùng kí tay.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrintA4}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] hover:border-[#E27396] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In phiếu cam kết (A4)</span>
          </button>
        </div>

        {/* Printable A4 area */}
        <div
          id="print-commitment-a4"
          className="p-6 sm:p-8 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200 dark:border-slate-800 space-y-5 text-sm"
        >
          <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-4 space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              LA BÀN LỰA CHỌN · HÀNH TRÌNH ĐỊNH HƯỚNG SAU THCS
            </p>
            <h3 className="text-lg sm:text-xl font-bold">
              PHIẾU CAM KẾT LỰA CHỌN &amp; ĐỒNG HÀNH BA BÊN
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Hạn chốt dự kiến:{" "}
              <span className="tabular-nums font-semibold">
                {commitment.deadlineDate || "Chưa đặt"}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Học sinh (Kí hiệu ẩn danh):
              </span>
              <p className="font-semibold">
                {commitment.studentNamePlaceholder} · {student.code}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Lớp:
              </span>
              <p className="font-semibold">{commitment.className}</p>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Hướng đi em đã chọn:
            </span>
            <p className="text-base font-bold text-[#9D2950] dark:text-[#EA9AB2] mt-0.5">
              {commitment.chosenOption || "Chưa chọn phương án"}
            </p>
          </div>

          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Thư gửi chính mình (Lí do lựa chọn bằng lời của em):
            </span>
            <p className="leading-relaxed mt-0.5">
              {commitment.reasonInOwnWords || "Chưa viết thư gửi chính mình"}
            </p>
          </div>

          {commitment.preMortemNote && (
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Phương án dự phòng khi gặp khó khăn (Thử nghĩ trước):
              </span>
              <p className="leading-relaxed mt-0.5">
                {commitment.preMortemNote}
              </p>
            </div>
          )}

          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Kế hoạch ngắn hạn em sẽ thực hiện:
            </span>
            <ul className="list-disc list-inside mt-1 space-y-1">
              {commitment.actionPlan.map((t) => (
                <li key={t.id}>
                  {t.title}
                  {t.dueDate ? ` (Hạn: ${t.dueDate})` : ""}{" "}
                  {t.done ? "— Đã xong" : ""}
                </li>
              ))}
            </ul>
          </div>

          {/* Signatures block formatted nicely for both screen and A4 hand-signing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="p-3.5 rounded-lg bg-white dark:bg-[#17222C] border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs font-bold">HỌC SINH</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                (Kí và ghi rõ họ tên khi in)
              </p>
              <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-700" />
              <p className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                {commitment.studentConfirmedAt || "Chưa xác nhận điện tử"}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-[#17222C] border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs font-bold">PHỤ HUYNH ĐỒNG HÀNH</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                (Kí và ghi rõ họ tên khi in)
              </p>
              <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-700" />
              <p className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                {commitment.parentConfirmedAt || "Chờ phụ huynh xác nhận"}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-white dark:bg-[#17222C] border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs font-bold">GIÁO VIÊN CHỦ NHIỆM</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                (Kí và ghi rõ họ tên khi in)
              </p>
              <div className="h-10 border-b border-dashed border-slate-300 dark:border-slate-700" />
              <p className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                {commitment.teacherConfirmedAt || "Chờ thầy/cô xác nhận"}
              </p>
            </div>
          </div>
        </div>

        {validationError && (
          <div className="no-print p-3.5 rounded-xl bg-[#EFCFE3]/50 dark:bg-[#E27396]/20 border border-[#E27396] text-sm text-[#4A1A2C] dark:text-[#EFCFE3] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="no-print flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handlePrintA4}
            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold inline-flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Xuất / In bản A4 để kí tay</span>
          </button>

          <button
            type="button"
            onClick={handleStudentConfirmSlip}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-semibold cursor-pointer transition-colors"
          >
            {commitment.studentConfirmedAt
              ? "Cập nhật xác nhận của em"
              : "Em xác nhận phiếu cam kết"}
          </button>
        </div>
      </section>
    </div>
  );
};
