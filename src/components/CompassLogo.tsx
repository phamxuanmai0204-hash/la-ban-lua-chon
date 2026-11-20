import React from "react";

interface CompassLogoProps {
  className?: string;
  size?: number;
}

export const CompassLogo: React.FC<CompassLogoProps> = ({
  className = "",
  size = 28,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="18"
        cy="18"
        r="15.5"
        className="fill-[#B3DEE2]/35 stroke-[#1D242B] dark:fill-[#B3DEE2]/15 dark:stroke-[#B3DEE2]"
        strokeWidth="1.6"
      />
      <circle
        cx="18"
        cy="18"
        r="11.5"
        className="stroke-[#1D242B]/25 dark:stroke-[#B3DEE2]/30"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <polygon
        points="18,6.5 21.4,18 18,16 14.6,18"
        className="fill-[#E27396]"
      />
      <polygon
        points="18,29.5 21.4,18 18,20 14.6,18"
        className="fill-[#1D242B] dark:fill-[#EDF2F7]"
      />
      <circle
        cx="18"
        cy="18"
        r="2"
        className="fill-[#FAFBFD] stroke-[#1D242B] dark:fill-[#0F171E] dark:stroke-[#EDF2F7]"
        strokeWidth="1.4"
      />
    </svg>
  );
};
