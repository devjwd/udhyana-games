// Station Monitor System Configuration
// Customize timings, thresholds, and labels here anytime.

export const STATION_CONFIG = {
  // Polling rate from server (in milliseconds)
  POLL_INTERVAL_MS: 2500,

  // Warning threshold for 5-minute alerts (in seconds)
  WARNING_THRESHOLD_SECONDS: 300,

  // Duration of the soft amber screen flash (in milliseconds)
  SOFT_FLASH_DURATION_MS: 2300,

  // Staff Call button cooldown (in seconds)
  STAFF_CALL_COOLDOWN_SECONDS: 30,

  // Default fallback hourly rate in PKR
  DEFAULT_HOURLY_RATE: 300,

  // Storage key for keeping station assigned on the phone
  STORAGE_STATION_KEY: 'assigned_station_id',

  // Audio muted setting key
  STORAGE_MUTE_KEY: 'station_sound_muted',

  // Stealth / Sleep Mode (screen stays black and only wakes up on double-tap, 5 mins left, or timeout)
  SLEEP_MODE: {
    ENABLED: true,
    // Seconds the screen stays awake after double-tap before returning to black
    MANUAL_WAKE_DURATION_SECONDS: 12,
  },

  // Status display labels
  LABELS: {
    ACTIVE: 'ACTIVE',
    ENDING_SOON: 'ENDING SOON',
    EXPIRED: "TIME'S UP",
    PAUSED: 'PAUSED',
    IDLE: 'AVAILABLE'
  }
} as const;
