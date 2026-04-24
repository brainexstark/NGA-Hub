'use client';

import { useEffect, useRef } from 'react';

// Request permission and register service worker
export async function setupPushNotifications(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;

  // Request permission
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  return permission === 'granted';
}

// Show a native notification — works even when app is in background via SW
export function showNativeNotification(params: {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}) {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;

  const { title, body, icon = '/icons/icon-192.png', url = '/', tag = 'nga-hub' } = params;

  // Try via service worker first (works in background)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      // Send message to SW to show notification
      if (reg.active) {
        reg.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
          icon,
          url,
          tag,
        });
      }
    }).catch(() => {
      // Fallback to direct Notification API
      try {
        const n = new Notification(title, { body, icon, tag });
        n.onclick = () => { window.focus(); n.close(); };
      } catch {}
    });
  } else {
    // Direct Notification API fallback
    try {
      const n = new Notification(title, { body, icon, tag });
      n.onclick = () => { window.focus(); n.close(); };
    } catch {}
  }
}

// Hook — auto-setup push notifications and show them for new realtime notifications
export function usePushNotifications(userId: string) {
  const setupDone = useRef(false);

  useEffect(() => {
    if (!userId || setupDone.current) return;
    setupDone.current = true;
    setupPushNotifications();
  }, [userId]);
}
