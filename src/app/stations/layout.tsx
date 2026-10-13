import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Station Arena & Timers | Udhyana Games',
  description: 'Real-time live gaming station monitor for Udhyana Games. See which PlayStation 5, Xbox, and PC stations are free or how much time is remaining.',
};

export default function StationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
