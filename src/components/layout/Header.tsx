'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import CartDrawer from '../features/CartDrawer';
import MobileNav from './MobileNav';
import AuthModal from '../features/AuthModal';
import DigitalMemberPassModal from '../profile/DigitalMemberPassModal';
import GamingIcon from '@/components/ui/GamingIcon';
import { useCart } from '@/context/CartContext';
import styles from './Header.module.css';

export default function Header() {
  const { data: session } = useSession();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { itemCount } = useCart();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserDropdownOpen]);

  const user = session?.user;
  const isStaff = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <div className={styles.brandLogo}>
            <GamingIcon name="logo" size={32} />
            <span className={styles.brandTitle}>
              UDHYANA <span className={styles.brandAccent}>GAMES</span>
            </span>
          </div>
        </Link>

        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>HOME</Link>
          <Link href="/#about" className={styles.navLink}>ABOUT</Link>
          <Link href="/consoles" className={styles.navLink}>LOUNGES</Link>
          <Link href="/book" className={styles.navLink}>BOOK</Link>
          <Link href="/events" className={styles.navLink}>EVENTS</Link>
          <Link href="/shop" className={styles.navLink}>SHOP</Link>
        </nav>

        <div className={styles.actions}>
          {/* User Auth & VIP Pass Button */}
          {user ? (
            <div className={styles.authContainer}>
              {/* Loyalty Points Pill Button */}
              <button
                className={styles.loyaltyBtn}
                onClick={() => setIsPassModalOpen(true)}
                title="View VIP Pass & XP History"
                aria-label="Loyalty VIP Pass"
              >
                <span className={styles.loyaltyIcon}>⚡</span>
                <span>{user.loyaltyPoints ?? 0} XP</span>
                <span className={styles.rankMiniBadge}>{user.rank || 'ROOKIE'}</span>
              </button>

              {/* User Dropdown */}
              <div className={styles.userMenuWrapper} ref={dropdownRef}>
                <button
                  className={styles.userMenuBtn}
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  aria-label="User menu"
                >
                  {(user.username || user.name || 'U').charAt(0).toUpperCase()}
                </button>

                {isUserDropdownOpen && (
                  <div className={styles.userDropdown}>
                    <div className={styles.userDropdownHeader}>
                      <div className={styles.userDropdownName}>{user.name || user.username}</div>
                      <div className={styles.userDropdownTag}>@{user.username || 'member'}</div>
                    </div>

                    <button
                      className={styles.userDropdownItem}
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setIsPassModalOpen(true);
                      }}
                    >
                      <span>💳</span> VIP Member Pass
                    </button>

                    {isStaff && (
                      <Link
                        href={user.role === 'ADMIN' ? '/admin' : '/reception'}
                        className={styles.userDropdownItem}
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <span>⚙️</span> {user.role === 'ADMIN' ? 'Admin Portal' : 'Reception POS'}
                      </Link>
                    )}

                    <button
                      className={styles.userDropdownItem}
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      style={{ color: '#f87171' }}
                    >
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              className={styles.loginBtn}
              onClick={() => setIsAuthModalOpen(true)}
              aria-label="Login or Sign Up"
            >
              <span>Login</span>
              <span className={styles.bonusPill}>+50 XP</span>
            </button>
          )}

          {/* Cart Icon */}
          <button className={styles.cart} onClick={() => setIsCartOpen(true)} aria-label="Cart">
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
          </button>

          {/* Hamburger Menu */}
          <button className={styles.hamburger} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Menu">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        <MobileNav
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onOpenPass={() => setIsPassModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </header>

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <DigitalMemberPassModal isOpen={isPassModalOpen} onClose={() => setIsPassModalOpen(false)} />
    </>
  );
}
