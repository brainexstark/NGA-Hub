'use client';

import * as React from 'react';
import { X, Download, Smartphone } from 'lucide-react';

export function InstallBanner() {
  const [show, setShow] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isIOS, setIsIOS] = React.useState(false);
  const [installed, setInstalled] = React.useState(false);

  React.useEffect(() => {
    // Don't show if already dismissed or installed
    const dismissed = localStorage.getItem('nga-install-dismissed');
    const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (dismissed || alreadyInstalled) return;

    // Check iOS
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    // Listen for Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // On iOS show it always (no beforeinstallprompt on Safari)
    if (ios) setShow(true);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setTimeout(() => setShow(false), 2000);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShow(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('nga-install-dismissed', '1');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6 sm:pb-0 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-black border border-white/15 rounded-3xl shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-400">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl overflow-hidden border border-white/10 shrink-0">
              <img src="/icons/icon-192.png" alt="NGA Hub" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-black text-white text-base">Install NGA Hub</p>
              <p className="text-xs text-white/40">nga-hub.vercel.app</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-white/30 hover:text-white transition-colors p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {installed ? (
          <div className="text-center py-2">
            <p className="text-white font-bold text-sm">✅ Installed successfully!</p>
          </div>
        ) : isIOS ? (
          <div className="space-y-3">
            <p className="text-sm text-white/70 leading-relaxed">
              To install on iPhone/iPad:
            </p>
            <ol className="space-y-2 text-sm text-white/60">
              <li className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white shrink-0">1</span>
                Tap the <strong className="text-white">Share</strong> button in Safari
              </li>
              <li className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white shrink-0">2</span>
                Tap <strong className="text-white">Add to Home Screen</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white shrink-0">3</span>
                Tap <strong className="text-white">Add</strong>
              </li>
            </ol>
          </div>
        ) : (
          <p className="text-sm text-white/70 leading-relaxed">
            Install NGA Hub on your device for the best experience — works offline, loads faster, and feels like a native app.
          </p>
        )}

        {/* Actions */}
        {!isIOS && !installed && (
          <div className="flex gap-3">
            <button onClick={handleDismiss}
              className="flex-1 h-11 rounded-2xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all">
              Not now
            </button>
            <button onClick={handleInstall}
              className="flex-1 h-11 rounded-2xl bg-white text-black text-sm font-black flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all">
              <Download className="h-4 w-4" /> Install
            </button>
          </div>
        )}

        {isIOS && (
          <button onClick={handleDismiss}
            className="w-full h-11 rounded-2xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all">
            Got it
          </button>
        )}
      </div>
    </div>
  );
}
