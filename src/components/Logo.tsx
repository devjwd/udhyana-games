import React from "react";

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]"
      >
        {/* Outer Shield Outline */}
        <path
          d="M50 5 L88 20 V50 C88 72 71 90 50 96 C29 90 12 72 12 50 V20 L50 5 Z"
          fill="#0f1319"
          stroke="#39FF14"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Inner Shield Accent */}
        <path
          d="M50 12 L80 25 V48 C80 66 66 81 50 86 C34 81 20 66 20 48 V25 L50 12 Z"
          fill="#07090c"
          stroke="rgba(57, 255, 20, 0.3)"
          strokeWidth="1.5"
        />
        
        {/* Stylized Flower / Blossom Icon Center */}
        <g transform="translate(50, 48)">
          {/* Petals */}
          <ellipse cx="0" cy="-14" rx="5" ry="11" fill="#39FF14" opacity="0.95" />
          <ellipse cx="0" cy="14" rx="5" ry="11" fill="#39FF14" opacity="0.95" />
          <ellipse cx="-14" cy="0" rx="11" ry="5" fill="#39FF14" opacity="0.95" />
          <ellipse cx="14" cy="0" rx="11" ry="5" fill="#39FF14" opacity="0.95" />
          <ellipse cx="-10" cy="-10" rx="6" ry="10" transform="rotate(-45 -10 -10)" fill="#39FF14" opacity="0.8" />
          <ellipse cx="10" cy="-10" rx="6" ry="10" transform="rotate(45 10 -10)" fill="#39FF14" opacity="0.8" />
          <ellipse cx="-10" cy="10" rx="6" ry="10" transform="rotate(45 -10 10)" fill="#39FF14" opacity="0.8" />
          <ellipse cx="10" cy="10" rx="6" ry="10" transform="rotate(-45 10 10)" fill="#39FF14" opacity="0.8" />
          
          {/* Controller D-Pad / Core Accent */}
          <circle cx="0" cy="0" r="6" fill="#07090c" stroke="#39FF14" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}
