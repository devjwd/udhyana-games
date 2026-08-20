import Link from 'next/link';
import styles from './Header.module.css';

export const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Lounge', path: '/consoles' },
  { name: 'Events', path: '/events' },
  { name: 'Shop', path: '/shop' },
  { name: 'About', path: '/about' },
];

export default function DesktopNav() {
  return (
    <nav className={styles.nav}>
      {navLinks.map(link => (
        <Link key={link.name} href={link.path} className={styles.navLink}>{link.name}</Link>
      ))}
      <Link href="/book" className={styles.bookBtn}>Book</Link>
    </nav>
  );
}
