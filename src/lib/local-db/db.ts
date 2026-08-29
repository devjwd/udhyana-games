import Dexie, { Table } from 'dexie';

export interface LocalGameSession {
  id: string;
  userId?: string | null;
  guestName?: string | null;
  consoleId: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  status: 'ACTIVE' | 'COMPLETED';
  synced: boolean;
  updatedAt: string;
}

export interface LocalOrder {
  id: string;
  userId?: string | null;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: LocalOrderItem[];
  synced: boolean;
}

export interface LocalOrderItem {
  id: string;
  orderId: string;
  name: string;
  price: number;
  quantity: number;
  type: string;
}

export interface LocalWaitlist {
  id: string;
  name: string;
  requested: string;
  status: 'WAITING' | 'ASSIGNED' | 'CANCELLED';
  createdAt: string;
  synced: boolean;
}

export interface LocalBooking {
  id: string;
  userId: string;
  consoleId: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    name?: string | null;
    fullName?: string | null;
    phone?: string | null;
    rank?: string | null;
  };
  console?: {
    id: string;
    hardwareTitle: string;
    hourlyRate?: number | null;
  };
}

export interface LocalConsole {
  id: string;
  hardwareTitle: string;
  hardwareSlug?: string | null;
  hourlyRate?: number | null;
  imagePath?: string | null;
  specs?: string | null;
  games?: string[];
}

export interface LocalSnack {
  id: string;
  name: string;
  price: number;
  icon: string;
}

export interface SyncMutation {
  id: string;
  actionType: 
    | 'START_SESSION' 
    | 'EXTEND_SESSION' 
    | 'END_SESSION' 
    | 'CREATE_ORDER' 
    | 'ADD_WAITLIST' 
    | 'UPDATE_WAITLIST_STATUS' 
    | 'CANCEL_BOOKING';
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError?: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'DEAD';
}

export class UdhyanaLocalDatabase extends Dexie {
  gameSessions!: Table<LocalGameSession, string>;
  orders!: Table<LocalOrder, string>;
  waitlist!: Table<LocalWaitlist, string>;
  bookings!: Table<LocalBooking, string>;
  consoles!: Table<LocalConsole, string>;
  snacks!: Table<LocalSnack, string>;
  syncQueue!: Table<SyncMutation, string>;

  constructor() {
    super('UdhyanaGamesReceptionDB');
    
    this.version(1).stores({
      gameSessions: 'id, consoleId, status, synced, startTime, endTime',
      orders: 'id, createdAt, status, synced',
      waitlist: 'id, status, createdAt, synced',
      bookings: 'id, consoleId, status, startTime, endTime',
      consoles: 'id',
      snacks: 'id',
      syncQueue: 'id, actionType, status, createdAt',
    });
  }
}

export const localDb = new UdhyanaLocalDatabase();
