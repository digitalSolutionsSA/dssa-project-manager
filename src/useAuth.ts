import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { AppUser, UserRole } from './types';

// ── Helpers ───────────────────────────────────────────────────────
function genId(): string { return Math.random().toString(36).substring(2, 10); }

async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode('dspm_' + pin)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const SESSION_KEY = 'pm_session_uid';
const USERS_KEY   = 'pm_users_cache';

function loadCachedUsers(): AppUser[] {
  try {
    const s = localStorage.getItem(USERS_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

async function fbPushUsers(list: AppUser[]) {
  const db = getFirebaseDb();
  if (!db) { localStorage.setItem(USERS_KEY, JSON.stringify(list)); return; }
  try {
    await setDoc(
      doc(db, 'appData', 'users'),
      { value: list, updatedAt: new Date().toISOString() }
    );
  } catch (e) { console.warn('Failed to push users:', e); }
}

// ── Hook ──────────────────────────────────────────────────────────
export function useAuth() {
  const [users, setUsers]           = useState<AppUser[]>(loadCachedUsers);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [authError, setAuthError]   = useState<string | null>(null);

  // ── Load users from Firestore (or localStorage fallback) ──────
  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      // No Firebase — use localStorage only, seed admin if empty
      const cached = loadCachedUsers();
      if (cached.length === 0) {
        hashPin('134679').then(pinHash => {
          const admin: AppUser = {
            id: genId(), username: 'vrLeonard99', pinHash,
            role: 'admin', displayName: 'Admin',
            createdAt: new Date().toISOString(),
          };
          const list = [admin];
          localStorage.setItem(USERS_KEY, JSON.stringify(list));
          setUsers(list);
          setIsLoading(false);
        });
      } else {
        setUsers(cached);
        setIsLoading(false);
      }
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'appData', 'users'),
      async (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d && Array.isArray(d.value) && d.value.length > 0) {
            setUsers(d.value);
            localStorage.setItem(USERS_KEY, JSON.stringify(d.value));
          } else {
            await seedAdmin();
          }
        } else {
          await seedAdmin();
        }
        setIsLoading(false);
      },
      (err) => {
        console.warn('Auth listener error:', err.message);
        // Fall back to cache
        const cached = loadCachedUsers();
        if (cached.length > 0) setUsers(cached);
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Restore session once users are loaded ─────────────────────
  useEffect(() => {
    if (isLoading || users.length === 0) return;
    const uid = localStorage.getItem(SESSION_KEY);
    if (!uid) return;
    const found = users.find(u => u.id === uid);
    if (found) setCurrentUser(found);
    else localStorage.removeItem(SESSION_KEY); // user was deleted
  }, [isLoading, users]);

  // ── Seed default admin ────────────────────────────────────────
  async function seedAdmin() {
    const pinHash = await hashPin('134679');
    const admin: AppUser = {
      id: genId(), username: 'vrLeonard99', pinHash,
      role: 'admin', displayName: 'Admin',
      createdAt: new Date().toISOString(),
    };
    const list = [admin];
    setUsers(list);
    await fbPushUsers(list);
  }

  // ── Login ─────────────────────────────────────────────────────
  async function login(username: string, pin: string): Promise<boolean> {
    setAuthError(null);
    const pinHash = await hashPin(pin);
    const match = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.pinHash === pinHash
    );
    if (!match) {
      setAuthError('Incorrect username or PIN. Please try again.');
      return false;
    }
    localStorage.setItem(SESSION_KEY, match.id);
    setCurrentUser(match);
    return true;
  }

  // ── Logout ────────────────────────────────────────────────────
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  }

  // ── Add user ──────────────────────────────────────────────────
  async function addUser(username: string, pin: string, role: UserRole, displayName: string): Promise<void> {
    const pinHash = await hashPin(pin);
    const newUser: AppUser = {
      id: genId(), username, pinHash, role,
      displayName: displayName || username,
      createdAt: new Date().toISOString(),
    };
    const updated = [...users, newUser];
    setUsers(updated);
    await fbPushUsers(updated);
  }

  // ── Delete user ───────────────────────────────────────────────
  async function deleteUser(id: string): Promise<void> {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    await fbPushUsers(updated);
  }

  // ── Change PIN ────────────────────────────────────────────────
  async function changePin(id: string, newPin: string): Promise<void> {
    const pinHash = await hashPin(newPin);
    const updated = users.map(u => u.id === id ? { ...u, pinHash } : u);
    setUsers(updated);
    await fbPushUsers(updated);
  }

  return {
    currentUser, users, isLoading, authError,
    login, logout, addUser, deleteUser, changePin,
  };
}
