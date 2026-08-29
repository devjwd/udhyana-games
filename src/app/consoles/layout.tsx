import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consoles & Hardware Stations',
  description: 'Explore our lineup of PS5 Pro, 240Hz Gaming PCs, Simulators, and Nintendo Switch OLED stations at Udhyana Games.',
};

export default function ConsolesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
