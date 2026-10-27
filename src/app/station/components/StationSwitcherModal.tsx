import React from 'react';
import styles from '../station.module.css';
import { StationSummary } from '../types/station';
import { stationSounds } from '../utils/stationSounds';

interface StationSwitcherModalProps {
  isOpen: boolean;
  stationId: string;
  allStations: StationSummary[];
  onSelectStation: (id: string) => void;
  onClose: () => void;
}

/**
 * StationSwitcherModal: Modal dialog for reassigning phone to a different console in the lounge.
 */
export default function StationSwitcherModal({
  isOpen,
  stationId,
  allStations,
  onSelectStation,
  onClose
}: StationSwitcherModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Select Station</div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '250px',
            overflowY: 'auto'
          }}
        >
          {allStations.map((s) => (
            <button
              key={s.id}
              className={`${styles.stationListItem} ${
                s.id === stationId ? styles.stationListItemActive : ''
              }`}
              onClick={() => {
                stationSounds.playClick();
                onSelectStation(s.id);
                onClose();
              }}
            >
              <span>{s.name}</span>
              {s.id === stationId && <span>✓</span>}
            </button>
          ))}
        </div>
        <button
          className={styles.iconBtn}
          style={{ alignSelf: 'flex-end', marginTop: '0.5rem' }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
