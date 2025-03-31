"use client";

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration using only NEXT_PUBLIC_ variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase client
let clientApp;
let clientDb;

// Ensure we only initialize in the browser, not during SSR
if (typeof window !== 'undefined') {
  // Check if we already have initialized apps
  const existingApps = getApps();
  
  if (existingApps.length === 0) {
    try {
      clientApp = initializeApp(firebaseConfig);
      clientDb = getFirestore(clientApp);
      console.log('Firebase client initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase client:', error);
    }
  } else {
    clientApp = existingApps[0];
    clientDb = getFirestore(clientApp);
  }
}

export { clientApp, clientDb };