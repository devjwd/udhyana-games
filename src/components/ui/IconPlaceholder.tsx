'use client';

import React from 'react';
import GamingIcon, { GamingIconType } from './GamingIcon';
import styles from './IconPlaceholder.module.css';

interface IconPlaceholderProps {
  icon: GamingIconType;
  title?: string;
  size?: number;
  showCorners?: boolean;
  showLabel?: boolean;
  isHero?: boolean;
  className?: string;
}

export default function IconPlaceholder({
  icon,
  title,
  size = 64,
  showCorners = true,
  showLabel = false,
  isHero: _isHero = false,
  className = '',
}: IconPlaceholderProps) {
  return (
    <div className={`${styles.wrapper} ${className} ${showCorners ? styles.cyberCorners : ''}`}>
      <div className={styles.gridPattern} />
      <div className={styles.glowRing} style={{ width: size * 1.8, height: size * 1.8 }} />
      <div className={styles.iconContainer}>
        <GamingIcon name={icon} size={size} />
      </div>
      {showLabel && title && (
        <span className={styles.labelBadge}>{title}</span>
      )}
    </div>
  );
}
