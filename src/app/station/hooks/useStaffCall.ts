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
  const [isStaffCalling, setIsStaffCalling] = useState<boolean>(false);
  const [staffCallCooldown, setStaffCallCooldown] = useState<number>(0);

  useEffect(() => {
    if (staffCallCooldown <= 0) {
      setIsStaffCalling(false);
      return;
    }

    const interval = setInterval(() => {
      setStaffCallCooldown((prev) => {
        if (prev <= 1) {
          setIsStaffCalling(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [staffCallCooldown]);

  const callStaff = useCallback(async () => {
    if (isStaffCalling) return;

    stationSounds.playStaffCallBell();
    setIsStaffCalling(true);
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
  }, [isStaffCalling, stationId, stationName]);

  return {
    isStaffCalling,
    staffCallCooldown,
    callStaff
  };
}
