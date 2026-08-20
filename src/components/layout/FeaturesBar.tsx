import styles from './FeaturesBar.module.css';

export default function FeaturesBar() {
  const features = [
    {
      category: "CONSOLES",
      subText: "AVAILABLE NOW",
      title: "Next-Gen Stations",
      icon: (
        // Gamepad icon
        <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-4M11 4V2m0 2h2M9 12h2m2 0h2M12 9v2m0 2v2" />
        </svg>
      )
    },
    {
      category: "HARDWARE",
      subText: "SETUP",
      title: "Max-Performance",
      icon: (
        // CPU / chip icon
        <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect x="9" y="9" width="6" height="6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
        </svg>
      )
    },
    {
      category: "EVENTS",
      subText: "WEEKLY",
      title: "Local Tournaments",
      icon: (
        // Trophy icon
        <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8M12 17v4M5 3H3v4a4 4 0 004 4h.5M19 3h2v4a4 4 0 01-4 4h-.5M7 3h10v6a5 5 0 01-10 0V3z" />
        </svg>
      )
    }
  ];

  return (
    <div className={styles.featuresBar}>
      {features.map((feature, index) => (
        <div key={index} className={styles.feature}>
          <div className={styles.topRow}>
            <div className={styles.categoryInfo}>
              <span className={styles.iconWrapper}>{feature.icon}</span>
              <span className={styles.category}>{feature.category}</span>
            </div>
          </div>
          <div className={styles.middleRow}>
            <span className={styles.subText}>{feature.subText}</span>
            <span className={styles.title}>{feature.title}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
