import React, { useMemo, useState } from "react";
import { Download, History, ShieldAlert, ShieldCheck, Edit3 } from "lucide-react";
import { exportAIModerationLogsCSV } from "../../services/export";
import type { AIModerationAction, AIModerationLog } from "../../types";

interface AIModerationHistoryProps {
  logs: AIModerationLog[];
}

export const AIModerationHistory: React.FC<AIModerationHistoryProps> = ({
  logs,
}) => {
  const [actionFilter, setActionFilter] = useState<"ALL" | "SAFETY" | "TEACHER">(
    "ALL"
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (actionFilter === "SAFETY") {
        return l.action === "lọc lớp 1" || l.action === "lọc lớp 2";
      }
      if (actionFilter === "TEACHER") {
        return (
          l.action === "giữ nguyên" ||
          l.action === "giáo viên đã sửa" ||
          l.action === "chuyển tư vấn" ||
          l.action === "thêm lời động viên"
        );
      }
      return true;
    });
  }, [logs, actionFilter]);

  const getActionBadge = (action: AIModerationAction) => {
    switch (action) {
      case "lọc lớp 1":
      case "lọc lớp 2":
        return "bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700";
      case "giáo viên đã sửa":
      case "chuyển tư vấn":
        return "bg-[#EFCFE3]/60 dark:bg-[#E27396]/20 text-[#4A1A2C] dark:text-[#EFCFE3] border-[#E27396]";
      case "giữ nguyên":
      case "thêm lời động viên":
        return "bg-[#EAF2D7] dark:bg-[#EAF2D7]/15 text-[#223A1E] dark:text-[#EAF2D7] border-[#8FB37C]";
      default:
        return "bg-[#B3DEE2]/40 dark:bg-[#B3DEE2]/15 text-[#133C42] dark:text-[#B3DEE2] border-[#63AEB6]";
    }
  };

  return (
    <div className="space-y-5">
      <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B3DEE2]/45 dark:bg-[#B3DEE2]/15 flex items-center justify-center text-[#133C42] dark:text-[#B3DEE2] shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              Lịch sử kiểm duyệt AI ({logs.length} bản ghi)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Lưu đầy đủ bản gốc của AI, bản giáo viên đã sửa hoặc bộ lọc an toàn 2 lớp thay thế, kèm người thực hiện, thời điểm và lí do.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={logs.length === 0}
          onClick={() => exportAIModerationLogsCSV(logs)}
          className="min-h-[42px] px-4 py-2 rounded-xl bg-[#B3DEE2] hover:bg-[#9FD3D8] disabled:opacity-50 text-[#133C42] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Xuất CSV kiểm duyệt</span>
        </button>
      </section>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "ALL", label: `Tất cả (${logs.length})` },
          {
            id: "SAFETY",
            label: `Bộ lọc Lớp 1 & Lớp 2 (${
              logs.filter(
                (l) => l.action === "lọc lớp 1" || l.action === "lọc lớp 2"
              ).length
            })`,
          },
          {
            id: "TEACHER",
            label: `Thao tác giáo viên (${
              logs.filter(
                (l) =>
                  l.action !== "tạo mới" &&
                  l.action !== "lọc lớp 1" &&
                  l.action !== "lọc lớp 2"
              ).length
            })`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              setActionFilter(tab.id as "ALL" | "SAFETY" | "TEACHER")
            }
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
              actionFilter === tab.id
                ? "bg-[#B3DEE2] dark:bg-[#B3DEE2]/20 border-[#63AEB6] text-[#133C42] dark:text-white"
                : "bg-white dark:bg-[#17222C] border-slate-200 dark:border-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-[#17222C] border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Chưa có bản ghi kiểm duyệt nào khớp bộ lọc.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <article
              key={log.id}
              className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-sm text-[#1D242B] dark:text-white">
                    {log.studentName}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg border text-xs font-semibold capitalize ${getActionBadge(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Người thực hiện: <strong>{log.actor}</strong>
                  </span>
                </div>

                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {log.timestamp}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div className="p-3 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Nội dung học sinh viết
                  </p>
                  <p className="leading-relaxed">{log.studentText}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAFBFD] dark:bg-[#0F171E] border border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Bản gốc AI / hệ thống</span>
                  </p>
                  <p className="leading-relaxed">{log.originalReply}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#B3DEE2]/15 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2]/50 dark:border-slate-700">
                  <p className="text-xs font-semibold text-[#133C42] dark:text-[#B3DEE2] mb-1 flex items-center gap-1">
                    {log.action === "lọc lớp 1" || log.action === "lọc lớp 2" ? (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    ) : (
                      <Edit3 className="w-3.5 h-3.5" />
                    )}
                    <span>Bản sau sửa / thay thế</span>
                  </p>
                  <p className="leading-relaxed">
                    {log.editedReply || "(Giữ nguyên bản gốc)"}
                  </p>
                </div>
              </div>

              {log.reason && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>Lí do:</strong> {log.reason}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
