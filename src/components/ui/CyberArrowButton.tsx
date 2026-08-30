import React from 'react';
import styles from './CyberArrowButton.module.css';

export interface CyberArrowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  direction: 'left' | 'right';
  size?: number;
}

export default function CyberArrowButton({
  direction,
  size = 44,
  className = '',
  ...props
}: CyberArrowButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.cyberBtn} ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.cyberSvg}
        aria-hidden="true"
      >
        {/* Outer Base Border (Dark / Subtle outline) */}
        <path
          className={styles.cyberOuterBase}
          d="M 1 11 L 11 1 L 37 1 A 6 6 0 0 1 43 7 L 43 33 L 33 43 L 7 43 A 6 6 0 0 1 1 37 Z"
        />

        {/* Outer Neon Accent Top-Left Bracket */}
        <path
          className={styles.cyberBracket}
          d="M 19 1 L 11 1 L 1 11 L 1 19"
        />

        {/* Outer Neon Accent Bottom-Right Bracket */}
        <path
          className={styles.cyberBracket}
          d="M 25 43 L 33 43 L 43 33 L 43 25"
        />

        {/* Inner Solid Accent Shape (chamfered top-left & bottom-right, rounded top-right & bottom-left) */}
        <path
          className={styles.cyberInner}
          d="M 4.5 12 L 12 4.5 L 34.5 4.5 A 5 5 0 0 1 39.5 9.5 L 39.5 32 L 32 39.5 L 9.5 39.5 A 5 5 0 0 1 4.5 34.5 Z"
        />

        {/* Directional Arrow (Black) */}
        {direction === 'left' ? (
          <path
            className={styles.cyberArrow}
            d="M 27 22 L 17 22 M 21 17.5 L 16.5 22 L 21 26.5"
          />
        ) : (
          <path
            className={styles.cyberArrow}
            d="M 17 22 L 27 22 M 23 17.5 L 27.5 22 L 23 26.5"
          />
        )}
      </svg>
    </button>
  );
}
