'use client';

import React from 'react';
import styles from '../../page.module.css';
import { UpcomingBooking } from '../../types';

interface UpcomingReservationsTableProps {
  bookings: UpcomingBooking[];
  onOpenCheckIn: (booking: UpcomingBooking) => void;
  onCancelBooking?: (bookingId: string, playerName: string) => void;
}

export default function UpcomingReservationsTable({
  bookings,
  onOpenCheckIn,
  onCancelBooking
}: UpcomingReservationsTableProps) {
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
                    <div>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{hours} hrs duration</div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.badgeStatus}>
                      {b.status}
                    </span>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className={styles.checkinBtn}
                        onClick={() => onOpenCheckIn(b)}
                        title="Check-In and seat player"
                      >
                        Check-In & Start
                      </button>
                      {onCancelBooking && (
                        <button
                          type="button"
                          className={styles.actionBtnDanger}
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => onCancelBooking(b.id, playerName)}
                          title="Cancel no-show reservation"
                        >
                          ✕ Cancel
                        </button>
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
