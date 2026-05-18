import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDNDY1WH4JJW_rRhgewOK94ApY4fF8G5A4",
  authDomain: "ds-project-manager.firebaseapp.com",
  projectId: "ds-project-manager",
  storageBucket: "ds-project-manager.firebasestorage.app",
  messagingSenderId: "587128203685",
  appId: "1:587128203685:web:780bcd15ac467cecb0204c"
};

let app: FirebaseApp;
let db: Firestore;

export function getFirebaseDb(): Firestore | null {
  if (firebaseConfig.apiKey === 'YOUR_API_KEY') return null;
  if (!app) {
    app = initializeApp(firebaseConfig);
    // persistentLocalCache keeps data in IndexedDB so it survives page reloads
    // and is available instantly on next open (no waiting for network).
    // persistentMultipleTabManager lets multiple browser tabs share the cache.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  }
  return db;
}

export { Firestore };
