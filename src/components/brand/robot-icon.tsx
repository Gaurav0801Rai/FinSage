import React from "react";
import { cn } from "@/lib/utils";

interface RobotIconProps {
  className?: string;
  size?: number;
}

export function RobotIcon({ className, size = 24 }: RobotIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      {/* Antenna */}
      <path d="M50 22V14" stroke="#FFC837" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="11" r="3" fill="#FFC837" />

      {/* Ears */}
      <rect x="23" y="32" width="5" height="12" rx="2" fill="#FFD700" />
      <rect x="72" y="32" width="5" height="12" rx="2" fill="#FFD700" />

      {/* Head Outline (Gold) */}
      <rect
        x="28"
        y="22"
        width="44"
        height="32"
        rx="16"
        fill="#121820"
        stroke="#FFC837"
        strokeWidth="3"
      />
      
      {/* Faceplate (Dark) */}
      <rect x="33" y="27" width="34" height="22" rx="11" fill="#090D12" />

      {/* Eyes (Glowing Cyan/Blue) */}
      <rect x="40" y="34" width="7" height="4" rx="2" fill="#00E5FF" />
      <rect x="53" y="34" width="7" height="4" rx="2" fill="#00E5FF" />

      {/* Smile */}
      <path
        d="M46 42Q50 46 54 42"
        stroke="#00E5FF"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Body (Gold) */}
      <rect
        x="34"
        y="54"
        width="32"
        height="20"
        rx="8"
        fill="#121820"
        stroke="#FFC837"
        strokeWidth="3"
      />

      {/* Chest Screen/Core */}
      <circle cx="50" cy="64" r="5" fill="#00E5FF" />
      
      {/* Arms */}
      <path
        d="M34 58C30 62 28 68 31 72"
        stroke="#FFC837"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M66 58C70 62 72 68 69 72"
        stroke="#FFC837"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
