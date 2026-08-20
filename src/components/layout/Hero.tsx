import Image from 'next/image';
import styles from './Hero.module.css';
import { Button } from '@/components/ui/Button';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.accentTriangle}></div>
      <div className={styles.background}>
        <Image
          src="/images/hero_background.png"
          alt="Premium Console Gaming Setup"
          fill
          priority
          className={styles.backgroundImage}
        />
        <div className={styles.overlay}></div>
      </div>
      <div className={styles.content}>
        <span className={styles.kicker}>Book Now</span>
        <h1 className={styles.headline}>
          Play Elevated<br />
          Experience
        </h1>
        <p className={styles.subheadline}>
          Premium console stations, dedicated cooling, and the best local multiplayer atmosphere. Step in and level up your game with our state-of-the-art setups.
        </p>
        <Button variant="solid" size="lg">Book A Console</Button>
      </div>
    </section>
  );
}
