import React, { useState } from "react";
import {
  Clock,
  Compass,
  Filter,
  BookOpen,
  Bot,
  Users,
  FileCheck2,
  UserCheck,
} from "lucide-react";
import type { AIMessage, Experience, Meeting, Student } from "../../types";

interface StudentTimelineProps {
  student: Student;
  experiences: Experience[];
  aiMessages: AIMessage[];
  meetings: Meeting[];
}

type TimelineFilter = "all" | "reflection" | "decision" | "support";

interface TimelineEventItem {
  id: string;
  category: Exclude<TimelineFilter, "all">;
  badge: string;
  title: string;
  meta: string;
  detail: string;
  tone: "teal" | "sage" | "pink" | "neutral";
  icon: React.FC<{ className?: string }>;
}

const TONE_CLASS: Record<TimelineEventItem["tone"], string> = {
  teal: "border-[#B3DEE2] bg-[#B3DEE2]/15 text-[#133C42] dark:text-[#B3DEE2]",
  sage: "border-[#8FB37C] bg-[#EAF2D7]/35 text-[#223A1E] dark:text-[#EAF2D7]",
  pink: "border-[#EA9AB2] bg-[#EFCFE3]/25 text-[#4A1A2C] dark:text-[#EFCFE3]",
  neutral:
    "border-slate-200 dark:border-slate-800 bg-[#FAFBFD] dark:bg-[#0F171E] text-slate-700 dark:text-slate-200",
};

export const StudentTimeline: React.FC<StudentTimelineProps> = ({
  student,
  experiences,
  aiMessages,
  meetings,
}) => {
  const [filter, setFilter] = useState<TimelineFilter>("all");

  const studentAI = aiMessages.filter((m) => m.studentId === student.id);
  const studentMeetings = meetings.filter((m) => m.studentId === student.id);

  const events: TimelineEventItem[] = [];

  // 1. Hồ sơ soi chiếu
  events.push({
    id: `tl-profile-${student.id}`,
    category: "reflection",
    badge: "Bước THU · Hồ sơ soi chiếu",
    title: "Hồ sơ năng lực, sở thích và điều kiện gia đình",
    meta: `Nhóm hứng thú: ${student.profile.hollandSummaryText || "Chưa chọn"}`,
    detail: `Em tự nhận: "${student.profile.abilitiesStudentSelf || "Chưa viết"}". Điều kiện đi lại & gia đình: ${student.profile.conditions.commuteDistance}; ${student.profile.conditions.familyFinance}`,
    tone: "teal",
    icon: UserCheck,
  });

  // 2. Các lần đổi phương án & tiêu chí lọc
  const chosenCount = student.consideredOptions.filter(
    (o) => o.status === "Đã chọn"
  ).length;
  const pausedCount = student.consideredOptions.filter(
    (o) => o.status === "Tạm gác lại"
  ).length;
  events.push({
    id: `tl-options-${student.id}`,
    category: "decision",
    badge: "Bước LỌC · Phương án & Tiêu chí",
    title: `${student.criteria.length} tiêu chí cá nhân · ${student.consideredOptions.length} phương án`,
    meta: `Đang chọn: ${chosenCount} · Tạm gác: ${pausedCount} · Số lần đổi ý ghi nhận: ${student.signals.changeOptionCount}`,
    detail:
      student.consideredOptions
        .map((o) => `${o.title} (${o.status})`)
        .join(" | ") || "Chưa đưa phương án nào vào danh sách cân nhắc.",
    tone: "sage",
    icon: Filter,
  });

  // 3. Trải nghiệm THỬ & kịch bản "Một ngày làm nghề"
  if (student.joinedExperienceIds.length > 0) {
    const joinedNames = student.joinedExperienceIds
      .map(
        (eid) => experiences.find((ex) => ex.id === eid)?.title || `Hoạt động ${eid}`
      )
      .join("; ");
    events.push({
      id: `tl-exp-${student.id}`,
      category: "reflection",
      badge: "Bước THỬ · Trải nghiệm thực tế",
      title: `Đã đăng kí ${student.joinedExperienceIds.length} hoạt động trải nghiệm`,
      meta: "Tham quan xưởng / Giao lưu / Tình huống",
      detail: joinedNames,
      tone: "teal",
      icon: Compass,
    });
  }

  (student.scenarioReflections || []).forEach((sr) => {
    events.push({
      id: `tl-sr-${sr.id}`,
      category: "reflection",
      badge: "Bước THỬ · Một ngày làm nghề",
      title: `Thử kịch bản: ${sr.pathwayTitle}`,
      meta: sr.date,
      detail: `Nhánh đã đi: ${sr.chosenPathLabels.join(" -> ") || "Tự khám phá"}. Suy ngẫm của em: "${sr.reflection}"`,
      tone: "teal",
      icon: Compass,
    });
  });

  // 4. Nhật ký lựa chọn
  student.journal.forEach((j) => {
    const extra3Q = j.reflection3Q
      ? ` (Nhìn thấy: ${j.reflection3Q.saw}; Cảm thấy: ${j.reflection3Q.felt}; Đổi suy nghĩ: ${j.reflection3Q.changedMind})`
      : "";
    events.push({
      id: `tl-j-${j.id}`,
      category: "reflection",
      badge: `Nhật ký · ${j.activityType}`,
      title: j.pathwayTitle || "Ghi chép hành trình",
      meta: j.date,
      detail: `${j.content}${extra3Q}`,
      tone: "neutral",
      icon: BookOpen,
    });
  });

  // 5. Phản hồi AI
  studentAI.forEach((m) => {
    events.push({
      id: `tl-ai-${m.id}`,
      category: "support",
      badge: `Trợ lí AI · Trạng thái: ${m.status}`,
      title: m.nhayCam
        ? "Cảnh báo nhạy cảm cần giáo viên chú ý"
        : "Câu hỏi gợi mở từ trợ lí AI",
      meta: `${m.createdAt} · Dấu hiệu: ${m.dauHieu}`,
      detail: `Em viết: "${m.studentText}" -> Phản hồi: "${m.teacherEditedReply || m.aiReply}"`,
      tone: m.nhayCam ? "pink" : "neutral",
      icon: Bot,
    });
  });

  // 6. Họp ba bên
  studentMeetings.forEach((mt) => {
    const confirmedParties = [
      mt.confirmations?.student ? "Học sinh" : null,
      mt.confirmations?.parent ? "Phụ huynh" : null,
      mt.confirmations?.teacher ? "Giáo viên" : null,
    ].filter(Boolean);

    events.push({
      id: `tl-meet-${mt.id}`,
      category: "support",
      badge: `Họp ba bên · ${mt.status}`,
      title: `Lịch hẹn ${mt.dateTime} (${mt.locationOrChannel})`,
      meta:
        confirmedParties.length > 0
          ? `Xác nhận: ${confirmedParties.join(", ")}`
          : "Chờ các bên xác nhận biên bản",
      detail: [
        mt.keyPoints ? `Ý chính: ${mt.keyPoints}` : "",
        mt.agreedChoice ? `Thống nhất: ${mt.agreedChoice}` : "",
        mt.nextSteps ? `Việc tiếp theo: ${mt.nextSteps}` : "",
      ]
        .filter(Boolean)
        .join(" · ") || "Chưa ghi biên bản cuộc họp.",
      tone: "pink",
      icon: Users,
    });
  });

  // 7. Cam kết điện tử
  events.push({
    id: `tl-commit-${student.id}`,
    category: "decision",
    badge: "Bước CHỐT & CAM KẾT",
    title: student.commitment.chosenOption
      ? `Phương án chốt: ${student.commitment.chosenOption}`
      : "Chưa chốt phương án chính thức",
    meta: `Hạn chốt: ${student.commitment.deadlineDate || "Chưa đặt hạn"} · HS: ${student.commitment.studentConfirmedAt || "Chưa kí"} · PH: ${student.commitment.parentConfirmedAt || "Chưa kí"} · GV: ${student.commitment.teacherConfirmedAt || "Chưa kí"}`,
    detail: student.commitment.reasonInOwnWords
      ? `Lí do bằng lời của em: "${student.commitment.reasonInOwnWords}"`
      : "Em chưa viết lí do lựa chọn bằng lời của mình.",
    tone: student.commitment.studentConfirmedAt ? "sage" : "neutral",
    icon: FileCheck2,
  });

  const visibleEvents =
    filter === "all" ? events : events.filter((ev) => ev.category === filter);

  return (
    <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-[#133C42] dark:text-[#B3DEE2]" />
          <div>
            <h3 className="text-base sm:text-lg font-bold">
              Dòng thời gian hành trình đầy đủ ({visibleEvents.length} mốc)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tổng hợp liên thông từ hồ sơ soi chiếu, đổi phương án, trải nghiệm, nhật ký, AI, họp ba bên đến phiếu cam kết.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "all", label: "Tất cả" },
              { id: "reflection", label: "Hồ sơ & Nhật ký" },
              { id: "decision", label: "Phương án & Cam kết" },
              { id: "support", label: "AI & Họp 3 bên" },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilter(btn.id)}
              className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                filter === btn.id
                  ? "bg-[#1D242B] text-white dark:bg-[#B3DEE2] dark:text-[#133C42]"
                  : "bg-slate-100 dark:bg-[#0F171E] text-slate-700 dark:text-slate-300"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <ol className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 pl-5 space-y-3.5">
        {visibleEvents.map((ev) => {
          const Icon = ev.icon;
          return (
            <li key={ev.id} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[29px] top-3 w-4 h-4 rounded-full bg-white dark:bg-[#17222C] border-2 border-[#3A8F98] dark:border-[#B3DEE2]"
              />
              <div className={`p-4 rounded-xl border space-y-1.5 ${TONE_CLASS[ev.tone]}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold inline-flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{ev.badge}</span>
                  </span>
                  <span className="text-xs opacity-80 tabular-nums">{ev.meta}</span>
                </div>
                <p className="text-sm font-bold text-[#1D242B] dark:text-white">
                  {ev.title}
                </p>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {ev.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
