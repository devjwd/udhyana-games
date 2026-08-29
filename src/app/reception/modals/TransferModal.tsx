'use client';

import React, { useEffect, useState } from 'react';
import styles from '../page.module.css';
import { ConsoleStation, Session } from '../types';

interface TransferModalProps {
  session: Session | null;
  consoles: ConsoleStation[];
  checkAvailability: (consoleId: string, durationSeconds: number) => { available: boolean; reason: string };
  onClose: () => void;
  onConfirm: (sessionId: string, targetConsoleId: string) => Promise<void>;
}

function TransferDialog({
  session,
  consoles,
  checkAvailability,
  onClose,
  onConfirm
}: {
  session: Session;
  consoles: ConsoleStation[];
  checkAvailability: (consoleId: string, durationSeconds: number) => { available: boolean; reason: string };
  onClose: () => void;
  onConfirm: (sessionId: string, targetConsoleId: string) => Promise<void>;
}) {
  const [targetConsoleId, setTargetConsoleId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleSubmit = async () => {
    if (!targetConsoleId) return;
    setIsSubmitting(true);
    try {
      await onConfirm(session.id, targetConsoleId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const playerName = session.guestName || session.user?.fullName || session.user?.username || 'Player';

  return (
    <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }} role="dialog" aria-modal="true">
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} style={{ color: '#ffb400' }}>Transfer Station</h2>
          <button className={styles.modalCloseBtn} onClick={onClose} disabled={isSubmitting}>✕</button>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
          Move <strong>{playerName}</strong> from <strong style={{ color: 'var(--primary-accent)' }}>{session.console.hardwareTitle}</strong> to another station with remaining time intact.
        </p>

        <div className={styles.field} style={{ marginBottom: '1.5rem' }}>
          <label className={styles.label}>Select Destination Station</label>
          <select
            value={targetConsoleId}
            onChange={e => setTargetConsoleId(e.target.value)}
            className={styles.select}
            required
          >
            <option value="">— Select Open Station —</option>
            {consoles
              .filter(c => c.id !== session.consoleId)
              .map(c => {
                const avail = checkAvailability(c.id, 1800);
                return (
                  <option key={c.id} value={c.id} disabled={!avail.available}>
                    {c.name} {!avail.available ? `(${avail.reason})` : '(Available)'}
                  </option>
                );
              })}
          </select>
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!targetConsoleId || isSubmitting}
            className={styles.submitBtn}
            style={{ background: '#ffb400', color: '#000' }}
          >
            {isSubmitting ? 'Moving Station...' : 'Confirm Station Transfer'}
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

export default function TransferModal(props: TransferModalProps) {
  if (!props.session) return null;
  return <TransferDialog key={props.session.id} {...props} session={props.session} />;
}
