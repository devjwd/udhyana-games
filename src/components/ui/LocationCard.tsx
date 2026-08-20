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
      <div className={styles.accentTriangle}></div>
      <div className={styles.statusBadge} style={{ color: statusColor }}>
        {status}
      </div>
      <div className={styles.imageWrapper}>
        <Image src={image} alt={title} fill className={styles.image} />
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.specs}>{specs}</span>
        <p className={styles.description}>{description}</p>
        
        <div className={styles.gamesSection}>
          <span className={styles.gamesLabel}>Features</span>
          <div className={styles.gamesList}>
            {features.map(feature => (
              <span key={feature} className={styles.gameTag}>{feature}</span>
            ))}
          </div>
        </div>

        <button className={styles.bookBtn} onClick={onClick}>
          View Consoles
        </button>
      </div>
    </div>
  );
}
