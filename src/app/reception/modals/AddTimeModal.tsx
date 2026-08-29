'use client';

import React, { useEffect, useState } from 'react';
import styles from '../page.module.css';
import { Session } from '../types';

interface AddTimeModalProps {
  session: Session | null;
  baseRate: number;
  onClose: () => void;
  onConfirm: (sessionId: string, additionalSeconds: number, paymentMethod: string, amount: number) => Promise<void>;
}

function AddTimeModalDialog({
  session,
  baseRate,
  onClose,
  onConfirm
}: {
  session: Session;
  baseRate: number;
  onClose: () => void;
  onConfirm: (sessionId: string, additionalSeconds: number, paymentMethod: string, amount: number) => Promise<void>;
}) {
  const [selectedHours, setSelectedHours] = useState<number>(1);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'account'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const quickOptions = [
    { label: '+30 Mins', hours: 0.5, seconds: 1800, cost: baseRate * 0.5 },
    { label: '+1 Hour', hours: 1, seconds: 3600, cost: baseRate },
    { label: '+2 Hours', hours: 2, seconds: 7200, cost: baseRate * 2 },
    { label: '+3 Hours', hours: 3, seconds: 10800, cost: baseRate * 3 },
  ];

  const currentSeconds = customMinutes ? Math.max(0, parseInt(customMinutes, 10) * 60) : selectedHours * 3600;
  const currentCost = Math.round((currentSeconds / 3600) * baseRate);

  const handleSubmit = async () => {
    if (currentSeconds <= 0) return;
    setIsSubmitting(true);
    try {
      await onConfirm(session.id, currentSeconds, paymentMethod, currentCost);
    } finally {
      setIsSubmitting(false);
    }
  };

  const playerName = session.guestName || session.user?.fullName || session.user?.username || 'Player';

  return (
    <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} style={{ color: 'var(--primary-accent)' }}>Extend Session Time</h2>
          <button className={styles.modalCloseBtn} onClick={onClose} disabled={isSubmitting}>✕</button>
        </div>

        <div className={styles.detailCard} style={{ marginBottom: '1.25rem' }}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Station:</span>
            <span className={styles.detailValue} style={{ color: 'var(--primary-accent)' }}>{session.console.hardwareTitle}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Player:</span>
            <span className={styles.detailValue}>{playerName}</span>
          </div>
        </div>

        <div className={styles.field} style={{ marginBottom: '1.25rem' }}>
          <label className={styles.label}>Quick Add Duration</label>
          <div className={styles.gridOptions} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {quickOptions.map(opt => (
              <button
                key={opt.hours}
                type="button"
                className={`${styles.optionBtn} ${!customMinutes && selectedHours === opt.hours ? styles.optionBtnActive : ''}`}
                onClick={() => {
                  setSelectedHours(opt.hours);
                  setCustomMinutes('');
                }}
              >
                <span style={{ fontWeight: 800 }}>{opt.label}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>PKR {opt.cost}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field} style={{ marginBottom: '1.25rem' }}>
          <label className={styles.label}>Or Custom Minutes</label>
          <input
            type="number"
            min="5"
            step="5"
            placeholder="e.g. 45"
            value={customMinutes}
            onChange={e => setCustomMinutes(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.field} style={{ marginBottom: '1.25rem' }}>
          <label className={styles.label}>Collect Payment Via</label>
          <div className={styles.paymentOptions}>
            <button
              type="button"
              className={`${styles.paymentBtn} ${paymentMethod === 'cash' ? styles.paymentBtnActive : ''}`}
              onClick={() => setPaymentMethod('cash')}
            >
              💵 Cash
            </button>
            <button
              type="button"
              className={`${styles.paymentBtn} ${paymentMethod === 'card' ? styles.paymentBtnActive : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              💳 Card
            </button>
            <button
              type="button"
              className={`${styles.paymentBtn} ${paymentMethod === 'account' ? styles.paymentBtnActive : ''}`}
              onClick={() => setPaymentMethod('account')}
            >
              👤 Account
            </button>
          </div>
        </div>

        <div className={styles.slipTotalRow} style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.85rem 1rem', borderRadius: '6px' }}>
          <span>Additional Charge:</span>
          <span className={styles.slipTotalAmount}>PKR {currentCost}</span>
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={currentSeconds <= 0 || isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? 'Recording Payment & Adding Time...' : `Mark as Paid & Add +${Math.round(currentSeconds / 60)} Mins`}
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

export default function AddTimeModal(props: AddTimeModalProps) {
  if (!props.session) return null;
  return <AddTimeModalDialog key={props.session.id} {...props} session={props.session} />;
}
