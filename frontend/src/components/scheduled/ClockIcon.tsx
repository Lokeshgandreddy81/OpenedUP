import React from "react";
import clockImg from "./clock.png";

interface ClockIconProps {
  size?: number;
  className?: string;
}

export const ClockIcon: React.FC<ClockIconProps> = ({ size = 46, className = "" }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center shrink-0 select-none ${className}`}
    >
      <img
        src={clockImg}
        alt="Schedule task clock"
        width={size}
        height={size}
        className="w-full h-full object-contain pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
      />
    </div>
  );
};
