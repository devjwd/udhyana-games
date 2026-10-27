import React, { useRef, useState, useEffect } from 'react';
import styles from '../station.module.css';
import { stationSounds } from '../utils/stationSounds';

interface SleepBlackoutOverlayProps {
  isAsleep: boolean;
  onDoubleTapWake: () => void;
}

/**
 * SleepBlackoutOverlay: Turns the entire screen pitch black (turning off OLED pixels).
 * Wakes up when the user double-taps anywhere on the screen.
 */
export default function SleepBlackoutOverlay({
  isAsleep,
  onDoubleTapWake
}: SleepBlackoutOverlayProps) {
  const lastTapRef = useRef<number>(0);
  const [hintActive, setHintActive] = useState<boolean>(false);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  if (!isAsleep) return null;

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const DOUBLE_TAP_THRESHOLD_MS = 420;

    if (now - lastTapRef.current < DOUBLE_TAP_THRESHOLD_MS && now - lastTapRef.current > 40) {
      // Double tap confirmed!
      stationSounds.playClick();
      onDoubleTapWake();
      lastTapRef.current = 0;
      setHintActive(false);
    } else {
      // First tap: record timestamp and briefly show hint
      lastTapRef.current = now;
      setHintActive(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setHintActive(false);
      }, 1500);
    }
  };

  return (
    <div
      className={styles.blackoutOverlay}
      onClick={handleTap}
      onTouchEnd={handleTap}
      role="button"
      tabIndex={0}
      title="Double-tap to wake"
    >
      <span className={`${styles.doubleTapHint} ${hintActive ? styles.doubleTapHintActive : ''}`}>
        •• Double-tap to wake ••
      </span>
    </div>
  );
}
