import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import TopRibbon from '@/components/TopRibbon';
import PitchMeter from '@/components/PitchMeter';
import { SettingsProvider } from '@/components/SettingsContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guitar TABS",
  description: "Web-app designed to teach new players important concepts of playing electric/bass guitar, such as rhythm, note length, pitch correctness, and potentially note quality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/vendor/alphaTab.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SettingsProvider>
          <TopRibbon />
          {children}
          {/* Mount a hidden PitchMeter so TopRibbon's start/stop events have a listener.
              Keeps audio logic active without a visible bottom ribbon. */}
          <div style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }} aria-hidden>
            <PitchMeter variant="ribbon" />
          </div>
        </SettingsProvider>
        <Script src="/vendor/alphaTab.min.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}

