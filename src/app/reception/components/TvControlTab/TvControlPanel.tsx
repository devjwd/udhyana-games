'use client';

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import styles from './TvControlPanel.module.css';
import { StationTvConfig } from '@/lib/tvController';

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'error' | 'warning';
  text: string;
}

const PRESET_VIDEOS = [
  {
    name: '🎮 Tekken 8 Trailer',
    url: 'https://www.youtube.com/watch?v=2hPuRQz6IlM',
    title: 'Tekken 8 — The King of Iron Fist'
  },
  {
    name: '🏎️ Forza Horizon 5',
    url: 'https://www.youtube.com/watch?v=FYH9n3Ov126',
    title: 'Forza Horizon 5 — Official Trailer'
  },
  {
    name: '⚽ EA Sports FC 25',
    url: 'https://www.youtube.com/watch?v=pBM2xyCo_Kg',
    title: 'EA Sports FC 25 — Club is Everything'
  },
  {
    name: '🥤 Cafe & Red Bull Reel',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Udhyana Games — Lounge Cafe Specials'
  },
  {
    name: '🍿 1080p Ultra-HD Animation',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: '1080p 60FPS Video Hardware Test'
  }
];

export default function TvControlPanel() {
  const [configs, setConfigs] = useState<StationTvConfig[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [savingStation, setSavingStation] = useState<string | null>(null);
  const [customToasts, setCustomToasts] = useState<Record<string, string>>({
    PS5: '🎮 Welcome to Udhyana Games Lounge! Station 1 Active.'
  });

  // Video Broadcast State
  const [selectedTargetPod, setSelectedTargetPod] = useState<string>('ALL');
  const [customVideoUrl, setCustomVideoUrl] = useState<string>(PRESET_VIDEOS[0].url);
  const [customVideoTitle, setCustomVideoTitle] = useState<string>(PRESET_VIDEOS[0].title);
  const [isVideoLooping, setIsVideoLooping] = useState<boolean>(true);
  const [isBroadcastingVideo, setIsBroadcastingVideo] = useState<boolean>(false);
  const [localMedia, setLocalMedia] = useState<{
    videos: Array<{ name: string; url: string; sizeFormatted: string }>;
    images: Array<{ name: string; url: string; sizeFormatted: string }>;
  }>({ videos: [], images: [] });
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      time: new Date().toLocaleTimeString(),
      type: 'info',
      text: 'Smart TV Control Environment initialized. Ready to test LG & Sony Smart TVs.'
    }
  ]);

  const addLog = useCallback((type: 'info' | 'success' | 'error' | 'warning', text: string) => {
    setLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        time: new Date().toLocaleTimeString(),
        type,
        text
      },
      ...prev.slice(0, 49) // Keep last 50 logs
    ]);
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch('/api/tv/control')
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.success && Array.isArray(data.configs)) {
          setConfigs(data.configs);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load TV configs:', err);
        }
      });

    // Fetch preloaded local offline media files from public/videos and public/images
    fetch('/api/station-media')
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data.success) {
          setLocalMedia({
            videos: data.videos || [],
            images: data.images || []
          });
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const updateStationField = (stationId: string, field: keyof StationTvConfig, value: unknown) => {
    setConfigs((prev) =>
      prev.map((c) => (c.stationId === stationId ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveStation = async (stationId: string) => {
    const station = configs.find((c) => c.stationId === stationId);
    if (!station) return;

    setSavingStation(stationId);
    addLog('info', `[${stationId}] Saving network setup: IP=${station.ip}, MAC=${station.mac}, Input=${station.hdmiInput}...`);

    try {
      const res = await fetch('/api/tv/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_station_tv',
          stationId: station.stationId,
          stationName: station.stationName,
          tvBrand: station.tvBrand,
          ip: station.ip,
          mac: station.mac,
          hdmiInput: station.hdmiInput,
          psk: station.psk
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Network settings saved for ${station.stationName}!`);
        addLog('success', `[${stationId}] ✅ Settings successfully written to local_database/tv_config.json`);
        if (data.configs) setConfigs(data.configs);
      } else {
        toast.error(data.message || 'Failed to save TV settings.');
        addLog('error', `[${stationId}] ❌ Save failed: ${data.message}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast.error(`Save error: ${errorMsg}`);
      addLog('error', `[${stationId}] Save exception: ${errorMsg}`);
    } finally {
      setSavingStation(null);
    }
  };

  const handleAction = async (
    stationId: string,
    action: 'wake' | 'turnOff' | 'turnOn' | 'toast' | 'warning5Min' | 'switchHdmi' | 'screenOff' | 'screenOn' | 'showPhoto' | 'gallery',
    message?: string
  ) => {
    const actionKey = `${stationId}-${action}`;
    setLoadingAction(actionKey);

    addLog('info', `[${stationId}] Executing TV action: "${action}"...`);

    try {
      const res = await fetch('/api/tv/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId,
          action,
          message: message || customToasts[stationId]
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || `Command "${action}" succeeded!`);
        addLog('success', `[${stationId}] ${data.message}`);
      } else {
        toast.error(data.message || `Command "${action}" failed!`);
        addLog('error', `[${stationId}] ❌ ${data.message}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast.error(`Network error: ${errorMsg}`);
      addLog('error', `[${stationId}] Network exception: ${errorMsg}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePlayVideo = async () => {
    if (!customVideoUrl) {
      toast.error('Please enter or select a video URL');
      return;
    }
    setIsBroadcastingVideo(true);
    addLog('info', `[${selectedTargetPod}] Broadcasting video: "${customVideoTitle || customVideoUrl}"...`);
    try {
      const res = await fetch('/api/station-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PLAY_VIDEO',
          stationId: selectedTargetPod,
          url: customVideoUrl,
          title: customVideoTitle,
          loop: isVideoLooping
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Video broadcast sent to ${selectedTargetPod === 'ALL' ? 'all 5 pods' : selectedTargetPod}!`);
        addLog('success', `[${selectedTargetPod}] 🎬 Video broadcast started on pod(s).`);
      } else {
        toast.error(data.error || 'Failed broadcasting video');
        addLog('error', `[${selectedTargetPod}] ❌ Broadcast failed: ${data.error}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast.error(`Broadcast failed: ${errorMsg}`);
      addLog('error', `[${selectedTargetPod}] ❌ Network error: ${errorMsg}`);
    } finally {
      setIsBroadcastingVideo(false);
    }
  };

  const handleStopVideo = async () => {
    addLog('info', `[${selectedTargetPod}] Stopping video broadcast...`);
    try {
      const res = await fetch('/api/station-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'STOP_VIDEO',
          stationId: selectedTargetPod
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Video stopped on ${selectedTargetPod === 'ALL' ? 'all pods' : selectedTargetPod}. Pod returned to timer.`);
        addLog('success', `[${selectedTargetPod}] ⏹️ Video stopped. Station returned to timer.`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast.error(`Stop failed: ${errorMsg}`);
      addLog('error', `[${selectedTargetPod}] ❌ Network error: ${errorMsg}`);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header bar */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2>📺 Smart TV Network Controller & Diagnostics</h2>
          <p>Direct Wi-Fi / LAN control for LG webOS and Sony Bravia station screens</p>
        </div>
        <div className={styles.statusPill}>
          <span className={styles.statusDot} />
          LAN Subnet Active
        </div>
      </div>

      {/* First-time pairing notice */}
      <div className={styles.firstTimeNotice}>
        <span>ℹ️</span>
        <div>
          <strong>First-time pairing reminder:</strong> When sending your first command to an LG TV, look at the TV screen and click <strong>[Accept]</strong> using your LG remote control to pair!
        </div>
      </div>

      {/* Station Cards Grid */}
      <div className={styles.stationGrid}>
        {configs.map((tv) => {
          const isLg = tv.tvBrand === 'LG';
          const isBusy = (actionName: string) => loadingAction === `${tv.stationId}-${actionName}`;

          return (
            <div key={tv.stationId} className={styles.stationCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.stationTitle}>
                    {tv.stationName}
                  </h3>
                  <span className={`${styles.brandBadge} ${isLg ? styles.brandLg : styles.brandSony}`}>
                    {tv.tvBrand} Smart TV
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: tv.enabled ? '#00ff88' : '#888' }}>
                  {tv.enabled ? '● Active Test' : '○ Standby'}
                </div>
              </div>

              {/* Editable Network Details */}
              <div className={styles.specsList}>
                <div className={styles.specItem}>
                  <label className={styles.specLabel}>IP Address</label>
                  <input
                    type="text"
                    className={styles.specInput}
                    value={tv.ip || ''}
                    onChange={(e) => updateStationField(tv.stationId, 'ip', e.target.value)}
                    placeholder="192.168.1.30"
                  />
                </div>
                <div className={styles.specItem}>
                  <label className={styles.specLabel}>MAC Address</label>
                  <input
                    type="text"
                    className={styles.specInput}
                    value={tv.mac || ''}
                    onChange={(e) => updateStationField(tv.stationId, 'mac', e.target.value)}
                    placeholder="20:3D:BD:99:DE:FA"
                  />
                </div>
                <div className={styles.specItem}>
                  <label className={styles.specLabel}>Console Input</label>
                  <input
                    type="text"
                    className={styles.specInput}
                    value={tv.hdmiInput || ''}
                    onChange={(e) => updateStationField(tv.stationId, 'hdmiInput', e.target.value)}
                    placeholder="HDMI_1"
                  />
                </div>
                <div className={styles.specItem}>
                  <label className={styles.specLabel}>TV Brand</label>
                  <select
                    className={styles.specSelect}
                    value={tv.tvBrand}
                    onChange={(e) => updateStationField(tv.stationId, 'tvBrand', e.target.value as 'LG' | 'SONY')}
                  >
                    <option value="LG">LG Smart TV (webOS)</option>
                    <option value="SONY">Sony Bravia (REST)</option>
                  </select>
                </div>
              </div>

              <div className={styles.saveConfigBar}>
                <button
                  type="button"
                  className={styles.btnSaveSpecs}
                  disabled={savingStation === tv.stationId}
                  onClick={() => handleSaveStation(tv.stationId)}
                >
                  {savingStation === tv.stationId ? '⏳ Saving...' : '💾 Save IP & MAC Settings'}
                </button>
              </div>

              {/* Action Buttons Grid */}
              <div className={styles.actionGrid}>
                {/* 1. Wake on LAN / Turn ON */}
                <button
                  type="button"
                  className={`${styles.btnAction} ${styles.btnWake}`}
                  disabled={loadingAction !== null}
                  onClick={() => handleAction(tv.stationId, 'wake')}
                >
                  {isBusy('wake') ? '⏳ Sending...' : '🟢 Wake-on-LAN (ON)'}
                </button>

                {/* 2. Switch to HDMI */}
                <button
                  type="button"
                  className={`${styles.btnAction} ${styles.btnHdmi}`}
                  disabled={loadingAction !== null}
                  onClick={() => handleAction(tv.stationId, 'switchHdmi')}
                >
                  {isBusy('switchHdmi') ? '⏳ Switching...' : `🎮 Switch to ${tv.hdmiInput}`}
                </button>

                {/* 3. Send 5-Min Warning Toast */}
                <button
                  type="button"
                  className={`${styles.btnAction} ${styles.btnWarning}`}
                  disabled={loadingAction !== null}
                  onClick={() => handleAction(tv.stationId, 'warning5Min')}
                >
                  {isBusy('warning5Min') ? '⏳ Sending...' : '⚠️ Test 5-Min Warning'}
                </button>

                {/* 4. Turn Screen Off (Blackout) */}
                <button
                  type="button"
                  className={styles.btnAction}
                  disabled={loadingAction !== null}
                  onClick={() => handleAction(tv.stationId, 'screenOff')}
                >
                  {isBusy('screenOff') ? '⏳ Sending...' : '🕶️ Blackout Screen'}
                </button>

                {/* 5. Turn Screen Back On */}
                <button
                  type="button"
                  className={styles.btnAction}
                  disabled={loadingAction !== null}
                  onClick={() => handleAction(tv.stationId, 'screenOn')}
                >
                  {isBusy('screenOn') ? '⏳ Sending...' : '☀️ Screen On'}
                </button>

                {/* 6. Show Standby Poster / Photo */}
                <button
                  type="button"
                  className={styles.btnAction}
                  style={{ color: '#d6ff01', borderColor: 'rgba(214, 255, 1, 0.35)' }}
                  disabled={loadingAction !== null}
                  onClick={() => handleAction(tv.stationId, 'showPhoto')}
                >
                  {isBusy('showPhoto') ? '⏳ Sending...' : '🖼️ Standby Poster'}
                </button>

                {/* 7. LG Art Gallery Mode */}
                <button
                  type="button"
                  className={styles.btnAction}
                  style={{ color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.35)' }}
                  disabled={loadingAction !== null}
                  onClick={() => handleAction(tv.stationId, 'gallery')}
                >
                  {isBusy('gallery') ? '⏳ Sending...' : '🎨 Art Gallery'}
                </button>

                {/* 8. Power OFF (Standby) */}
                <button
                  type="button"
                  className={`${styles.btnAction} ${styles.btnOff}`}
                  disabled={loadingAction !== null}
                  onClick={() => handleAction(tv.stationId, 'turnOff')}
                >
                  {isBusy('turnOff') ? '⏳ Sending...' : '🔴 Power OFF'}
                </button>
              </div>

              {/* Custom Toast Message Input */}
              {isLg && (
                <div>
                  <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                    Custom Toast Alert to TV Screen
                  </label>
                  <div className={styles.customToastRow}>
                    <input
                      type="text"
                      className={styles.toastInput}
                      value={customToasts[tv.stationId] || ''}
                      onChange={(e) =>
                        setCustomToasts((prev) => ({ ...prev, [tv.stationId]: e.target.value }))
                      }
                      placeholder="Type custom notification banner..."
                    />
                    <button
                      type="button"
                      className={`${styles.btnAction} ${styles.btnToast}`}
                      style={{ padding: '0.5rem 1rem' }}
                      disabled={loadingAction !== null}
                      onClick={() => handleAction(tv.stationId, 'toast')}
                    >
                      {isBusy('toast') ? '⏳' : '🚀 Pop Toast'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Remote Video & Attract Mode Controller */}
      <div className={styles.videoSection}>
        <div className={styles.videoHeader}>
          <div className={styles.videoTitle}>
            <span>🎬</span> Station Pod Remote Video & Attract Mode
          </div>
          <span style={{ fontSize: '0.75rem', color: '#ff0055', fontWeight: 800 }}>
            ● FULLSCREEN 1080P POD BROADCAST
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          Broadcast high-energy trailers, promotional videos, or sponsor ads directly to your NEC VersaPro station pods over Wi-Fi.
        </p>

        {/* Preloaded Offline Media (from public/videos) */}
        {localMedia.videos.length > 0 && (
          <div style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '8px', padding: '10px 14px' }}>
            <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#00f0ff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
              <span>⚡</span> Preloaded Offline Videos Detected (public/videos/):
            </label>
            <div className={styles.presetGrid}>
              {localMedia.videos.map((vid) => {
                const isSelected = customVideoUrl === vid.url;
                return (
                  <button
                    key={vid.url}
                    type="button"
                    className={`${styles.presetBtn} ${isSelected ? styles.presetBtnActive : ''}`}
                    onClick={() => {
                      setCustomVideoUrl(vid.url);
                      setCustomVideoTitle(vid.name);
                    }}
                    style={{ borderColor: isSelected ? '#00f0ff' : 'rgba(0, 240, 255, 0.25)' }}
                  >
                    <span style={{ color: '#00f0ff' }}>📁 {vid.name}</span>
                    <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>Instant 0ms / {vid.sizeFormatted}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Preset Video Cards */}
        <div>
          <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
            Click Preset Video to Test:
          </label>
          <div className={styles.presetGrid}>
            {PRESET_VIDEOS.map((vid) => {
              const isSelected = customVideoUrl === vid.url;
              return (
                <button
                  key={vid.url}
                  type="button"
                  className={`${styles.presetBtn} ${isSelected ? styles.presetBtnActive : ''}`}
                  onClick={() => {
                    setCustomVideoUrl(vid.url);
                    setCustomVideoTitle(vid.title);
                  }}
                >
                  <span>{vid.name}</span>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>{vid.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Controls Bar */}
        <div className={styles.videoControlsRow}>
          <select
            className={styles.stationSelect}
            value={selectedTargetPod}
            onChange={(e) => setSelectedTargetPod(e.target.value)}
          >
            <option value="ALL">📺 Broadcast to ALL 5 Pods</option>
            {configs.map((c) => (
              <option key={c.stationId} value={c.stationId}>
                🎮 {c.stationName}
              </option>
            ))}
          </select>

          <input
            type="text"
            className={styles.videoInput}
            value={customVideoUrl}
            onChange={(e) => setCustomVideoUrl(e.target.value)}
            placeholder="Paste direct MP4 or YouTube URL..."
          />

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#fff', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isVideoLooping}
              onChange={(e) => setIsVideoLooping(e.target.checked)}
            />
            Loop
          </label>

          <button
            type="button"
            className={styles.btnPlayVideo}
            disabled={isBroadcastingVideo}
            onClick={handlePlayVideo}
          >
            {isBroadcastingVideo ? '⏳ Sending...' : '▶️ Play on Pod(s)'}
          </button>

          <button
            type="button"
            className={styles.btnStopVideo}
            onClick={handleStopVideo}
          >
            ⏹️ Stop Video & Return
          </button>
        </div>
      </div>

      {/* Real-time Diagnostics Terminal */}
      <div className={styles.consoleBox}>
        <div className={styles.consoleHeader}>
          <span className={styles.consoleTitle}>
            <span>⚡</span> Real-time Network Diagnostic Stream
          </span>
          <button
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
            onClick={() => setLogs([])}
          >
            Clear Log
          </button>
        </div>

        <div className={styles.consoleLogs}>
          {logs.map((log) => {
            let colorClass = styles.logInfo;
            if (log.type === 'success') colorClass = styles.logSuccess;
            if (log.type === 'error') colorClass = styles.logError;
            if (log.type === 'warning') colorClass = styles.logWarning;

            return (
              <div key={log.id} className={`${styles.logLine} ${colorClass}`}>
                <span className={styles.logTime}>[{log.time}]</span>
                <span>{log.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
