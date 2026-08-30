import Image from 'next/image';
import CyberButton from '@/components/ui/CyberButton';
import styles from './ConsoleCard.module.css';

interface ConsoleCardProps {
  id: string;
  title: string;
  specs: string;
  description: string;
  image: string;
  status: string;
  statusColor: string;
  games: string[];
}

export default function ConsoleCard({ id, title, specs, description, image, status, statusColor, games }: ConsoleCardProps) {
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
          <span className={styles.gamesLabel}>Available Titles</span>
          <div className={styles.gamesList}>
            {games.map(game => (
              <span key={game} className={styles.gameTag}>{game}</span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 'auto', width: '100%' }}>
          <CyberButton href={`/book?console=${id}`} fullWidth>
            Book Station →
          </CyberButton>
        </div>
      </div>
    </div>
  );
}

