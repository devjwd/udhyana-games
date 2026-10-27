import React from 'react';
import styles from '../station.module.css';

import { StationStatus } from '../types/station';

interface PreviewToolbarProps {
  previewState: StationStatus;
  onApplyState: (state: StationStatus) => void;
  onTriggerSleep?: () => void;
  onExitPreview: () => void;
}

/**
 * PreviewToolbar: Floating simulator toolbar at bottom of screen for instant testing.
 */
export default function PreviewToolbar({
  previewState,
  onApplyState,
  onTriggerSleep,
  onExitPreview
}: PreviewToolbarProps) {
  return (
    <div className={styles.previewToolbar}>
      <button
        className={`${styles.previewBtn} ${previewState === 'WARNING' ? styles.previewBtnActive : ''}`}
        onClick={() => onApplyState('WARNING')}
      >
        Ending Soon (00:03:32)
      </button>
      <button
        className={`${styles.previewBtn} ${previewState === 'ACTIVE' ? styles.previewBtnActive : ''}`}
        onClick={() => onApplyState('ACTIVE')}
      >
        Active (45m)
      </button>
      <button
        className={`${styles.previewBtn} ${previewState === 'EXPIRED' ? styles.previewBtnActive : ''}`}
        onClick={() => onApplyState('EXPIRED')}
      >
        Time&apos;s Up
      </button>
      <button
        className={`${styles.previewBtn} ${previewState === 'IDLE' ? styles.previewBtnActive : ''}`}
        onClick={() => onApplyState('IDLE')}
      >
        Idle
      </button>
      {onTriggerSleep && (
        <button className={styles.previewBtn} onClick={onTriggerSleep}>
          🌙 Test Sleep (Blackout)
        </button>
      )}
      <button className={styles.previewCloseBtn} onClick={onExitPreview}>
        ✕ Exit
      </button>
    </div>
  );
}
