import 'next-auth';
import { DefaultSession } from 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    role?: string;
    status?: string;
    username?: string | null;
    rank?: string | null;
    sessionsCount?: number;
    playtimeHours?: number;
    loyaltyPoints?: number;
  }

  interface Session {
    user: {
      id: string;
      role?: string;
      status?: string;
      username?: string | null;
      rank?: string | null;
      sessionsCount?: number;
      playtimeHours?: number;
      loyaltyPoints?: number;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    role?: string;
  }
}
