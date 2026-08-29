import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Gaming Station',
  description: 'Reserve your next-gen console or PC gaming station online with instant confirmation at Udhyana Games.',
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
