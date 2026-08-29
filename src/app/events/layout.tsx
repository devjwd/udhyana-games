import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tournaments & Leaderboard',
  description: 'Track the Hall of Fame leaderboard and register for upcoming competitive tournaments at Udhyana Games.',
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
