import React from "react";
import { JOURNEY_STEPS } from "../../data/mockData";
import type { JourneyStep } from "../../types";

interface JourneyCompassSVGProps {
  currentStep: JourneyStep;
  completedSteps: JourneyStep[];
  celebrateStep?: JourneyStep | null;
  onSelectStep: (step: JourneyStep) => void;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArcSector(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    outerStart.x,
    outerStart.y,
    "A",
    outerR,
    outerR,
    0,
    largeArcFlag,
    0,
    outerEnd.x,
    outerEnd.y,
    "L",
    innerEnd.x,
    innerEnd.y,
    "A",
    innerR,
    innerR,
    0,
    largeArcFlag,
    1,
    innerStart.x,
    innerStart.y,
    "Z",
  ].join(" ");
}

export const JourneyCompassSVG: React.FC<JourneyCompassSVGProps> = ({
  currentStep,
  completedSteps,
  celebrateStep,
  onSelectStep,
}) => {
  const cx = 180;
  const cy = 180;
  const innerR = 76;
  const outerR = 148;
  const labelR = 113;

  const currentIdx = JOURNEY_STEPS.findIndex((s) => s.id === currentStep);
  const activeCenterAngle = (currentIdx >= 0 ? currentIdx : 0) * 72;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 360 360"
        className="w-full max-w-[320px] sm:max-w-[350px] h-auto select-none"
        role="img"
        aria-label={`La bàn hành trình 5 bước. Em đang ở bước ${currentStep}.`}
      >
        {/* Outer subtle degree ring */}
        <circle
          cx={cx}
          cy={cy}
          r={162}
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-700"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />

        {/* Gentle celebration halo when a step is completed (respects prefers-reduced-motion) */}
        {celebrateStep && (
          <circle
            cx={cx}
            cy={cy}
            r={168}
            fill="none"
            className="stroke-[#3E9A94] dark:stroke-[#B3DEE2] animate-pulse motion-reduce:animate-none"
            strokeWidth="3"
          />
        )}

        {/* Cardinal compass ticks */}
        {[0, 72, 144, 216, 288].map((deg) => {
          const p1 = polarToCartesian(cx, cy, 152, deg);
          const p2 = polarToCartesian(cx, cy, 162, deg);
          return (
            <line
              key={deg}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              className="stroke-slate-400 dark:stroke-slate-500"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}

        {/* 5 Step Arcs */}
        {JOURNEY_STEPS.map((st, idx) => {
          const centerDeg = idx * 72;
          const startDeg = centerDeg - 32.5;
          const endDeg = centerDeg + 32.5;
          const pathData = describeArcSector(
            cx,
            cy,
            innerR,
            outerR,
            startDeg,
            endDeg
          );

          const isCurrent = st.id === currentStep;
          const isCompleted =
            completedSteps.includes(st.id) || idx < currentIdx;

          const labelPos = polarToCartesian(cx, cy, labelR, centerDeg);

          let fillClass =
            "fill-[#F4F7FA] dark:fill-[#111B24] stroke-slate-300 dark:stroke-slate-700";
          let textClass = "fill-[#334155] dark:fill-[#CBD5E1]";

          if (isCompleted && !isCurrent) {
            fillClass =
              "fill-[#B3DEE2] dark:fill-[#1A4D54] stroke-[#3B8F97] dark:stroke-[#63AEB6]";
            textClass = "fill-[#0F353B] dark:fill-[#E6FAFC]";
          } else if (isCurrent) {
            fillClass =
              "fill-[#EFCFE3] dark:fill-[#5E243B] stroke-[#D95B86] dark:stroke-[#EA9AB2]";
            textClass = "fill-[#4A1A2C] dark:fill-[#FFF0F6]";
          }

          const statusWord = isCurrent
            ? "Đang thực hiện"
            : isCompleted
            ? "Đã hoàn thành"
            : "Sắp tới";

          return (
            <g
              key={st.id}
              role="button"
              tabIndex={0}
              aria-label={`Bước ${idx + 1}: ${st.label} – ${st.shortDesc} (${statusWord})`}
              onClick={() => onSelectStep(st.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectStep(st.id);
                }
              }}
              className="cursor-pointer group focus:outline-none"
            >
              <path
                d={pathData}
                className={`${fillClass} transition-colors duration-200 group-hover:brightness-95 dark:group-hover:brightness-110`}
                strokeWidth={isCurrent ? 2.5 : 1.5}
              />
              <text
                x={labelPos.x}
                y={labelPos.y - 4}
                textAnchor="middle"
                dominantBaseline="central"
                className={`${textClass} text-[11px] font-bold tracking-tight pointer-events-none`}
              >
                {st.label}
              </text>
              <text
                x={labelPos.x}
                y={labelPos.y + 11}
                textAnchor="middle"
                dominantBaseline="central"
                className={`${textClass} text-[9px] font-medium opacity-90 pointer-events-none`}
              >
                {isCompleted && !isCurrent
                  ? "✓ Xong"
                  : isCurrent
                  ? "Đang đi"
                  : `Bước ${idx + 1}`}
              </text>
            </g>
          );
        })}

        {/* Inner compass dial */}
        <circle
          cx={cx}
          cy={cy}
          r={64}
          className="fill-white dark:fill-[#17222C] stroke-slate-200 dark:stroke-slate-700"
          strokeWidth="2"
        />

        {/* Rotating needle pointing to currentStep */}
        <g
          style={{
            transform: `rotate(${activeCenterAngle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
          className="transition-transform duration-500 ease-out motion-reduce:transition-none pointer-events-none"
        >
          {/* North / Active pointer tip */}
          <polygon
            points={`${cx},${cy - 56} ${cx - 8},${cy} ${cx + 8},${cy}`}
            fill="#E27396"
          />
          {/* South counterweight */}
          <polygon
            points={`${cx},${cy + 42} ${cx - 6},${cy} ${cx + 6},${cy}`}
            fill="#94A3B8"
          />
        </g>

        {/* Center cap */}
        <circle cx={cx} cy={cy} r={10} fill="#133C42" />
        <circle cx={cx} cy={cy} r={4} fill="#FFFFFF" />
      </svg>

      {/* Accessible Legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#B3DEE2] border border-[#3B8F97] inline-block" />
          <span>Đã xong (xanh ngọc)</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#EFCFE3] border border-[#D95B86] inline-block" />
          <span>Kim đang chỉ ({currentStep})</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#F4F7FA] dark:bg-[#111B24] border border-slate-300 dark:border-slate-700 inline-block" />
          <span>Chưa tới</span>
        </span>
      </div>
    </div>
  );
};
