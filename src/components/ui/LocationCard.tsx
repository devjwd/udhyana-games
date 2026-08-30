import Image from 'next/image';
import styles from './ConsoleCard.module.css';

interface LocationCardProps {
  id: string;
  title: string;
  specs: string;
  description: string;
  image: string;
  status: string;
  statusColor: string;
  features: string[];
  onClick: () => void;
}

export default function LocationCard({ title, specs, description, image, status, statusColor, features, onClick }: LocationCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image src={image} alt={title} fill className={styles.image} />
        <div className={styles.statusBadge} style={{ color: statusColor }}>
          <span className={styles.statusDot} style={{ backgroundColor: statusColor }} />
          {status}
        </div>
      </div>
      <div className={styles.info}>
        <span className={styles.specs}>{specs}</span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        
        <div className={styles.gamesSection}>
          <span className={styles.gamesLabel}>Features &amp; Amenities</span>
          <div className={styles.gamesList}>
            {features.map(feature => (
              <span key={feature} className={styles.gameTag}>{feature}</span>
            ))}
          </div>
        </div>

        <button className={styles.bookBtn} onClick={onClick}>
          View Stations →
        </button>
      </div>
    </div>
  );
}

