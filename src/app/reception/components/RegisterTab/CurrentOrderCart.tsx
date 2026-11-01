'use client';

import React from 'react';
import styles from '../../page.module.css';
import { CartItem } from '../../types';

interface CurrentOrderCartProps {
  cart: CartItem[];
  paymentMethod: string;
  onPaymentMethodChange: (method: 'cash' | 'card' | 'account') => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  pointsToRedeem: number;
  onPointsToRedeemChange: (points: number) => void;
}

export default function CurrentOrderCart({
  cart,
  paymentMethod,
  onPaymentMethodChange,
  onRemoveItem,
  onClearCart,
  onCheckout,
  pointsToRedeem,
  onPointsToRedeemChange
}: CurrentOrderCartProps) {
  const grossTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const hasPostpaid = cart.some(item => item.billingType === 'POSTPAID');

  // Detect attached member from any session/waitlist item
  const memberItem = cart.find(item => item.userId);
  const memberPoints = memberItem?.userLoyaltyPoints ?? 0;
  const memberRank = memberItem?.userRank || 'ROOKIE';
  const memberName = memberItem?.userName || 'Member';

  // Game Time restriction: Points can strictly discount console sessions, not snacks
  const gameTimeSubtotal = cart
    .filter(item => item.type === 'session')
    .reduce((sum, item) => sum + item.price, 0);
  const nonGameTimeSubtotal = grossTotal - gameTimeSubtotal;

  const maxRedeemableXP = Math.min(memberPoints, gameTimeSubtotal);
  const activePointsRedeemed = Math.min(pointsToRedeem, maxRedeemableXP);
  const netDueNow = Math.max(0, grossTotal - activePointsRedeemed);
  const pointsToEarn = Math.floor(netDueNow / 100);

  const handlePointPillClick = (amount: number) => {
    onPointsToRedeemChange(Math.min(amount, maxRedeemableXP));
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderRow}>
        <h2 className={styles.panelHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>Current Order</h2>
        {cart.length > 0 && (
          <button type="button" onClick={onClearCart} className={styles.textBtnDanger}>
            Clear Cart
          </button>
        )}
      </div>

      <div className={styles.cartItems}>
        {cart.length === 0 ? (
          <div className={styles.cartEmptyState}>
            <span>🛒</span>
            <p>Order is empty. Add a gaming session or snacks to begin.</p>
          </div>
        ) : (
          cart.map(item => {
            const isPostpaid = item.billingType === 'POSTPAID';
            return (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.cartItemDetails}>
                  <span className={styles.cartItemName}>{item.name}</span>
                  {item.type === 'session' && item.consoleName && (
                    <span className={styles.cartItemSub}>Station: {item.consoleName}</span>
                  )}
                  {isPostpaid && (
                    <span className={styles.cartItemSub} style={{ color: 'var(--primary-accent)', fontWeight: 700 }}>
                      ⚡ Open Session • Accrues per minute • Pay at Exit
                    </span>
                  )}
                  {item.type === 'waitlist' && (
                    <span className={styles.cartItemSub} style={{ color: '#ffb400', fontWeight: 800 }}>
                      ⏳ Paid Waitlist Queue Spot ({item.consoleName || 'Any Station'})
                    </span>
                  )}
                  {item.type === 'snack' && (
                    <span className={styles.cartItemSub} style={{ color: '#94a3b8' }}>
                      Retail Snack / Drink (Cash only, points excluded)
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  {isPostpaid ? (
                    <span style={{
                      background: 'rgba(193, 255, 28, 0.12)',
                      color: 'var(--primary-accent)',
                      border: '1px solid rgba(193, 255, 28, 0.35)',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap'
                    }}>
                      Pay on Checkout
                    </span>
                  ) : (
                    <span className={styles.cartItemPrice}>PKR {item.price}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className={styles.cartItemRemove}
                    title="Remove from cart"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Loyalty Points Redemption Module */}
      {memberItem && gameTimeSubtotal > 0 && memberPoints > 0 && (
        <div style={{
          margin: '1rem 0',
          padding: '0.85rem',
          background: 'rgba(214, 255, 1, 0.04)',
          border: '1px solid rgba(214, 255, 1, 0.25)',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: '#d6ff01', fontSize: '0.9rem' }}>⚡</span>
              <strong style={{ fontSize: '0.82rem', color: '#fff' }}>
                Loyalty Discount ({memberName} - {memberRank})
              </strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#d6ff01', fontWeight: 800 }}>
              {memberPoints} XP Available (= PKR {memberPoints})
            </span>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.65rem' }}>
            Points discount Game Time up to PKR {gameTimeSubtotal}.
            {nonGameTimeSubtotal > 0 && ` (PKR ${nonGameTimeSubtotal} snacks require cash/card)`}
          </div>

          {/* Quick Redemption Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.65rem' }}>
            <button
              type="button"
              onClick={() => handlePointPillClick(0)}
              style={{
                background: activePointsRedeemed === 0 ? '#d6ff01' : 'rgba(255,255,255,0.08)',
                color: activePointsRedeemed === 0 ? '#000' : '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.25rem 0.55rem',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              No Points (0 XP)
            </button>
            {maxRedeemableXP >= 50 && (
              <button
                type="button"
                onClick={() => handlePointPillClick(50)}
                style={{
                  background: activePointsRedeemed === 50 ? '#d6ff01' : 'rgba(255,255,255,0.08)',
                  color: activePointsRedeemed === 50 ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                50 XP (-PKR 50)
              </button>
            )}
            {maxRedeemableXP >= 100 && (
              <button
                type="button"
                onClick={() => handlePointPillClick(100)}
                style={{
                  background: activePointsRedeemed === 100 ? '#d6ff01' : 'rgba(255,255,255,0.08)',
                  color: activePointsRedeemed === 100 ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                100 XP (-PKR 100)
              </button>
            )}
            {maxRedeemableXP >= 200 && (
              <button
                type="button"
                onClick={() => handlePointPillClick(200)}
                style={{
                  background: activePointsRedeemed === 200 ? '#d6ff01' : 'rgba(255,255,255,0.08)',
                  color: activePointsRedeemed === 200 ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                200 XP (-PKR 200)
              </button>
            )}
            <button
              type="button"
              onClick={() => handlePointPillClick(maxRedeemableXP)}
              style={{
                background: activePointsRedeemed === maxRedeemableXP ? '#d6ff01' : 'rgba(255,255,255,0.08)',
                color: activePointsRedeemed === maxRedeemableXP ? '#000' : '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.25rem 0.55rem',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Max ({maxRedeemableXP} XP)
            </button>
          </div>

          {/* Precise Points Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Custom Points:</span>
            <input
              type="number"
              min={0}
              max={maxRedeemableXP}
              value={activePointsRedeemed || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val)) onPointsToRedeemChange(0);
                else onPointsToRedeemChange(Math.min(Math.max(0, val), maxRedeemableXP));
              }}
              placeholder="0"
              style={{
                background: '#0d1015',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#d6ff01',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                width: '90px',
                fontSize: '0.8rem',
                fontWeight: 800
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              = -PKR {activePointsRedeemed} discount
            </span>
          </div>
        </div>
      )}

      <div className={styles.cartTotalSection}>
        {/* Breakdown if points redeemed */}
        {activePointsRedeemed > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.65rem', paddingBottom: '0.65rem', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span>Subtotal:</span>
              <span>PKR {grossTotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#4ade80', fontWeight: 700 }}>
              <span>⚡ Loyalty Discount ({activePointsRedeemed} XP):</span>
              <span>-PKR {activePointsRedeemed}</span>
            </div>
          </div>
        )}

        <div className={styles.cartTotalRow}>
          <span>{hasPostpaid && grossTotal === 0 ? 'Billing Terms:' : 'Due Now:'}</span>
          <span className={styles.cartTotalAmount} style={hasPostpaid && grossTotal === 0 ? { fontSize: '1.05rem', color: 'var(--primary-accent)' } : {}}>
            {hasPostpaid && grossTotal === 0
              ? 'Pay on Checkout'
              : hasPostpaid
                ? `PKR ${netDueNow} (+ Session on Exit)`
                : `PKR ${netDueNow}`}
          </span>
        </div>

        {memberItem && netDueNow > 0 && (
          <div style={{ fontSize: '0.7rem', color: '#a3e635', marginTop: '0.25rem' }}>
            🎁 Member will earn +{pointsToEarn} XP on this purchase (net cash)
          </div>
        )}

        <div className={styles.field} style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
          <label className={styles.label}>
            {hasPostpaid && grossTotal === 0 ? 'Settlement Type' : 'Payment Method'}
          </label>
          {hasPostpaid && grossTotal === 0 ? (
            <div style={{
              background: 'rgba(193, 255, 28, 0.06)',
              border: '1px solid rgba(193, 255, 28, 0.25)',
              borderRadius: '6px',
              padding: '0.65rem 0.85rem',
              fontSize: '0.78rem',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.1rem' }}>⚡</span>
              <div>
                <strong>Postpaid Gaming Pass</strong>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)' }}>
                  Player pays cash/card when checking out. Proceed to generate entry pass.
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.paymentOptions}>
              <button
                type="button"
                className={`${styles.paymentBtn} ${paymentMethod === 'cash' ? styles.paymentBtnActive : ''}`}
                onClick={() => onPaymentMethodChange('cash')}
              >
                Cash
              </button>
              <button
                type="button"
                className={`${styles.paymentBtn} ${paymentMethod === 'card' ? styles.paymentBtnActive : ''}`}
                onClick={() => onPaymentMethodChange('card')}
              >
                Card
              </button>
              <button
                type="button"
                className={`${styles.paymentBtn} ${paymentMethod === 'account' ? styles.paymentBtnActive : ''}`}
                onClick={() => onPaymentMethodChange('account')}
              >
                Account
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className={styles.checkoutBtn}
          onClick={onCheckout}
          disabled={cart.length === 0}
          style={hasPostpaid ? { background: 'var(--primary-accent)', color: '#000', fontWeight: 900 } : {}}
        >
          {hasPostpaid && grossTotal === 0 ? '▶ Generate Slip & Start Session' : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  );
}
