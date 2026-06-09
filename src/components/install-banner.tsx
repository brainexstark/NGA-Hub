'use client';
import React from 'react';
import { X } from 'lucide-react';

export function InstallBanner() {
  const [show, setShow] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  React.useEffect(() => {
    const dismissed = localStorage.getItem('nga-install-dismissed');
    if (dismissed) return;
    
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Also show on first visit even without install prompt (iOS)
    const visits = parseInt(localStorage.getItem('nga-visits') || '0');
    localStorage.setItem('nga-visits', String(visits + 1));
    if (visits === 0) setShow(true);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    dismiss();
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('nga-install-dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[99999] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900/98 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0">
          <img src="/icons/icon-192.png" alt="NGA Hub" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-white">Install NGA Hub</p>
          <p className="text-[10px] text-white/50">Add to home screen for the best experience</p>
        </div>
        <button onClick={handleInstall}
          className="shrink-0 bg-primary text-white text-xs font-black px-3 py-2 rounded-xl">
          Install
        </button>
        <button onClick={dismiss} className="shrink-0 text-white/30 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
