import Link from 'next/link';
import styles from './Header.module.css';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.mobileNav}>
      <Link href="/" className={styles.mobileNavLink} onClick={onClose}>HOME</Link>
      <div className={styles.mobileNavGroup}>
        <span className={styles.mobileNavLabel}>LOUNGE</span>
        <Link href="/consoles" className={styles.mobileNavSub} onClick={onClose}>Main Lounge</Link>
        <Link href="/consoles?section=vip" className={styles.mobileNavSub} onClick={onClose}>VIP Suite</Link>
        <Link href="/events" className={styles.mobileNavSub} onClick={onClose}>Tournament Arena</Link>
        <Link href="/consoles?section=pc" className={styles.mobileNavSub} onClick={onClose}>PC Zone</Link>
      </div>
      <Link href="/about" className={styles.mobileNavLink} onClick={onClose}>ABOUT</Link>
      <Link href="/consoles" className={styles.mobileNavLink} onClick={onClose}>LOUNGES</Link>
      <Link href="/book" className={styles.mobileNavLink} onClick={onClose}>BOOK</Link>
      <Link href="/events" className={styles.mobileNavLink} onClick={onClose}>EVENTS</Link>
      <Link href="/shop" className={styles.mobileNavLink} onClick={onClose}>SHOP</Link>
    </div>
  );
}
