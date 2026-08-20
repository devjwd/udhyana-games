import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { CartProvider } from '@/context/CartContext';
import AuthProvider from '@/components/AuthProvider';
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Udhyana Games",
  description: "The ultimate gaming lounge experience",
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
