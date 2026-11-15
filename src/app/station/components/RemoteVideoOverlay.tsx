'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './RemoteVideoOverlay.module.css';
import { RemoteVideoCommand } from '../types/station';

interface RemoteVideoOverlayProps {
  video: RemoteVideoCommand;
  onClose: () => void;
}

export default function RemoteVideoOverlay({ video, onClose }: RemoteVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string>(video.url);

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

  // Check if YouTube
  const ytMatch = video.url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );

  // Check if Image (Photo / Poster / Winner Announcement)
  const isImage = (/(?:\.jpg|\.jpeg|\.png|\.webp|\.gif|\.svg|\.bmp)(?:\?.*)?$/i).test(video.url);

  // Permanent Tablet Cache: If already saved locally on NEC tablet, use cached blob; else save it to local disk
  useEffect(() => {
    let active = true;
    let objectUrlToRevoke: string | null = null;

    if (typeof window !== 'undefined' && 'caches' in window && !ytMatch) {
      caches.open('udhyana-pod-media-v1').then(async (cache) => {
        try {
          const cached = await cache.match(video.url);
          if (cached) {
            const blob = await cached.blob();
            const blobUrl = URL.createObjectURL(blob);
            objectUrlToRevoke = blobUrl;
            if (active) setResolvedSrc(blobUrl);
          } else {
            // Save to tablet local disk cache for instant future playback
            cache.add(video.url).catch(() => {});
          }
        } catch {
          // fallback to live url
        }
      });
    }

    return () => {
      active = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [video.url, ytMatch]);

  // Try to play video with audio or fallback to muted
  useEffect(() => {
    if (!isImage && videoRef.current) {
      videoRef.current.play().catch(() => {
        // If unmuted autoplay is blocked by browser policy, fallback to muted then try
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch((err) => console.warn('Autoplay failed:', err));
        }
      });
    }
  }, [resolvedSrc, isImage]);

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
          <span className={styles.liveBadge}>
            {isImage ? '🖼️ PHOTO' : '🔴 BROADCAST'}
          </span>
          <span className={styles.videoTitle}>
            {video.title || (isImage ? 'Lounge Photo' : 'Lounge Video')}
          </span>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          ✕ Return to Timer
        </button>
      </div>

      {/* Content Renderer: YouTube, Video, or Photo */}
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
      ) : isImage ? (
        <img
          className={styles.imageElement}
          src={resolvedSrc}
          alt={video.title || 'Lounge Photo'}
        />
      ) : (
        <video
          ref={videoRef}
          className={styles.videoElement}
          src={resolvedSrc}
          autoPlay
          playsInline
          loop={video.loop !== false}
          onEnded={handleEnded}
        />
      )}
    </div>
  );
}
