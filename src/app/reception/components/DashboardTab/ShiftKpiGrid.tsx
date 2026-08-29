'use client';

import React from 'react';
import styles from '../../page.module.css';
import { ShiftSummary } from '../../types';

interface ShiftKpiGridProps {
  shiftSummary: ShiftSummary | null;
  activeSessionCount: number;
  totalConsoleCount: number;
}

export default function ShiftKpiGrid({
  shiftSummary,
  activeSessionCount,
  totalConsoleCount
}: ShiftKpiGridProps) {
  return (
    <div className={styles.kpiGrid}>
      <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Today&apos;s Revenue</span>
        <span className={styles.kpiValue} style={{ color: 'var(--primary-accent)' }}>
          PKR {shiftSummary?.grandTotal?.toLocaleString() || 0}
        </span>
        <span className={styles.kpiSub}>{shiftSummary?.orderCount || 0} Total Orders</span>
      </div>

      <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Cash In Register</span>
        <span className={styles.kpiValue}>
          PKR {shiftSummary?.cashTotal?.toLocaleString() || 0}
        </span>
        <span className={styles.kpiSub}>Drawer Balance</span>
      </div>

      <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Card Payments</span>
        <span className={styles.kpiValue}>
          PKR {shiftSummary?.cardTotal?.toLocaleString() || 0}
        </span>
        <span className={styles.kpiSub}>POS Terminal</span>
      </div>

      <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>Station Occupancy</span>
        <span className={styles.kpiValue} style={{ color: '#60a5fa' }}>
          {activeSessionCount} / {totalConsoleCount}
        </span>
        <span className={styles.kpiSub}>
          {totalConsoleCount > 0 ? `${Math.round((activeSessionCount / totalConsoleCount) * 100)}% Capacity` : 'Stations In-Use'}
        </span>
      </div>
    </div>
  );
}
