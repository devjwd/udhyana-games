'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AuthModal from '../features/AuthModal';
import CartDrawer from '../features/CartDrawer';
import MobileNav from './MobileNav';
import { useCart } from '@/context/CartContext';
import styles from './Header.module.css';

const locationsDropdown = [
  { name: 'Matta Lounge', path: '/consoles' },
  { name: 'Downtown Lounge', path: '/consoles' },
  { name: 'Westside Lounge', path: '/consoles' },
];

export default function Header() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { itemCount } = useCart();

  const handleTeamsEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTeamsOpen(true);
  };

  const handleTeamsLeave = () => {
    timeoutRef.current = setTimeout(() => setTeamsOpen(false), 150);
  };

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <Image src="/images/logo.png" alt="Udhyana Games" width={160} height={48} style={{ objectFit: 'contain' }} />
      </Link>

      <nav className={styles.nav}>
        <Link href="/" className={styles.navLink}>HOME</Link>

        {/* LOCATIONS dropdown */}
        <div
          className={styles.dropdownWrapper}
          onMouseEnter={handleTeamsEnter}
          onMouseLeave={handleTeamsLeave}
        >
          <button className={styles.navDropdownBtn}>
            LOCATIONS
            <svg className={`${styles.chevron} ${teamsOpen ? styles.chevronOpen : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {teamsOpen && (
            <div className={styles.dropdownMenu}>
              {locationsDropdown.map(item => (
                <Link key={item.name} href={item.path} className={styles.dropdownItem} onClick={() => setTeamsOpen(false)}>
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/about" className={styles.navLink}>ABOUT</Link>
        <Link href="/events" className={styles.navLink}>SCHEDULE</Link>
        <Link href="/events?tab=news" className={styles.navLink}>NEWS</Link>
        <Link href="/shop" className={styles.navLink}>SHOP</Link>
      </nav>

      <div className={styles.actions}>
        <button className={styles.icon} onClick={() => setIsAuthOpen(true)} aria-label="Account">
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        <button className={styles.cart} onClick={() => setIsCartOpen(true)} aria-label="Cart">
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
        </button>

        <button className={styles.hamburger} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Menu">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
