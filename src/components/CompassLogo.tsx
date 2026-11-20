import React from "react";
import { JourneyStep } from "../types";

export const CompassMark: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="20" cy="20" r="17.5" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="20" cy="20" r="13.5" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1" />
    <path
      d="M20 6V9M20 31V34M6 20H9M31 20H34"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M25.5 14.5L22.2 22.2L14.5 25.5L17.8 17.8L25.5 14.5Z" fill="#E0A030" />
    <path d="M25.5 14.5L22.2 22.2L17.8 17.8L25.5 14.5Z" fill="#1F3A5F" className="dark:fill-[#38A3A5]" />
    <circle cx="20" cy="20" r="2.2" fill="#F7F9FB" stroke="#1F3A5F" strokeWidth="1.4" />
  </svg>
);

export const JOURNEY_STEPS: { id: JourneyStep; label: string; hint: string }[] = [
  { id: "THU", label: "THU", hint: "Tìm hiểu bản đồ lộ trình" },
  { id: "LỌC", label: "LỌC", hint: "Đặt tiêu chí đủ tốt" },
  { id: "THỬ", label: "THỬ", hint: "Trải nghiệm & ghi nhật ký" },
  { id: "CHỐT", label: "CHỐT", hint: "Viết lí do & lập kế hoạch" },
  { id: "CAM KẾT", label: "CAM KẾT", hint: "Xác nhận cùng ba bên" },
];

interface CompassJourneyBarProps {
  currentStep: JourneyStep;
  onSelectStep: (step: JourneyStep) => void;
}

export const CompassJourneyBar: React.FC<CompassJourneyBarProps> = ({
  currentStep,
  onSelectStep,
}) => {
  const currentIdx = JOURNEY_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="bg-white dark:bg-[#182334] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <CompassMark className="w-6 h-6 text-[#1F3A5F] dark:text-[#F0B44A] shrink-0" />
          <span className="text-sm font-semibold text-[#1F3A5F] dark:text-slate-100">
            Hành trình la bàn 5 bước
          </span>
        </div>
        <span className="text-xs text-slate-600 dark:text-slate-300">
          Em đang ở bước <strong className="text-[#2A7F7F] dark:text-[#4CC9C9]">{currentStep}</strong> ·{" "}
          {JOURNEY_STEPS[currentIdx]?.hint}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {JOURNEY_STEPS.map((step, idx) => {
          const isCurrent = step.id === currentStep;
          const isPassed = idx < currentIdx;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep(step.id)}
              className={`group relative flex flex-col items-center text-center py-2.5 px-1.5 rounded-xl border transition-colors min-h-[56px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F3A5F] ${
                isCurrent
                  ? "bg-[#1F3A5F] text-white border-[#1F3A5F] dark:bg-[#2A7F7F] dark:border-[#2A7F7F]"
                  : isPassed
                  ? "bg-[#2A7F7F]/10 text-[#1F3A5F] border-[#2A7F7F]/35 dark:bg-[#2A7F7F]/20 dark:text-slate-100 dark:border-[#2A7F7F]/50 hover:bg-[#2A7F7F]/15"
                  : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span
                className={`text-[11px] sm:text-xs font-semibold tracking-wide whitespace-nowrap ${
                  isCurrent ? "text-[#F0B44A] dark:text-[#FDE68A]" : ""
                }`}
              >
                {step.label}
              </span>
              <span
                className={`mt-1 text-[10px] leading-tight hidden sm:block ${
                  isCurrent
                    ? "text-slate-200"
                    : isPassed
                    ? "text-[#2A7F7F] dark:text-[#6EE7E7]"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {isCurrent ? "Đang đi" : isPassed ? "Đã qua" : "Tiếp theo"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
