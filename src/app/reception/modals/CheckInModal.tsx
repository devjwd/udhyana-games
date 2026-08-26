'use client';

import React, { useEffect, useState } from 'react';
import styles from '../page.module.css';
import { UpcomingBooking } from '../types';

interface CheckInModalProps {
  booking: UpcomingBooking | null;
  baseRate: number;
  onClose: () => void;
  onConfirm: (bookingId: string, paymentMethod: string) => Promise<void>;
}

export default function CheckInModal({
  booking,
  baseRate,
  onClose,
  onConfirm
}: CheckInModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'account'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (booking) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [booking, isSubmitting, onClose]);

  if (!booking) return null;

  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);
  const durationHours = Math.max(0.5, (endTime.getTime() - startTime.getTime()) / (1000 * 3600));
  const estimatedTotal = Math.round(durationHours * baseRate);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(booking.id, paymentMethod);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} style={{ color: '#60a5fa' }}>Check-In Reservation</h2>
          <button className={styles.modalCloseBtn} onClick={onClose} disabled={isSubmitting}>✕</button>
        </div>

        <div className={styles.detailCard}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Player:</span>
            <span className={styles.detailValue}>{booking.user.fullName || booking.user.username}</span>
          </div>
          {booking.user.phone && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Contact:</span>
              <span className={styles.detailValue}>{booking.user.phone}</span>
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
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? 'Activating Station...' : 'Confirm Payment & Start Session'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={styles.waitlistBtn}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
