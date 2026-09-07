'use client';

import React, { useState, useEffect } from 'react';
import styles from '../../page.module.css';
import { Session } from '../../types';

interface ActiveSessionsMonitorProps {
  sessions: Session[];
  baseRate?: number;
  extraControllerRate?: number;
  onOpenAddTime: (session: Session) => void;
  onTogglePause: (session: Session) => void;
  onOpenTransfer: (session: Session) => void;
  onEndSession: (sessionId: string, isExpired?: boolean) => void;
  onOpenPostpaidCheckout?: (session: Session) => void;
  onEndAllExpired?: () => void;
}

function SessionCard({
  session,
  baseRate = 300,
  extraControllerRate = 100,
  onOpenAddTime,
  onTogglePause,
  onOpenTransfer,
  onEndSession,
  onOpenPostpaidCheckout
}: {
  session: Session;
  baseRate?: number;
  extraControllerRate?: number;
  onOpenAddTime: (session: Session) => void;
  onTogglePause: (session: Session) => void;
  onOpenTransfer: (session: Session) => void;
  onEndSession: (sessionId: string, isExpired?: boolean) => void;
  onOpenPostpaidCheckout?: (session: Session) => void;
}) {
  const isPostpaid = session.billingType === 'POSTPAID';

  // Prepaid timers
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

  // Postpaid count-up elapsed time
  const [postpaidElapsed, setPostpaidElapsed] = useState<number>(() => {
    const startMs = new Date(session.startTime).getTime();
    return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  });

  useEffect(() => {
    if (session.status === 'PAUSED') {
      if (!isPostpaid && session.pausedRemainingSeconds != null) {
        setRemainingSeconds(Math.max(0, session.pausedRemainingSeconds));
      }
      return;
    }

    const tick = () => {
      const now = Date.now();
      if (isPostpaid) {
        const startMs = new Date(session.startTime).getTime();
        setPostpaidElapsed(Math.max(0, Math.floor((now - startMs) / 1000)));
      } else {
        const endMs = new Date(session.endTime).getTime();
        const rem = Math.max(0, Math.floor((endMs - now) / 1000));
        setRemainingSeconds(rem);
        const over = Math.max(0, Math.floor((now - endMs) / 1000));
        setElapsedOvertime(over);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session.startTime, session.endTime, session.status, session.pausedRemainingSeconds, isPostpaid]);

  const formatTime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return '00:00:00';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isPaused = session.status === 'PAUSED';
  const isTimeUp = !isPostpaid && remainingSeconds <= 0 && !isPaused;
  const isEndingSoon = !isPostpaid && remainingSeconds > 0 && remainingSeconds <= 900 && !isPaused; // 15 mins

  let statusText = 'Active';
  let statusClass = styles.statusActive;

  if (isPaused) {
    statusText = 'Paused';
    statusClass = styles.statusPaused;
  } else if (isPostpaid) {
    statusText = 'Open (Postpaid)';
    statusClass = styles.statusActive;
  } else if (isTimeUp) {
    statusText = 'Time Expired';
    statusClass = styles.statusDanger;
  } else if (isEndingSoon) {
    statusText = 'Ending Soon';
    statusClass = styles.statusWarning;
  }

  const playerName = session.guestName || session.user?.fullName || session.user?.username || 'Guest Player';
  const startTimeStr = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTimeStr = new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Postpaid accrued bill calculation
  const postpaidBillableMins = Math.max(15, Math.ceil(postpaidElapsed / 60));
  const postpaidAccruedAmt = Math.round((postpaidBillableMins / 60) * baseRate) + (session.extraControllers || 0) * extraControllerRate;

  return (
    <div className={`${styles.sessionCard} ${isTimeUp ? styles.sessionCardDanger : isEndingSoon ? styles.sessionCardWarning : ''}`} style={isPostpaid ? { borderTop: '3px solid var(--primary-accent)' } : {}}>
      <div className={styles.sessionCardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <h3 className={styles.sessionHardwareTitle}>{session.console.hardwareTitle}</h3>
        </div>
        <span className={statusClass}>{statusText}</span>
      </div>

      <div className={styles.sessionPlayerSection}>
        <div className={styles.sessionPlayerLabel}>Player</div>
        <div className={styles.sessionPlayerName}>{playerName}</div>
        {session.user?.phone && <div className={styles.sessionPlayerContact}>{session.user.phone}</div>}
      </div>

      {isPostpaid ? (
        /* Postpaid Open Session Count-Up Display */
        <div className={styles.timerDisplay} style={{ background: 'rgba(193, 255, 28, 0.06)', borderColor: 'rgba(193, 255, 28, 0.25)' }}>
          <div style={{ color: 'var(--primary-accent)', letterSpacing: '0.05em' }}>
            {formatTime(postpaidElapsed)}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
            💰 PKR {postpaidAccruedAmt} Accrued
          </div>
          <div style={{ fontSize: '0.66rem', fontWeight: 600, opacity: 0.75, letterSpacing: 'normal', marginTop: '0.15rem' }}>
            Started at {startTimeStr} • Rate: PKR {baseRate}/hr
            {session.extraControllers ? ` (+${session.extraControllers} Controller)` : ''}
          </div>
        </div>
      ) : (
        /* Prepaid Countdown Display */
        <div className={`${styles.timerDisplay} ${isTimeUp ? styles.timerDisplayDanger : isEndingSoon ? styles.timerDisplayWarning : ''}`}>
          <div>{isTimeUp ? `+${formatTime(elapsedOvertime)}` : formatTime(remainingSeconds)}</div>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, opacity: 0.8, letterSpacing: 'normal', marginTop: '0.2rem' }}>
            {isTimeUp ? `Expired at ${endTimeStr}` : `Ends at ${endTimeStr}`}
          </div>
        </div>
      )}

      <div className={styles.sessionControls}>
        {!isPostpaid && (
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={() => onOpenAddTime(session)}
          >
            + Time
          </button>
        )}

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

        {isPostpaid ? (
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            style={{ fontWeight: 800, background: 'var(--primary-accent)', color: '#000' }}
            onClick={() => {
              if (onOpenPostpaidCheckout) {
                onOpenPostpaidCheckout(session);
              } else {
                onEndSession(session.id, false);
              }
            }}
          >
            🧾 End & Bill
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.actionBtn} ${isTimeUp ? styles.actionBtnDangerFilled : styles.actionBtnDanger}`}
            onClick={() => onEndSession(session.id, isTimeUp)}
          >
            {isTimeUp ? 'Check Out' : 'End'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ActiveSessionsMonitor({
  sessions,
  baseRate = 300,
  extraControllerRate = 100,
  onOpenAddTime,
  onTogglePause,
  onOpenTransfer,
  onEndSession,
  onOpenPostpaidCheckout,
  onEndAllExpired
}: ActiveSessionsMonitorProps) {
  const expiredSessionsCount = sessions.filter(s => {
    if (s.status === 'PAUSED' || s.billingType === 'POSTPAID') return false;
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
            baseRate={baseRate}
            extraControllerRate={extraControllerRate}
            onOpenAddTime={onOpenAddTime}
            onTogglePause={onTogglePause}
            onOpenTransfer={onOpenTransfer}
            onEndSession={onEndSession}
            onOpenPostpaidCheckout={onOpenPostpaidCheckout}
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
