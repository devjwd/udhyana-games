import Image from 'next/image';
import Link from 'next/link';
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
          <span className={styles.gamesLabel}>Featured Games</span>
          <div className={styles.gamesList}>
            {games.map(game => (
              <span key={game} className={styles.gameTag}>{game}</span>
            ))}
          </div>
        </div>

        <Link href={`/book?console=${id}`} style={{ width: '100%', marginTop: 'auto' }}>
          <button className={styles.bookBtn}>Book Station</button>
        </Link>
      </div>
    </div>
  );
}
