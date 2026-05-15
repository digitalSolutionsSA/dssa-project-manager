import { useState } from 'react';
import { Plus, Trash2, KeyRound, Users, Check, X, ShieldCheck, UserCog, Calendar, Tag } from 'lucide-react';
import { AppUser, UserRole } from './types';

interface Props {
  users: AppUser[];
  currentUserId: string;
  onAddUser: (username: string, pin: string, role: UserRole, displayName: string) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onChangePin: (id: string, newPin: string) => Promise<void>;
  onUpdatePermissions: (id: string, perms: { calendarAccess?: boolean }) => Promise<void>;
}

export default function UserManagement({ users, currentUserId, onAddUser, onDeleteUser, onChangePin, onUpdatePermissions }: Props) {
  const [showAdd, setShowAdd]       = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPin, setNewPin]         = useState('');
  const [newRole, setNewRole]       = useState<UserRole>('assistant');
  const [adding, setAdding]         = useState(false);
  const [addError, setAddError]     = useState('');

  const [changingPinFor, setChangingPinFor] = useState<string | null>(null);
  const [newPinVal, setNewPinVal]   = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
    <section className="user-mgmt">
      {/* Header */}
      <div className="section-head">
        <Users size={16} />
        User Management
        <span className="section-total">{users.length} user{users.length !== 1 ? 's' : ''}</span>
        <button
          className="icon-btn accent"
          style={{ marginLeft: 'auto' }}
          onClick={() => { setShowAdd(p => !p); setAddError(''); }}
          title="Add user"
        >
          {showAdd ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {/* Add user form */}
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
                onChange={e => setNewPin(e.target.value.replace(/\D/g,''))} />
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

      {/* User list */}
      <div className="user-list">
        {users.map(u => (
          <div key={u.id} className="user-row">
            {/* Avatar */}
            <div className={`user-avatar ${u.role}`}>
              {u.role === 'admin' ? <ShieldCheck size={16}/> : <UserCog size={16}/>}
            </div>

            {/* Info */}
            <div className="user-info">
              <span className="user-name">{u.displayName || u.username}</span>
              <span className="user-username">@{u.username}</span>
            </div>

            {/* Role badge */}
            <span className={`user-role-badge ${u.role}`}>
              {u.role === 'admin' ? 'Admin' : 'Assistant'}
            </span>

            {/* Permission toggles (assistants only) */}
            {u.role === 'assistant' && (
              <div className="user-perms">
                <button
                  className={`perm-toggle-btn ${u.calendarAccess ? 'on' : ''}`}
                  onClick={() => onUpdatePermissions(u.id, { calendarAccess: !u.calendarAccess })}
                  title={u.calendarAccess ? 'Revoke calendar access' : 'Grant calendar access'}
                >
                  <Calendar size={12} />
                  <span>Calendar</span>
                </button>
              </div>
            )}

            {/* Change PIN inline */}
            {changingPinFor === u.id ? (
              <div className="user-pin-row">
                <input
                  className="field-input user-pin-input"
                  type="password"
                  inputMode="numeric"
                  placeholder="New PIN"
                  value={newPinVal}
                  onChange={e => setNewPinVal(e.target.value.replace(/\D/,''))}
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
              <button
                className="icon-btn"
                title="Change PIN"
                onClick={() => { setChangingPinFor(u.id); setNewPinVal(''); }}
              >
                <KeyRound size={15} />
              </button>
            )}

            {/* Delete */}
            {u.id !== currentUserId && (
              confirmDelete === u.id ? (
                <div className="user-confirm-delete">
                  <span>Delete?</span>
                  <button className="btn-danger" onClick={() => handleDelete(u.id)}>Yes</button>
                  <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>No</button>
                </div>
              ) : (
                <button
                  className="icon-btn red-h"
                  title="Delete user"
                  onClick={() => setConfirmDelete(u.id)}
                >
                  <Trash2 size={15} />
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
