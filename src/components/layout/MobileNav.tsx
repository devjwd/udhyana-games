'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import styles from './Header.module.css';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPass?: () => void;
  onOpenAuth?: () => void;
}

export default function MobileNav({ isOpen, onClose, onOpenPass, onOpenAuth }: MobileNavProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const isStaff = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  if (!isOpen) return null;

  return (
    <div className={styles.mobileNav}>
      {/* Mobile User Loyalty / Sign In Section */}
      <div style={{ padding: '0.75rem clamp(1.5rem, 5vw, 5rem)', borderBottom: '1px solid var(--border)', background: 'rgba(214, 255, 1, 0.03)' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{user.name || user.username}</div>
              <div style={{ fontSize: '0.72rem', color: '#8e95a5' }}>@{user.username || 'gamer'}</div>
            </div>
            <button
              className={styles.loyaltyBtn}
              onClick={() => {
                onClose();
                onOpenPass?.();
              }}
            >
              <span className={styles.loyaltyIcon}>⚡</span>
              <span>{user.loyaltyPoints ?? 0} XP</span>
              <span className={styles.rankMiniBadge}>{user.rank || 'ROOKIE'}</span>
            </button>
          </div>
        ) : (
          <button
            className={styles.loginBtn}
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => {
              onClose();
              onOpenAuth?.();
            }}
          >
            <span>Login / Join</span>
            <span className={styles.bonusPill}>+50 XP GIFT</span>
          </button>
        )}
      </div>

      <Link href="/" className={styles.mobileNavLink} onClick={onClose}>HOME</Link>
      <div className={styles.mobileNavGroup}>
        <span className={styles.mobileNavLabel}>LOUNGE</span>
        <Link href="/consoles" className={styles.mobileNavSub} onClick={onClose}>Main Lounge</Link>
        <Link href="/consoles?section=vip" className={styles.mobileNavSub} onClick={onClose}>VIP Suite</Link>
        <Link href="/events" className={styles.mobileNavSub} onClick={onClose}>Tournament Arena</Link>
        <Link href="/consoles?section=pc" className={styles.mobileNavSub} onClick={onClose}>PC Zone</Link>
      </div>
      <Link href="/#about" className={styles.mobileNavLink} onClick={onClose}>ABOUT</Link>
      <Link href="/consoles" className={styles.mobileNavLink} onClick={onClose}>LOUNGES</Link>
      <Link href="/book" className={styles.mobileNavLink} onClick={onClose}>BOOK</Link>
      <Link href="/events" className={styles.mobileNavLink} onClick={onClose}>EVENTS</Link>
      <Link href="/shop" className={styles.mobileNavLink} onClick={onClose}>SHOP</Link>

      {user && (
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', padding: '0.5rem 0' }}>
          <button
            className={styles.mobileNavLink}
            style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={() => {
              onClose();
              onOpenPass?.();
            }}
          >
            💳 VIP PASS & XP HISTORY
          </button>

          {isStaff && (
            <Link
              href={user.role === 'ADMIN' ? '/admin' : '/reception'}
              className={styles.mobileNavLink}
              onClick={onClose}
            >
              ⚙️ {user.role === 'ADMIN' ? 'ADMIN PORTAL' : 'RECEPTION POS'}
            </Link>
          )}

          <button
            className={styles.mobileNavLink}
            style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171' }}
            onClick={() => {
              onClose();
              signOut({ callbackUrl: '/' });
            }}
          >
            🚪 SIGN OUT
          </button>
        </div>
      )}
    </div>
  );
}
