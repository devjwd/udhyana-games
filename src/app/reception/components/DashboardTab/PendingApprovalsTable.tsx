'use client';

import React, { useState } from 'react';
import styles from '../../page.module.css';
import { PendingUser } from '../../types';

interface PendingApprovalsTableProps {
  pendingUsers: PendingUser[];
  onApproveUser: (userId: string) => Promise<void>;
}

export default function PendingApprovalsTable({
  pendingUsers,
  onApproveUser
}: PendingApprovalsTableProps) {
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (user: PendingUser) => {
    if (confirm(`Verify ID in person: Approve account for "${user.fullName || user.username}"?`)) {
      setApprovingId(user.id);
      try {
        await onApproveUser(user.id);
      } finally {
        setApprovingId(null);
      }
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderRow}>
        <h2 className={styles.panelHeader} style={{ borderBottom: 'none', paddingBottom: 0, color: 'var(--primary-accent)' }}>
          Pending Account Approvals
        </h2>
        {pendingUsers.length > 0 && (
          <span className={styles.badgeHighlight}>{pendingUsers.length} Action Required</span>
        )}
      </div>

      <div className={styles.tableResponsive}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Full Name</th>
              <th className={styles.th}>Gamer Tag</th>
              <th className={styles.th}>Contact No</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map(user => (
              <tr key={user.id} className={styles.tr}>
                <td className={styles.td} style={{ fontWeight: 800 }}>{user.fullName || '—'}</td>
                <td className={styles.td}>@{user.username}</td>
                <td className={styles.td}>{user.phone || '—'}</td>
                <td className={styles.td} style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className={styles.approveBtn}
                    disabled={approvingId === user.id}
                    onClick={() => handleApprove(user)}
                  >
                    {approvingId === user.id ? 'Approving...' : '✓ Verify & Approve'}
                  </button>
                </td>
              </tr>
            ))}
            {pendingUsers.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.tableEmpty}>
                  All registered member accounts are verified. No pending approvals.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
