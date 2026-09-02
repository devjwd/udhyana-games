'use client';

import React, { useEffect, useState } from 'react';
import styles from '../page.module.css';
import { UpcomingBooking } from '../types';

interface CheckInModalProps {
  booking: UpcomingBooking | null;
  baseRate: number;
  onClose: () => void;
  onConfirm: (bookingId: string, paymentMethod: string) => Promise<void>;
  onAccept?: (bookingId: string) => Promise<void>;
}

export default function CheckInModal({
  booking,
  baseRate,
  onClose,
  onConfirm,
  onAccept
}: CheckInModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'account'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [currentTime] = useState<number>(() => Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && !isAccepting) onClose();
    };
    if (booking) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [booking, isSubmitting, isAccepting, onClose]);

  if (!booking) return null;

  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);
  const durationHours = Math.max(0.5, (endTime.getTime() - startTime.getTime()) / (1000 * 3600));
  const estimatedTotal = Math.round(durationHours * baseRate);

  const diffMinutes = Math.round((startTime.getTime() - currentTime) / (60 * 1000));
  const isFuture = diffMinutes > 20;
  const isPending = booking.status === 'PENDING';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(booking.id, paymentMethod);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptOnly = async () => {
    if (!onAccept) return;
    setIsAccepting(true);
    try {
      await onAccept(booking.id);
      onClose();
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget && !isSubmitting && !isAccepting) onClose(); }} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} style={{ color: '#60a5fa' }}>
            {isPending ? 'Review & Seat Reservation' : 'Seat Player & Check-In'}
          </h2>
          <button className={styles.modalCloseBtn} onClick={onClose} disabled={isSubmitting || isAccepting}>✕</button>
        </div>

        {/* Advisory banner if reservation is in the future */}
        {isFuture && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            fontSize: '0.82rem',
            color: '#fde047',
            lineHeight: '1.45'
          }}>
            <strong style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.88rem' }}>
              ⏰ Scheduled For: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (in {Math.floor(diffMinutes / 60)}h {diffMinutes % 60}m)
            </strong>
            This station is reserved for that time. Only click &ldquo;Seat Early&rdquo; if the customer has arrived early and wants to start playing immediately.
          </div>
        )}

        <div className={styles.detailCard}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Player:</span>
            <span className={styles.detailValue}>{booking.guestName || booking.user?.fullName || booking.user?.username || 'Guest Player'}</span>
          </div>
          {(booking.guestPhone || booking.user?.phone) && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Contact:</span>
              <span className={styles.detailValue}>{booking.guestPhone || booking.user?.phone}</span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Reserved Station:</span>
            <span className={styles.detailValue} style={{ color: 'var(--primary-accent)' }}>{booking.console.hardwareTitle}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Time Window:</span>
            <span className={styles.detailValue}>
              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({durationHours} hrs)
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Reservation Status:</span>
            <span className={styles.detailValue} style={{ color: isPending ? '#facc15' : '#34d399', fontWeight: 700 }}>
              {isPending ? 'Awaiting Acceptance' : 'Confirmed & Held'}
            </span>
          </div>
          <div className={`${styles.detailRow} ${styles.detailRowHighlight}`}>
            <span>Total Payable:</span>
            <span style={{ color: 'var(--primary-accent)', fontSize: '1.25rem', fontWeight: 900 }}>PKR {estimatedTotal}</span>
          </div>
        </div>

        <div className={styles.field} style={{ marginBottom: '1.5rem' }}>
          <label className={styles.label}>Collect Payment Via</label>
          <div className={styles.paymentOptions}>
            <button
              type="button"
              className={`${styles.paymentBtn} ${paymentMethod === 'cash' ? styles.paymentBtnActive : ''}`}
              onClick={() => setPaymentMethod('cash')}
            >
              Cash
            </button>
            <button
              type="button"
              className={`${styles.paymentBtn} ${paymentMethod === 'card' ? styles.paymentBtnActive : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              Card
            </button>
            <button
              type="button"
              className={`${styles.paymentBtn} ${paymentMethod === 'account' ? styles.paymentBtnActive : ''}`}
              onClick={() => setPaymentMethod('account')}
            >
              Account
            </button>
          </div>
        </div>

        <div className={styles.modalActions}>
          {isPending && onAccept && (
            <button
              type="button"
              onClick={handleAcceptOnly}
              disabled={isSubmitting || isAccepting}
              className={styles.actionBtnOutline}
              style={{
                borderColor: '#34d399',
                color: '#34d399',
                padding: '0.75rem',
                fontWeight: 700
              }}
            >
              {isAccepting ? 'Holding Station...' : `✓ Accept & Hold Station for ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isAccepting}
            className={styles.submitBtn}
          >
            {isSubmitting
              ? 'Activating Station...'
              : isFuture
              ? 'Seat Early & Start Live Session Now'
              : 'Confirm Payment & Start Session'}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isAccepting}
            className={styles.waitlistBtn}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
