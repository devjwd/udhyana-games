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
            Main Bazaar, Matta, Swat<br />
            Khyber Pakhtunkhwa<br />
            Pakistan
          </p>
        </div>

        <div className={styles.column}>
          <h3 className={styles.title}>Hours</h3>
          <p className={styles.text}>
            Monday – Sunday<br />
            10:00 AM – 12:00 AM<br />
            Open 7 Days a Week
          </p>
        </div>

        <div className={styles.column}>
          <h3 className={styles.title}>Connect</h3>
          <p className={styles.text}>
            Phone: <Link href="tel:+923000000000" className={styles.link}>+92 (300) 000-0000</Link><br />
            Email: <Link href="mailto:info@udhyanagames.com" className={styles.link}>info@udhyanagames.com</Link>
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
