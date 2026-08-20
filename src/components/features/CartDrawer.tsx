'use client';

import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import styles from './CartDrawer.module.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, subtotal, removeItem } = useCart();

  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} onClick={onClose}></div>
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Your Cart</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close cart">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className={styles.items}>
          {items.length === 0 && (
            <p className={styles.emptyState}>Your cart is empty.</p>
          )}
          {items.map(item => (
            <div key={item.id} className={styles.cartItem}>
              <Image src={item.image} alt={item.name} width={60} height={60} className={styles.itemImage} />
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemPrice}>
                  ${(item.price * item.quantity).toFixed(2)}
                  {item.quantity > 1 && <span style={{ opacity: 0.6 }}> ×{item.quantity}</span>}
                </span>
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.name}`}
                style={{ marginLeft: 'auto', flexShrink: 0 }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Subtotal</span>
            <span className={styles.totalValue}>${subtotal.toFixed(2)}</span>
          </div>
          <button
            className={styles.checkoutBtn}
            disabled={items.length === 0}
            style={{ opacity: items.length === 0 ? 0.5 : 1, cursor: items.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            Checkout
          </button>
        </div>
      </div>
    </>
  );
}
