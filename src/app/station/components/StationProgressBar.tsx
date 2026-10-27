import React from 'react';
import styles from '../station.module.css';

interface StationProgressBarProps {
  progressPercent: number;
  barClass: string;
}

/**
 * StationProgressBar: Sleek bottom progress track with TIME ELAPSED and REMAINING indicators.
 */
export default function StationProgressBar({ progressPercent, barClass }: StationProgressBarProps) {
  return (
    <div className={styles.bottomSection}>
      <div className={styles.progressLabels}>
        <span className={styles.labelElapsed}>TIME ELAPSED</span>
        <span className={styles.labelRemaining}>REMAINING</span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressBar} ${barClass}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
