import Image from 'next/image';
import styles from './VibeSection.module.css';

export default function VibeSection() {
  return (
    <section className={styles.vibeSection} id="lounge-vibe">
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.headline}>Designed for True Gamers.</h2>
          <p className={styles.description}>
            Immerse yourself in our premium physical gaming lounge. Engineered for ultimate comfort and peak performance, every station features state-of-the-art ergonomic seating, ultra-wide high-refresh-rate displays, and dedicated next-gen consoles with max-performance cooling. Whether you&apos;re grinding solo or throwing down in a local tournament, our immersive atmosphere ensures you play at your absolute best.
          </p>
        </div>
        <div className={styles.imageGrid}>
          <Image
            src="/images/lounge_interior.png"
            alt="Lounge Interior Vibe"
            fill
            className={styles.image}
          />
        </div>
      </div>
    </section>
  );
}
