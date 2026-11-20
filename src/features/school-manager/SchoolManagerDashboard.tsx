import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  GraduationCap,
  Moon,
  Settings,
  Sparkles,
  Sun,
  UserCheck,
  Users,
} from "lucide-react";
import { CompassLogo } from "../../components/CompassLogo";
import { AccountMenu } from "../../components/AccountMenu";
import { JOURNEY_STEPS } from "../../data/mockData";
import {
  MAX_CHILDREN_PER_PARENT,
  SCHOOL_CLASSES,
  schoolClassLabel,
  type SchoolRoster,
  type SchoolStats,
} from "../../data/schoolClasses";
import type { AppState, AuthUser, JourneyStep } from "../../types";

interface SchoolManagerDashboardProps {
  appState: AppState;
  roster: SchoolRoster;
  stats: SchoolStats | null;
  account?: AuthUser | null;
  offlineSession?: boolean;
  onLogout?: () => void;
  onExitRole: () => void;
  onToggleDarkMode: () => void;
  onOpenHowAIWorks: () => void;
  onOpenSettings: () => void;
}

const FINAL_JOURNEY_STEP: JourneyStep =
  JOURNEY_STEPS[JOURNEY_STEPS.length - 1].id;

const stepShareColor: Record<JourneyStep, string> = {
  THU: "bg-[#B3DEE2]",
  LỌC: "bg-[#EAF2D7]",
  THỬ: "bg-[#EFCFE3]",
  CHỐT: "bg-[#EA9AB2]",
  "CAM KẾT": "bg-[#E27396]",
};

export const SchoolManagerDashboard: React.FC<SchoolManagerDashboardProps> = ({
  appState,
  roster,
  stats,
  account,
  offlineSession,
  onLogout,
  onExitRole,
  onToggleDarkMode,
  onOpenHowAIWorks,
  onOpenSettings,
}) => {
  const [activeClass, setActiveClass] = useState<string>("ALL");
  const students = appState.students;
  const total = students.length;

  const metrics = useMemo(() => {
    const started = students.filter(
      (s) =>
        (s.completedSteps?.length ?? 0) > 0 || s.currentStep !== "THU"
    ).length;
    const committed = students.filter(
      (s) =>
        s.currentStep === FINAL_JOURNEY_STEP ||
        s.completedSteps?.includes(FINAL_JOURNEY_STEP)
    ).length;
    const needsAttention = students.filter(
      (s) => s.signals?.hasSensitiveAlert || s.signals?.abandonedCommitStep
    ).length;
    const sharedWithParent = students.filter((s) => s.shareWithParent).length;
    const stepCounts = JOURNEY_STEPS.map((step) => ({
      id: step.id,
      label: step.label,
      count: students.filter((s) => s.currentStep === step.id).length,
    }));
    return {
      started,
      committed,
      needsAttention,
      sharedWithParent,
      stepCounts,
      startedPct: total ? Math.round((started / total) * 100) : 0,
      committedPct: total ? Math.round((committed / total) * 100) : 0,
    };
  }, [students, total]);

  const classRows = useMemo(
    () =>
      SCHOOL_CLASSES.map((cls) => {
        const classStudents = students.filter((s) => s.className === cls.id);
        const rosterClass = roster.classes.find((item) => item.id === cls.id);
        const committed = classStudents.filter(
          (s) => s.currentStep === FINAL_JOURNEY_STEP
        ).length;
        const attention = classStudents.filter(
          (s) => s.signals?.hasSensitiveAlert || s.signals?.abandonedCommitStep
        ).length;
        const accounts = rosterClass?.students.filter(
          (s) => s.source === "account"
        ).length ?? 0;
        return {
          id: cls.id,
          label: cls.label,
          total: classStudents.length,
          rosterTotal: rosterClass?.students.length ?? 0,
          accounts,
          committed,
          attention,
          committedPct: classStudents.length
            ? Math.round((committed / classStudents.length) * 100)
            : 0,
        };
      }),
    [students, roster]
  );

  const visibleRows =
    activeClass === "ALL"
      ? classRows
      : classRows.filter((row) => row.id === activeClass);

  const statCards = [
    {
      label: "Lớp trong khối 9",
      value: SCHOOL_CLASSES.length,
      hint: "9A1 – 9A4 đang theo dõi",
      icon: Building2,
      tone: "bg-[#F3E7C9]/70 text-[#5A3A0E]",
    },
    {
      label: "Học sinh",
      value: total,
      hint: `${metrics.started} em đã bắt đầu hành trình (${metrics.startedPct}%)`,
      icon: GraduationCap,
      tone: "bg-[#B3DEE2]/45 text-[#133C42]",
    },
    {
      label: "Giáo viên",
      value: stats?.teachers ?? 0,
      hint: "Tài khoản giáo viên đã đăng ký",
      icon: UserCheck,
      tone: "bg-[#EAF2D7] text-[#223A1E]",
    },
    {
      label: "Phụ huynh",
      value: stats?.parents ?? 0,
      hint: `Liên kết tối đa ${MAX_CHILDREN_PER_PARENT} con mỗi tài khoản`,
      icon: Users,
      tone: "bg-[#EFCFE3]/70 text-[#4A1A2C]",
    },
    {
      label: "Quản lý nhà trường",
      value: stats?.schoolAdmins ?? 0,
      hint: "Tài khoản quản trị đã đăng ký",
      icon: CheckCircle2,
      tone: "bg-[#EAF2D7]/70 text-[#223A1E]",
    },
    {
      label: "Học sinh cần chú ý",
      value: metrics.needsAttention,
      hint: "Có tín hiệu nhạy cảm hoặc bỏ dở bước Chốt",
      icon: AlertTriangle,
      tone: "bg-rose-100 text-rose-700",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFD] dark:bg-[#0F171E] text-[#1D242B] dark:text-[#EDF2F7] flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#17222C]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <CompassLogo size={26} />
            <span className="text-base font-bold tracking-tight">
              La Bàn Lựa Chọn
            </span>
            <span className="hidden sm:inline text-xs font-semibold text-[#5A3A0E] dark:text-[#F3E7C9] bg-[#F3E7C9]/70 dark:bg-[#F3E7C9]/15 rounded-lg px-2 py-0.5">
              Quản lý nhà trường
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {account && onLogout ? (
              <AccountMenu
                user={account}
                offline={offlineSession}
                onLogout={onLogout}
              />
            ) : (
              <button
                type="button"
                onClick={onExitRole}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Đổi vai trò
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200/70 dark:border-slate-800 bg-[#F3E7C9]/40 dark:bg-[#17222C]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <span className="font-semibold text-[#5A3A0E] dark:text-[#F3E7C9]">
            Tổng quan toàn trường · Năm học 2026 – 2027
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenHowAIWorks}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#133C42] dark:text-[#B3DEE2]" />
              <span>Cách app dùng AI</span>
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Cài đặt</span>
            </button>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17222C] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              {appState.settings.darkMode ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
              <span>{appState.settings.darkMode ? "Sáng" : "Tối"}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Bức tranh toàn trường
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Tổng hợp mức độ tham gia hành trình hướng nghiệp của{" "}
                {total} học sinh trong {SCHOOL_CLASSES.length} lớp.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="school-class-filter"
                className="text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Lọc lớp
              </label>
              <select
                id="school-class-filter"
                value={activeClass}
                onChange={(e) => setActiveClass(e.target.value)}
                className="min-h-[38px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#FAFBFD] dark:bg-[#0F171E] px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E27396]"
              >
                <option value="ALL">Tất cả các lớp</option>
                {SCHOOL_CLASSES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#FAFBFD] dark:bg-[#0F171E] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {card.label}
                    </span>
                    <span
                      className={`w-8 h-8 rounded-lg inline-flex items-center justify-center ${card.tone}`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{card.value}</p>
                  <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                    {card.hint}
                  </p>
                </div>
              );
            })}
          </div>

          {!account && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đang xem dữ liệu mẫu 45 học sinh. Số giáo viên, phụ huynh và quản
              lý là tài khoản thật đã đăng ký trên máy chủ.
            </p>
          )}
        </section>

        <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#9D2950] dark:text-[#EA9AB2]" />
            <h2 className="text-base font-bold">Mức độ tham gia theo 5 bước</h2>
          </div>

          <div className="space-y-2.5">
            {metrics.stepCounts.map((step) => {
              const pct = total ? Math.round((step.count / total) * 100) : 0;
              return (
                <div key={step.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>{step.label}</span>
                    <span className="tabular-nums text-slate-600 dark:text-slate-300">
                      {step.count} em · {pct}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stepShareColor[step.id]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-[#B3DEE2]/30 dark:bg-[#B3DEE2]/10 border border-[#B3DEE2]">
              <p className="text-slate-600 dark:text-slate-300">
                Đã bắt đầu hành trình
              </p>
              <p className="font-bold text-lg mt-0.5">
                {metrics.started} em ({metrics.startedPct}%)
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#EAF2D7]/60 dark:bg-[#EAF2D7]/10 border border-[#EAF2D7]">
              <p className="text-slate-600 dark:text-slate-300">
                Đã cam kết hướng đi
              </p>
              <p className="font-bold text-lg mt-0.5">
                {metrics.committed} em ({metrics.committedPct}%)
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#EFCFE3]/45 dark:bg-[#EFCFE3]/10 border border-[#EA9AB2]">
              <p className="text-slate-600 dark:text-slate-300">
                Hồ sơ chia sẻ với phụ huynh
              </p>
              <p className="font-bold text-lg mt-0.5">
                {metrics.sharedWithParent} em
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-[#17222C] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold">Chi tiết theo lớp</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Sĩ số mẫu · tài khoản mới · mức hoàn thành
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2 pr-3 font-semibold">Lớp</th>
                  <th className="py-2 px-3 font-semibold">Sĩ số dữ liệu</th>
                  <th className="py-2 px-3 font-semibold">Tài khoản mới</th>
                  <th className="py-2 px-3 font-semibold">Đã cam kết</th>
                  <th className="py-2 px-3 font-semibold">Cần chú ý</th>
                  <th className="py-2 pl-3 font-semibold">Mức hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 dark:border-slate-800/70 last:border-0"
                  >
                    <td className="py-3 pr-3 font-semibold">
                      {schoolClassLabel(row.id)}
                    </td>
                    <td className="py-3 px-3 tabular-nums">{row.total}</td>
                    <td className="py-3 px-3 tabular-nums">
                      {row.accounts}
                      <span className="text-xs text-slate-400">
                        {" "}
                        / {row.rosterTotal}
                      </span>
                    </td>
                    <td className="py-3 px-3 tabular-nums">{row.committed}</td>
                    <td className="py-3 px-3 tabular-nums">
                      <span
                        className={
                          row.attention > 0
                            ? "text-rose-700 dark:text-rose-300 font-semibold"
                            : ""
                        }
                      >
                        {row.attention}
                      </span>
                    </td>
                    <td className="py-3 pl-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#E27396]"
                            style={{ width: `${row.committedPct}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums">
                          {row.committedPct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            &ldquo;Tài khoản mới&rdquo; là học sinh đã đăng ký tài khoản riêng,
            được phụ huynh liên kết bằng mã PIN. Học sinh mẫu dùng mã PIN phụ
            huynh mặc định 1234 khi trải nghiệm.
          </p>
        </section>
      </main>
    </div>
  );
};
