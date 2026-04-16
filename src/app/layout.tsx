'use client';

import { useEffect, useState } from 'react';
import { Toaster } from '../components/ui/toaster';
import { PwaInstaller } from '../components/pwa-installer';
import './globals.css';
import { FirebaseClientProvider } from '../firebase/client-provider';
import { RateAppDialog } from '../components/rate-app-dialog';

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
    // Cycle theme-color meta tag for dynamic top bar
    const colors = ['#ff007f','#9d00ff','#0044ff','#00c3ff','#00e676','#ff6d00','#ff4081','#7c4dff'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % colors.length;
      const meta = document.getElementById('theme-color-meta');
      if (meta) meta.setAttribute('content', colors[i]);
      // Also update the top bar div if present
      const bar = document.getElementById('dynamic-top-bar');
      if (bar) bar.style.background = colors[i];
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>NGA Hub</title>
        <meta name="description" content="A modern social platform - NGA Hub" />
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        {/* Apple */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff007f" id="theme-color-meta" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NGA Hub" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="NGA Hub" />
        {/* Microsoft */}
        <meta name="msapplication-TileColor" content="#ff007f" />
        <meta name="msapplication-TileImage" content="/icons/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-screen font-sans antialiased bg-[#0a051a]" suppressHydrationWarning>
        {/* Dynamic colour bar at very top */}
        <div id="dynamic-top-bar" className="fixed top-0 left-0 right-0 h-1 z-[9999] animate-topbar-cycle" style={{background:'#ff007f'}} />
        <FirebaseClientProvider>
          <PwaInstaller />
          {/* STARK-B Hydration Guard: Terminates SSR logic interference */}
          {mounted ? children : (
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0a051a]">
                <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          )}
          <Toaster />
          <RateAppDialog />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
