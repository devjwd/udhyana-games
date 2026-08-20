import Image from 'next/image';
import styles from './SidePromo.module.css';

export default function SidePromo() {
  return (
    <section className={styles.sidePromo}>
      <div className={styles.accentTriangle}></div>
      <div className={styles.background}>
        <Image
          src="/images/lounge_interior.png"
          alt="VIP Lounge Area"
          fill
          className={styles.backgroundImage}
        />
        <div className={styles.overlay}></div>
      </div>
      <div className={styles.content}>
        <span className={styles.kicker}>Next-Gen Ready</span>
        <h2 className={styles.headline}>
          The 2026<br />Collection
        </h2>
        <p className={styles.subheadline}>
          Check out our newly updated lineup of physical consoles and premium cooling stations.
        </p>
        <button className={styles.primaryBtn}>View Consoles</button>
      </div>
    </section>
  );
}
