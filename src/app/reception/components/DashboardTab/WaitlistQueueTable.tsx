'use client';

import React from 'react';
import styles from '../../page.module.css';
import { WaitlistEntry } from '../../types';

interface WaitlistQueueTableProps {
  waitlist: WaitlistEntry[];
  onAssignWaitlist: (waiter: WaitlistEntry) => void;
  onRemoveWaitlist: (id: string) => Promise<void>;
}

export default function WaitlistQueueTable({
  waitlist,
  onAssignWaitlist,
  onRemoveWaitlist
}: WaitlistQueueTableProps) {
  const [currentTime, setCurrentTime] = React.useState<number>(() => Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const getWaitTime = (createdAt: string | Date) => {
    const mins = Math.floor((currentTime - new Date(createdAt).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m`;
    }
    return `${mins} mins`;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderRow}>
        <h2 className={styles.panelHeader} style={{ borderBottom: 'none', paddingBottom: 0, color: 'var(--primary-accent)' }}>
          Waitlist Queue
        </h2>
        {waitlist.length > 0 && (
          <span className={styles.panelBadge}>{waitlist.length} Waiting</span>
        )}
      </div>

      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Player Name</th>
              <th className={styles.th}>Requested Station & Duration</th>
              <th className={styles.th}>Payment Status</th>
              <th className={styles.th}>Wait Time</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {waitlist.map(w => {
              const isPrepaid = w.requested.toUpperCase().includes('PAID');
              const displayRequested = w.requested.replace(/\s*\(PAID\)\s*/i, '').trim();

              return (
                <tr key={w.id} className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 900, color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--primary-accent)' }}>🎮</span>
                      <span>{w.name}</span>
                    </div>
                  </td>
                  <td className={styles.td} style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {displayRequested}
                  </td>
                  <td className={styles.td}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      background: isPrepaid ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 180, 0, 0.15)',
                      color: isPrepaid ? '#34d399' : '#ffb400',
                      border: `1px solid ${isPrepaid ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255, 180, 0, 0.3)'}`
                    }}>
                      {isPrepaid ? '✓ PRE-PAID' : 'PAY AT DESK'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.badgeWaitTime}>
                      ⏱ {getWaitTime(w.createdAt)}
                    </span>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className={styles.actionBtnOutline}
                        style={{
                          color: 'var(--primary-accent)',
                          borderColor: 'rgba(193, 255, 28, 0.4)',
                          fontWeight: 800
                        }}
                        onClick={() => onAssignWaitlist(w)}
                        title="Seat player on available station"
                      >
                        🚀 Assign Station
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtnDanger}
                        onClick={() => onRemoveWaitlist(w.id)}
                        title="Remove player from waitlist"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {waitlist.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.tableEmpty}>
                  Waitlist queue is empty. No players currently queued.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
