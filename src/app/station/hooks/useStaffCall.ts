import { useState, useEffect, useCallback } from 'react';
import { stationSounds } from '../utils/stationSounds';
import { STATION_CONFIG } from '../config/stationConfig';

interface UseStaffCallProps {
  stationId: string;
  stationName: string;
}

/**
 * Hook to manage customer staff assistance calls and cooldown timing.
 */
export function useStaffCall({ stationId, stationName }: UseStaffCallProps) {
  const [staffCallCooldown, setStaffCallCooldown] = useState<number>(0);
  const isStaffCalling = staffCallCooldown > 0;

  useEffect(() => {
    if (staffCallCooldown <= 0) return;

    const interval = setInterval(() => {
      setStaffCallCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [staffCallCooldown]);

  const callStaff = useCallback(async () => {
    if (staffCallCooldown > 0) return;

    stationSounds.playStaffCallBell();
    setStaffCallCooldown(STATION_CONFIG.STAFF_CALL_COOLDOWN_SECONDS);

    try {
      await fetch('/api/station-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId,
          stationName,
          action: 'CALL_STAFF'
        })
      });
    } catch (e) {
      console.warn('[StaffCall] Failed to send staff assistance request:', e);
    }
  }, [staffCallCooldown, stationId, stationName]);

  return {
    isStaffCalling,
    staffCallCooldown,
    callStaff
  };
}
