'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './station.module.css';
import { stationSounds } from './utils/stationSounds';
import { STATION_CONFIG } from './config/stationConfig';
import { useWakeLock } from './hooks/useWakeLock';
import { useStaffCall } from './hooks/useStaffCall';
import {
  StationInfo,
  SessionInfo,
  StationSummary,
  StationApiResponse,
} from './types/station';

// Modular UI components
import StationHeader from './components/StationHeader';
import TimerDisplay from './components/TimerDisplay';
import StationProgressBar from './components/StationProgressBar';
import ScreenFlashOverlay from './components/ScreenFlashOverlay';
import StationSwitcherModal from './components/StationSwitcherModal';
import KioskTapOverlay from './components/KioskTapOverlay';
import SleepBlackoutOverlay from './components/SleepBlackoutOverlay';

function formatTimerDigits(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function StationMonitorClient({ initialStationId }: { initialStationId?: string }) {
  const [stationId, setStationId] = useState<string>(() => {
    if (initialStationId) return initialStationId;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlStation = params.get('stationId') || params.get('station') || params.get('id');
      if (urlStation) return urlStation;
      const stored = localStorage.getItem(STATION_CONFIG.STORAGE_STATION_KEY);
      if (stored) return stored;
    }
    return 'PS5';
  });

  const [stationData, setStationData] = useState<StationInfo>({
    id: stationId,
    name: 'STATION 01',
    slug: stationId,
    hourlyRate: STATION_CONFIG.DEFAULT_HOURLY_RATE,
    games: []
  });

  const [sessionData, setSessionData] = useState<SessionInfo>({
    id: null,
    status: 'IDLE',
    guestName: 'Available',
    billingType: 'PREPAID',
    remainingSeconds: 0,
    elapsedSeconds: 0,
    totalDurationSeconds: 0,
    extraControllers: 0,
    startTime: null,
    endTime: null
  });

  const [allStations, setAllStations] = useState<StationSummary[]>([]);
  const [localSeconds, setLocalSeconds] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? stationSounds.getMuted() : false;
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hasStartedKiosk, setHasStartedKiosk] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('station_kiosk_active') === 'true';
    }
    return false;
  });
  const [isSwitcherOpen, setIsSwitcherOpen] = useState<boolean>(false);

  // Determine current active/warning/expired state
  const isTimeUp =
    sessionData.status === 'EXPIRED' ||
    (sessionData.status === 'ACTIVE' && localSeconds <= 0 && sessionData.billingType === 'PREPAID');

  const isEndingSoon =
    !isTimeUp &&
    (sessionData.status === 'ENDING_SOON' ||
      (sessionData.status === 'ACTIVE' &&
        sessionData.billingType === 'PREPAID' &&
        localSeconds <= STATION_CONFIG.WARNING_THRESHOLD_SECONDS));

  const isPaused = sessionData.status === 'PAUSED';
  const isIdle = sessionData.status === 'IDLE';

  // OLED Stealth / Blackout Sleep Mode state
  const [isScreenAsleep, setIsScreenAsleep] = useState<boolean>(false);
  const wakeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isEndingSoonRef = useRef<boolean>(isEndingSoon);
  const isTimeUpRef = useRef<boolean>(isTimeUp);

  useEffect(() => {
    isEndingSoonRef.current = isEndingSoon;
    isTimeUpRef.current = isTimeUp;
  }, [isEndingSoon, isTimeUp]);

  // Wake screen: wakes up display, then schedules return to sleep after duration
  const wakeScreen = useCallback((durationSeconds: number = STATION_CONFIG.SLEEP_MODE.MANUAL_WAKE_DURATION_SECONDS) => {
    setIsScreenAsleep(false);
    if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);

    if (isEndingSoonRef.current || isTimeUpRef.current) {
      return;
    }

    wakeTimerRef.current = setTimeout(() => {
      if (!isEndingSoonRef.current && !isTimeUpRef.current) {
        setIsScreenAsleep(true);
      }
    }, durationSeconds * 1000);
  }, []);

  // When 5-minute alert or timeout triggers, clear any scheduled sleep timer
  useEffect(() => {
    if (isEndingSoon || isTimeUp) {
      if (wakeTimerRef.current) {
        clearTimeout(wakeTimerRef.current);
        wakeTimerRef.current = null;
      }
    }
  }, [isEndingSoon, isTimeUp]);

  // Clean up wake timer on unmount
  useEffect(() => {
    return () => {
      if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
    };
  }, []);

  // Refresh wake timer on user interaction while screen is awake
  const handleScreenActivity = useCallback(() => {
    if (!isScreenAsleep && !isEndingSoon && !isTimeUp) {
      if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
      wakeTimerRef.current = setTimeout(() => {
        if (!isEndingSoonRef.current && !isTimeUpRef.current) {
          setIsScreenAsleep(true);
        }
      }, STATION_CONFIG.SLEEP_MODE.MANUAL_WAKE_DURATION_SECONDS * 1000);
    }
  }, [isScreenAsleep, isEndingSoon, isTimeUp]);

  // Screen Flash state for 5-minute warning
  const [flashState, setFlashState] = useState<'NONE' | 'SOFT_WARNING'>('NONE');
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio trigger tracking refs to avoid duplicate chiming
  const lastSessionIdRef = useRef<string | null>(null);
  const hasChimedWarningRef = useRef<boolean>(false);
  const hasChimedExpiredRef = useRef<boolean>(false);

  // Hooks
  const { requestWakeLock } = useWakeLock();

  // Format clean station display name (e.g. STATION 01)
  let cleanStationName = stationData.name.replace(/\s*\([^)]*\)/g, '').trim().toUpperCase();
  cleanStationName = cleanStationName.replace(/(\bSTATION\s+)(\d\b)/i, '$10$2');

  const { isStaffCalling, staffCallCooldown, callStaff } = useStaffCall({
    stationId,
    stationName: cleanStationName
  });

  const triggerSoftWarningFlash = useCallback(() => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashState('SOFT_WARNING');
    flashTimerRef.current = setTimeout(() => {
      setFlashState('NONE');
    }, STATION_CONFIG.SOFT_FLASH_DURATION_MS);
  }, []);

  // Save assigned stationId in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && stationId) {
      localStorage.setItem(STATION_CONFIG.STORAGE_STATION_KEY, stationId);
    }
  }, [stationId]);

  // Main polling engine
  const fetchStationStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/station-display?stationId=${encodeURIComponent(stationId)}`, {
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('Network error');
      const data: StationApiResponse = await res.json();

      if (data.success) {
        if (data.allStations) setAllStations(data.allStations);
        if (data.station) setStationData(data.station);

        if (data.session) {
          const sess = data.session;
          setSessionData(sess);
          setLocalSeconds(sess.remainingSeconds);

          if (sess.id) {
            if (lastSessionIdRef.current !== sess.id) {
              lastSessionIdRef.current = sess.id;
              hasChimedWarningRef.current = false;
              hasChimedExpiredRef.current = false;
              if (sess.status === 'ACTIVE' || sess.status === 'ENDING_SOON') {
                stationSounds.playSessionStart();
                wakeScreen(10);
              }
            }

            if (
              sess.billingType === 'PREPAID' &&
              sess.remainingSeconds <= STATION_CONFIG.WARNING_THRESHOLD_SECONDS &&
              sess.remainingSeconds > 0 &&
              !hasChimedWarningRef.current
            ) {
              hasChimedWarningRef.current = true;
              stationSounds.playWarningChime();
              triggerSoftWarningFlash();
            }

            if (
              sess.billingType === 'PREPAID' &&
              (sess.status === 'EXPIRED' || sess.remainingSeconds <= 0) &&
              !hasChimedExpiredRef.current
            ) {
              hasChimedExpiredRef.current = true;
              stationSounds.playTimeUpAlarm();
            }
          } else {
            lastSessionIdRef.current = null;
            hasChimedWarningRef.current = false;
            hasChimedExpiredRef.current = false;
          }
        }
      }
    } catch {
      // Graceful offline fallback
    }
  }, [stationId, triggerSoftWarningFlash, wakeScreen]);

  // Polling interval
  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (active) await fetchStationStatus();
    };
    poll();
    const pollInterval = setInterval(poll, STATION_CONFIG.POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [fetchStationStatus]);

  // Local second-by-second countdown ticker
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setLocalSeconds((prev) => {
        if (sessionData.status === 'PAUSED' || sessionData.status === 'IDLE') {
          return prev;
        }
        if (sessionData.billingType === 'POSTPAID') {
          return prev + 1;
        }
        const nextSec = prev - 1;
        if (
          nextSec <= STATION_CONFIG.WARNING_THRESHOLD_SECONDS &&
          nextSec > STATION_CONFIG.WARNING_THRESHOLD_SECONDS - 2 &&
          !hasChimedWarningRef.current
        ) {
          hasChimedWarningRef.current = true;
          stationSounds.playWarningChime();
          triggerSoftWarningFlash();
        }
        if (nextSec <= 0 && !hasChimedExpiredRef.current) {
          hasChimedExpiredRef.current = true;
          stationSounds.playTimeUpAlarm();
          return 0;
        }
        return Math.max(0, nextSec);
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [sessionData.status, sessionData.billingType, triggerSoftWarningFlash]);

  const toggleFullscreen = () => {
    stationSounds.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const toggleMute = () => {
    const nextMute = stationSounds.toggleMuted();
    setIsMuted(nextMute);
  };

  const handleStartKiosk = () => {
    stationSounds.initContext();
    stationSounds.playClick();
    requestWakeLock();
    if (typeof window !== 'undefined') {
      localStorage.setItem('station_kiosk_active', 'true');
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    }
    setHasStartedKiosk(true);
    if (!isEndingSoon && !isTimeUp) {
      wakeScreen(8);
    }
  };

  // Progress percentage calculation
  let progressPercent = 0;
  if (!isIdle && sessionData.totalDurationSeconds > 0) {
    if (sessionData.billingType === 'POSTPAID') {
      progressPercent = 100;
    } else {
      progressPercent = Math.min(
        100,
        Math.max(
          0,
          ((sessionData.totalDurationSeconds - localSeconds) / sessionData.totalDurationSeconds) * 100
        )
      );
    }
  }

  // Visual styling variants
  let digitsClass = styles.digitsActive;
  let capsuleClass = styles.capsuleActive;
  let barClass = styles.barActive;
  let statusText: string = STATION_CONFIG.LABELS.ACTIVE;

  if (isTimeUp) {
    digitsClass = styles.digitsExpired;
    capsuleClass = styles.capsuleExpired;
    barClass = styles.barExpired;
    statusText = STATION_CONFIG.LABELS.EXPIRED;
  } else if (isEndingSoon) {
    digitsClass = styles.digitsWarning;
    capsuleClass = styles.capsuleWarning;
    barClass = styles.barWarning;
    statusText = STATION_CONFIG.LABELS.ENDING_SOON;
  } else if (isPaused) {
    digitsClass = styles.digitsActive;
    capsuleClass = styles.capsulePaused;
    barClass = styles.barWarning;
    statusText = STATION_CONFIG.LABELS.PAUSED;
  } else if (isIdle) {
    digitsClass = styles.digitsIdle;
    capsuleClass = styles.capsuleIdle;
    barClass = styles.barIdle;
    statusText = STATION_CONFIG.LABELS.IDLE;
  }

  // Display blackout only when asleep and not in alert states
  const isDisplayAsleep = isScreenAsleep && !isEndingSoon && !isTimeUp;

  return (
    <div
      className={styles.container}
      onClick={handleScreenActivity}
      onTouchStart={handleScreenActivity}
    >
      {/* FULL-SCREEN FLASH EFFECTS: RED FLASH ON TIMEOUT & SOFT FLASH ON 5-MIN REMAINING */}
      <ScreenFlashOverlay isTimeUp={isTimeUp} flashState={flashState} />

      {/* TOP HEADER: CORNER UTILITY BUTTONS + [🎮 STATION 01] */}
      <StationHeader
        stationName={cleanStationName}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        onOpenSwitcher={() => setIsSwitcherOpen(true)}
        onToggleMute={toggleMute}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* CENTER CLOCK & STATUS CAPSULE & CALL STAFF BUTTON */}
      <TimerDisplay
        timerDisplay={isIdle ? '00:00:00' : formatTimerDigits(localSeconds)}
        statusText={statusText}
        digitsClass={digitsClass}
        capsuleClass={capsuleClass}
        isStaffCalling={isStaffCalling}
        staffCallCooldown={staffCallCooldown}
        onCallStaff={callStaff}
      />

      {/* BOTTOM PROGRESS SECTION */}
      <StationProgressBar progressPercent={progressPercent} barClass={barClass} />

      {/* STEALTH OLED BLACKOUT OVERLAY (WAKES ON DOUBLE-TAP, 5 MINS LEFT, OR TIMEOUT) */}
      <SleepBlackoutOverlay
        isAsleep={isDisplayAsleep}
        onDoubleTapWake={() => wakeScreen()}
      />

      {/* INITIAL TAP-TO-ENTER KIOSK OVERLAY */}
      <KioskTapOverlay isVisible={!hasStartedKiosk} onStartKiosk={handleStartKiosk} />

      {/* STATION SWITCHER MODAL */}
      <StationSwitcherModal
        isOpen={isSwitcherOpen}
        stationId={stationId}
        allStations={allStations}
        onSelectStation={(id) => setStationId(id)}
        onClose={() => setIsSwitcherOpen(false)}
      />
    </div>
  );
}
