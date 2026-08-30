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
  const { items, subtotal, removeItem, clearCart } = useCart();
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
        router.push('/profile');
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
          <h2 className={styles.title}>Your Cart</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close cart">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {successMessage ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#d6ff01' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{successMessage}</h3>
            <p style={{ color: '#7f8388', fontSize: '0.85rem' }}>Redirecting to your Profile...</p>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {items.length === 0 && (
                <p className={styles.emptyState}>Your cart is empty.</p>
              )}
              {items.map(item => (
                <div key={item.id} className={styles.cartItem}>
                  {item.image ? (
                    <Image src={item.image} alt={item.name} width={60} height={60} className={styles.itemImage} />
                  ) : (
                    <div style={{ width: 60, height: 60, background: '#141a20', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#7f8388' }}>ITEM</div>
                  )}
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemPrice}>
                      PKR {item.price * item.quantity}
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

            {items.length > 0 && (
              <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(214, 255, 1, 0.08)', borderTop: '1px solid #22272c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: '#7f8388' }}>⭐ Loyalty Reward:</span>
                <span style={{ color: '#d6ff01', fontWeight: 800 }}>+{pointsToEarn} Reward Points</span>
              </div>
            )}

            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalValue}>PKR {subtotal}</span>
              </div>
              <CyberButton
                onClick={handleCheckout}
                disabled={items.length === 0 || isCheckingOut}
                fullWidth
              >
                {isCheckingOut ? 'Processing...' : 'Checkout & Earn XP'}
              </CyberButton>
            </div>
          </>
        )}
      </div>
    </>
  );
}
