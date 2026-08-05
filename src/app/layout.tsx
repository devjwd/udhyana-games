import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Udhyana Games | Matta Swat Physical Gaming Lounge • Play Elevated",
  description:
    "Matta's premier physical gaming lounge. High-end PS5, Xbox, and PC console stations in a 100% smoke-free, climate-controlled family atmosphere with pro gaming accessories retail.",
  keywords: [
    "Udhyana Games",
    "Gaming Lounge Matta",
    "Matta Swat Gamezone",
    "Physical Gaming Lounge Swat",
    "PS5 Gaming Zone Swat",
    "Smoke-Free Gaming Matta",
    "Udhyana Network",
    "Play Elevated",
  ],
  authors: [{ name: "Udhyana Games" }],
  viewport: "width=device-width, initial-scale=1.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#07090c] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
