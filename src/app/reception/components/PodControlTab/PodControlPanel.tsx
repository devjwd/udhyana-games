'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './PodControlPanel.module.css';

interface PodFleetEntry {
  lastSeen: number;
  ip: string;
  isOnline: boolean;
  agoSeconds: number;
}

const STATION_OPTIONS = [
  { id: 'PS5', label: 'Station 1 (PS5)' },
  { id: 'Xbox series X', label: 'Station 2 (Xbox Series X)' },
  { id: 'Xbox series X(2)', label: 'Station 3 (Xbox Series X 2)' },
  { id: 'steerin wheel + ps4', label: 'Station 4 (Steering Wheel)' }
];

const PRESET_MEDIA = [
  {
    type: 'video',
    name: 'Tekken 8 Trailer',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    title: 'Tekken 8 — The King of Iron Fist'
  },
  {
    type: 'video',
    name: 'Red Bull & Cafe Reel',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Udhyana Games — Lounge Cafe Specials'
  },
  {
    type: 'video',
    name: '1080p 60FPS Video Test',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: '1080p 60FPS Video Hardware Test'
  },
  {
    type: 'photo',
    name: 'Champions Poster',
    url: '/images/champs.jpg',
    title: 'Tournament Champions Announcement'
  },
  {
    type: 'photo',
    name: 'Lounge Interior',
    url: '/images/lounge_interior.png',
    title: 'Udhyana Gaming Lounge VIP Booths'
  },
  {
    type: 'photo',
    name: 'Hero Gaming Art',
    url: '/images/hero_main.jpg',
    title: 'Next-Gen Gaming Arena'
  }
];

export default function PodControlPanel() {
  const [selectedStation, setSelectedStation] = useState<string>('PS5');
  const [targetBroadcast, setTargetBroadcast] = useState<string>('ALL');
  const [isPreviewDiagnostics, setIsPreviewDiagnostics] = useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState<number>(1);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Fleet heartbeats
  const [fleet, setFleet] = useState<Record<string, PodFleetEntry>>({});

  // Media Broadcast State
  const [customMediaUrl, setCustomMediaUrl] = useState<string>(PRESET_MEDIA[0].url);
  const [customMediaTitle, setCustomMediaTitle] = useState<string>(PRESET_MEDIA[0].title);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  // Poll Fleet Status
  const fetchFleet = useCallback(async () => {
    try {
      const res = await fetch('/api/station-display', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.fleet) {
        setFleet(data.fleet);
      }
    } catch {
      // offline fallback
    }
  }, []);

  useEffect(() => {
    fetchFleet();
    const interval = setInterval(fetchFleet, 3500);
    return () => clearInterval(interval);
  }, [fetchFleet]);

  const triggerPodAction = async (payload: Record<string, unknown>, actionName: string) => {
    setLoadingAction(actionName);
    setFeedback({ type: 'info', text: `Sending ${actionName} to ${targetBroadcast}...` });
    try {
      const res = await fetch('/api/station-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: targetBroadcast,
          ...payload
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `✅ [${targetBroadcast}] ${actionName} sent! Preview & physical tablets will react within 2s.`
        });
      } else {
        setFeedback({ type: 'error', text: `❌ Failed: ${data.error || 'Server rejected action'}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setFeedback({ type: 'error', text: `❌ Network Error: ${msg}` });
    } finally {
      setLoadingAction(null);
    }
  };

  // Preview URL calculation
  const currentPreviewUrl = isPreviewDiagnostics
    ? '/station/test'
    : `/station/${encodeURIComponent(selectedStation)}`;

  const reloadPreview = () => {
    setPreviewKey((prev) => prev + 1);
  };

  const openPreviewPopout = () => {
    window.open(currentPreviewUrl, '_blank', 'width=1024,height=600');
  };

  return (
    <div className={styles.container}>
      {/* HEADER SECTION */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2>
            <span>🎮</span> Station Pod Simulator & Fleet Testing Center
          </h2>
          <p>
            Test alerts, audio chimes, locate beacons, and video/photo broadcasts on your NEC VersaPro tablets with a live interactive simulator.
          </p>
        </div>

        <div className={styles.headerControls}>
          {/* Station Selector */}
          <div className={styles.stationSelector}>
            {STATION_OPTIONS.map((st) => (
              <button
                key={st.id}
                type="button"
                className={`${styles.stationTabBtn} ${
                  selectedStation === st.id && !isPreviewDiagnostics ? styles.stationTabBtnActive : ''
                }`}
                onClick={() => {
                  setSelectedStation(st.id);
                  setIsPreviewDiagnostics(false);
                }}
              >
                {st.label}
              </button>
            ))}

            <button
              type="button"
              className={`${styles.stationTabBtn} ${isPreviewDiagnostics ? styles.stationTabBtnActive : ''}`}
              onClick={() => setIsPreviewDiagnostics(true)}
              style={{ color: isPreviewDiagnostics ? '#000' : '#00f0ff' }}
            >
              🛠️ Hardware Diagnostics
            </button>
          </div>

          <button type="button" className={styles.topBtn} onClick={reloadPreview} title="Reload Simulator Frame">
            🔄 Reload Preview
          </button>

          <button type="button" className={`${styles.topBtn} ${styles.topBtnCyan}`} onClick={openPreviewPopout}>
            ↗ Pop Out Simulator
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={styles.feedbackBanner}
          style={{
            background:
              feedback.type === 'success'
                ? 'rgba(0, 240, 255, 0.12)'
                : feedback.type === 'error'
                ? 'rgba(255, 0, 85, 0.15)'
                : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${
              feedback.type === 'success'
                ? '#00f0ff'
                : feedback.type === 'error'
                ? '#ff0055'
                : 'rgba(255, 255, 255, 0.15)'
            }`,
            color: feedback.type === 'success' ? '#00f0ff' : feedback.type === 'error' ? '#ff0055' : '#fff'
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* MASTER 2-COLUMN SPLIT LAYOUT */}
      <div className={styles.masterLayout}>
        {/* COLUMN 1: LIVE INTERACTIVE TABLET SIMULATOR */}
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <div className={styles.previewTitle}>
              <span>📱</span>
              <span>
                {isPreviewDiagnostics ? 'NEC Tablet Hardware Diagnostics' : `Live Preview: ${selectedStation}`}
              </span>
            </div>
            <span className={styles.liveIndicator}>● LIVE SIMULATOR</span>
          </div>

          {/* REALISTIC TABLET BEZEL */}
          <div className={styles.tabletFrame}>
            <div className={styles.tabletCamera} />
            <div className={styles.tabletScreenWrapper}>
              <iframe
                key={previewKey}
                className={styles.tabletIframe}
                src={currentPreviewUrl}
                title="Station Pod Simulator"
                allow="autoplay; fullscreen"
              />
            </div>
          </div>

          <div className={styles.previewToolbar}>
            <span>
              Simulating 10.1&quot; 1920×1200 Display • Connected to <code>{currentPreviewUrl}</code>
            </span>
            <span style={{ color: '#00f0ff' }}>Interactions in frame test live touch & gestures</span>
          </div>
        </div>

        {/* COLUMN 2: INSTANT ACTION TESTING DECK */}
        <div className={styles.actionsSection}>
          {/* CARD 1: HARDWARE ALERT & CHIME SIMULATOR */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <span>⚡</span> Hardware Alert & Chime Triggers
              </div>
              <span className={styles.cardTag} style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff' }}>
                Instant LAN Trigger
              </span>
            </div>

            {/* Target Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 800 }}>
                Target:
              </label>
              <select
                value={targetBroadcast}
                onChange={(e) => setTargetBroadcast(e.target.value)}
                style={{
                  background: '#08090d',
                  border: '1px solid #00f0ff',
                  borderRadius: '6px',
                  color: '#00f0ff',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '4px 8px',
                  outline: 'none',
                  flex: 1
                }}
              >
                <option value="ALL">📺 Broadcast to ALL Pods (and Simulator)</option>
                <option value="PS5">🎮 Station 1 (PS5)</option>
                <option value="Xbox series X">🎮 Station 2 (Xbox Series X)</option>
                <option value="Xbox series X(2)">🎮 Station 3 (Xbox Series X 2)</option>
                <option value="steerin wheel + ps4">🎮 Station 4 (Steering Wheel)</option>
              </select>
            </div>

            <div className={styles.actionGrid}>
              {/* Locate Beacon */}
              <button
                type="button"
                className={`${styles.btnAction} ${styles.btnLocate}`}
                disabled={loadingAction !== null}
                onClick={() =>
                  triggerPodAction(
                    { action: 'TRIGGER_TEST', testType: 'LOCATE', label: `📍 LOCATE: ${targetBroadcast}` },
                    'Locate Beacon'
                  )
                }
              >
                <span className={styles.actionIcon}>📍</span>
                <div>
                  <div className={styles.actionTextTitle}>Locate Beacon</div>
                  <div className={styles.actionTextSub}>Flashes screen & plays ping</div>
                </div>
              </button>

              {/* 5-Min Alert */}
              <button
                type="button"
                className={`${styles.btnAction} ${styles.btnWarning}`}
                disabled={loadingAction !== null}
                onClick={() =>
                  triggerPodAction(
                    { action: 'TRIGGER_TEST', testType: 'WARNING' },
                    '5-Min Warning Chime'
                  )
                }
              >
                <span className={styles.actionIcon}>🔔</span>
                <div>
                  <div className={styles.actionTextTitle}>5-Min Warning</div>
                  <div className={styles.actionTextSub}>Amber flash + soft chime</div>
                </div>
              </button>

              {/* Time's Up Alarm */}
              <button
                type="button"
                className={`${styles.btnAction} ${styles.btnAlarm}`}
                disabled={loadingAction !== null}
                onClick={() =>
                  triggerPodAction(
                    { action: 'TRIGGER_TEST', testType: 'EXPIRED' },
                    "Time's Up Alarm"
                  )
                }
              >
                <span className={styles.actionIcon}>🚨</span>
                <div>
                  <div className={styles.actionTextTitle}>Time&apos;s Up Alarm</div>
                  <div className={styles.actionTextSub}>Crimson flash + loud buzzer</div>
                </div>
              </button>

              {/* Reload Tablet Browser */}
              <button
                type="button"
                className={styles.btnAction}
                disabled={loadingAction !== null}
                onClick={() =>
                  triggerPodAction(
                    { action: 'TRIGGER_TEST', testType: 'RELOAD' },
                    'Remote Reload'
                  )
                }
              >
                <span className={styles.actionIcon}>🔄</span>
                <div>
                  <div className={styles.actionTextTitle}>Remote Reload</div>
                  <div className={styles.actionTextSub}>Refreshes tablet over Wi-Fi</div>
                </div>
              </button>
            </div>
          </div>

          {/* CARD 2: REMOTE MEDIA BROADCAST */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <span>🎬</span> Video & Photo Broadcast (Attract Mode)
              </div>
              <span className={styles.cardTag} style={{ background: 'rgba(255, 0, 85, 0.15)', color: '#ff0055' }}>
                1080p Fullscreen
              </span>
            </div>

            {/* Quick Presets */}
            <div className={styles.presetChips}>
              {PRESET_MEDIA.map((item) => {
                const isSelected = customMediaUrl === item.url;
                return (
                  <button
                    key={item.url}
                    type="button"
                    className={`${styles.chipBtn} ${isSelected ? styles.chipBtnActive : ''}`}
                    onClick={() => {
                      setCustomMediaUrl(item.url);
                      setCustomMediaTitle(item.title);
                    }}
                  >
                    <span>{item.type === 'video' ? '🎬' : '🖼️'}</span>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.mediaInputRow}>
              <input
                type="text"
                className={styles.mediaInput}
                value={customMediaUrl}
                onChange={(e) => setCustomMediaUrl(e.target.value)}
                placeholder="Direct MP4 video, Photo (.jpg/.png), or YouTube URL..."
              />

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#fff', cursor: 'pointer' }}>
                <input type="checkbox" checked={isLooping} onChange={(e) => setIsLooping(e.target.checked)} />
                Loop
              </label>

              <button
                type="button"
                className={styles.btnPrimary}
                disabled={loadingAction !== null}
                onClick={() =>
                  triggerPodAction(
                    {
                      action: 'PLAY_VIDEO',
                      url: customMediaUrl,
                      title: customMediaTitle,
                      loop: isLooping
                    },
                    'Media Broadcast'
                  )
                }
              >
                ▶️ Broadcast
              </button>

              <button
                type="button"
                className={styles.btnStop}
                disabled={loadingAction !== null}
                onClick={() => triggerPodAction({ action: 'STOP_VIDEO' }, 'Stop Media')}
              >
                ⏹️ Close
              </button>
            </div>
          </div>

          {/* CARD 3: 5-POD LIVE FLEET STATUS */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <span>📶</span> Live Pod Fleet Heartbeat Matrix
              </div>
              <span style={{ fontSize: '0.72rem', color: '#00f0ff', fontWeight: 800 }}>
                ● Auto-refreshing every 3.5s
              </span>
            </div>

            <div className={styles.fleetGrid}>
              {STATION_OPTIONS.map((st) => {
                const entry = fleet[st.id];
                const isOnline = Boolean(entry?.isOnline);
                const pingText = entry ? `${entry.agoSeconds}s ago` : 'Offline';

                return (
                  <div
                    key={st.id}
                    className={`${styles.fleetItem} ${isOnline ? styles.fleetItemOnline : ''}`}
                  >
                    <div className={styles.fleetName}>{st.label.replace(/\s*\([^)]*\)/g, '')}</div>
                    <div className={`${styles.fleetStatus} ${isOnline ? styles.fleetStatusOnline : ''}`}>
                      {isOnline ? `🟢 ${pingText}` : '⚪ Offline'}
                    </div>
                    {entry?.ip && (
                      <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>
                        {entry.ip}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
