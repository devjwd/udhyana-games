'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './PodDiagnostic.module.css';
import { stationSounds } from '../utils/stationSounds';

export default function PodDiagnosticClient() {
  // Device & Screen Specs
  const [screenRes, setScreenRes] = useState<string>('Detecting...');
  const [touchPoints, setTouchPoints] = useState<number>(0);
  const [batteryLevel, setBatteryLevel] = useState<string>('AC Power / N/A');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<'testing' | 'success' | 'failed'>('testing');
  const [serverIp, setServerIp] = useState<string>('');
  const [cachedMediaCount, setCachedMediaCount] = useState<number>(0);

  // Touch Matrix (24 cells: 6 cols x 4 rows)
  const TOTAL_CELLS = 24;
  const [touchedCells, setTouchedCells] = useState<Set<number>>(new Set());
  const [lastTouchCoord, setLastTouchCoord] = useState<{ x: number; y: number; count: number } | null>(null);

  // Audio Testing states
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  // Fullscreen Color Testing
  const [activeColorTest, setActiveColorTest] = useState<'BLACK' | 'AMBER' | 'RED' | 'WHITE' | null>(null);

  // Staff Call Beacon Test State
  const [beaconStatus, setBeaconStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Detect specs on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setScreenRes(`${window.screen.width} x ${window.screen.height} (Viewport: ${window.innerWidth} x ${window.innerHeight})`);
      setTouchPoints(navigator.maxTouchPoints || 0);

      // Battery API if supported
      if ('getBattery' in navigator) {
        (navigator as unknown as { getBattery: () => Promise<{ level: number; charging: boolean }> })
          .getBattery()
          .then((battery) => {
            const pct = Math.round(battery.level * 100);
            setBatteryLevel(`${pct}% ${battery.charging ? '(Plugged In)' : '(On Battery)'}`);
          })
          .catch(() => {});
      }

      // Check CacheStorage
      if ('caches' in window) {
        caches.open('udhyana-pod-media-v1').then(async (cache) => {
          try {
            const keys = await cache.keys();
            setCachedMediaCount(keys.length);
          } catch {
            // ignore
          }
        });
      }
    }
  }, []);

  // Ping Server Test
  const runPingTest = useCallback(async () => {
    setPingStatus('testing');
    const start = performance.now();
    try {
      const res = await fetch('/api/station-display', { cache: 'no-store' });
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        setLatencyMs(elapsed);
        setPingStatus('success');
        setServerIp(window.location.hostname);
      } else {
        setPingStatus('failed');
      }
    } catch {
      setPingStatus('failed');
    }
  }, []);

  useEffect(() => {
    runPingTest();
    const interval = setInterval(runPingTest, 5000);
    return () => clearInterval(interval);
  }, [runPingTest]);

  // Touch Matrix handlers
  const handleTouchGrid = (idx: number, e: React.TouchEvent | React.MouseEvent) => {
    stationSounds.playClick();
    setTouchedCells((prev) => {
      const updated = new Set(prev);
      updated.add(idx);
      return updated;
    });

    if ('touches' in e && e.touches.length > 0) {
      const t = e.touches[0];
      setLastTouchCoord({ x: Math.round(t.clientX), y: Math.round(t.clientY), count: e.touches.length });
    } else if ('clientX' in e) {
      setLastTouchCoord({ x: Math.round(e.clientX), y: Math.round(e.clientY), count: 1 });
    }
  };

  const handleClearGrid = () => {
    stationSounds.playClick();
    setTouchedCells(new Set());
    setLastTouchCoord(null);
  };

  // Sound Tests
  const testSound = (name: string, fn: () => void) => {
    setPlayingSound(name);
    stationSounds.initContext();
    fn();
    setTimeout(() => setPlayingSound(null), 1200);
  };

  // Staff Call Beacon Test
  const handleTestStaffCall = async () => {
    setBeaconStatus('sending');
    try {
      const res = await fetch('/api/station-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: 'DIAGNOSTIC_POD',
          stationName: 'NEC Diagnostic Tablet',
          action: 'CALL_STAFF'
        })
      });
      if (res.ok) {
        stationSounds.playStaffCallBell();
        setBeaconStatus('sent');
        setTimeout(() => setBeaconStatus('idle'), 4000);
      } else {
        setBeaconStatus('error');
      }
    } catch {
      setBeaconStatus('error');
    }
  };

  // Launch Live Kiosk
  const launchStation = (id: string) => {
    window.location.href = `/station/${encodeURIComponent(id)}`;
  };

  return (
    <div className={styles.container}>
      {/* HEADER SECTION */}
      <header className={styles.header}>
        <div>
          <div className={styles.headerTitle}>
            <span>🛠️</span>
            <span>UDHYANA GAMES — NEC VERSAPRO HARDWARE DIAGNOSTICS</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
            Interactive Display, Touch Digitizer, Audio & Network Verification Suite
          </div>
        </div>

        <div className={styles.systemBadges}>
          <div className={`${styles.badge} ${pingStatus === 'success' ? styles.badgeSuccess : ''}`}>
            <span>📶 Server Ping:</span>
            <span>{pingStatus === 'success' ? `${latencyMs}ms (${serverIp})` : 'Connecting...'}</span>
          </div>
          <div className={styles.badge}>
            <span>🖥️ Resolution:</span>
            <span>{screenRes}</span>
          </div>
          <div className={`${styles.badge} ${touchPoints > 0 ? styles.badgeSuccess : ''}`}>
            <span>👆 Touch Points:</span>
            <span>{touchPoints > 0 ? `${touchPoints}-point Multi-touch` : 'None / Disabled'}</span>
          </div>
          <div className={styles.badge}>
            <span>🔋 Power:</span>
            <span>{batteryLevel}</span>
          </div>
        </div>
      </header>

      {/* MAIN DIAGNOSTIC GRID */}
      <div className={styles.grid}>
        {/* TEST 1: TOUCH SCREEN & DIGITIZER */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>
                <span>👆</span> Test 1: Touch Digitizer Matrix
              </div>
              <div className={styles.cardSubtitle}>
                Tap each box across the screen to confirm all touch areas work
              </div>
            </div>
            <button type="button" className={styles.btnTest} style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={handleClearGrid}>
              🔄 Reset Grid
            </button>
          </div>

          <div className={styles.touchMatrix}>
            {Array.from({ length: TOTAL_CELLS }).map((_, i) => {
              const isDone = touchedCells.has(i);
              return (
                <div
                  key={i}
                  className={`${styles.touchCell} ${isDone ? styles.touchCellTouched : ''}`}
                  onPointerDown={(e) => handleTouchGrid(i, e)}
                >
                  {isDone ? '✓' : i + 1}
                </div>
              );
            })}
          </div>

          <div className={styles.touchInfoRow}>
            <span>
              <strong>Progress:</strong> {touchedCells.size} / {TOTAL_CELLS} zones verified (
              {Math.round((touchedCells.size / TOTAL_CELLS) * 100)}%)
            </span>
            {lastTouchCoord && (
              <span style={{ color: '#00f0ff' }}>
                📍 X: {lastTouchCoord.x}, Y: {lastTouchCoord.y} ({lastTouchCoord.count} touch)
              </span>
            )}
          </div>
        </div>

        {/* TEST 2: AUDIO ENGINE & CHIMES */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>
                <span>🔊</span> Test 2: Sound Synthesizer & Chimes
              </div>
              <div className={styles.cardSubtitle}>
                Web Audio synthesizer alerts at 100% volume
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#00f0ff', fontWeight: 800 }}>
              {playingSound ? `▶️ Playing: ${playingSound}` : 'Ready'}
            </span>
          </div>

          <div className={styles.buttonGrid}>
            <button
              type="button"
              className={`${styles.btnTest} ${playingSound === 'Session Start' ? styles.btnTestActive : ''}`}
              onClick={() => testSound('Session Start', () => stationSounds.playSessionStart())}
            >
              <span>🎵</span> Session Start Chime
            </button>

            <button
              type="button"
              className={`${styles.btnTest} ${styles.btnWarning} ${playingSound === '5-Min Warning' ? styles.btnTestActive : ''}`}
              onClick={() => testSound('5-Min Warning', () => stationSounds.playWarningChime())}
            >
              <span>🔔</span> 5-Min Warning Soft Chime
            </button>

            <button
              type="button"
              className={`${styles.btnTest} ${styles.btnAlarm} ${playingSound === "Time's Up Alarm" ? styles.btnTestActive : ''}`}
              onClick={() => testSound("Time's Up Alarm", () => stationSounds.playTimeUpAlarm())}
            >
              <span>🚨</span> Time's Up Alarm
            </button>

            <button
              type="button"
              className={`${styles.btnTest} ${playingSound === 'Staff Call' ? styles.btnTestActive : ''}`}
              onClick={() => testSound('Staff Call', () => stationSounds.playStaffCallBell())}
            >
              <span>🛎️</span> Staff Service Bell
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)' }}>
            ✓ Zero external MP3 files required — generated live by the tablet's sound hardware.
          </div>
        </div>

        {/* TEST 3: FULLSCREEN DISPLAY & COLOR UNIFORMITY */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>
                <span>🎨</span> Test 3: Display Color & Alert Overlays
              </div>
              <div className={styles.cardSubtitle}>
                Check panel backlight, dead pixels, and alert flashes
              </div>
            </div>
          </div>

          <div className={styles.buttonGrid}>
            <button
              type="button"
              className={styles.btnTest}
              onClick={() => setActiveColorTest('BLACK')}
            >
              <span>⬛</span> Pure Black (Stealth Sleep)
            </button>

            <button
              type="button"
              className={`${styles.btnTest} ${styles.btnWarning}`}
              onClick={() => setActiveColorTest('AMBER')}
            >
              <span>🟨</span> Amber (5-Min Soft Flash)
            </button>

            <button
              type="button"
              className={`${styles.btnTest} ${styles.btnAlarm}`}
              onClick={() => setActiveColorTest('RED')}
            >
              <span>🟥</span> Crimson (Time's Up Flash)
            </button>

            <button
              type="button"
              className={styles.btnTest}
              onClick={() => setActiveColorTest('WHITE')}
            >
              <span>⬜</span> Pure White (Backlight Test)
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)' }}>
            Tip: Tap anywhere on the full-screen color test to exit back here.
          </div>
        </div>

        {/* TEST 4: NETWORK, DISK VAULT & STAFF CALL BEACON */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>
                <span>⚡</span> Test 4: Network & Tablet Media Vault
              </div>
              <div className={styles.cardSubtitle}>
                Connection latency and offline media storage verification
              </div>
            </div>
            <button type="button" className={styles.btnTest} style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={runPingTest}>
              🔄 Ping Server
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Server Response Latency:</span>
              <span style={{ fontWeight: 800, color: latencyMs && latencyMs < 50 ? '#00f0ff' : '#ffaa00' }}>
                {latencyMs ? `${latencyMs} ms` : 'Testing...'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Offline Media Saved on Tablet:</span>
              <span style={{ fontWeight: 800, color: '#00f0ff' }}>
                {cachedMediaCount > 0 ? `${cachedMediaCount} files in CacheStorage Vault` : 'Scanning...'}
              </span>
            </div>

            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.6rem' }}>
              <button
                type="button"
                className={styles.btnTest}
                style={{ flex: 1 }}
                disabled={beaconStatus === 'sending'}
                onClick={handleTestStaffCall}
              >
                <span>🛎️</span>
                {beaconStatus === 'sending'
                  ? 'Sending...'
                  : beaconStatus === 'sent'
                  ? '✅ Call Delivered to Reception!'
                  : beaconStatus === 'error'
                  ? '❌ Network Error'
                  : 'Send Test Call to Reception'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER & LIVE STATION LAUNCHERS */}
      <footer className={styles.footer}>
        <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>
          Done testing? Launch this tablet directly into a live Gaming Pod:
        </div>

        <div className={styles.launchGrid}>
          <button type="button" className={styles.launchBtn} onClick={() => launchStation('PS5')}>
            Station 1 (PS5)
          </button>
          <button type="button" className={styles.launchBtn} onClick={() => launchStation('Xbox series X')}>
            Station 2 (Xbox Series X)
          </button>
          <button type="button" className={styles.launchBtn} onClick={() => launchStation('Xbox series X(2)')}>
            Station 3 (Xbox Series X 2)
          </button>
          <button type="button" className={styles.launchBtn} onClick={() => launchStation('steerin wheel + ps4')}>
            Station 4 (Steering Wheel)
          </button>
        </div>
      </footer>

      {/* FULLSCREEN COLOR TEST OVERLAYS */}
      {activeColorTest === 'BLACK' && (
        <div
          className={styles.colorOverlay}
          style={{ backgroundColor: '#000000', color: '#333' }}
          onClick={() => setActiveColorTest(null)}
        >
          <span>Tap to exit Blackout Test</span>
        </div>
      )}

      {activeColorTest === 'AMBER' && (
        <div
          className={styles.colorOverlay}
          style={{ backgroundColor: 'rgba(255, 170, 0, 0.35)', color: '#ffaa00' }}
          onClick={() => setActiveColorTest(null)}
        >
          <span>5-Minute Warning Soft Flash Preview (Tap to exit)</span>
        </div>
      )}

      {activeColorTest === 'RED' && (
        <div
          className={styles.colorOverlay}
          style={{ backgroundColor: 'rgba(255, 0, 50, 0.45)', color: '#ff0055' }}
          onClick={() => setActiveColorTest(null)}
        >
          <span>Time's Up Expired Crimson Flash Preview (Tap to exit)</span>
        </div>
      )}

      {activeColorTest === 'WHITE' && (
        <div
          className={styles.colorOverlay}
          style={{ backgroundColor: '#ffffff', color: '#000000' }}
          onClick={() => setActiveColorTest(null)}
        >
          <span>Backlight & Dead Pixel Test (Tap to exit)</span>
        </div>
      )}
    </div>
  );
}
