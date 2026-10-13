'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Toaster, toast } from 'react-hot-toast';
import styles from './page.module.css';
import { soundManager } from '@/app/reception/utils/sound';
import {
  LiveStationItem,
  LiveStationStats,
  pauseGameSession,
  resumeGameSession,
  addTimeToSession,
  endGameSession
} from '@/backend/actions';

function formatTimer(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function LiveStationsPage() {
  const { data: authSession } = useSession();
  const isAuthStaff = authSession?.user?.role === 'ADMIN' || authSession?.user?.role === 'RECEPTIONIST';

  const [stations, setStations] = useState<LiveStationItem[]>([]);
  const [stats, setStats] = useState<LiveStationStats | null>(null);
  const [baseRate, setBaseRate] = useState<number>(300);
  const [isStaffMode, setIsStaffMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      if (modeParam === 'staff') return true;
      if (modeParam === 'visitor') return false;
    }
    return false;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? soundManager.getMuted() : false;
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'ACTIVE' | 'ENDING_SOON'>('ALL');
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const expiredNotifiedRef = useRef<Set<string>>(new Set());

  // URL query parameter & staff role synchronization
  useEffect(() => {
    if (isAuthStaff) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') !== 'visitor') {
        const timer = setTimeout(() => setIsStaffMode(true), 0);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthStaff]);

  // Digital clock (ticking every second)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live station status from API
  const fetchLiveStations = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setTimeout(() => setIsSyncing(true), 0);
    }
    try {
      const res = await fetch('/api/stations/live', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.stations) {
        setStations(data.stations);
        setStats(data.stats);
        if (data.baseRate) setBaseRate(data.baseRate);

        // Check for expired sessions to ring audio chime
        data.stations.forEach((st: LiveStationItem) => {
          if (st.isOccupied && st.status === 'EXPIRED' && st.sessionId && !expiredNotifiedRef.current.has(st.sessionId)) {
            expiredNotifiedRef.current.add(st.sessionId);
            soundManager.playTimeUpChime();
            toast.error(`Time Expired: ${st.hardwareTitle}`, { id: `expired-${st.sessionId}`, duration: 5000 });
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch live station data:', err);
    } finally {
      setIsSyncing(false);
      setLoading(false);
    }
  }, []);

  // Initial load and periodic background polling (every 5 seconds)
  useEffect(() => {
    let isCancelled = false;
    const runFetch = async () => {
      if (!isCancelled) {
        await fetchLiveStations(true);
      }
    };
    runFetch();
    const pollInterval = setInterval(() => {
      runFetch();
    }, 5000);
    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
    };
  }, [fetchLiveStations]);

  // Client-side 1-second countdown and count-up ticker
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setStations(prevStations =>
        prevStations.map(st => {
          if (!st.isOccupied || st.isPaused) return st;

          if (st.billingType === 'POSTPAID') {
            return {
              ...st,
              elapsedSeconds: st.elapsedSeconds + 1
            };
          }

          // Prepaid countdown
          const nextRemaining = Math.max(0, st.remainingSeconds - 1);
          let newStatus = st.status;
          if (nextRemaining <= 0) {
            newStatus = 'EXPIRED';
            if (st.sessionId && !expiredNotifiedRef.current.has(st.sessionId)) {
              expiredNotifiedRef.current.add(st.sessionId);
              soundManager.playTimeUpChime();
              toast.error(`Time Expired: ${st.hardwareTitle}`, { id: `expired-${st.sessionId}`, duration: 5000 });
            }
          } else if (nextRemaining <= 900) {
            newStatus = 'ENDING_SOON';
          } else {
            newStatus = 'ACTIVE';
          }

          return {
            ...st,
            remainingSeconds: nextRemaining,
            elapsedSeconds: st.elapsedSeconds + 1,
            status: newStatus
          };
        })
      );
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Sound mute toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
    if (!nextMuted) {
      soundManager.playSuccessTone();
      toast.success('Chime audio enabled', { duration: 2000 });
    } else {
      toast('Chime audio muted', { icon: '🔇', duration: 2000 });
    }
  };

  // Staff Quick Action: Quick Add Time (+15m, +30m, +1h)
  const handleQuickAddTime = async (session: LiveStationItem, seconds: number, label: string) => {
    if (!session.sessionId) return;
    try {
      toast.loading(`Adding ${label} to ${session.hardwareTitle}...`, { id: `add-${session.sessionId}` });
      const res = await addTimeToSession(session.sessionId, seconds, 'cash');
      if (res && typeof res === 'object' && 'error' in res && res.error) {
        throw new Error(String(res.error));
      }
      soundManager.playSuccessTone();
      toast.success(`+${label} added to ${session.hardwareTitle}!`, { id: `add-${session.sessionId}` });
      await fetchLiveStations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to extend time.';
      toast.error(msg, { id: `add-${session.sessionId}` });
    }
  };

  // Staff Quick Action: Pause / Resume Session
  const handleTogglePause = async (session: LiveStationItem) => {
    if (!session.sessionId) return;
    try {
      if (session.isPaused) {
        toast.loading(`Resuming ${session.hardwareTitle}...`, { id: `pause-${session.sessionId}` });
        const res = await resumeGameSession(session.sessionId, session.remainingSeconds);
        if (res && typeof res === 'object' && 'error' in res && res.error) {
          throw new Error(String(res.error));
        }
        soundManager.playSuccessTone();
        toast.success(`Resumed ${session.hardwareTitle}!`, { id: `pause-${session.sessionId}` });
      } else {
        toast.loading(`Pausing ${session.hardwareTitle}...`, { id: `pause-${session.sessionId}` });
        const res = await pauseGameSession(session.sessionId, session.remainingSeconds);
        if (res && typeof res === 'object' && 'error' in res && res.error) {
          throw new Error(String(res.error));
        }
        toast.success(`Paused ${session.hardwareTitle} (${formatTimer(session.remainingSeconds)} saved)`, { id: `pause-${session.sessionId}` });
      }
      await fetchLiveStations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed.';
      toast.error(msg, { id: `pause-${session.sessionId}` });
    }
  };

  // Staff Quick Action: End Session
  const handleEndSession = async (session: LiveStationItem) => {
    if (!session.sessionId) return;
    const confirm = window.confirm(`End session for ${session.hardwareTitle} (${session.playerName})? Station will become free.`);
    if (!confirm) return;

    try {
      toast.loading(`Ending session on ${session.hardwareTitle}...`, { id: `end-${session.sessionId}` });
      await endGameSession(session.sessionId);
      soundManager.playSuccessTone();
      toast.success(`${session.hardwareTitle} is now FREE!`, { id: `end-${session.sessionId}` });
      await fetchLiveStations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to end session.';
      toast.error(msg, { id: `end-${session.sessionId}` });
    }
  };

  // Filtered station list
  const filteredStations = useMemo(() => {
    return stations.filter(st => {
      // Status filter
      if (filterStatus === 'AVAILABLE' && st.isOccupied) return false;
      if (filterStatus === 'ACTIVE' && (!st.isOccupied || st.status === 'EXPIRED')) return false;
      if (filterStatus === 'ENDING_SOON' && st.status !== 'ENDING_SOON' && st.status !== 'EXPIRED') return false;

      // Platform filter
      if (filterPlatform !== 'ALL' && st.type !== filterPlatform) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = st.hardwareTitle.toLowerCase().includes(q);
        const matchesPlayer = (st.playerName || '').toLowerCase().includes(q);
        const matchesGame = st.games.some(g => g.toLowerCase().includes(q));
        if (!matchesTitle && !matchesPlayer && !matchesGame) return false;
      }

      return true;
    });
  }, [stations, filterStatus, filterPlatform, searchQuery]);

  // Unique platform types
  const platformTypes = useMemo(() => {
    const set = new Set<string>();
    stations.forEach(s => {
      if (s.type) set.add(s.type);
    });
    return Array.from(set);
  }, [stations]);

  return (
    <div className={`${styles.container} ${isFullscreen ? styles.kioskMode : ''}`}>
      <Toaster position="top-right" />

      {/* Decorative ambient lighting */}
      <div className={styles.ambientGlowTop} />
      <div className={styles.ambientGlowRight} />

      {/* Top Application Bar */}
      <header className={styles.topBar}>
        <div className={styles.brandGroup}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src="/images/logo.png"
              alt="Udhyana Games"
              width={145}
              height={44}
              style={{ objectFit: 'contain' }}
              priority
            />
          </Link>
          <span className={styles.badgeLive}>
            <span className={styles.radarPulse} />
            Live Arena Status
          </span>
        </div>

        {/* Real-time Clock */}
        <div className={styles.clockArea}>
          <span className={styles.digitalClock} id="live-clock">{currentTime || '--:--:--'}</span>
          <span className={styles.clockDate}>{currentDate}</span>
        </div>

        {/* Controls: Mode Switcher, Sound, Fullscreen, Reception Link */}
        <div className={styles.controlsGroup}>
          {/* Mode toggle */}
          <div className={styles.viewModeToggle} role="group" aria-label="Display View Mode">
            <button
              type="button"
              id="btn-mode-visitor"
              className={`${styles.viewModeBtn} ${!isStaffMode ? styles.viewModeBtnActive : ''}`}
              onClick={() => setIsStaffMode(false)}
            >
              👥 Customer View
            </button>
            <button
              type="button"
              id="btn-mode-staff"
              className={`${styles.viewModeBtn} ${isStaffMode ? styles.viewModeBtnActive : ''}`}
              onClick={() => setIsStaffMode(true)}
            >
              ⏱️ Staff Timers
            </button>
          </div>

          {/* Sound Alert Toggle */}
          <button
            type="button"
            id="btn-toggle-sound"
            className={`${styles.btnControl} ${!isMuted ? styles.btnControlActive : ''}`}
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute chime audio' : 'Mute chime audio'}
          >
            {isMuted ? '🔇 Audio Off' : '🔔 Audio On'}
          </button>

          {/* Refresh sync button */}
          <button
            type="button"
            id="btn-manual-sync"
            className={styles.btnControl}
            onClick={() => fetchLiveStations()}
            title="Refresh live statuses"
          >
            {isSyncing ? '🔄 Syncing...' : '🔄 Refresh'}
          </button>

          {/* Fullscreen TV Kiosk Mode Toggle */}
          <button
            type="button"
            id="btn-toggle-fullscreen"
            className={`${styles.btnControl} ${isFullscreen ? styles.btnControlActive : ''}`}
            onClick={handleToggleFullscreen}
            title="Toggle Fullscreen TV Mode"
          >
            {isFullscreen ? '✕ Exit TV Mode' : '⛶ TV Fullscreen'}
          </button>

          {/* Quick jump to reception desk */}
          <Link href="/reception" className={`${styles.btnControl} ${styles.btnReceptionDesk}`}>
            🖥️ Reception POS
          </Link>
        </div>
      </header>

      {/* Hero KPI Summary Row */}
      <section className={styles.kpiGrid} aria-label="Station Availability Summary">
        {/* Available Stations */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconBox} ${styles.kpiAvailableIcon}`}>🟢</div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Available Now</span>
            <span className={styles.kpiValue} style={{ color: '#10b981' }}>
              {stats?.available ?? 0}
            </span>
            <span className={styles.kpiSubtext}>Free to play immediately</span>
          </div>
        </div>

        {/* Occupied Stations */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconBox} ${styles.kpiOccupiedIcon}`}>🎮</div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>In Play</span>
            <span className={styles.kpiValue} style={{ color: '#00f0ff' }}>
              {stats?.occupied ?? 0}
            </span>
            <span className={styles.kpiSubtext}>Sessions currently running</span>
          </div>
        </div>

        {/* Next Station Freeing Up */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconBox} ${styles.kpiNextIcon}`}>⏳</div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Next Opening</span>
            <span className={styles.kpiValue} style={{ color: '#fbbf24', fontSize: '1.25rem' }}>
              {stats?.nextAvailableSeconds
                ? formatTimer(stats.nextAvailableSeconds)
                : stats?.available && stats.available > 0
                  ? 'Stations Free Now'
                  : 'All In Session'}
            </span>
            <span className={styles.kpiSubtext}>
              {stats?.nextAvailableStation ? `(${stats.nextAvailableStation})` : 'Walk in to reception'}
            </span>
          </div>
        </div>

        {/* Total Stations */}
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconBox} ${styles.kpiTotalIcon}`}>🕹️</div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Stations</span>
            <span className={styles.kpiValue}>
              {stats?.total ?? stations.length}
            </span>
            <span className={styles.kpiSubtext}>Arena gaming capacity</span>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className={styles.filterBar}>
        <div className={styles.filterTabs}>
          {/* Status filters */}
          <button
            type="button"
            className={`${styles.filterTabBtn} ${filterStatus === 'ALL' ? styles.filterTabBtnActive : ''}`}
            onClick={() => setFilterStatus('ALL')}
          >
            All ({stations.length})
          </button>
          <button
            type="button"
            className={`${styles.filterTabBtn} ${filterStatus === 'AVAILABLE' ? styles.filterTabBtnActive : ''}`}
            onClick={() => setFilterStatus('AVAILABLE')}
          >
            🟢 Available ({stats?.available ?? 0})
          </button>
          <button
            type="button"
            className={`${styles.filterTabBtn} ${filterStatus === 'ACTIVE' ? styles.filterTabBtnActive : ''}`}
            onClick={() => setFilterStatus('ACTIVE')}
          >
            🎮 In Play ({stats?.occupied ?? 0})
          </button>
          {stats && stats.endingSoon > 0 && (
            <button
              type="button"
              className={`${styles.filterTabBtn} ${filterStatus === 'ENDING_SOON' ? styles.filterTabBtnActive : ''}`}
              onClick={() => setFilterStatus('ENDING_SOON')}
            >
              ⏳ Ending Soon ({stats.endingSoon})
            </button>
          )}

          {/* Platform category buttons */}
          {platformTypes.map(pt => (
            <button
              key={pt}
              type="button"
              className={`${styles.filterTabBtn} ${filterPlatform === pt ? styles.filterTabBtnActive : ''}`}
              onClick={() => setFilterPlatform(filterPlatform === pt ? 'ALL' : pt)}
            >
              {pt}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className={styles.filterSearchBox}>
          <span>🔍</span>
          <input
            type="text"
            id="station-search-input"
            className={styles.filterSearchInput}
            placeholder="Search station, game, or player..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </section>

      {/* Stations Arena Grid */}
      <main className={styles.stationGrid}>
        {filteredStations.map(station => {
          const isAvailable = !station.isOccupied;
          const isPostpaid = station.billingType === 'POSTPAID';
          const isPaused = station.isPaused;
          const isExpired = station.status === 'EXPIRED';
          const isEndingSoon = station.status === 'ENDING_SOON';

          // Progress percentage for countdown
          const totalDuration = station.totalDurationSeconds || 3600;
          const progressPercent = totalDuration > 0
            ? Math.min(100, Math.max(0, Math.round(((totalDuration - station.remainingSeconds) / totalDuration) * 100)))
            : 0;

          // End time string
          const endTimeStr = station.endTime
            ? new Date(station.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          // Postpaid accrued bill estimate
          const postpaidMins = Math.max(15, Math.ceil(station.elapsedSeconds / 60));
          const postpaidAccrued = Math.round((postpaidMins / 60) * (station.hourlyRate || baseRate));

          // Card class
          let cardStateClass = styles.stationCardAvailable;
          let statusBadgeClass = styles.statusAvailable;
          let statusLabel = 'Available Now';

          if (isPaused) {
            cardStateClass = styles.stationCardPaused;
            statusBadgeClass = styles.statusPaused;
            statusLabel = 'Paused';
          } else if (isPostpaid) {
            cardStateClass = styles.stationCardPostpaid;
            statusBadgeClass = styles.statusPostpaid;
            statusLabel = 'Open Session';
          } else if (isExpired) {
            cardStateClass = styles.stationCardExpired;
            statusBadgeClass = styles.statusExpired;
            statusLabel = 'Time Expired';
          } else if (isEndingSoon) {
            cardStateClass = styles.stationCardEndingSoon;
            statusBadgeClass = styles.statusEndingSoon;
            statusLabel = 'Ending Soon';
          } else if (station.isOccupied) {
            cardStateClass = styles.stationCardActive;
            statusBadgeClass = styles.statusActive;
            statusLabel = 'In Play';
          }

          return (
            <article
              key={station.id}
              className={`${styles.stationCard} ${cardStateClass}`}
              id={`station-card-${station.id}`}
            >
              {/* Card Header: Station Title, Platform Tag, Status Badge */}
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.hardwareTitle}>{station.hardwareTitle}</h2>
                  <div className={styles.hardwareMeta}>
                    <span className={styles.typeTag}>{station.type || 'CONSOLE'}</span>
                    <span className={styles.rateTag}>PKR {station.hourlyRate || baseRate}/hr</span>
                  </div>
                </div>

                <span className={`${styles.statusBadge} ${statusBadgeClass}`}>
                  {isAvailable && '🟢 '}
                  {isEndingSoon && '⏳ '}
                  {isExpired && '⚠️ '}
                  {isPaused && '⏸️ '}
                  {statusLabel}
                </span>
              </div>

              {/* Card Body: Countdown Timer or Available State */}
              <div className={styles.cardBody}>
                {isAvailable ? (
                  /* AVAILABLE / READY TO PLAY */
                  <div className={styles.availableShowcase}>
                    <div className={styles.availableReadyTitle}>
                      <span>🟢 READY TO PLAY</span>
                    </div>
                    <p className={styles.availableNotice}>
                      {station.nextBookingTime
                        ? `Available now • Reserved at ${station.nextBookingTime}`
                        : 'Station is open! Step up to reception to play.'}
                    </p>

                    {/* Installed games list */}
                    {station.games.length > 0 && (
                      <div className={styles.gamesSection}>
                        <div className={styles.gamesTitle}>Featured Games Installed</div>
                        <div className={styles.gamesPillList}>
                          {station.games.slice(0, 5).map(game => (
                            <span key={game} className={styles.gamePill}>{game}</span>
                          ))}
                          {station.games.length > 5 && (
                            <span className={styles.gamePill}>+{station.games.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {station.specs && (
                      <div className={styles.specsNotice}>
                        <span>⚡ {station.specs}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* OCCUPIED / LIVE TIMER DISPLAY */
                  <div
                    className={`${styles.timerBox} ${
                      isExpired
                        ? styles.timerBoxExpired
                        : isEndingSoon
                          ? styles.timerBoxEndingSoon
                          : isPostpaid
                            ? styles.timerBoxPostpaid
                            : ''
                    }`}
                  >
                    {isPostpaid ? (
                      /* POSTPAID OPEN SESSION (COUNT-UP) */
                      <>
                        <div className={`${styles.timerDigits} ${styles.timerDigitsPostpaid}`}>
                          {formatTimer(station.elapsedSeconds)}
                        </div>
                        <div className={styles.timerMeta}>
                          <span>⏱️ Ongoing Play</span>
                          {isStaffMode && (
                            <span style={{ color: '#c1ff1c', fontWeight: 700 }}>
                              • PKR {postpaidAccrued} Accrued
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      /* PREPAID COUNTDOWN TIMER */
                      <>
                        <div
                          className={`${styles.timerDigits} ${
                            isExpired
                              ? styles.timerDigitsExpired
                              : isEndingSoon
                                ? styles.timerDigitsEndingSoon
                                : isPaused
                                  ? styles.timerDigitsPaused
                                  : ''
                          }`}
                        >
                          {isExpired
                            ? `00:00`
                            : formatTimer(station.remainingSeconds)}
                        </div>

                        <div className={styles.timerMeta}>
                          {isExpired ? (
                            <span style={{ color: '#f87171', fontWeight: 800 }}>
                              ⚠️ Ended at {endTimeStr}
                            </span>
                          ) : isPaused ? (
                            <span style={{ color: '#fbbf24' }}>
                              ⏸️ Paused ({formatTimer(station.remainingSeconds)} saved)
                            </span>
                          ) : (
                            <span>
                              {isEndingSoon ? '⚠️ Ends soon at ' : 'Ends at '}
                              <strong>{endTimeStr}</strong>
                            </span>
                          )}
                        </div>

                        {/* Visual Progress Bar */}
                        <div className={styles.progressBarBg}>
                          <div
                            className={`${styles.progressBarFill} ${
                              isExpired
                                ? styles.progressBarFillExpired
                                : isEndingSoon
                                  ? styles.progressBarFillEndingSoon
                                  : ''
                            }`}
                            style={{ width: `${isExpired ? 100 : progressPercent}%` }}
                          />
                        </div>
                      </>
                    )}

                    {/* Active Player Row */}
                    <div className={styles.playerInfoRow}>
                      <span className={styles.playerLabel}>Player:</span>
                      <span className={styles.playerName}>
                        {station.playerName || 'Guest Player'}
                      </span>
                      {isStaffMode && station.playerPhone && (
                        <span className={styles.playerContact}>{station.playerPhone}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Interactive Actions (Different for Customer vs Staff Mode) */}
              <div className={styles.cardFooter}>
                {isStaffMode ? (
                  /* STAFF OPERATIONS CONTROLS */
                  <>
                    {station.isOccupied ? (
                      <>
                        {!isPostpaid && (
                          <>
                            <button
                              type="button"
                              className={styles.staffBtn}
                              onClick={() => handleQuickAddTime(station, 900, '15m')}
                              title="Extend 15 minutes"
                            >
                              +15m
                            </button>
                            <button
                              type="button"
                              className={styles.staffBtn}
                              onClick={() => handleQuickAddTime(station, 1800, '30m')}
                              title="Extend 30 minutes"
                            >
                              +30m
                            </button>
                            <button
                              type="button"
                              className={styles.staffBtn}
                              onClick={() => handleQuickAddTime(station, 3600, '1h')}
                              title="Extend 1 hour"
                            >
                              +1h
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          className={`${styles.staffBtn} ${styles.staffBtnWarning}`}
                          onClick={() => handleTogglePause(station)}
                        >
                          {station.isPaused ? '▶ Resume' : '⏸ Pause'}
                        </button>

                        <button
                          type="button"
                          className={`${styles.staffBtn} ${isExpired ? styles.staffBtnDanger : styles.staffBtnDanger}`}
                          onClick={() => handleEndSession(station)}
                        >
                          {isPostpaid ? 'End & Bill' : isExpired ? 'Check Out' : 'End'}
                        </button>
                      </>
                    ) : (
                      <Link
                        href={`/reception`}
                        className={`${styles.staffBtn} ${styles.staffBtnPrimary}`}
                      >
                        ⚡ Start Session
                      </Link>
                    )}
                  </>
                ) : (
                  /* CUSTOMER / LOBBY DISPLAY VIEW */
                  <>
                    {isAvailable ? (
                      <Link
                        href="/book"
                        className={`${styles.staffBtn} ${styles.staffBtnPrimary}`}
                      >
                        🎮 Play Now at Reception
                      </Link>
                    ) : (
                      <div style={{ width: '100%', textAlign: 'center', fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                        {isExpired
                          ? 'Session complete • Reopening shortly'
                          : isEndingSoon
                            ? 'Freeing up soon • Queue at Reception'
                            : 'In active session • Check back soon'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })}

        {filteredStations.length === 0 && !loading && (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateTitle}>No stations found</div>
            <p>Try clearing your filter or search query to see all lounge stations.</p>
          </div>
        )}
      </main>

      {/* Helpful Status Legend & Lounge Footer */}
      <footer className={styles.legendFooter}>
        <div className={styles.legendList}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotAvailable}`} />
            <span>Available (Free)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotActive}`} />
            <span>In Play</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotEndingSoon}`} />
            <span>Ending Soon (&lt;15m)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotExpired}`} />
            <span>Time Expired</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotPostpaid}`} />
            <span>Open Session</span>
          </div>
        </div>

        <div>
          <span>Udhyana Games Lounge • Live Arena Board • Auto-updates every second</span>
        </div>
      </footer>
    </div>
  );
}
