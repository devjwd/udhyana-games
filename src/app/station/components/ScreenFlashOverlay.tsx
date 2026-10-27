import React from 'react';
import styles from '../station.module.css';

interface ScreenFlashOverlayProps {
  isTimeUp: boolean;
  flashState: 'NONE' | 'SOFT_WARNING';
}

/**
 * ScreenFlashOverlay: Renders red strobe on timeout or gentle warm amber flash on 5-min warning.
 */
export default function ScreenFlashOverlay({ isTimeUp, flashState }: ScreenFlashOverlayProps) {
  if (isTimeUp) {
    return <div className={styles.timeoutRedFlash} aria-hidden="true" />;
  }

  if (flashState === 'SOFT_WARNING') {
    return <div className={styles.softWarningFlash} aria-hidden="true" />;
  }

  return null;
}
