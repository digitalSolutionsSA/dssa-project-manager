// ── Firebase Configuration ────────────────────────────────────────
// Replace the values below with your own Firebase project credentials.
// Steps:
//  1. Go to https://console.firebase.google.com
//  2. Create a project (or use existing)
//  3. Add a Web App
//  4. Copy the firebaseConfig object here
//  5. In Firebase console → Build → Firestore Database → Create database (start in test mode)

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// 👇 REPLACE WITH YOUR OWN CONFIG
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

let app: FirebaseApp;
let db: Firestore;

export function getFirebaseDb(): Firestore | null {
  // If config hasn't been filled in, return null (fall back to localStorage)
  if (firebaseConfig.apiKey === 'YOUR_API_KEY') {
    return null;
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
    db  = getFirestore(app);
  }
  return db;
}

export { Firestore };
