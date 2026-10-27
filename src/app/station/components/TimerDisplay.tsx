import React from 'react';
import styles from '../station.module.css';

interface TimerDisplayProps {
  timerDisplay: string;
  statusText: string;
  digitsClass: string;
  capsuleClass: string;
  isStaffCalling: boolean;
  staffCallCooldown: number;
  onCallStaff: () => void;
}

/**
 * TimerDisplay: Huge digital clock, status capsule pill, and minimal Call Staff button.
 */
export default function TimerDisplay({
  timerDisplay,
  statusText,
  digitsClass,
  capsuleClass,
  isStaffCalling,
  staffCallCooldown,
  onCallStaff
}: TimerDisplayProps) {
  return (
    <div className={styles.centerSection}>
      {/* DIGITAL CLOCK DIGITS */}
      <div className={`${styles.timerDigits} ${digitsClass}`}>
        {timerDisplay}
      </div>

      {/* STATUS CAPSULE PILL */}
      <div className={`${styles.statusCapsule} ${capsuleClass}`}>
        <span className={styles.statusDot} />
        <span>{statusText}</span>
      </div>

      {/* CALL STAFF BUTTON */}
      <button
        className={`${styles.callStaffBtn} ${isStaffCalling ? styles.callStaffActive : ''}`}
        onClick={onCallStaff}
        title="Press to request assistance from staff"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.bellIcon}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span>
          {isStaffCalling
            ? `Staff Called (${staffCallCooldown}s)`
            : 'Call Staff'}
        </span>
      </button>
    </div>
  );
}
