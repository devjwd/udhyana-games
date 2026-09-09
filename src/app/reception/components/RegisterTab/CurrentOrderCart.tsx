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
}

export default function CurrentOrderCart({
  cart,
  paymentMethod,
  onPaymentMethodChange,
  onRemoveItem,
  onClearCart,
  onCheckout
}: CurrentOrderCartProps) {
  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
  const hasPostpaid = cart.some(item => item.billingType === 'POSTPAID');

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

      <div className={styles.cartTotalSection}>
        <div className={styles.cartTotalRow}>
          <span>{hasPostpaid && totalAmount === 0 ? 'Billing Terms:' : 'Due Now:'}</span>
          <span className={styles.cartTotalAmount} style={hasPostpaid && totalAmount === 0 ? { fontSize: '1.05rem', color: 'var(--primary-accent)' } : {}}>
            {hasPostpaid && totalAmount === 0
              ? 'Pay on Checkout'
              : hasPostpaid
                ? `PKR ${totalAmount} (+ Session on Exit)`
                : `PKR ${totalAmount}`}
          </span>
        </div>

        <div className={styles.field} style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
          <label className={styles.label}>
            {hasPostpaid && totalAmount === 0 ? 'Settlement Type' : 'Payment Method'}
          </label>
          {hasPostpaid && totalAmount === 0 ? (
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
          {hasPostpaid && totalAmount === 0 ? '▶ Generate Slip & Start Session' : 'Proceed to Checkout'}
        </button>
      </div>
    </div>
  );
}
