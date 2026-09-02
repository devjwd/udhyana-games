'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { createOnlineShopOrder } from '@/backend/actions';
import CyberButton from '@/components/ui/CyberButton';
import styles from './CartDrawer.module.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const pointsToEarn = Math.max(1, Math.floor(subtotal / 10));

  const handleCheckout = async () => {
    if (!session?.user?.id) {
      alert('Please log in to complete your purchase and claim your loyalty reward points!');
      return;
    }

    try {
      setIsCheckingOut(true);
      const res = await createOnlineShopOrder(session.user.id, items, subtotal, 'ONLINE');
      if (res && 'error' in res && res.error) {
        alert(res.error);
        return;
      }
      if (res && 'pointsEarned' in res) {
        setSuccessMessage(`Order Confirmed! You earned +${res.pointsEarned} Loyalty Points!`);
      } else {
        setSuccessMessage('Order Confirmed!');
      }
      clearCart();
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
        router.push('/');
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout failed.';
      alert(msg);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} onClick={onClose}></div>
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>🛒</span>
            <h2 className={styles.title}>Your Gear Loadout</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close cart">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {successMessage ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#d6ff01' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              {successMessage}
            </h3>
            <p style={{ color: '#7f8388', fontSize: '0.85rem' }}>Redirecting to your Profile...</p>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {items.length === 0 && (
                <div className={styles.emptyContainer}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>🎒</div>
                  <p className={styles.emptyState}>Your cart loadout is currently empty.</p>
                  <button
                    onClick={onClose}
                    className={styles.shopNowBtn}
                  >
                    Browse Equipment →
                  </button>
                </div>
              )}
              {items.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemImageWrap}>
                    <Image
                      src={item.image || '/images/products/headphones.png'}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className={styles.itemImage}
                    />
                  </div>

                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemPrice}>
                      PKR {(item.price * item.quantity).toLocaleString()}
                    </span>

                    {/* Quantity controls */}
                    <div className={styles.qtyRow}>
                      <div className={styles.qtyControls}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className={styles.qtyButton}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className={styles.qtyNumber}>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className={styles.qtyButton}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        className={styles.removeLink}
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className={styles.loyaltyBar}>
                <span style={{ color: '#7f8388' }}>⭐ Loyalty XP Earned:</span>
                <span style={{ color: '#d6ff01', fontWeight: 800 }}>+{pointsToEarn} XP</span>
              </div>
            )}

            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total Amount</span>
                <span className={styles.totalValue}>PKR {subtotal.toLocaleString()}</span>
              </div>
              <CyberButton
                onClick={handleCheckout}
                disabled={items.length === 0 || isCheckingOut}
                fullWidth
              >
                {isCheckingOut ? 'Processing Order...' : 'Checkout & Claim XP'}
              </CyberButton>
            </div>
          </>
        )}
      </div>
    </>
  );
}
