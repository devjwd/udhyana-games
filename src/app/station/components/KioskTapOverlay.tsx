import React from 'react';
import styles from '../station.module.css';

interface KioskTapOverlayProps {
  isVisible: boolean;
  onStartKiosk: () => void;
}

/**
 * KioskTapOverlay: Full-screen overlay to ensure browser grants Web Audio API and Screen WakeLock permissions.
 */
export default function KioskTapOverlay({ isVisible, onStartKiosk }: KioskTapOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={styles.tapOverlay} onClick={onStartKiosk}>
      <div className={styles.tapCard} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '2.5rem' }}>📱🎮</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
          Station Monitor Display
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
          Tap below to enter fullscreen display and enable audio chimes.
        </p>
        <button className={styles.tapBtn} onClick={onStartKiosk}>
          Enter Kiosk Mode
        </button>
      </div>
    </div>
  );
}
