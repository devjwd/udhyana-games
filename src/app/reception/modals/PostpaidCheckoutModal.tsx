'use client';

import React, { useEffect, useState, useMemo } from 'react';
import styles from '../page.module.css';
import { Session, SnackItem } from '../types';

interface PostpaidCheckoutModalProps {
  session: Session | null;
  baseRate: number;
  extraControllerRate: number;
  snacks: SnackItem[];
  onClose: () => void;
  onConfirm: (
    sessionId: string,
    paymentMethod: string,
    customGamingAmount: number,
    snackItems: { name: string; price: number; quantity: number; type: string }[]
  ) => Promise<void>;
}

interface AddedSnack {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

function PostpaidCheckoutDialog({
  session,
  baseRate,
  extraControllerRate,
  snacks,
  onClose,
  onConfirm
}: {
  session: Session;
  baseRate: number;
  extraControllerRate: number;
  snacks: SnackItem[];
  onClose: () => void;
  onConfirm: (
    sessionId: string,
    paymentMethod: string,
    customGamingAmount: number,
    snackItems: { name: string; price: number; quantity: number; type: string }[]
  ) => Promise<void>;
}) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'account'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [customGamingPrice, setCustomGamingPrice] = useState<string>('');
  const [addedSnacks, setAddedSnacks] = useState<AddedSnack[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Calculate elapsed time from session start
  const startTime = useMemo(() => new Date(session.startTime), [session.startTime]);
  const [nowTime] = useState<Date>(() => new Date());

  const elapsedSeconds = useMemo(() => {
    return Math.max(60, Math.floor((nowTime.getTime() - startTime.getTime()) / 1000));
  }, [nowTime, startTime]);

  const totalMinutes = Math.ceil(elapsedSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  // Minimum 15 mins billable
  const billableMinutes = Math.max(15, totalMinutes);
  const calculatedTimeCharge = Math.round((billableMinutes / 60) * baseRate);
  const controllersCount = session.extraControllers || 0;
  const controllerFee = controllersCount * extraControllerRate;
  const calculatedGamingTotal = calculatedTimeCharge + controllerFee;

  const finalGamingAmount = isCustomAmount && customGamingPrice !== ''
    ? Math.max(0, parseInt(customGamingPrice, 10) || 0)
    : calculatedGamingTotal;

  const snacksTotal = addedSnacks.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const grandTotal = finalGamingAmount + snacksTotal;

  const changeDue = useMemo(() => {
    const tendered = parseFloat(cashTendered);
    if (isNaN(tendered) || tendered < grandTotal) return 0;
    return tendered - grandTotal;
  }, [cashTendered, grandTotal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleAddSnack = (snack: SnackItem) => {
    setAddedSnacks(prev => {
      const existing = prev.find(s => s.id === snack.id);
      if (existing) {
        return prev.map(s => s.id === snack.id ? { ...s, quantity: s.quantity + 1 } : s);
      }
      return [...prev, { id: snack.id, name: snack.name, price: snack.price, quantity: 1 }];
    });
  };

  const handleUpdateSnackQty = (id: string, delta: number) => {
    setAddedSnacks(prev => {
      return prev
        .map(s => {
          if (s.id === id) {
            const nextQty = s.quantity + delta;
            return nextQty > 0 ? { ...s, quantity: nextQty } : null;
          }
          return s;
        })
        .filter((s): s is AddedSnack => s !== null);
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const snackPayload = addedSnacks.map(s => ({
        name: s.name,
        price: s.price,
        quantity: s.quantity,
        type: 'snack'
      }));

      await onConfirm(session.id, paymentMethod, finalGamingAmount, snackPayload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const playerName = session.guestName || session.user?.fullName || session.user?.username || 'Guest Player';
  const startTimeFormatted = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTimeFormatted = nowTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={styles.modalOverlay}
      onClick={e => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modalContent} style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🧾</span>
            <div>
              <h2 className={styles.modalTitle} style={{ color: 'var(--primary-accent)', margin: 0 }}>
                End & Bill Open Session
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                Open Session • Real-Time Calculation
              </span>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose} disabled={isSubmitting}>✕</button>
        </div>

        {/* Station & Player Summary */}
        <div className={styles.detailCard} style={{ marginBottom: '1rem', background: 'rgba(193, 255, 28, 0.04)', borderColor: 'rgba(193, 255, 28, 0.2)' }}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Station:</span>
            <span className={styles.detailValue} style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>
              {session.console.hardwareTitle}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Player:</span>
            <span className={styles.detailValue}>
              {playerName} {session.user?.phone ? `(${session.user.phone})` : ''}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Session Time:</span>
            <span className={styles.detailValue}>
              {startTimeFormatted} → {endTimeFormatted}
            </span>
          </div>
          <div className={styles.detailRow} style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
            <span className={styles.detailLabel} style={{ fontWeight: 700, color: '#fff' }}>Total Playtime:</span>
            <span className={styles.detailValue} style={{ color: 'var(--primary-accent)', fontWeight: 800, fontSize: '0.95rem' }}>
              {hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`} ({billableMinutes}m billed @ PKR {baseRate}/hr)
            </span>
          </div>
        </div>

        {/* Gaming Charges Breakdown */}
        <div className={styles.field} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label className={styles.label} style={{ margin: 0 }}>Gaming Time Charge</label>
            <button
              type="button"
              onClick={() => {
                setIsCustomAmount(!isCustomAmount);
                if (!isCustomAmount) setCustomGamingPrice(calculatedGamingTotal.toString());
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary-accent)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isCustomAmount ? 'Reset to Auto Calculation' : '✏️ Custom / Discount'}
            </button>
          </div>

          {!isCustomAmount ? (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.65rem 0.85rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Playtime Fee: PKR {calculatedTimeCharge}</div>
                {controllersCount > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                    +{controllersCount} Extra Controller{controllersCount > 1 ? 's' : ''}: PKR {controllerFee}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-accent)' }}>
                PKR {calculatedGamingTotal}
              </span>
            </div>
          ) : (
            <div>
              <input
                type="number"
                min="0"
                step="10"
                placeholder="Enter custom gaming amount in PKR"
                value={customGamingPrice}
                onChange={e => setCustomGamingPrice(e.target.value)}
                className={styles.input}
                style={{ fontSize: '0.95rem', borderColor: 'var(--primary-accent)' }}
              />
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem', display: 'block' }}>
                Auto-calculated was PKR {calculatedGamingTotal}. Enter adjusted final gaming amount.
              </span>
            </div>
          )}
        </div>

        {/* Add Snacks & Drinks Tab */}
        <div className={styles.field} style={{ marginBottom: '1rem' }}>
          <label className={styles.label}>Add Snacks / Drinks to Tab</label>

          {/* Quick Snack Badges */}
          {snacks.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
              {snacks.map(snack => (
                <button
                  key={snack.id}
                  type="button"
                  onClick={() => handleAddSnack(snack)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '5px',
                    padding: '0.3rem 0.6rem',
                    color: '#fff',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary-accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                >
                  <span>{snack.icon || '🥤'}</span>
                  <span>{snack.name}</span>
                  <span style={{ color: 'var(--primary-accent)', fontWeight: 700 }}>(+PKR {snack.price})</span>
                </button>
              ))}
            </div>
          )}

          {/* Added Snacks List */}
          {addedSnacks.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}>
              {addedSnacks.map(snack => (
                <div key={snack.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span>{snack.name} (PKR {snack.price} × {snack.quantity})</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary-accent)', marginRight: '0.4rem' }}>
                      PKR {snack.price * snack.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateSnackQty(snack.id, -1)}
                      style={{
                        background: 'rgba(255, 59, 48, 0.2)',
                        border: '1px solid rgba(255, 59, 48, 0.4)',
                        color: '#ff4d4f',
                        borderRadius: '3px',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem'
                      }}
                    >
                      -
                    </button>
                    <span style={{ minWidth: '14px', textAlign: 'center', fontWeight: 700 }}>{snack.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateSnackQty(snack.id, 1)}
                      style={{
                        background: 'rgba(193, 255, 28, 0.2)',
                        border: '1px solid rgba(193, 255, 28, 0.4)',
                        color: 'var(--primary-accent)',
                        borderRadius: '3px',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className={styles.field} style={{ marginBottom: '1rem' }}>
          <label className={styles.label}>Payment Method</label>
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
              👤 Member Account
            </button>
          </div>
        </div>

        {/* Cash Tendered & Change Calculator */}
        {paymentMethod === 'cash' && (
          <div className={styles.field} style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className={styles.label} style={{ margin: 0 }}>Cash Tendered (PKR)</label>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[grandTotal, Math.ceil(grandTotal / 500) * 500, Math.ceil(grandTotal / 1000) * 1000].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 3).map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashTendered(amt.toString())}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '4px',
                      padding: '0.15rem 0.4rem',
                      color: '#fff',
                      fontSize: '0.68rem',
                      cursor: 'pointer'
                    }}
                  >
                    PKR {amt}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="0"
              placeholder={`Enter cash given (e.g. ${grandTotal})`}
              value={cashTendered}
              onChange={e => setCashTendered(e.target.value)}
              className={styles.input}
            />

            {parseFloat(cashTendered) >= grandTotal && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.4rem 0.6rem',
                background: 'rgba(193, 255, 28, 0.1)',
                border: '1px solid rgba(193, 255, 28, 0.3)',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-accent)' }}>Return Change:</span>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary-accent)' }}>
                  PKR {changeDue}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Final Total Summary */}
        <div className={styles.slipTotalRow} style={{
          marginBottom: '1.25rem',
          background: 'rgba(193, 255, 28, 0.08)',
          padding: '1rem 1.25rem',
          borderRadius: '8px',
          border: '1px solid rgba(193, 255, 28, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Total Amount to Collect</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
              Gaming: PKR {finalGamingAmount} {addedSnacks.length > 0 ? `+ Snacks: PKR ${snacksTotal}` : ''}
            </div>
          </div>
          <span className={styles.slipTotalAmount} style={{ fontSize: '1.5rem', color: 'var(--primary-accent)', fontWeight: 900 }}>
            PKR {grandTotal}
          </span>
        </div>

        {/* Modal Actions */}
        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || grandTotal < 0}
            className={styles.submitBtn}
            style={{ flex: 1, padding: '0.85rem' }}
          >
            {isSubmitting ? 'Processing Settlement & Clearing Station...' : `✓ Settle & Complete (PKR ${grandTotal})`}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={styles.waitlistBtn}
            style={{ padding: '0.85rem' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PostpaidCheckoutModal(props: PostpaidCheckoutModalProps) {
  if (!props.session) return null;
  return <PostpaidCheckoutDialog key={props.session.id} {...props} session={props.session} />;
}
