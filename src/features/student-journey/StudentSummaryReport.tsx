import React from "react";
import {
  Bot,
  BookOpen,
  Calendar,
  CheckCircle2,
  Compass,
  MapPin,
  PenLine,
  Send,
  Sparkles,
} from "lucide-react";
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
        {summary.selfProfile.mbti && (
          <p>
            <span className="text-slate-500 dark:text-slate-400">
              Xu hướng MBTI gợi ý:{" "}
            </span>
            {summary.selfProfile.mbti}
          </p>
        )}
        {summary.selfProfile.interestAnalysis && (
          <div className="rounded-xl border border-[#EFCFE3] dark:border-slate-700 bg-[#FDF7FA] dark:bg-[#0F171E] p-3.5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold text-[#9D2950] dark:text-[#EA9AB2]">
                Kết quả trắc nghiệm khám phá bản thân (20 câu)
              </p>
              <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-[#17222C] text-[10px] font-semibold text-slate-500 dark:text-slate-300">
                {summary.selfProfile.interestAnalysis.source === "ai"
                  ? "AI phân tích"
                  : "Phân tích dự phòng khi AI chưa kết nối"}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                1. Đặc điểm tính cách &amp; cách tư duy nổi bật (MBTI)
              </p>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {summary.selfProfile.interestAnalysis.personality}
              </p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                2. Nhóm sở thích &amp; hứng thú nghề nghiệp nổi trội (Holland)
              </p>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {summary.selfProfile.interestAnalysis.interests}
              </p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                3. Gợi mở môi trường học tập &amp; hướng khám phá tiếp theo
              </p>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {summary.selfProfile.interestAnalysis.environment}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Hoàn thành lúc: {summary.selfProfile.interestAnalysis.completedAt}
            </p>
          </div>
        )}
        <p>
          <span className="text-slate-500 dark:text-slate-400">
            Điều kiện gia đình/đi lại/tự lập:{" "}
          </span>
          {summary.selfProfile.conditions}
        </p>
        <p>
          <span className="text-slate-500 dark:text-slate-400">
            {audience === "teacher"
              ? "Dấu hiệu dao động/FOBO: "
              : "Dấu hiệu dao động/do dự: "}
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
        <div className="rounded-xl border border-[#EFCFE3] bg-[#EFCFE3]/20 dark:bg-[#EFCFE3]/10 dark:border-[#EFCFE3]/40 p-3.5 space-y-3">
          <p>
            <span className="font-semibold">THỬ: </span>
            {summary.steps.thuTry}
          </p>

          {summary.steps.tryDetails && (
            <div className="space-y-3">
              <div className="rounded-lg bg-white/80 dark:bg-[#17222C] border border-slate-200/70 dark:border-slate-800 p-3 space-y-2">
                <p className="text-[11px] font-bold text-[#4A1A2C] dark:text-[#EFCFE3] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  1. Thử một ngày theo lộ trình
                </p>
                {summary.steps.tryDetails.scenarioReflections.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Chưa lưu câu trả lời nào từ phần thử lộ trình.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {summary.steps.tryDetails.scenarioReflections.map(
                      (item, idx) => (
                        <article
                          key={`${item.pathwayTitle}-${item.date}-${idx}`}
                          className="rounded-lg border border-slate-200/70 dark:border-slate-800 bg-[#FAFBFD] dark:bg-[#0F171E] p-2.5 space-y-1.5 text-xs sm:text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-bold text-[#133C42] dark:text-[#B3DEE2]">
                              {item.pathwayTitle}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {item.date}
                            </span>
                          </div>
                          {item.chosenPathLabels.length > 0 && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              Lựa chọn trong tình huống:{" "}
                              {item.chosenPathLabels.join(" → ")}
                            </p>
                          )}
                          <p className="leading-relaxed whitespace-pre-line">
                            {item.reflection || "—"}
                          </p>
                        </article>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-white/80 dark:bg-[#17222C] border border-slate-200/70 dark:border-slate-800 p-3 space-y-2">
                <p className="text-[11px] font-bold text-[#4A1A2C] dark:text-[#EFCFE3] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  2. Hoạt động nhà trường đã đăng kí
                </p>
                {summary.steps.tryDetails.activities.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Em chưa đăng kí hoạt động trải nghiệm nào do nhà trường tổ
                    chức.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {summary.steps.tryDetails.activities.map(
                      (activity, idx) => (
                        <article
                          key={`${activity.title}-${idx}`}
                          className="rounded-lg border border-slate-200/70 dark:border-slate-800 bg-[#FAFBFD] dark:bg-[#0F171E] p-2.5 space-y-1.5 text-xs sm:text-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-bold">{activity.title}</p>
                              <p className="text-[11px] text-[#9D2950] dark:text-[#EA9AB2]">
                                {activity.activityType}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF2D7] text-[#223A1E] px-2 py-0.5 text-[10px] font-bold shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              {activity.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {activity.dateLabel}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {activity.location}
                            </span>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-white/80 dark:bg-[#17222C] border border-slate-200/70 dark:border-slate-800 p-3 space-y-2">
                <p className="text-[11px] font-bold text-[#4A1A2C] dark:text-[#EFCFE3] flex items-center gap-1.5">
                  <PenLine className="w-3.5 h-3.5" />
                  3. Nhật ký thông minh &amp; Phiếu cảm nhận 3 câu
                </p>
                {summary.steps.tryDetails.journalEntries.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic inline-flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Chưa có nhật ký nào ở bước THỬ.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {summary.steps.tryDetails.journalEntries.map(
                      (entry, idx) => (
                        <article
                          key={`${entry.date}-${idx}`}
                          className="rounded-lg border border-slate-200/70 dark:border-slate-800 bg-[#FAFBFD] dark:bg-[#0F171E] p-2.5 space-y-1.5 text-xs sm:text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-[#4A1A2C] dark:text-[#EFCFE3]">
                              {entry.activityType}
                            </span>
                            {entry.pathwayTitle && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{entry.pathwayTitle}</span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{entry.date}</span>
                          </div>

                          {entry.reflection3Q ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div className="rounded-lg bg-white dark:bg-[#17222C] border border-slate-200/60 dark:border-slate-800 p-2">
                                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                  Em thấy gì
                                </p>
                                <p className="mt-0.5 leading-relaxed whitespace-pre-line">
                                  {entry.reflection3Q.saw || "—"}
                                </p>
                              </div>
                              <div className="rounded-lg bg-white dark:bg-[#17222C] border border-slate-200/60 dark:border-slate-800 p-2">
                                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                  Em cảm thấy thế nào
                                </p>
                                <p className="mt-0.5 leading-relaxed whitespace-pre-line">
                                  {entry.reflection3Q.felt || "—"}
                                </p>
                              </div>
                              <div className="rounded-lg bg-white dark:bg-[#17222C] border border-slate-200/60 dark:border-slate-800 p-2">
                                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                  Điều đó có thay đổi suy nghĩ không
                                </p>
                                <p className="mt-0.5 leading-relaxed whitespace-pre-line">
                                  {entry.reflection3Q.changedMind || "—"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="leading-relaxed whitespace-pre-line">
                              {entry.content}
                            </p>
                          )}
                        </article>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-[#EFCFE3]/45 dark:bg-[#EFCFE3]/10 border border-[#EA9AB2]/70 dark:border-[#EA9AB2]/40 p-2.5 text-xs sm:text-sm">
                <p className="font-semibold text-[#4A1A2C] dark:text-[#EFCFE3]">
                  Đối chiếu THỬ với LỌC &amp; CHỐT
                </p>
                <p className="mt-0.5 leading-relaxed">
                  {summary.steps.tryDetails.crossCheck}
                </p>
              </div>
            </div>
          )}
        </div>
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
