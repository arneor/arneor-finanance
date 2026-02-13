import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React from "react";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Arneor Vault - Internal Financial Management",
  description: "Internal financial tracking and vault system for Arneor Labs partners and leadership team.",
  keywords: "Arneor Labs, internal finance, vault, partner funds, expense management",
  robots: "noindex, nofollow",
  openGraph: {
    title: "Arneor Vault",
    description: "Internal Financial Management System",
    url: "https://www.arneor.com",
    type: "website",
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.className}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
