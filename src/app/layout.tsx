import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { CartProvider } from '@/context/CartContext';
import AuthProvider from '@/components/AuthProvider';
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
});

export const viewport: Viewport = {
  themeColor: "#c1ff1c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://udhyanagames.com'),
  title: {
    default: "Udhyana Games | Premier Gaming Lounge & Esports Arena",
    template: "%s | Udhyana Games",
  },
  description: "Experience next-generation console gaming, PS5 Pro stations, competitive tournaments, and elite gamer perks at Udhyana Games.",
  keywords: ["gaming lounge", "PS5 Pro", "esports arena", "console gaming", "Udhyana Games", "gaming cafe"],
  authors: [{ name: "Udhyana Games" }],
  openGraph: {
    title: "Udhyana Games | Premier Gaming Lounge & Esports Arena",
    description: "Book high-end gaming consoles, compete in tournaments, and explore merchandise at Udhyana Games.",
    url: "https://udhyanagames.com",
    siteName: "Udhyana Games",
    images: [
      {
        url: "/images/hero_main.jpg",
        width: 1200,
        height: 630,
        alt: "Udhyana Games Lounge",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Udhyana Games | Premier Gaming Lounge",
    description: "Next-gen console gaming, tournaments, and lounge experience.",
    images: ["/images/hero_main.jpg"],
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} antialiased`}
    >
      <body>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
