import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer} id="location">
      <div className={styles.container}>
        <div className={styles.column}>
          <h3 className={styles.title}>Udhyana Games</h3>
          <p className={styles.text}>
            The ultimate premium console gaming experience. Level up your local multiplayer sessions in our state-of-the-art lounge.
          </p>
        </div>
        
        <div className={styles.column}>
          <h3 className={styles.title}>Location</h3>
          <p className={styles.text}>
            123 Cyber Avenue<br />
            Neon District, Sector 4<br />
            NY 10001
          </p>
        </div>

        <div className={styles.column}>
          <h3 className={styles.title}>Hours</h3>
          <p className={styles.text}>
            Mon-Thu: 12:00 PM - 12:00 AM<br />
            Fri-Sat: 12:00 PM - 2:00 AM<br />
            Sun: 10:00 AM - 10:00 PM
          </p>
        </div>

        <div className={styles.column}>
          <h3 className={styles.title}>Connect</h3>
          <p className={styles.text}>
            Phone: <Link href="tel:+15550198" className={styles.link}>(555) 019-8822</Link><br />
            Email: <Link href="mailto:hello@udhyanagames.com" className={styles.link}>hello@udhyanagames.com</Link>
          </p>
          <div className={styles.socials}>
            <Link href="#" className={styles.link}>Instagram</Link>
            <Link href="#" className={styles.link}>Twitter</Link>
            <Link href="#" className={styles.link}>Discord</Link>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        &copy; {new Date().getFullYear()} Udhyana Games. All rights reserved.
      </div>
    </footer>
  );
}
