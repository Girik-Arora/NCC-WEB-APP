import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin only once (singleton pattern)
let app: App | undefined;

if (!getApps().length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is not defined. Admin functions will not work.');
    } else {
      const serviceAccount = JSON.parse(serviceAccountKey);
      app = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully.');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
} else {
  app = getApps()[0];
}

const isInitialized = getApps().length > 0;

export const adminAuth = isInitialized ? getAuth() : null;
export const adminDb = isInitialized ? getFirestore() : null;
