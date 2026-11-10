import React from 'react';

export type GamingIconType =
  | 'logo'
  | 'controller'
  | 'ps5'
  | 'xbox'
  | 'racing'
  | 'pc'
  | 'headset'
  | 'keyboard'
  | 'mouse'
  | 'apparel'
  | 'mousepad'
  | 'trophy'
  | 'vip'
  | 'arena'
  | 'lounge'
  | 'energy'
  | 'avatar';

interface GamingIconProps {
  name: GamingIconType;
  size?: number;
  className?: string;
  color?: string;
  accentColor?: string;
}

export default function GamingIcon({
  name,
  size = 48,
  className = '',
  color = 'currentColor',
  accentColor = 'var(--accent, #d6ff01)',
}: GamingIconProps) {
  const s = size;

  switch (name) {
    case 'logo':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Cyber Shield */}
          <polygon
            points="24,3 44,11 39,37 24,45 9,37 4,11"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="rgba(214,255,1,0.06)"
          />
          {/* Inner Accent Path */}
          <polygon
            points="24,9 38,15 34,33 24,39 14,33 10,15"
            stroke={accentColor}
            strokeWidth="1.2"
            strokeOpacity="0.4"
            fill="none"
          />
          {/* Stylized 'U' & Gamepad center */}
          <path
            d="M17 18V26C17 29.866 20.134 33 24 33C27.866 33 31 29.866 31 26V18"
            stroke="#ffffff"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <circle cx="21" cy="22" r="1.5" fill={accentColor} />
          <circle cx="27" cy="22" r="1.5" fill={accentColor} />
          <line x1="24" y1="20" x2="24" y2="28" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'controller':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Outer gamepad shell */}
          <path
            d="M18 16C12 16 8 21 8 28C8 38 12 50 16 52C19 54 23 48 27 42H37C41 48 45 54 48 52C52 50 56 38 56 28C56 21 52 16 46 16C40 16 35 20 32 20C29 20 24 16 18 16Z"
            stroke={color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="rgba(255,255,255,0.03)"
          />
          {/* D-Pad */}
          <path
            d="M21 26V34M17 30H25"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Action Buttons */}
          <circle cx="43" cy="26" r="1.8" fill={accentColor} />
          <circle cx="47" cy="30" r="1.8" fill={accentColor} />
          <circle cx="39" cy="30" r="1.8" fill={accentColor} />
          <circle cx="43" cy="34" r="1.8" fill={accentColor} />
          {/* Analog Sticks */}
          <circle cx="26" cy="38" r="3.5" stroke={color} strokeWidth="2" fill="rgba(255,255,255,0.1)" />
          <circle cx="38" cy="38" r="3.5" stroke={color} strokeWidth="2" fill="rgba(255,255,255,0.1)" />
          {/* Center touchpad bar */}
          <rect x="27" y="22" width="10" height="4" rx="1.5" stroke={color} strokeWidth="1.5" fill="none" />
        </svg>
      );

    case 'ps5':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* PS5 Tall Console Silhouette with aerodynamic collar */}
          <path
            d="M24 10C24 10 26 22 25 54H39C38 22 40 10 40 10"
            stroke={accentColor}
            strokeWidth="2"
            fill="rgba(214,255,1,0.05)"
          />
          {/* Left Wing Plate */}
          <path
            d="M19 8C20 18 20 46 22 56L25 54C26 22 24 10 24 10L19 8Z"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="rgba(255,255,255,0.05)"
          />
          {/* Right Wing Plate */}
          <path
            d="M45 8C44 18 44 46 42 56L39 54C38 22 40 10 40 10L45 8Z"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="rgba(255,255,255,0.05)"
          />
          {/* Blue/Accent LED Light slit */}
          <line x1="32" y1="13" x2="32" y2="50" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" />
          {/* Power Stand */}
          <ellipse cx="32" cy="56" rx="16" ry="3" stroke={color} strokeWidth="1.5" />
          {/* Triangle / Circle / Cross / Square floating marks */}
          <polygon points="12,24 15,19 18,24" stroke={accentColor} strokeWidth="1.2" fill="none" opacity="0.6" />
          <circle cx="51" cy="22" r="2.5" stroke={accentColor} strokeWidth="1.2" fill="none" opacity="0.6" />
        </svg>
      );

    case 'xbox':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Monolithic Tower */}
          <rect
            x="20"
            y="12"
            width="24"
            height="42"
            rx="2"
            stroke="#ffffff"
            strokeWidth="2.5"
            fill="rgba(255,255,255,0.04)"
          />
          {/* Top concave grill */}
          <path
            d="M20 16C26 18 38 18 44 16"
            stroke={accentColor}
            strokeWidth="2"
          />
          <circle cx="26" cy="14" r="1" fill={accentColor} />
          <circle cx="32" cy="14" r="1" fill={accentColor} />
          <circle cx="38" cy="14" r="1" fill={accentColor} />
          {/* Xbox Sphere Button with X */}
          <circle cx="26" cy="22" r="3.5" stroke={accentColor} strokeWidth="1.5" fill="none" />
          <path d="M24.5 20.5L27.5 23.5M27.5 20.5L24.5 23.5" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
          {/* Disc Slot */}
          <line x1="24" y1="36" x2="24" y2="46" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          {/* USB Port */}
          <rect x="36" y="44" width="3" height="1.5" rx="0.5" fill={accentColor} />
        </svg>
      );

    case 'racing':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Outer Wheel Rim */}
          <circle
            cx="32"
            cy="32"
            r="22"
            stroke="#ffffff"
            strokeWidth="3.5"
            fill="rgba(214,255,1,0.03)"
          />
          {/* Top Center Stripe (Racing stripe) */}
          <path d="M30 10H34" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          {/* Central Hub */}
          <circle cx="32" cy="32" r="8" stroke={accentColor} strokeWidth="2.5" fill="rgba(0,0,0,0.5)" />
          {/* Wheel Spokes */}
          <line x1="10" y1="32" x2="24" y2="32" stroke="#ffffff" strokeWidth="3" />
          <line x1="40" y1="32" x2="54" y2="32" stroke="#ffffff" strokeWidth="3" />
          <line x1="32" y1="40" x2="32" y2="54" stroke="#ffffff" strokeWidth="3" />
          {/* Hub Bolt details */}
          <circle cx="32" cy="32" r="3" fill={accentColor} />
          {/* Paddle shifters behind */}
          <path d="M12 22C14 24 14 28 12 30" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M52 22C50 24 50 28 52 30" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'pc':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* PC Case Outline */}
          <rect
            x="16"
            y="10"
            width="32"
            height="44"
            rx="3"
            stroke="#ffffff"
            strokeWidth="2.5"
            fill="rgba(255,255,255,0.03)"
          />
          {/* Tempered Glass Window */}
          <rect
            x="20"
            y="14"
            width="24"
            height="34"
            rx="1.5"
            stroke={color}
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          {/* Triple RGB Fan Circles */}
          <circle cx="32" cy="20" r="4.5" stroke={accentColor} strokeWidth="1.8" />
          <circle cx="32" cy="31" r="4.5" stroke={accentColor} strokeWidth="1.8" />
          <circle cx="32" cy="42" r="4.5" stroke={accentColor} strokeWidth="1.8" />
          {/* Power Button */}
          <circle cx="43" cy="12" r="1" fill={accentColor} />
          {/* Bottom Stand feet */}
          <line x1="20" y1="54" x2="24" y2="57" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="44" y1="54" x2="40" y2="57" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'headset':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Headband Arch */}
          <path
            d="M16 34C16 22 22 14 32 14C42 14 48 22 48 34"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Top Cushion Band */}
          <path
            d="M22 17C26 15 38 15 42 17"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Left Earcup */}
          <rect
            x="11"
            y="30"
            width="10"
            height="18"
            rx="5"
            stroke={accentColor}
            strokeWidth="2.5"
            fill="rgba(214,255,1,0.1)"
          />
          {/* Right Earcup */}
          <rect
            x="43"
            y="30"
            width="10"
            height="18"
            rx="5"
            stroke={accentColor}
            strokeWidth="2.5"
            fill="rgba(214,255,1,0.1)"
          />
          {/* Boom Mic */}
          <path
            d="M16 44C16 50 24 53 30 52"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect x="29" y="50" width="4" height="4" rx="1" fill={accentColor} />
        </svg>
      );

    case 'keyboard':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Keyboard Body */}
          <rect
            x="8"
            y="20"
            width="48"
            height="26"
            rx="3"
            stroke="#ffffff"
            strokeWidth="2.5"
            fill="rgba(255,255,255,0.03)"
          />
          {/* Key Rows */}
          {/* WASD Row */}
          <rect x="14" y="25" width="4" height="4" rx="0.8" fill={accentColor} />
          <rect x="20" y="25" width="4" height="4" rx="0.8" fill={accentColor} />
          <rect x="26" y="25" width="4" height="4" rx="0.8" stroke={color} strokeWidth="1" />
          <rect x="32" y="25" width="4" height="4" rx="0.8" stroke={color} strokeWidth="1" />
          <rect x="38" y="25" width="4" height="4" rx="0.8" stroke={color} strokeWidth="1" />
          <rect x="44" y="25" width="6" height="4" rx="0.8" stroke={color} strokeWidth="1" />

          {/* Middle Row */}
          <rect x="14" y="31" width="5" height="4" rx="0.8" stroke={color} strokeWidth="1" />
          <rect x="21" y="31" width="4" height="4" rx="0.8" fill={accentColor} />
          <rect x="27" y="31" width="4" height="4" rx="0.8" stroke={color} strokeWidth="1" />
          <rect x="33" y="31" width="4" height="4" rx="0.8" stroke={color} strokeWidth="1" />
          <rect x="39" y="31" width="4" height="4" rx="0.8" stroke={color} strokeWidth="1" />
          <rect x="45" y="31" width="5" height="4" rx="0.8" stroke={color} strokeWidth="1" />

          {/* Spacebar Row */}
          <rect x="14" y="37" width="6" height="4" rx="0.8" stroke={color} strokeWidth="1" />
          <rect x="22" y="37" width="20" height="4" rx="0.8" stroke={accentColor} strokeWidth="1.5" />
          <rect x="44" y="37" width="6" height="4" rx="0.8" stroke={color} strokeWidth="1" />
        </svg>
      );

    case 'mouse':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Ergonomic mouse body */}
          <path
            d="M22 24C22 16 26 12 32 12C38 12 42 16 42 24V40C42 48 38 52 32 52C26 52 22 48 22 40V24Z"
            stroke="#ffffff"
            strokeWidth="2.5"
            fill="rgba(214,255,1,0.04)"
          />
          {/* Center split line */}
          <line x1="32" y1="12" x2="32" y2="28" stroke="#ffffff" strokeWidth="1.5" />
          {/* Scroll Wheel */}
          <rect x="30" y="18" width="4" height="8" rx="2" stroke={accentColor} strokeWidth="1.5" fill="none" />
          {/* Thumb Side Buttons */}
          <path d="M21 28V34" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
          {/* Bottom RGB Glow Arc */}
          <path d="M25 46C27 48 37 48 39 46" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'apparel':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Jersey / Hoodie silhouette */}
          <path
            d="M24 14C28 17 36 17 40 14L54 22L47 31L42 27V52H22V27L17 31L10 22L24 14Z"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="rgba(255,255,255,0.03)"
          />
          {/* Collar Accent */}
          <path d="M26 15C29 18 35 18 38 15" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
          {/* Esports Chest Stripe */}
          <path d="M22 32L32 37L42 32" stroke={accentColor} strokeWidth="2.5" strokeLinejoin="round" />
          {/* Number 80 / U monogram */}
          <text x="32" y="47" fill={accentColor} fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
            80
          </text>
        </svg>
      );

    case 'mousepad':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Desk Mat Surface */}
          <rect
            x="10"
            y="18"
            width="44"
            height="30"
            rx="3"
            stroke="#ffffff"
            strokeWidth="2.5"
            fill="rgba(214,255,1,0.04)"
          />
          {/* Stitched Edge / Cyber border */}
          <rect
            x="13"
            y="21"
            width="38"
            height="24"
            rx="1.5"
            stroke={color}
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          {/* Corner Logo */}
          <polygon points="44,38 48,42 42,42" fill={accentColor} />
          {/* Geometric wave line */}
          <path d="M16 35C24 35 28 27 36 27C44 27 46 33 50 33" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'trophy':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Trophy Cup */}
          <path
            d="M20 14H44V26C44 34 38 40 32 40C26 40 20 34 20 26V14Z"
            stroke={accentColor}
            strokeWidth="2.5"
            fill="rgba(214,255,1,0.1)"
          />
          {/* Dual Handles */}
          <path
            d="M20 18H14C12 18 10 20 10 24C10 29 14 31 20 31"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M44 18H50C52 18 54 20 54 24C54 29 50 31 44 31"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Stem & Hex Base */}
          <path d="M32 40V48" stroke="#ffffff" strokeWidth="3" />
          <rect x="22" y="48" width="20" height="6" rx="1.5" stroke="#ffffff" strokeWidth="2" fill="rgba(255,255,255,0.06)" />
          {/* Star in cup */}
          <polygon
            points="32,20 34,24 38,24 35,27 36,31 32,28 28,31 29,27 26,24 30,24"
            fill={accentColor}
          />
        </svg>
      );

    case 'vip':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* 5-point angular crown */}
          <path
            d="M14 44L10 24L22 32L32 16L42 32L54 24L50 44H14Z"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="rgba(214,255,1,0.08)"
          />
          {/* Gem points */}
          <circle cx="10" cy="24" r="2" fill="#ffffff" />
          <circle cx="32" cy="16" r="2.5" fill={accentColor} />
          <circle cx="54" cy="24" r="2" fill="#ffffff" />
          {/* Crown Base */}
          <rect x="14" y="44" width="36" height="5" rx="1" stroke="#ffffff" strokeWidth="2" fill="rgba(255,255,255,0.1)" />
          {/* VIP Text */}
          <text x="32" y="38" fill={accentColor} fontSize="8" fontWeight="950" textAnchor="middle" fontFamily="sans-serif">
            VIP
          </text>
        </svg>
      );

    case 'arena':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Arena Dome / Stage */}
          <path
            d="M12 44C12 30 20 20 32 20C44 20 52 30 52 44"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Stadium Spotlights */}
          <line x1="16" y1="16" x2="24" y2="28" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
          <line x1="48" y1="16" x2="40" y2="28" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
          {/* Main Stage Screen */}
          <rect x="22" y="26" width="20" height="12" rx="1.5" stroke={accentColor} strokeWidth="1.8" fill="rgba(214,255,1,0.1)" />
          <polygon points="30,30 35,32 30,34" fill={accentColor} />
          {/* Dual Pods */}
          <rect x="14" y="42" width="12" height="6" rx="1" stroke="#ffffff" strokeWidth="1.5" />
          <rect x="38" y="42" width="12" height="6" rx="1" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="10" y1="50" x2="54" y2="50" stroke={color} strokeWidth="2" />
        </svg>
      );

    case 'lounge':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Curved Ultrawide Display */}
          <path
            d="M14 26C20 22 44 22 50 26"
            stroke={accentColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path d="M14 26V36C20 33 44 33 50 36V26" stroke="#ffffff" strokeWidth="2" fill="rgba(214,255,1,0.06)" />
          <line x1="32" y1="35" x2="32" y2="42" stroke="#ffffff" strokeWidth="2" />
          <line x1="26" y1="42" x2="38" y2="42" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          {/* Ergonomic Gaming Chair Outline */}
          <path d="M26 52H38M32 46V52" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
          {/* Ambient LED glow bar */}
          <line x1="16" y1="46" x2="48" y2="46" stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
      );

    case 'energy':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Sleek Can silhouette */}
          <rect
            x="22"
            y="14"
            width="20"
            height="38"
            rx="4"
            stroke="#ffffff"
            strokeWidth="2.5"
            fill="rgba(255,255,255,0.03)"
          />
          {/* Top can tab rim */}
          <ellipse cx="32" cy="14" rx="10" ry="2.5" stroke="#ffffff" strokeWidth="2" fill="none" />
          {/* Center Lightning Bolt */}
          <polygon
            points="33,22 26,33 31,33 30,42 38,30 33,30"
            fill={accentColor}
            stroke={accentColor}
            strokeWidth="1"
          />
          {/* Energy Sparks */}
          <circle cx="25" cy="22" r="1" fill={accentColor} />
          <circle cx="39" cy="38" r="1" fill={accentColor} />
        </svg>
      );

    case 'avatar':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Gamer Shield Frame */}
          <polygon
            points="32,6 54,16 48,46 32,58 16,46 10,16"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="rgba(214,255,1,0.06)"
          />
          {/* Head & Cyber Visor */}
          <circle cx="32" cy="24" r="8" stroke="#ffffff" strokeWidth="2" fill="rgba(255,255,255,0.06)" />
          <path d="M27 24H37" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
          {/* Shoulders */}
          <path
            d="M20 44C20 37 25 34 32 34C39 34 44 37 44 44"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    default:
      return null;
  }
}

/**
 * Helper to determine the best gaming icon based on title, category, or url string.
 */
export function getGamingIconType(text: string = ''): GamingIconType {
  const t = text.toLowerCase();
  if (t.includes('ps5') || t.includes('playstation') || t.includes('sony')) return 'ps5';
  if (t.includes('xbox')) return 'xbox';
  if (t.includes('wheel') || t.includes('racing') || t.includes('steer') || t.includes('gt7') || t.includes('forza')) return 'racing';
  if (t.includes('pc') || t.includes('rig') || t.includes('rtx') || t.includes('desktop')) return 'pc';
  if (t.includes('headphone') || t.includes('headset') || t.includes('audio')) return 'headset';
  if (t.includes('keyboard')) return 'keyboard';
  if (t.includes('mousepad') || t.includes('deskmat') || t.includes('pad')) return 'mousepad';
  if (t.includes('mouse')) return 'mouse';
  if (t.includes('hoodie') || t.includes('jersey') || t.includes('apparel') || t.includes('merch') || t.includes('shirt') || t.includes('wear')) return 'apparel';
  if (t.includes('trophy') || t.includes('champ') || t.includes('tourn') || t.includes('event')) return 'trophy';
  if (t.includes('vip') || t.includes('suite') || t.includes('booth') || t.includes('crown')) return 'vip';
  if (t.includes('arena') || t.includes('downtown') || t.includes('stadium')) return 'arena';
  if (t.includes('lounge') || t.includes('matta') || t.includes('pod') || t.includes('station')) return 'lounge';
  if (t.includes('red bull') || t.includes('snack') || t.includes('drink') || t.includes('sting') || t.includes('fuel') || t.includes('monster')) return 'energy';
  return 'controller';
}

