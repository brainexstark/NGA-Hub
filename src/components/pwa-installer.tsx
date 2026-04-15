'use client';

import { useEffect } from 'react';

/**
 * STARK-B PWA Service Registry
 * Captures the native Chrome installation signal and broadcasts it to the network.
 */
export function PwaInstaller() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register the service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('STARK-B Node: Service Worker Registered', registration.scope);
        })
        .catch(error => {
          console.error('STARK-B Node: Service Worker Failed', error);
        });
    }

    const handlePrompt = (e: any) => {
      // Prevent Chrome from showing its own mini-bar instantly to control the flow
      e.preventDefault();
      // Store the event globally for the Install page interaction
      (window as any).deferredInstallPrompt = e;
      // Dispatch a custom signal to the network
      window.dispatchEvent(new CustomEvent('stark-b-install-ready'));
      console.log('STARK-B Node: Hardware Handshake Authorized.');
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    
    window.addEventListener('appinstalled', () => {
      (window as any).deferredInstallPrompt = null;
      console.log('STARK-B Node: Hardware Synchronization Complete.');
    });

    return () => {
        window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  return null;
}