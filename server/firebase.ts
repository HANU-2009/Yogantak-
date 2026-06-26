import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { App } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
let firebaseApp: App | undefined;

try {
  if (!getApps().length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('Firebase Admin SDK missing credentials. Authentication via Firebase will not work until .env is populated.');
    }
  } else {
    firebaseApp = getApp();
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
}

export const adminAuth = firebaseApp ? getAuth(firebaseApp) : null;
