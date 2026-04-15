'use client';

import { useEffect, useState } from 'react';
import { Toaster } from '../components/ui/toaster';
import { PwaInstaller } from '../components/pwa-installer';
import './globals.css';
import { FirebaseClientProvider } from '../firebase/client-provider';

/**
 * STARK-B ROOT IDENTITY NODE (v3.0 - SSR Neutralized)
 * Features a high-performance hydration guard to ensure 100% client-side execution.
 * Synchronized with custom hardware icons and metadata protocols.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>NGA Hub</title>
        <meta name="description" content="A modern social platform - NGA Hub" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" sizes="32x32" href="/icons/icon-32.png" />
        <link rel="icon" sizes="16x16" href="/icons/icon-16.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-screen font-sans antialiased bg-[#0a051a]" suppressHydrationWarning>
        <FirebaseClientProvider>
          <PwaInstaller />
          {/* STARK-B Hydration Guard: Terminates SSR logic interference */}
          {mounted ? children : (
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0a051a]">
                <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          )}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
