'use client';

import React, { useEffect, useRef } from 'react';
import styles from './RemoteVideoOverlay.module.css';
import { RemoteVideoCommand } from '../types/station';

interface RemoteVideoOverlayProps {
  video: RemoteVideoCommand;
  onClose: () => void;
}

export default function RemoteVideoOverlay({ video, onClose }: RemoteVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Try to play with audio or unmuted
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // If unmuted autoplay is blocked by browser policy, fallback to muted then try
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch((err) => console.warn('Autoplay failed:', err));
        }
      });
    }
  }, [video.url]);

  // Check if YouTube
  const ytMatch = video.url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );

  const handleEnded = () => {
    if (video.autoClose) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay}>
      {/* Top Banner Bar */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <span className={styles.liveBadge}>🔴 BROADCAST</span>
          <span className={styles.videoTitle}>{video.title || 'Lounge Video'}</span>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          ✕ Return to Timer
        </button>
      </div>

      {/* Video Content */}
      {ytMatch ? (
        <iframe
          className={styles.iframeWrapper}
          src={`https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&controls=0&mute=0&loop=${
            video.loop !== false ? 1 : 0
          }&playlist=${ytMatch[1]}&modestbranding=1&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={video.title || 'Remote Video'}
        />
      ) : (
        <video
          ref={videoRef}
          className={styles.videoElement}
          src={video.url}
          autoPlay
          playsInline
          loop={video.loop !== false}
          onEnded={handleEnded}
        />
      )}
    </div>
  );
}

