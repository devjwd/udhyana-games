import CyberButton from '@/components/ui/CyberButton';
import IconPlaceholder from '@/components/ui/IconPlaceholder';
import { getGamingIconType } from '@/components/ui/GamingIcon';
import styles from './ConsoleCard.module.css';

interface LocationCardProps {
  id: string;
  title: string;
  specs: string;
  description: string;
  image?: string;
  status: string;
  statusColor: string;
  features: string[];
  onClick: () => void;
}

export default function LocationCard({ title, specs, description, status, statusColor, features, onClick }: LocationCardProps) {
  const iconType = getGamingIconType(`${title} ${specs}`);

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <IconPlaceholder icon={iconType} title={title} size={72} />
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

        <div style={{ marginTop: 'auto', width: '100%' }}>
          <CyberButton onClick={onClick} fullWidth>
            View Stations →
          </CyberButton>
        </div>
      </div>
    </div>
  );
}
