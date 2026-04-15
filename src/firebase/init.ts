'use client';

import { firebaseConfig } from './config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * STARK-B GLOBAL SINGLETON REGISTRY
 */
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
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    
    const services = {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };

    win[STARK_B_KEY] = services;
    return services;
  } catch (error) {
    console.error("STARK-B Initialization Failure:", error);
    return null;
  }
}
