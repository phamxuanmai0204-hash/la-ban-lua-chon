import React, { useState } from "react";
import { MeetingRecord, StudentProfileData } from "../types";
import { Calendar, Plus, CheckCircle2 } from "lucide-react";

interface ThreePartyMeetingProps {
  role: "teacher" | "parent";
  meetings: MeetingRecord[];
  students: StudentProfileData[];
  filterStudentId?: string;
  onAddMeeting?: (meeting: MeetingRecord) => void;
  onUpdateMeeting: (meeting: MeetingRecord) => void;
}

export const ThreePartyMeeting: React.FC<ThreePartyMeetingProps> = ({
  role,
  meetings,
  students,
  filterStudentId,
  onAddMeeting,
  onUpdateMeeting,
}) => {
  const [studentId, setStudentId] = useState(filterStudentId ?? students[0]?.id ?? "HS A");
  const [dateTime, setDateTime] = useState("");
  const [locationOrChannel, setLocationOrChannel] = useState("Phòng tư vấn trường THCS");
  const [editingMinutesId, setEditingMinutesId] = useState<string | null>(null);
  const [summaryPoints, setSummaryPoints] = useState("");
  const [agreedChoice, setAgreedChoice] = useState("");
  const [nextNotes, setNextNotes] = useState("");

  const visibleMeetings = filterStudentId
    ? meetings.filter((m) => m.studentId === filterStudentId)
    : meetings;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTime.trim() || !onAddMeeting) return;
    onAddMeeting({
      id: `meet-${Date.now()}`,
      studentId,
      dateTime: dateTime.trim(),
      locationOrChannel: locationOrChannel.trim() || "Phòng tư vấn trường THCS",
      participants: `GVCN lớp 9A1 · Phụ huynh ${studentId} · ${studentId}`,
      parentInvited: true,
      parentAcknowledged: false,
      summaryPoints: "",
      agreedChoice: "",
      nextNotes: "",
    });
    setDateTime("");
  };

  const handleSaveMinutes = (m: MeetingRecord) => {
    onUpdateMeeting({
      ...m,
      summaryPoints,
      agreedChoice,
      nextNotes,
    });
    setEditingMinutesId(null);
  };

  return (
    <div className="space-y-6">
      {role === "teacher" && onAddMeeting && (
        <section className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#1F3A5F] dark:text-slate-100">
              Tạo lịch họp ba bên (Nhà trường – Gia đình – Học sinh)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Mời phụ huynh và học sinh cùng ngồi lại trao đổi, xem nhận xét năng lực và thống nhất lộ trình.
            </p>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="meet-student" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Học sinh
              </label>
              <select
                id="meet-student"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} {s.isFocusGroup ? "(Nhóm trọng tâm)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="meet-datetime" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Thời gian dự kiến
              </label>
              <input
                id="meet-datetime"
                type="text"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                placeholder="Ví dụ: 30/11/2026 · 15:30"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
              />
            </div>

            <div>
              <label htmlFor="meet-loc" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Địa điểm / Hình thức
              </label>
              <input
                id="meet-loc"
                type="text"
                value={locationOrChannel}
                onChange={(e) => setLocationOrChannel(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={!dateTime.trim()}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#E0A030] hover:bg-[#d19225] disabled:opacity-50 text-[#14263E] text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo lịch & Gửi lời mời phụ huynh</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Meetings List */}
      <div className="space-y-4">
        {visibleMeetings.length === 0 ? (
          <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Chưa có lịch họp ba bên nào được tạo cho hồ sơ này.
          </div>
        ) : (
          visibleMeetings.map((m) => {
            const isEditing = editingMinutesId === m.id;
            return (
              <div
                key={m.id}
                className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#1F3A5F] dark:text-slate-100">
                      <Calendar className="w-4 h-4 text-[#2A7F7F] dark:text-[#6EE7E7]" />
                      <span>
                        Cuộc họp ba bên · {m.studentId} · {m.dateTime}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {m.locationOrChannel} · {m.participants}
                    </p>
                  </div>

                  <div>
                    {m.parentAcknowledged ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A7F7F] dark:text-[#6EE7E7]">
                        <CheckCircle2 className="w-4 h-4" /> Phụ huynh đã xác nhận tham gia
                      </span>
                    ) : role === "parent" ? (
                      <button
                        type="button"
                        onClick={() => onUpdateMeeting({ ...m, parentAcknowledged: true })}
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#E0A030] hover:bg-[#d19225] text-[#14263E] text-xs font-semibold cursor-pointer"
                      >
                        Xác nhận tham gia họp
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Đã mời phụ huynh (chờ xác nhận)
                      </span>
                    )}
                  </div>
                </div>

                {/* Minutes */}
                {isEditing ? (
                  <div className="space-y-3 bg-[#F7F9FB] dark:bg-slate-800/60 p-4 rounded-xl">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Ý chính đã trao đổi
                      </label>
                      <textarea
                        rows={2}
                        value={summaryPoints}
                        onChange={(e) => setSummaryPoints(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Lựa chọn thống nhất của ba bên
                      </label>
                      <input
                        type="text"
                        value={agreedChoice}
                        onChange={(e) => setAgreedChoice(e.target.value)}
                        className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Việc tiếp theo
                      </label>
                      <input
                        type="text"
                        value={nextNotes}
                        onChange={(e) => setNextNotes(e.target.value)}
                        className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingMinutesId(null)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs cursor-pointer"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveMinutes(m)}
                        className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#2A7F7F] text-white text-xs font-semibold cursor-pointer"
                      >
                        Lưu biên bản ngắn
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-500 dark:text-slate-400">Biên bản ý chính:</span>{" "}
                      <span className="text-[#14263E] dark:text-slate-100">
                        {m.summaryPoints || "Chưa ghi biên bản (cập nhật sau buổi họp)."}
                      </span>
                    </p>
                    {m.agreedChoice && (
                      <p>
                        <span className="text-slate-500 dark:text-slate-400">Lựa chọn thống nhất:</span>{" "}
                        <strong className="text-[#2A7F7F] dark:text-[#6EE7E7]">{m.agreedChoice}</strong>
                      </p>
                    )}
                    {m.nextNotes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Ghi chú tiếp theo: {m.nextNotes}
                      </p>
                    )}

                    {role === "teacher" && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMinutesId(m.id);
                            setSummaryPoints(m.summaryPoints);
                            setAgreedChoice(m.agreedChoice);
                            setNextNotes(m.nextNotes);
                          }}
                          className="text-xs font-semibold text-[#1F3A5F] dark:text-[#F0B44A] underline underline-offset-4 cursor-pointer"
                        >
                          {m.summaryPoints ? "Chỉnh sửa biên bản" : "Ghi biên bản ngắn"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
