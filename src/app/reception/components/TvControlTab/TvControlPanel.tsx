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

export default function TvControlPanel() {
  const [configs, setConfigs] = useState<StationTvConfig[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [savingStation, setSavingStation] = useState<string | null>(null);
  const [customToasts, setCustomToasts] = useState<Record<string, string>>({
    PS5: '🎮 Welcome to Udhyana Games Lounge! Station 1 Active.'
  });
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
