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
          cart.map(item => (
            <div key={item.id} className={styles.cartItem}>
              <div className={styles.cartItemDetails}>
                <span className={styles.cartItemName}>{item.name}</span>
                {item.type === 'session' && item.consoleName && (
                  <span className={styles.cartItemSub}>Station: {item.consoleName}</span>
                )}
                {item.type === 'waitlist' && (
                  <span className={styles.cartItemSub} style={{ color: '#ffb400', fontWeight: 800 }}>
                    ⏳ Paid Waitlist Queue Spot ({item.consoleName || 'Any Station'})
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className={styles.cartItemPrice}>PKR {item.price}</span>
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
          ))
        )}
      </div>

      <div className={styles.cartTotalSection}>
        <div className={styles.cartTotalRow}>
          <span>Total Amount:</span>
          <span className={styles.cartTotalAmount}>PKR {totalAmount}</span>
        </div>

        <div className={styles.field} style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
          <label className={styles.label}>Payment Method</label>
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
        </div>

        <button
          type="button"
          className={styles.checkoutBtn}
          onClick={onCheckout}
          disabled={cart.length === 0}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
