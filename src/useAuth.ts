import { useState, useEffect } from 'react';
import { getSupabaseClient } from './supabase';
import { AppUser, UserRole } from './types';
type UserPermissions = Pick<AppUser, 'calendarAccess' | 'tasksAccess' | 'pricesAccess'>;

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

const USERS_KEY = 'pm_users_cache';

function loadCachedUsers(): AppUser[] {
  try {
    const s = localStorage.getItem(USERS_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

async function sbPushUsers(list: AppUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
  const sb = getSupabaseClient();
  try {
    const { error } = await sb.from('app_data').upsert({
      key: 'users',
      value: list,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Failed to push users:', error.message);
  } catch (e) { console.warn('Failed to push users:', e); }
}

// ── Hook ──────────────────────────────────────────────────────────
export function useAuth() {
  const [users, setUsers]             = useState<AppUser[]>(loadCachedUsers);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [authError, setAuthError]     = useState<string | null>(null);

  // ── Load users from Supabase (with localStorage fallback) ─────
  useEffect(() => {
    const sb = getSupabaseClient();

    sb.from('app_data').select('value').eq('key', 'users').maybeSingle().then(async ({ data, error }) => {
      if (error) {
        console.warn('Auth load error:', error.message);
        const cached = loadCachedUsers();
        if (cached.length > 0) setUsers(cached);
        else await seedAdmin();
        setIsLoading(false);
        return;
      }
      if (data && Array.isArray(data.value) && (data.value as AppUser[]).length > 0) {
        const list = data.value as AppUser[];
        setUsers(list);
        localStorage.setItem(USERS_KEY, JSON.stringify(list));
      } else {
        await seedAdmin();
      }
      setIsLoading(false);
    });

    // Real-time: update user list when another device changes it
    const channel = sb
      .channel('users-watch')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'app_data', filter: 'key=eq.users' },
        (payload) => {
          if (payload.eventType === 'DELETE') return;
          const newRow = payload.new as { value: AppUser[] };
          if (Array.isArray(newRow.value) && newRow.value.length > 0) {
            setUsers(newRow.value);
            localStorage.setItem(USERS_KEY, JSON.stringify(newRow.value));
          }
        }
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, []);

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
    await sbPushUsers(list);
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
    setCurrentUser(match);
    return true;
  }

  // ── Logout ────────────────────────────────────────────────────
  function logout() { setCurrentUser(null); }

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
    await sbPushUsers(updated);
  }

  // ── Delete user ───────────────────────────────────────────────
  async function deleteUser(id: string): Promise<void> {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    await sbPushUsers(updated);
  }

  // ── Change PIN ────────────────────────────────────────────────
  async function changePin(id: string, newPin: string): Promise<void> {
    const pinHash = await hashPin(newPin);
    const updated = users.map(u => u.id === id ? { ...u, pinHash } : u);
    setUsers(updated);
    await sbPushUsers(updated);
  }

  // ── Update permissions ────────────────────────────────────────
  async function updateUserPermissions(id: string, perms: Partial<UserPermissions>): Promise<void> {
    const updated = users.map(u => u.id === id ? { ...u, ...perms } : u);
    setUsers(updated);
    if (id === currentUser?.id) {
      setCurrentUser(prev => prev ? { ...prev, ...perms } : prev);
    }
    await sbPushUsers(updated);
  }

  return {
    currentUser, users, isLoading, authError,
    login, logout, addUser, deleteUser, changePin, updateUserPermissions,
  };
}
