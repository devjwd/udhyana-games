'use client';

import React, { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { ConsoleStation } from '../types';

interface PodTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  consoles: ConsoleStation[];
}

export default function PodTestModal({ isOpen, onClose, consoles }: PodTestModalProps) {
  const [targetStation, setTargetStation] = useState<string>('ALL');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const triggerPodAction = async (actionPayload: Record<string, unknown>, actionName: string) => {
    setLoadingAction(actionName);
    setFeedback({ type: 'info', text: `Sending ${actionName} to ${targetStation}...` });
    try {
      const res = await fetch('/api/station-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: targetStation,
          ...actionPayload
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `✅ [${targetStation}] ${actionName} triggered successfully! Tablet will react within 2 seconds.`
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

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modalContent} style={{ maxWidth: '640px' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} style={{ color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🧪</span> Station Pod Action Testing Suite
          </h2>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          Trigger live visual flashes, sound alerts, media broadcasts, or locate beacons across your NEC VersaPro station pods over Wi-Fi.
        </p>

        {/* TARGET STATION PICKER */}
        <div style={{ marginBottom: '1.2rem' }}>
          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 800, display: 'block', marginBottom: '0.4rem' }}>
            Select Target Pod Tablet:
          </label>
          <select
            value={targetStation}
            onChange={(e) => setTargetStation(e.target.value)}
            style={{
              width: '100%',
              background: '#0a0b10',
              border: '1px solid #00f0ff',
              borderRadius: '8px',
              padding: '0.65rem 0.9rem',
              color: '#00f0ff',
              fontWeight: 800,
              fontSize: '0.95rem',
              outline: 'none'
            }}
          >
            <option value="ALL">📺 Broadcast to ALL 5 Station Pods</option>
            {consoles.map((c) => (
              <option key={c.id} value={c.id}>
                🎮 {c.name || c.id}
              </option>
            ))}
          </select>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.2rem',
              fontSize: '0.82rem',
              fontWeight: 700,
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

        {/* TEST ACTION BUTTONS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.2rem' }}>
          {/* Action 1: Locate Beacon */}
          <button
            type="button"
            disabled={loadingAction !== null}
            onClick={() =>
              triggerPodAction(
                { action: 'TRIGGER_TEST', testType: 'LOCATE', label: `📍 LOCATE: ${targetStation}` },
                'Locate Beacon'
              )
            }
            style={{
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
              padding: '0.75rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>📍</span>
            <div>
              <div>Locate Tablet Beacon</div>
              <div style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 500 }}>Flashes screen to identify booth</div>
            </div>
          </button>

          {/* Action 2: 5-Minute Warning */}
          <button
            type="button"
            disabled={loadingAction !== null}
            onClick={() =>
              triggerPodAction(
                { action: 'TRIGGER_TEST', testType: 'WARNING' },
                '5-Minute Alert'
              )
            }
            style={{
              background: 'rgba(255, 170, 0, 0.1)',
              border: '1px solid #ffaa00',
              color: '#ffaa00',
              padding: '0.75rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🔔</span>
            <div>
              <div>5-Min Warning Alert</div>
              <div style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 500 }}>Amber flash + soft chime</div>
            </div>
          </button>

          {/* Action 3: Time's Up Alarm */}
          <button
            type="button"
            disabled={loadingAction !== null}
            onClick={() =>
              triggerPodAction(
                { action: 'TRIGGER_TEST', testType: 'EXPIRED' },
                "Time's Up Alarm"
              )
            }
            style={{
              background: 'rgba(255, 0, 85, 0.1)',
              border: '1px solid #ff0055',
              color: '#ff0055',
              padding: '0.75rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🚨</span>
            <div>
              <div>Time's Up Alarm</div>
              <div style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 500 }}>Red flash + loud buzzer</div>
            </div>
          </button>

          {/* Action 4: Remote Reload Kiosk */}
          <button
            type="button"
            disabled={loadingAction !== null}
            onClick={() =>
              triggerPodAction(
                { action: 'TRIGGER_TEST', testType: 'RELOAD' },
                'Remote Reload'
              )
            }
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '0.75rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🔄</span>
            <div>
              <div>Reload Kiosk Browser</div>
              <div style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 500 }}>Refreshes tablet over Wi-Fi</div>
            </div>
          </button>

          {/* Action 5: Broadcast Video */}
          <button
            type="button"
            disabled={loadingAction !== null}
            onClick={() =>
              triggerPodAction(
                {
                  action: 'PLAY_VIDEO',
                  url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                  title: '1080p 60FPS Video Test',
                  loop: true
                },
                'Video Broadcast'
              )
            }
            style={{
              background: 'rgba(255, 0, 85, 0.1)',
              border: '1px solid rgba(255, 0, 85, 0.4)',
              color: '#fff',
              padding: '0.75rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🎬</span>
            <div>
              <div>Broadcast Sample Video</div>
              <div style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 500 }}>Fullscreen 1080p video player</div>
            </div>
          </button>

          {/* Action 6: Broadcast Photo */}
          <button
            type="button"
            disabled={loadingAction !== null}
            onClick={() =>
              triggerPodAction(
                {
                  action: 'PLAY_VIDEO',
                  url: '/images/champs.jpg',
                  title: 'Tournament Champions Announcement',
                  loop: true
                },
                'Photo Broadcast'
              )
            }
            style={{
              background: 'rgba(255, 0, 150, 0.1)',
              border: '1px solid rgba(255, 0, 150, 0.4)',
              color: '#fff',
              padding: '0.75rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🖼️</span>
            <div>
              <div>Broadcast Poster / Photo</div>
              <div style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 500 }}>Fullscreen high-res image</div>
            </div>
          </button>
        </div>

        {/* STOP / RETURN BUTTON & HARDWARE DIAGNOSTICS LINK */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            disabled={loadingAction !== null}
            onClick={() => triggerPodAction({ action: 'STOP_VIDEO' }, 'Stop Media')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '0.55rem 1rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ⏹️ Stop Media & Return to Timer
          </button>

          <a
            href="/station/test"
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#00f0ff',
              fontSize: '0.8rem',
              fontWeight: 800,
              textDecoration: 'underline'
            }}
          >
            Open Interactive Tablet Calibration Suite ↗
          </a>
        </div>
      </div>
    </div>
  );
}
