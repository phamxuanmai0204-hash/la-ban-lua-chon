import React from "react";
import { Bot, CheckCircle2, Send } from "lucide-react";
import type { StudentSummary } from "../../types";

interface StudentSummaryReportProps {
  summary: StudentSummary;
  audience: "student" | "teacher" | "parent";
}

const AUDIENCE_NOTE: Record<StudentSummaryReportProps["audience"], string> = {
  student:
    "Hồ sơ tổng hợp được AI biên soạn khi em hoàn thành cả 5 bước và gửi tới giáo viên, phụ huynh của em.",
  teacher:
    "Hồ sơ tổng hợp do AI biên soạn tự động từ hành trình của học sinh, gửi tới tài khoản giáo viên khi em hoàn thành 5 bước.",
  parent:
    "Hồ sơ tổng hợp do AI biên soạn tự động từ hành trình của con, gửi tới tài khoản phụ huynh khi con hoàn thành 5 bước.",
};

export const StudentSummaryReport: React.FC<StudentSummaryReportProps> = ({
  summary,
  audience,
}) => {
  return (
    <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFCFE3]/60 dark:bg-[#EFCFE3]/15 flex items-center justify-center text-[#9D2950] dark:text-[#EFCFE3] shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              Hồ sơ tổng hợp hành trình
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {AUDIENCE_NOTE[audience]}
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
          Biên soạn: {summary.generatedAt}
        </span>
      </div>

      <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-sm">
        <p className="text-xs font-bold text-[#133C42] dark:text-[#B3DEE2]">
          (a) Định danh &amp; lớp
        </p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">Họ tên: </span>
          <strong>{summary.identity.fullName}</strong>
          {" · "}
          <span className="text-slate-500 dark:text-slate-400">Lớp: </span>
          <strong>{summary.identity.className}</strong>
        </p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">
            Phụ huynh liên hệ:{" "}
          </span>
          {summary.identity.parentContact}
        </p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">
            Giáo viên phụ trách:{" "}
          </span>
          {summary.identity.teacherContact}
        </p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">
            Thời điểm hoàn thành 5 bước:{" "}
          </span>
          <span className="tabular-nums font-semibold">
            {summary.identity.completedAt}
          </span>
        </p>
      </div>

      <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-2 text-sm">
        <p className="text-xs font-bold text-[#133C42] dark:text-[#B3DEE2]">
          (b) Soi chiếu bản thân
        </p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">
            Năng lực/điểm mạnh:{" "}
          </span>
          {summary.selfProfile.strengths}
        </p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">Lưu ý: </span>
          {summary.selfProfile.teacherNote}
        </p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">Holland: </span>
          {summary.selfProfile.holland}
        </p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">
            Điều kiện gia đình/đi lại/tự lập:{" "}
          </span>
          {summary.selfProfile.conditions}
        </p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">
            Dấu hiệu dao động/FOBO:{" "}
          </span>
          {summary.selfProfile.fluctuation}
        </p>
      </div>

      <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-2 text-sm">
        <p className="text-xs font-bold text-[#133C42] dark:text-[#B3DEE2]">
          (c) Chi tiết 5 bước
        </p>
        <p>
          <span className="font-semibold">THU: </span>
          {summary.steps.thu}
        </p>
        <p>
          <span className="font-semibold">LỌC: </span>
          {summary.steps.loc}
        </p>
        <p>
          <span className="font-semibold">THỬ: </span>
          {summary.steps.thuTry}
        </p>
        <p>
          <span className="font-semibold">CHỐT: </span>
          {summary.steps.chot}
        </p>
        <p>
          <span className="font-semibold">CAM KẾT: </span>
          {summary.steps.camKet}
        </p>
      </div>

      <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-sm">
        <p className="text-xs font-bold text-[#133C42] dark:text-[#B3DEE2]">
          (d) Tóm tắt tương tác AI
        </p>
        <p>{summary.aiInteraction}</p>
      </div>

      <div className="p-4 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-sm">
        <p className="text-xs font-bold text-[#133C42] dark:text-[#B3DEE2]">
          (e) Đánh giá mức độ sẵn sàng &amp; tín hiệu cần lưu ý
        </p>
        <p className="leading-relaxed">{summary.readiness}</p>
      </div>

      <div className="p-4 rounded-xl bg-[#EAF2D7]/55 dark:bg-[#EAF2D7]/10 border border-[#8FB37C] space-y-1.5 text-sm">
        <p className="text-xs font-bold text-[#223A1E] dark:text-[#EAF2D7] flex items-center gap-1.5">
          <Send className="w-3.5 h-3.5" />
          (f) Trạng thái gửi &amp; xác nhận
        </p>
        <p className="text-slate-800 dark:text-slate-100">
          {summary.sendStatus}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-300 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {summary.sentToParentAt
            ? "Đã gửi tới cả tài khoản giáo viên và phụ huynh"
            : "Đã gửi tới giáo viên; phụ huynh sẽ nhận khi học sinh bật chia sẻ"}
        </p>
      </div>
    </section>
  );
};
