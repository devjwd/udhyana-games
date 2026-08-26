'use client';

import React, { useEffect, useState } from 'react';
import styles from '../page.module.css';
import { WaitlistEntry, ConsoleStation, DurationOption } from '../types';
import toast from 'react-hot-toast';

interface AssignWaitlistModalProps {
  waiter: WaitlistEntry | null;
  consoles: ConsoleStation[];
  durations: DurationOption[];
  checkAvailability: (consoleId: string, durationSeconds: number) => {
    available: boolean;
    reason: string;
    isOccupied: boolean;
    isReserved: boolean;
  };
  onClose: () => void;
  onConfirm: (
    waitlistId: string,
    consoleId: string,
    durationSeconds: number,
    guestName: string,
    isPrepaid: boolean,
    paymentMethod: string,
    amount: number
  ) => Promise<void>;
}

export default function AssignWaitlistModal({
  waiter,
  consoles,
  durations,
  checkAvailability,
  onClose,
  onConfirm
}: AssignWaitlistModalProps) {
  const [selectedConsoleId, setSelectedConsoleId] = useState<string>('');
  const [selectedDurationId, setSelectedDurationId] = useState<string>('3600');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'account'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (waiter) {
      setPaymentMethod('cash');
      // Try to parse duration from requested string
      const req = waiter.requested.toLowerCase();
      if (req.includes('3h') || req.includes('3 hours') || req.includes('10800')) {
        setSelectedDurationId('10800');
      } else if (req.includes('2h') || req.includes('2 hours') || req.includes('7200')) {
        setSelectedDurationId('7200');
      } else if (req.includes('30m') || req.includes('0.5h') || req.includes('1800')) {
        setSelectedDurationId('1800');
      } else {
        setSelectedDurationId('3600');
      }

      // Try to match requested console
      const matched = consoles.find(c =>
        c.name.toLowerCase().includes(req.split(' •')[0].trim().toLowerCase()) ||
        c.id.toLowerCase() === req.split(' •')[0].trim().toLowerCase()
      );
      if (matched) {
        setSelectedConsoleId(matched.id);
      } else {
        const firstAvailable = consoles.find(c => checkAvailability(c.id, 3600).available);
        setSelectedConsoleId(firstAvailable ? firstAvailable.id : (consoles[0]?.id || ''));
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (waiter) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [waiter, consoles, checkAvailability, isSubmitting, onClose]);

  if (!waiter) return null;

  const isPrepaid = waiter.requested.toUpperCase().includes('PAID');
  const currentDuration = durations.find(d => d.id === selectedDurationId) || durations[1] || durations[0];
  const availability = selectedConsoleId
    ? checkAvailability(selectedConsoleId, currentDuration.seconds)
    : { available: false, reason: 'Select a station', isOccupied: false, isReserved: false };

  const handleSubmit = async () => {
    if (!selectedConsoleId) {
      toast.error('Please select an available station.');
      return;
    }
    if (!availability.available) {
      toast.error(`Station is unavailable: ${availability.reason}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(
        waiter.id,
        selectedConsoleId,
        currentDuration.seconds,
        waiter.name,
        isPrepaid,
        paymentMethod,
        isPrepaid ? 0 : currentDuration.price
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={e => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modalContent} style={{ maxWidth: '520px' }}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle} style={{ color: 'var(--primary-accent)' }}>
              Assign Station to Waitlist Player
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              Activate gaming timer for queued customer
            </span>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose} disabled={isSubmitting}>
            ✕
          </button>
        </div>

        {/* Waiter Details Card */}
        <div className={styles.detailCard} style={{ marginBottom: '1.25rem' }}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Gamer / Player:</span>
            <span className={styles.detailValue} style={{ fontWeight: 900, color: '#fff' }}>
              {waiter.name}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Queue Request:</span>
            <span className={styles.detailValue} style={{ color: 'var(--primary-accent)' }}>
              {waiter.requested}
            </span>
          </div>
          <div className={`${styles.detailRow} ${styles.detailRowHighlight}`}>
            <span>Payment Status:</span>
            <span
              style={{
                color: isPrepaid ? '#34d399' : '#ffb400',
                fontSize: '0.9rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {isPrepaid ? '✓ PRE-PAID AT ORDER (0 PKR Due)' : `Pay at Desk: PKR ${currentDuration.price}`}
            </span>
          </div>
        </div>

        {/* Station Selector */}
        <div className={styles.field} style={{ marginBottom: '1.25rem' }}>
          <label className={styles.label}>Select Available Gaming Station</label>
          <select
            className={styles.select}
            value={selectedConsoleId}
            onChange={e => setSelectedConsoleId(e.target.value)}
            disabled={isSubmitting}
          >
            {consoles.map(c => {
              const avail = checkAvailability(c.id, currentDuration.seconds);
              return (
                <option key={c.id} value={c.id}>
                  {c.name} {avail.available ? '• [AVAILABLE]' : `• [OCCUPIED: ${avail.reason}]`}
                </option>
              );
            })}
          </select>
          {!availability.available && selectedConsoleId && (
            <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
              ⚠️ {availability.reason}
            </span>
          )}
        </div>

        {/* Duration Selector */}
        <div className={styles.field} style={{ marginBottom: isPrepaid ? '1.5rem' : '1.25rem' }}>
          <label className={styles.label}>Confirmed Duration</label>
          <div className={styles.gridOptions} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {durations.map(d => (
              <button
                key={d.id}
                type="button"
                className={`${styles.optionBtn} ${selectedDurationId === d.id ? styles.optionBtnActive : ''}`}
                onClick={() => setSelectedDurationId(d.id)}
                disabled={isSubmitting}
              >
                <span className={styles.optionMainText}>{d.name.split(' (')[0]}</span>
                <span className={styles.optionSubText}>
                  {isPrepaid ? 'PAID' : `PKR ${d.price}`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Collect Payment selector if NOT prepaid */}
        {!isPrepaid && (
          <div className={styles.field} style={{ marginBottom: '1.5rem' }}>
            <label className={styles.label}>Collect Payment (PKR {currentDuration.price})</label>
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
        )}

        <button
          type="button"
          className={styles.modalSubmitBtn}
          style={{
            background: 'var(--primary-accent)',
            color: '#000',
            fontWeight: 900,
            opacity: availability.available ? 1 : 0.5,
            cursor: availability.available ? 'pointer' : 'not-allowed'
          }}
          onClick={handleSubmit}
          disabled={!availability.available || isSubmitting}
        >
          {isSubmitting
            ? 'Starting Session...'
            : !availability.available
              ? 'Station Occupied — Pick Another Station'
              : isPrepaid
                ? '🚀 Seat Player & Start Session'
                : `Mark as Paid (PKR ${currentDuration.price}) & Start Session`}
        </button>
      </div>
    </div>
  );
}
