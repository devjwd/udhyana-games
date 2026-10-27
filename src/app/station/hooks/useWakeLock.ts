import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to request and maintain Screen Wake Lock so mobile phone screens don't turn off.
 */
export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        const lock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = lock;
      } catch (err) {
        console.warn('[WakeLock] Unable to acquire screen wake lock:', err);
      }
    }
  }, []);

  useEffect(() => {
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [requestWakeLock]);

  return { requestWakeLock };
}
