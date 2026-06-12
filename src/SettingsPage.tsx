import { useState } from 'react';
import {
  Plus, Trash2, KeyRound, Users, Check, X, ShieldCheck, UserCog,
  Tag, ClipboardList, Sun, Moon, Wifi, WifiOff, Settings as SettingsIcon, Calendar, Repeat,
} from 'lucide-react';
import { AppUser, UserRole, ThemeMode } from './types';

interface Props {
  users: AppUser[];
  currentUserId: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  fbReady: boolean;
  fbError: string | null;
  onAddUser: (username: string, pin: string, role: UserRole, displayName: string) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onChangePin: (id: string, newPin: string) => Promise<void>;
  onUpdatePermissions: (id: string, perms: { tasksAccess?: boolean; pricesAccess?: boolean; calendarAccess?: boolean; retainerAccess?: boolean }) => Promise<void>;
}

export default function SettingsPage({
  users, currentUserId, theme, onToggleTheme, fbReady, fbError,
  onAddUser, onDeleteUser, onChangePin, onUpdatePermissions,
}: Props) {
  const [showAdd, setShowAdd]               = useState(false);
  const [newUsername, setNewUsername]       = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPin, setNewPin]                 = useState('');
  const [newRole, setNewRole]               = useState<UserRole>('assistant');
  const [adding, setAdding]                 = useState(false);
  const [addError, setAddError]             = useState('');

  const [changingPinFor, setChangingPinFor] = useState<string | null>(null);
  const [newPinVal, setNewPinVal]           = useState('');
  const [confirmDelete, setConfirmDelete]   = useState<string | null>(null);

  async function handleAdd() {
    setAddError('');
    if (!newUsername.trim()) { setAddError('Username is required.'); return; }
    if (!/^\d{4,}$/.test(newPin)) { setAddError('PIN must be at least 4 digits.'); return; }
    const exists = users.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase());
    if (exists) { setAddError('That username is already taken.'); return; }
    setAdding(true);
    await onAddUser(newUsername.trim(), newPin, newRole, newDisplayName.trim() || newUsername.trim());
    setNewUsername(''); setNewDisplayName(''); setNewPin(''); setNewRole('assistant');
    setShowAdd(false); setAdding(false);
  }

  async function handleChangePin(id: string) {
    if (!/^\d{4,}$/.test(newPinVal)) return;
    await onChangePin(id, newPinVal);
    setChangingPinFor(null);
    setNewPinVal('');
  }

  async function handleDelete(id: string) {
    await onDeleteUser(id);
    setConfirmDelete(null);
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <span className="page-subtitle">Appearance, sync &amp; assistant access</span>
      </div>

      <main className="settings-page">
        {/* ── Appearance ─────────────────────────────────────────── */}
        <section className="settings-section">
          <div className="tasks-section-head">
            <SettingsIcon size={16} className="section-icon" />
            <span>Appearance</span>
          </div>
          <div className="settings-card">
            <div className="settings-row">
              <div className="settings-row-label">
                <span className="settings-row-title">Theme</span>
                <span className="settings-row-sub">Switch between dark and light interface</span>
              </div>
              <button className="sb-theme-toggle" onClick={onToggleTheme}>
                <span className={`sb-theme-track ${theme}`}>
                  <span className="sb-theme-thumb">
                    {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                  </span>
                </span>
                <span className="sb-theme-label">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
              </button>
            </div>
            <div className="settings-row">
              <div className="settings-row-label">
                <span className="settings-row-title">Sync Status</span>
                <span className="settings-row-sub">Realtime data connection to Supabase</span>
              </div>
              <div className={`sb-sync settings-sync ${fbError ? 'error' : fbReady ? 'ok' : 'connecting'}`}>
                {fbError || !fbReady ? <WifiOff size={14} /> : <Wifi size={14} />}
                <span>{fbError ? `Error — ${fbError}` : fbReady ? 'Synced' : 'Connecting…'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── User Management ───────────────────────────────────── */}
        <section className="settings-section">
          <div className="tasks-section-head">
            <Users size={16} className="section-icon" />
            <span>Assistants &amp; Access</span>
            <span className="section-total-of">{users.length}</span>
            <button className="icon-btn accent" style={{ marginLeft: 'auto' }}
              onClick={() => { setShowAdd(p => !p); setAddError(''); }} title="Add user">
              {showAdd ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {showAdd && (
            <div className="user-add-form">
              <div className="user-add-grid">
                <div>
                  <label className="field-label">Username</label>
                  <input className="field-input" placeholder="e.g. janesmith" value={newUsername}
                    onChange={e => setNewUsername(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Display Name</label>
                  <input className="field-input" placeholder="e.g. Jane Smith" value={newDisplayName}
                    onChange={e => setNewDisplayName(e.target.value)} />
                </div>
                <div>
                  <label className="field-label">PIN (numbers only)</label>
                  <input className="field-input" type="password" inputMode="numeric"
                    placeholder="Min 4 digits" value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} />
                </div>
                <div>
                  <label className="field-label">Role</label>
                  <select className="field-input" value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}>
                    <option value="assistant">Assistant</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {addError && <p className="user-add-error">{addError}</p>}
              <div className="user-add-actions">
                <button className="btn-ghost" onClick={() => { setShowAdd(false); setAddError(''); }}>Cancel</button>
                <button className="btn-primary" onClick={handleAdd} disabled={adding}>
                  {adding ? 'Adding…' : 'Add User'}
                </button>
              </div>
            </div>
          )}

          <div className="user-list">
            {users.map(u => (
              <div key={u.id} className="user-row">
                <div className={`user-avatar ${u.role}`}>
                  {u.role === 'admin' ? <ShieldCheck size={16} /> : <UserCog size={16} />}
                </div>

                <div className="user-info">
                  <span className="user-name">{u.displayName || u.username}</span>
                  <span className="user-username">@{u.username}</span>
                </div>

                <span className={`user-role-badge ${u.role}`}>
                  {u.role === 'admin' ? 'Admin' : 'Assistant'}
                </span>

                {u.role === 'assistant' && (
                  <div className="user-perms">
                    <button
                      className={`perm-toggle-btn ${u.tasksAccess !== false ? 'on' : ''}`}
                      onClick={() => onUpdatePermissions(u.id, { tasksAccess: u.tasksAccess === false ? true : false })}
                      title={u.tasksAccess !== false ? 'Revoke tasks access' : 'Grant tasks access'}
                    >
                      <ClipboardList size={12} />
                      <span>Tasks</span>
                    </button>
                    <button
                      className={`perm-toggle-btn ${u.pricesAccess ? 'on' : ''}`}
                      onClick={() => onUpdatePermissions(u.id, { pricesAccess: !u.pricesAccess })}
                      title={u.pricesAccess ? 'Revoke price list access' : 'Grant price list access'}
                    >
                      <Tag size={12} />
                      <span>Prices</span>
                    </button>
                    <button
                      className={`perm-toggle-btn ${u.calendarAccess !== false ? 'on' : ''}`}
                      onClick={() => onUpdatePermissions(u.id, { calendarAccess: u.calendarAccess === false ? true : false })}
                      title={u.calendarAccess !== false ? 'Revoke calendar access' : 'Grant calendar access'}
                    >
                      <Calendar size={12} />
                      <span>Calendar</span>
                    </button>
                    <button
                      className={`perm-toggle-btn ${u.retainerAccess ? 'on' : ''}`}
                      onClick={() => onUpdatePermissions(u.id, { retainerAccess: !u.retainerAccess })}
                      title={u.retainerAccess ? 'Revoke retainer access' : 'Grant retainer access'}
                    >
                      <Repeat size={12} />
                      <span>Retainer</span>
                    </button>
                  </div>
                )}

                {changingPinFor === u.id ? (
                  <div className="user-pin-row">
                    <input
                      className="field-input user-pin-input"
                      type="password"
                      inputMode="numeric"
                      placeholder="New PIN"
                      value={newPinVal}
                      onChange={e => setNewPinVal(e.target.value.replace(/\D/, ''))}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleChangePin(u.id);
                        if (e.key === 'Escape') { setChangingPinFor(null); setNewPinVal(''); }
                      }}
                    />
                    <button className="icon-btn accent" onClick={() => handleChangePin(u.id)} title="Save PIN">
                      <Check size={14} />
                    </button>
                    <button className="icon-btn" onClick={() => { setChangingPinFor(null); setNewPinVal(''); }} title="Cancel">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button className="icon-btn" title="Change PIN" onClick={() => { setChangingPinFor(u.id); setNewPinVal(''); }}>
                    <KeyRound size={15} />
                  </button>
                )}

                {u.id !== currentUserId && (
                  confirmDelete === u.id ? (
                    <div className="user-confirm-delete">
                      <span>Delete?</span>
                      <button className="btn-danger" onClick={() => handleDelete(u.id)}>Yes</button>
                      <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>No</button>
                    </div>
                  ) : (
                    <button className="icon-btn red-h" title="Delete user" onClick={() => setConfirmDelete(u.id)}>
                      <Trash2 size={15} />
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
