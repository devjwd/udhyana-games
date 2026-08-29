'use client';

import React, { useState } from 'react';
import styles from '../../page.module.css';
import { UpcomingBooking } from '../../types';

interface UpcomingReservationsTableProps {
  bookings: UpcomingBooking[];
  onOpenCheckIn: (booking: UpcomingBooking) => void;
  onAcceptBooking?: (bookingId: string) => Promise<void>;
  onCancelBooking?: (bookingId: string, playerName: string) => void;
}

export default function UpcomingReservationsTable({
  bookings,
  onOpenCheckIn,
  onAcceptBooking,
  onCancelBooking
}: UpcomingReservationsTableProps) {
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleAccept = async (bookingId: string) => {
    if (!onAcceptBooking) return;
    setAcceptingId(bookingId);
    try {
      await onAcceptBooking(bookingId);
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderRow}>
        <h2 className={styles.panelHeader} style={{ borderBottom: 'none', paddingBottom: 0, color: '#60a5fa' }}>
          Upcoming Online Reservations
        </h2>
        {bookings.length > 0 && (
          <span className={styles.badgeBlue}>{bookings.length} Booked</span>
        )}
      </div>

      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Player</th>
              <th className={styles.th}>Station</th>
              <th className={styles.th}>Scheduled Time</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => {
              const start = new Date(b.startTime);
              const end = new Date(b.endTime);
              const hours = Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 10) / 10;
              const playerName = b.user.fullName || b.user.username || 'Player';
              const isPending = b.status === 'PENDING';
              const isAccepting = acceptingId === b.id;

              const now = currentTime;
              const startTimeMs = start.getTime();
              // Near or currently in time slot (within 30 mins of scheduled start)
              const isNearOrActive = now >= (startTimeMs - 30 * 60 * 1000);

              return (
                <tr key={b.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div style={{ fontWeight: 'bold' }}>{playerName}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{b.user.phone || `@${b.user.username}`}</div>
                  </td>
                  <td className={styles.td}>
                    <span style={{ color: 'var(--primary-accent)', fontWeight: 700 }}>
                      {b.console.hardwareTitle}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div>
                      {start.toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      <span style={{ fontWeight: 700 }}>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{hours} hrs ({start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</div>
                  </td>
                  <td className={styles.td}>
                    {isPending ? (
                      <span
                        style={{
                          background: 'rgba(234, 179, 8, 0.15)',
                          color: '#facc15',
                          border: '1px solid rgba(234, 179, 8, 0.35)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        Awaiting Acceptance
                      </span>
                    ) : (
                      <span
                        style={{
                          background: 'rgba(52, 211, 153, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(52, 211, 153, 0.35)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        Confirmed & Reserved
                      </span>
                    )}
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            className={styles.submitBtn}
                            style={{
                              padding: '0.45rem 0.85rem',
                              fontSize: '0.78rem',
                              background: '#34d399',
                              color: '#000',
                              fontWeight: 800
                            }}
                            disabled={isAccepting}
                            onClick={() => handleAccept(b.id)}
                            title="Accept reservation and lock the station for this time without starting timer"
                          >
                            {isAccepting ? 'Accepting...' : '✓ Accept Booking'}
                          </button>
                          {onCancelBooking && (
                            <button
                              type="button"
                              className={styles.actionBtnDanger}
                              style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }}
                              disabled={isAccepting}
                              onClick={() => onCancelBooking(b.id, playerName)}
                              title="Decline reservation"
                            >
                              ✕ Decline
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={isNearOrActive ? styles.checkinBtn : styles.actionBtnOutline}
                            style={!isNearOrActive ? { padding: '0.45rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(96, 165, 250, 0.4)', color: '#60a5fa' } : {}}
                            onClick={() => onOpenCheckIn(b)}
                            title={isNearOrActive ? "Seat player and start live gaming session" : "Customer is scheduled later. Click to seat early if arrived."}
                          >
                            {isNearOrActive ? '🎮 Seat & Start' : 'Seat Early'}
                          </button>
                          {onCancelBooking && (
                            <button
                              type="button"
                              className={styles.actionBtnDanger}
                              style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }}
                              onClick={() => onCancelBooking(b.id, playerName)}
                              title="Cancel reservation"
                            >
                              ✕ Cancel
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.tableEmpty}>
                  No upcoming online reservations at this time.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
