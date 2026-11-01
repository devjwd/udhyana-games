import React from 'react';
import styles from '../station.module.css';
import { stationSounds } from '../utils/stationSounds';

interface StationHeaderProps {
  stationName: string;
  isMuted: boolean;
  isFullscreen: boolean;
  onOpenSwitcher: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
}

/**
 * StationHeader: Top station capsule pill [🎮 STATION 01] and subtle corner utility controls.
 */
export default function StationHeader({
  stationName,
  isMuted,
  isFullscreen,
  onOpenSwitcher,
  onToggleMute,
  onToggleFullscreen
}: StationHeaderProps) {
  return (
    <>
      {/* DISCREET CORNER UTILITY CONTROLS */}
      <div className={styles.cornerControls}>
        <button className={styles.iconBtn} onClick={onToggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button className={styles.iconBtn} onClick={onToggleFullscreen} title="Toggle Fullscreen">
          {isFullscreen ? '⤢' : '⛶'}
        </button>
      </div>

      {/* TOP PILL: [CONTROLLER ICON] STATION 01 */}
      <div className={styles.topSection}>
        <button
          className={styles.stationPill}
          onClick={() => {
            stationSounds.playClick();
            onOpenSwitcher();
          }}
          title="Tap to switch station"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.controllerIcon}
          >
            <path d="M6 12h4M8 10v4" />
            <circle cx="15" cy="11" r="1" fill="currentColor" />
            <circle cx="18" cy="13" r="1" fill="currentColor" />
            <rect x="2" y="6" width="20" height="12" rx="5" />
          </svg>
          <span>{stationName || 'STATION 01'}</span>
        </button>
      </div>
    </>
  );
}
