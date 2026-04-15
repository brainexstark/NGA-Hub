'use client';

import { firebaseConfig } from './config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const STARK_B_KEY = '_stark_b_singleton_vfinal_v6';

export function initializeFirebase(): FirebaseServices | null {
  if (typeof window === 'undefined') return null;

  const win = window as any;
  if (win[STARK_B_KEY]) return win[STARK_B_KEY];

  try {
    // Validate config before initializing
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.error('Firebase config missing required fields');
      return null;
    }

    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

    const auth = getAuth(app);
    const firestore = getFirestore(app);

    const services = { firebaseApp: app, auth, firestore };
    win[STARK_B_KEY] = services;
    return services;
  } catch (error: any) {
    console.error('Firebase init error:', error?.message || error);
    return null;
  }
}
