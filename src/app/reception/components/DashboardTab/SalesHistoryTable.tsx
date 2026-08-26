'use client';

import React from 'react';
import styles from '../../page.module.css';
import { Sale } from '../../types';

interface SalesHistoryTableProps {
  sales: Sale[];
}

export default function SalesHistoryTable({ sales }: SalesHistoryTableProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderRow}>
        <h2 className={styles.panelHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>
          Recent Transactions
        </h2>
        <span className={styles.panelBadge}>Live Register Log</span>
      </div>

      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Order Items</th>
              <th className={styles.th}>Total</th>
              <th className={styles.th}>Time</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id} className={styles.tr}>
                <td className={styles.td}>
                  <div style={{ fontWeight: 600 }}>
                    {sale.items.map((i: { name: string }) => i.name).join(', ')}
                  </div>
                </td>
                <td className={styles.td} style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>
                  PKR {sale.totalAmount}
                </td>
                <td className={styles.td} style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                  {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className={styles.td} style={{ textAlign: 'right' }}>
                  <span className={styles.badgeMethod}>
                    {sale.paymentMethod}
                  </span>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.tableEmpty}>
                  No sales recorded today yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
