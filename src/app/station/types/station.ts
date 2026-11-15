// Type definitions for the Phone Station Monitor System

export interface StationInfo {
  id: string;
  name: string;
  slug: string;
  hourlyRate: number;
  games: string[];
}

export type StationStatus = 'IDLE' | 'ACTIVE' | 'ENDING_SOON' | 'EXPIRED' | 'PAUSED' | 'WARNING';

export interface SessionInfo {
  id: string | null;
  status: StationStatus;
  guestName: string;
  billingType: string;
  remainingSeconds: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  extraControllers: number;
  startTime: string | null;
  endTime: string | null;
}

export interface StationSummary {
  id: string;
  name: string;
  slug: string;
}

export interface RemoteVideoCommand {
  url: string;
  title?: string;
  loop?: boolean;
  autoClose?: boolean;
  timestamp: number;
}

export interface StationTestCommand {
  testType: 'LOCATE' | 'WARNING' | 'EXPIRED' | 'RELOAD';
  label?: string;
  timestamp: number;
}

export interface StationApiResponse {
  success: boolean;
  station?: StationInfo;
  session?: SessionInfo;
  allStations?: StationSummary[];
  staffCallPending?: boolean;
  remoteVideo?: RemoteVideoCommand | null;
  testCommand?: StationTestCommand | null;
  offline?: boolean;
  error?: string;
}

export type FlashType = 'NONE' | 'SOFT_WARNING' | 'TIMEOUT_RED';
