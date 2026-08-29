export interface ConsoleStation {
  id: string;
  name: string;
  games: string[];
  type?: string;
}

export interface Session {
  id: string;
  guestName?: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  startTime: string | Date;
  endTime: string | Date;
  pausedRemainingSeconds?: number | null;
  consoleId: string;
  console: {
    id?: string;
    hardwareTitle: string;
    type?: string;
  };
  user?: {
    id?: string;
    fullName?: string | null;
    username?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
}

export interface WaitlistEntry {
  id: string;
  name: string;
  requested: string;
  createdAt: string | Date;
  phone?: string | null;
}

export interface SaleItem {
  name: string;
  price: number;
  type?: string;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: string;
  createdAt: string | Date;
}

export interface SnackItem {
  id: string;
  name: string;
  icon?: string;
  price: number;
}

export interface CartItem {
  id: string;
  type: 'session' | 'snack' | 'waitlist';
  name: string;
  price: number;
  consoleId?: string;
  consoleName?: string;
  durationSeconds?: number;
  phone?: string;
  userId?: string;
  extraControllers?: number;
}

export interface ShiftSummary {
  grandTotal: number;
  orderCount: number;
  cashTotal: number;
  cardTotal: number;
  accountTotal?: number;
}

export interface PendingUser {
  id: string;
  fullName?: string | null;
  username: string;
  phone?: string | null;
  email?: string | null;
  createdAt?: string | Date;
}

export interface UpcomingBooking {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  consoleId: string;
  console: {
    id?: string;
    hardwareTitle: string;
  };
  user: {
    id?: string;
    fullName?: string | null;
    username?: string | null;
    phone?: string | null;
    email?: string | null;
  };
}

export interface DurationOption {
  id: string;
  name: string;
  seconds: number;
  price: number;
}
