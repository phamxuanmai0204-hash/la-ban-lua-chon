import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Plus,
  CheckCircle2,
  Users,
  Sparkles,
  AlertCircle,
  ClipboardPaste,
} from "lucide-react";
import { requestTeacherMeetingAgenda } from "../../services/ai";
import type { Meeting, Student } from "../../types";

interface ThreePartyMeetingProps {
  students: Student[];
  meetings: Meeting[];
  onAddMeeting: (meeting: Meeting) => void;
  onUpdateMeeting: (meeting: Meeting) => void;
}

export const ThreePartyMeeting: React.FC<ThreePartyMeetingProps> = ({
  students,
  meetings,
  onAddMeeting,
  onUpdateMeeting,
}) => {
  const [studentId, setStudentId] = useState(students[0]?.id || "hs-01");
  const [dateTime, setDateTime] = useState("2026-11-26 15:30");
  const [locationOrChannel, setLocationOrChannel] = useState(
    "Phòng tư vấn trường THCS"
  );
  const [parentInvited, setParentInvited] = useState(true);
  const [initialKeyPoints, setInitialKeyPoints] = useState("");
  const [initialNextSteps, setInitialNextSteps] = useState("");

  // AI Meeting Agenda Draft state
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [agendaStudentCode, setAgendaStudentCode] = useState<string>("");
  const [agendaOpening, setAgendaOpening] = useState<string>("");
  const [agendaQuestions, setAgendaQuestions] = useState<string[]>([]);
  const [hasAgendaDraft, setHasAgendaDraft] = useState(false);

  const selectedStudent =
    students.find((s) => s.id === studentId) || students[0];

  const handleGenerateAgenda = async (targetStu?: Student) => {
    const stu = targetStu || selectedStudent;
    if (!stu) return;
    setAgendaError(null);
    setAgendaLoading(true);
    try {
      const res = await requestTeacherMeetingAgenda(stu);
      setAgendaStudentCode(stu.code);
      setAgendaOpening(res.openingNote);
      setAgendaQuestions(res.questions);
      setHasAgendaDraft(true);
    } catch (err) {
      setAgendaError(
        err instanceof Error
          ? err.message
          : "Không gợi ý được chương trình họp ba bên lúc này."
      );
    } finally {
      setAgendaLoading(false);
    }
  };

  const formatAgendaText = () => {
    const lines = [
      agendaOpening ? `Mở đầu: ${agendaOpening}` : "",
      ...agendaQuestions
        .map((q) => q.trim())
        .filter(Boolean)
        .map((q, idx) => `Câu hỏi ${idx + 1}: ${q}`),
    ].filter(Boolean);
    return lines.join("\n");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find((s) => s.id === studentId);
    if (!stu) return;
    onAddMeeting({
      id: `meet-${Date.now()}`,
      studentId: stu.id,
      studentCode: stu.code,
      dateTime,
      locationOrChannel: locationOrChannel.trim() || "Phòng họp lớp",
      parentInvited,
      status: "Đã lên lịch",
      keyPoints: initialKeyPoints.trim(),
      agreedChoice: "",
      nextSteps: initialNextSteps.trim(),
      confirmations: {
        student: false,
        parent: false,
        teacher: true,
      },
    });
    setInitialKeyPoints("");
    setInitialNextSteps("");
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B3DEE2]/50 dark:bg-[#B3DEE2]/15 flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Tạo lịch họp ba bên (Học sinh – Phụ huynh – Giáo viên)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Mẫu biên bản chuẩn: ý chính – lựa chọn thống nhất – việc tiếp theo – xác nhận của ba bên.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={agendaLoading}
            onClick={() => handleGenerateAgenda(selectedStudent)}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] disabled:opacity-50 text-[#133C42] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {agendaLoading
                ? "AI đang soạn gợi ý..."
                : `Gợi ý chương trình họp cho ${selectedStudent?.code || "HS"}`}
            </span>
          </button>
        </div>

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label
              htmlFor="meet-student"
              className="block text-xs font-semibold mb-1"
            >
              Học sinh
            </label>
            <select
              id="meet-student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} ({s.anonymizedLabel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="meet-time"
              className="block text-xs font-semibold mb-1"
            >
              Ngày giờ dự kiến
            </label>
            <input
              id="meet-time"
              type="text"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor="meet-loc"
              className="block text-xs font-semibold mb-1"
            >
              Địa điểm / Hình thức
            </label>
            <input
              id="meet-loc"
              type="text"
              value={locationOrChannel}
              onChange={(e) => setLocationOrChannel(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#E27396] hover:bg-[#EA9AB2] text-[#1D1519] text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo lịch &amp; mời phụ huynh</span>
          </button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Ý chính dự kiến cho buổi họp mới (tùy chọn):
            </label>
            <textarea
              rows={2}
              value={initialKeyPoints}
              onChange={(e) => setInitialKeyPoints(e.target.value)}
              placeholder="Có thể bấm 'Gợi ý chương trình họp' ở góc phải rồi chèn vào đây..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Việc tiếp theo dự kiến (tùy chọn):
            </label>
            <textarea
              rows={2}
              value={initialNextSteps}
              onChange={(e) => setInitialNextSteps(e.target.value)}
              placeholder="Ví dụ: Gia đình và em rà soát lại tiêu chí đi lại trước ngày..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm"
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={parentInvited}
            onChange={(e) => setParentInvited(e.target.checked)}
            className="w-4 h-4 accent-[#E27396]"
          />
          <span>Gửi thông báo lịch họp tới tài khoản Phụ huynh</span>
        </label>

        {agendaError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-700 text-xs sm:text-sm text-rose-800 dark:text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{agendaError}</span>
          </div>
        )}

        {/* Editable AI Meeting Agenda Draft */}
        {hasAgendaDraft && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#EAF2D7]/55 dark:bg-[#EAF2D7]/10 border border-[#8FB37C] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[#223A1E] dark:text-[#EAF2D7]">
                  Bản nháp do AI viết – thầy/cô kiểm tra lại ({agendaStudentCode})
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Thầy/cô chỉnh sửa trực tiếp câu chữ trước khi đưa vào kế hoạch họp hoặc biên bản.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInitialKeyPoints(formatAgendaText())}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#223A1E] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Dùng cho lịch họp mới</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold">
                Lời mở đầu kết nối ba bên:
              </label>
              <textarea
                rows={2}
                value={agendaOpening}
                onChange={(e) => setAgendaOpening(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F171E] p-2.5 text-sm"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold">
                3–4 câu hỏi gợi ý cho giáo viên (sửa trực tiếp):
              </p>
              {agendaQuestions.map((q, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 w-5 shrink-0 tabular-nums">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) =>
                      setAgendaQuestions((prev) =>
                        prev.map((item, i) => (i === idx ? e.target.value : item))
                      )
                    }
                    className="flex-1 min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F171E] px-3 py-1.5 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="space-y-4">
        {meetings.map((m) => {
          const confirmations = m.confirmations || {
            student: false,
            parent: false,
            teacher: false,
          };
          return (
            <article
              key={m.id}
              className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-sm text-[#1D242B] dark:text-white">
                      {m.studentCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3.5 h-3.5" />
                      {m.dateTime}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {m.locationOrChannel}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  {hasAgendaDraft && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMeeting({
                          ...m,
                          keyPoints: m.keyPoints
                            ? `${m.keyPoints}\n\n${formatAgendaText()}`
                            : formatAgendaText(),
                        })
                      }
                      className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[#8FB37C] bg-[#EAF2D7]/60 text-[#223A1E] text-xs font-semibold cursor-pointer"
                    >
                      + Chèn gợi ý AI đã sửa vào biên bản
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateMeeting({
                        ...m,
                        status: m.status === "Đã họp" ? "Đã lên lịch" : "Đã họp",
                      })
                    }
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                      m.status === "Đã họp"
                        ? "bg-[#EAF2D7] text-[#223A1E]"
                        : "bg-[#B3DEE2]/60 text-[#133C42]"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{m.status}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    1. Ý chính buổi trao đổi
                  </label>
                  <textarea
                    rows={4}
                    value={m.keyPoints}
                    onChange={(e) =>
                      onUpdateMeeting({ ...m, keyPoints: e.target.value })
                    }
                    placeholder="Ghi ngắn gọn ý kiến của học sinh, phụ huynh và giáo viên..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    2. Lựa chọn thống nhất
                  </label>
                  <textarea
                    rows={4}
                    value={m.agreedChoice}
                    onChange={(e) =>
                      onUpdateMeeting({ ...m, agreedChoice: e.target.value })
                    }
                    placeholder="Ghi phương án ba bên cùng thống nhất hỗ trợ em thực hiện..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    3. Việc tiếp theo
                  </label>
                  <textarea
                    rows={4}
                    value={m.nextSteps || ""}
                    onChange={(e) =>
                      onUpdateMeeting({ ...m, nextSteps: e.target.value })
                    }
                    placeholder="Việc cụ thể học sinh, phụ huynh và giáo viên cùng làm sau buổi họp..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] p-3 text-sm"
                  />
                </div>
              </div>

              {/* 4. Xác nhận của ba bên */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  4. Xác nhận biên bản của ba bên:
                </span>
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                  {(
                    [
                      { key: "student", label: "Học sinh" },
                      { key: "parent", label: "Phụ huynh" },
                      { key: "teacher", label: "Giáo viên chủ nhiệm" },
                    ] as const
                  ).map((party) => (
                    <label
                      key={party.key}
                      className="inline-flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(confirmations[party.key])}
                        onChange={(e) =>
                          onUpdateMeeting({
                            ...m,
                            confirmations: {
                              ...confirmations,
                              [party.key]: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 accent-[#3A8F98]"
                      />
                      <span>{party.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

