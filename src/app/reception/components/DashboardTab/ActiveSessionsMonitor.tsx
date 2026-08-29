'use client';

import React, { useState, useEffect } from 'react';
import styles from '../../page.module.css';
import { Session } from '../../types';

interface ActiveSessionsMonitorProps {
  sessions: Session[];
  onOpenAddTime: (session: Session) => void;
  onTogglePause: (session: Session) => void;
  onOpenTransfer: (session: Session) => void;
  onEndSession: (sessionId: string, isExpired?: boolean) => void;
  onEndAllExpired?: () => void;
}

function SessionCard({
  session,
  onOpenAddTime,
  onTogglePause,
  onOpenTransfer,
  onEndSession
}: {
  session: Session;
  onOpenAddTime: (session: Session) => void;
  onTogglePause: (session: Session) => void;
  onOpenTransfer: (session: Session) => void;
  onEndSession: (sessionId: string, isExpired?: boolean) => void;
}) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (session.status === 'PAUSED' && session.pausedRemainingSeconds != null) {
      return Math.max(0, session.pausedRemainingSeconds);
    }
    return Math.max(0, Math.floor((new Date(session.endTime).getTime() - Date.now()) / 1000));
  });
  const [elapsedOvertime, setElapsedOvertime] = useState<number>(() => {
    if (session.status === 'PAUSED') return 0;
    const diff = Math.floor((Date.now() - new Date(session.endTime).getTime()) / 1000);
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    if (session.status === 'PAUSED') {
      if (session.pausedRemainingSeconds != null) {
        setRemainingSeconds(Math.max(0, session.pausedRemainingSeconds));
      }
      return;
    }

    const tick = () => {
      const now = Date.now();
      const endMs = new Date(session.endTime).getTime();
      const rem = Math.max(0, Math.floor((endMs - now) / 1000));
      setRemainingSeconds(rem);
      const over = Math.max(0, Math.floor((now - endMs) / 1000));
      setElapsedOvertime(over);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session.endTime, session.status, session.pausedRemainingSeconds]);

  const formatTime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return '00:00:00';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isPaused = session.status === 'PAUSED';
  const isTimeUp = remainingSeconds <= 0 && !isPaused;
  const isEndingSoon = remainingSeconds > 0 && remainingSeconds <= 900 && !isPaused; // 15 mins

  let statusText = 'Active';
  let statusClass = styles.statusActive;

  if (isPaused) {
    statusText = 'Paused';
    statusClass = styles.statusPaused;
  } else if (isTimeUp) {
    statusText = 'Time Expired';
    statusClass = styles.statusDanger;
  } else if (isEndingSoon) {
    statusText = 'Ending Soon';
    statusClass = styles.statusWarning;
  }

  const playerName = session.guestName || session.user?.fullName || session.user?.username || 'Guest Player';
  const endTimeStr = new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`${styles.sessionCard} ${isTimeUp ? styles.sessionCardDanger : isEndingSoon ? styles.sessionCardWarning : ''}`}>
      <div className={styles.sessionCardHeader}>
        <h3 className={styles.sessionHardwareTitle}>{session.console.hardwareTitle}</h3>
        <span className={statusClass}>{statusText}</span>
      </div>

      <div className={styles.sessionPlayerSection}>
        <div className={styles.sessionPlayerLabel}>Player</div>
        <div className={styles.sessionPlayerName}>{playerName}</div>
        {session.user?.phone && <div className={styles.sessionPlayerContact}>{session.user.phone}</div>}
      </div>

      <div className={`${styles.timerDisplay} ${isTimeUp ? styles.timerDisplayDanger : isEndingSoon ? styles.timerDisplayWarning : ''}`}>
        <div>{isTimeUp ? `+${formatTime(elapsedOvertime)}` : formatTime(remainingSeconds)}</div>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, opacity: 0.8, letterSpacing: 'normal', marginTop: '0.2rem' }}>
          {isTimeUp ? `Expired at ${endTimeStr}` : `Ends at ${endTimeStr}`}
        </div>
      </div>

      <div className={styles.sessionControls}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          onClick={() => onOpenAddTime(session)}
        >
          + Time
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnWarning}`}
          onClick={() => onTogglePause(session)}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          className={styles.actionBtnOutline}
          onClick={() => onOpenTransfer(session)}
        >
          Transfer
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${isTimeUp ? styles.actionBtnDangerFilled : styles.actionBtnDanger}`}
          onClick={() => onEndSession(session.id, isTimeUp)}
        >
          {isTimeUp ? 'Check Out' : 'End'}
        </button>
      </div>
    </div>
  );
}

export default function ActiveSessionsMonitor({
  sessions,
  onOpenAddTime,
  onTogglePause,
  onOpenTransfer,
  onEndSession,
  onEndAllExpired
}: ActiveSessionsMonitorProps) {
  const expiredSessionsCount = sessions.filter(s => {
    if (s.status === 'PAUSED') return false;
    return new Date(s.endTime).getTime() <= Date.now();
  }).length;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 className={styles.panelHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>Active Sessions Monitor</h2>
          <span className={styles.panelBadge}>{sessions.length} In-Use</span>
        </div>
        {expiredSessionsCount > 0 && onEndAllExpired && (
          <button
            type="button"
            className={styles.clearExpiredBtn}
            onClick={onEndAllExpired}
          >
            End All Expired ({expiredSessionsCount})
          </button>
        )}
      </div>

      <div className={styles.sessionGrid}>
        {sessions.map(session => (
          <SessionCard
            key={session.id}
            session={session}
            onOpenAddTime={onOpenAddTime}
            onTogglePause={onTogglePause}
            onOpenTransfer={onOpenTransfer}
            onEndSession={onEndSession}
          />
        ))}

        {sessions.length === 0 && (
          <div className={styles.emptyStateContainer}>
            <p>No active game sessions right now. All stations are available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
