// ── Firebase Sync ────────────────────────────────────────────────
// This hook pushes all app state to Firestore and pulls it back.
// If Firebase is not configured it does nothing (localStorage is used instead).
// The document structure: one doc per collection key under /appData/main

import { useEffect, useRef } from 'react';
import { doc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';

const COLLECTIONS = [
  'clients','events','costs','devProjects',
  'budgetIncome','budgetExpenses','unforeseenExpenses',
  'onceOffCosts','monthlySnapshots','meetingNotes',
];

type SyncHandlers = {
  [key: string]: {
    get: () => unknown;
    set: (v: unknown) => void;
  };
};

export function useFirebaseSync(handlers: SyncHandlers, ready: boolean) {
  const db = getFirebaseDb();
  const unsubsRef = useRef<Unsubscribe[]>([]);

  // Initial load from Firestore
  useEffect(() => {
    if (!db || !ready) return;

    // Clear old listeners
    unsubsRef.current.forEach(u => u());
    unsubsRef.current = [];

    COLLECTIONS.forEach(key => {
      if (!handlers[key]) return;
      const ref = doc(db!, 'appData', key);

      // Subscribe to realtime updates
      const unsub = onSnapshot(ref, snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && Array.isArray(data.value)) {
            handlers[key].set(data.value);
          }
        }
      }, err => {
        console.warn(`Firebase sync error for ${key}:`, err.message);
      });

      unsubsRef.current.push(unsub);
    });

    return () => {
      unsubsRef.current.forEach(u => u());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ready]);

  return {
    pushToFirebase: async (key: string, value: unknown) => {
      if (!db) return;
      try {
        await setDoc(doc(db, 'appData', key), { value, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn('Firebase push failed:', e);
      }
    },
    isFirebaseConfigured: !!db,
  };
}
