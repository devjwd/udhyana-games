'use client';

import React from 'react';
import styles from '../../page.module.css';
import { SnackItem } from '../../types';

interface QuickSaleSnacksProps {
  snacks: SnackItem[];
  onAddSnack: (snack: SnackItem) => void;
}

export default function QuickSaleSnacks({ snacks, onAddSnack }: QuickSaleSnacksProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderRow}>
        <h2 className={styles.panelHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>Quick Sale (Snacks & Drinks)</h2>
        <span className={styles.panelBadge}>POS</span>
      </div>

      <div className={styles.snackGrid}>
        {snacks.map(snack => (
          <button
            key={snack.id}
            type="button"
            className={styles.snackBtn}
            onClick={() => onAddSnack(snack)}
          >
            <span className={styles.snackName}>{snack.name}</span>
            <span className={styles.snackPrice}>PKR {snack.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
