import { useState } from 'react';
import { Plus, Trash2, Edit3, Check, X, Repeat, CheckCircle2, AlertCircle, Bell, BellOff, CalendarDays, ToggleLeft, ToggleRight } from 'lucide-react';
import { RetainerClient, PostSchedule, CheckInReminder, DayOfWeek, AppUser } from './types';
import { needsCheckIn } from './useStore';

const ALL_DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Reusable assignee picker ────────────────────────────────────
function AssigneePicker({ users, value, onChange }: {
  users: AppUser[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="pl-form-field">
      <label className="field-label">Assign to</label>
      <select className="field-input" value={value} onChange={e => onChange(e.target.value)}>
        <option value="all">Everyone</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.displayName || u.username}</option>
        ))}
      </select>
    </div>
  );
}

// ── Add / edit client form ───────────────────────────────────────
function ClientForm({
  initial, users, onSave, onCancel,
}: {
  initial?: Partial<RetainerClient>;
  users: AppUser[];
  onSave: (name: string, description: string, assignedTo: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo ?? 'all');
  const valid = name.trim().length > 0;
  function submit() { if (!valid) return; onSave(name.trim(), description.trim(), assignedTo); }
  return (
    <div className="pl-item-form">
      <div className="pl-form-field">
        <label className="field-label">Client Name <span className="required">*</span></label>
        <input className="field-input" placeholder="e.g. Vaal Exotics" value={name}
          onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
      </div>
      <div className="pl-form-field">
        <label className="field-label">Description <span className="optional">(optional)</span></label>
        <textarea className="field-input field-ta" rows={3}
          placeholder="Notes about this retainer client..."
          value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <AssigneePicker users={users} value={assignedTo} onChange={setAssignedTo} />
      <div className="modal-actions" style={{ marginTop: 8 }}>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={!valid}>
          <Check size={14} /> {initial?.id ? 'Save Changes' : 'Add Client'}
        </button>
      </div>
    </div>
  );
}

// ── Single client card ──────────────────────────────────────────
function RetainerCard({ client, mode, onCheckIn, onEdit, onDelete }: {
  client: RetainerClient;
  mode: 'admin' | 'assistant';
  onCheckIn: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const pending = needsCheckIn(client);
  return (
    <div className="retainer-card" style={{ borderLeftColor: pending ? 'var(--amber)' : 'var(--green)' }}>
      <div className="retainer-card-main">
        <div className="retainer-card-info">
          <span className="retainer-card-name">{client.name}</span>
          {client.description && <span className="retainer-card-desc">{client.description}</span>}
        </div>
        <div className={`retainer-status ${pending ? 'pending' : 'ok'}`}>
          {pending ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
          <span>{pending ? 'Needs check-in this week' : 'Checked in this week'}</span>
        </div>
      </div>
      <div className="retainer-card-actions">
        {pending && (
          <button className="btn-primary sm" onClick={onCheckIn}>
            <Check size={13} /> Mark Checked In
          </button>
        )}
        {mode === 'admin' && onEdit && (
          <button className="icon-btn xs" onClick={onEdit} title="Edit"><Edit3 size={13} /></button>
        )}
        {mode === 'admin' && onDelete && (
          <button className="icon-btn xs red-h" onClick={onDelete} title="Remove client"><Trash2 size={13} /></button>
        )}
      </div>
    </div>
  );
}

// ── Post Schedule Form ──────────────────────────────────────────
function ScheduleForm({ clients, users, initial, onSave, onCancel }: {
  clients: RetainerClient[];
  users: AppUser[];
  initial?: PostSchedule;
  onSave: (clientId: string, clientName: string, days: DayOfWeek[], assignedTo: string) => void;
  onCancel: () => void;
}) {
  const [clientId, setClientId] = useState(initial?.clientId ?? '');
  const [days, setDays] = useState<DayOfWeek[]>(initial?.days ?? []);
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo ?? 'all');

  function toggleDay(d: DayOfWeek) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  function submit() {
    if (!clientId || days.length === 0) return;
    const client = clients.find(c => c.id === clientId);
    onSave(clientId, client?.name ?? '', days, assignedTo);
  }

  return (
    <div className="pl-item-form">
      {!initial && (
        <div className="pl-form-field">
          <label className="field-label">Client <span className="required">*</span></label>
          <select className="field-input" value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">Select a client...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      <div className="pl-form-field">
        <label className="field-label">Posting Days <span className="required">*</span></label>
        <div className="schedule-day-picker">
          {ALL_DAYS.map(d => (
            <button key={d} type="button"
              className={`schedule-day-btn ${days.includes(d) ? 'active' : ''}`}
              onClick={() => toggleDay(d)}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <AssigneePicker users={users} value={assignedTo} onChange={setAssignedTo} />
      <div className="modal-actions" style={{ marginTop: 8 }}>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={!clientId || days.length === 0}>
          <Check size={14} /> {initial ? 'Save Changes' : 'Add Schedule'}
        </button>
      </div>
    </div>
  );
}

// ── Reminder Form ───────────────────────────────────────────────
function ReminderForm({ initial, users, onSave, onCancel }: {
  initial?: CheckInReminder;
  users: AppUser[];
  onSave: (title: string, message: string | undefined, schedule: CheckInReminder['schedule'], assignedTo: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [message, setMessage] = useState(initial?.message ?? '');
  const [schedule, setSchedule] = useState<CheckInReminder['schedule']>(initial?.schedule ?? 'daily');
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo ?? 'all');
  const valid = title.trim().length > 0;
  return (
    <div className="pl-item-form">
      <div className="pl-form-field">
        <label className="field-label">Reminder Title <span className="required">*</span></label>
        <input className="field-input" placeholder="e.g. Update social media stats" value={title}
          onChange={e => setTitle(e.target.value)} autoFocus />
      </div>
      <div className="pl-form-field">
        <label className="field-label">Message <span className="optional">(optional)</span></label>
        <textarea className="field-input field-ta" rows={2}
          placeholder="Any extra details for your assistant..."
          value={message} onChange={e => setMessage(e.target.value)} />
      </div>
      <div className="pl-form-field">
        <label className="field-label">Show on <span className="required">*</span></label>
        <div className="schedule-day-picker">
          <button type="button" className={`schedule-day-btn ${schedule === 'daily' ? 'active' : ''}`}
            onClick={() => setSchedule('daily')}>Every Day</button>
          {ALL_DAYS.map(d => (
            <button key={d} type="button"
              className={`schedule-day-btn ${schedule === d ? 'active' : ''}`}
              onClick={() => setSchedule(d)}>{d}</button>
          ))}
        </div>
      </div>
      <AssigneePicker users={users} value={assignedTo} onChange={setAssignedTo} />
      <div className="modal-actions" style={{ marginTop: 8 }}>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={() => valid && onSave(title.trim(), message.trim() || undefined, schedule, assignedTo)} disabled={!valid}>
          <Check size={14} /> {initial ? 'Save Changes' : 'Add Reminder'}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// RETAINER PAGE
// ══════════════════════════════════════════════════════════════════
type RetainerTab = 'clients' | 'schedules' | 'reminders';

export default function RetainerPage({
  clients, mode, users, onAdd, onUpdate, onDelete, onCheckIn,
  postSchedules, onAddSchedule, onUpdateSchedule, onDeleteSchedule,
  checkInReminders, onAddReminder, onToggleReminder, onUpdateReminder, onDeleteReminder,
}: {
  clients: RetainerClient[];
  mode: 'admin' | 'assistant';
  users?: AppUser[];
  onAdd?: (name: string, description: string, assignedTo: string) => void;
  onUpdate?: (id: string, changes: Partial<RetainerClient>) => void;
  onDelete?: (id: string) => void;
  onCheckIn: (id: string) => void;
  postSchedules?: PostSchedule[];
  onAddSchedule?: (clientId: string, clientName: string, days: DayOfWeek[], assignedTo: string) => void;
  onUpdateSchedule?: (id: string, days: DayOfWeek[], clientName?: string, assignedTo?: string) => void;
  onDeleteSchedule?: (id: string) => void;
  checkInReminders?: CheckInReminder[];
  onAddReminder?: (title: string, message?: string, schedule?: CheckInReminder['schedule'], assignedTo?: string) => void;
  onToggleReminder?: (id: string) => void;
  onUpdateReminder?: (id: string, changes: Partial<CheckInReminder>) => void;
  onDeleteReminder?: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<RetainerTab>('clients');
  const [showAddForm, setShowAddForm]     = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);

  const pendingCount = clients.filter(needsCheckIn).length;
  const schedules = postSchedules ?? [];
  const reminders = checkInReminders ?? [];
  const allUsers = users ?? [];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Retainer Clients</h1>
        <span className="page-subtitle">
          {clients.length} client{clients.length !== 1 ? 's' : ''}
          {pendingCount > 0 ? ` · ${pendingCount} need${pendingCount === 1 ? 's' : ''} a check-in` : ' · all checked in'}
        </span>
      </div>

      {mode === 'admin' && (
        <div className="retainer-tabs">
          <button className={`retainer-tab-btn ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
            <Repeat size={14} /> Clients
            {pendingCount > 0 && <span className="tab-count">{pendingCount}</span>}
          </button>
          <button className={`retainer-tab-btn ${activeTab === 'schedules' ? 'active' : ''}`} onClick={() => setActiveTab('schedules')}>
            <CalendarDays size={14} /> Post Schedules
            {schedules.length > 0 && <span className="tab-count">{schedules.length}</span>}
          </button>
          <button className={`retainer-tab-btn ${activeTab === 'reminders' ? 'active' : ''}`} onClick={() => setActiveTab('reminders')}>
            <Bell size={14} /> Reminders
            {reminders.filter(r => r.active).length > 0 && <span className="tab-count">{reminders.filter(r => r.active).length}</span>}
          </button>
        </div>
      )}

      {/* ── CLIENTS TAB ── */}
      {(activeTab === 'clients' || mode === 'assistant') && (
        <main className="retainer-list">
          {mode === 'admin' && (
            <div className="tasks-section-head">
              <Repeat size={16} className="section-icon" />
              <span>Monthly Retainer Clients</span>
              <span className="section-total-of">{clients.length}</span>
              <button className="icon-btn accent" style={{ marginLeft: 'auto' }}
                onClick={() => { setShowAddForm(p => !p); setEditingId(null); }} title="Add client">
                {showAddForm ? <X size={16} /> : <Plus size={16} />}
              </button>
            </div>
          )}
          {mode === 'admin' && showAddForm && (
            <div className="pl-add-wrap">
              <ClientForm users={allUsers}
                onSave={(name, description, assignedTo) => { onAdd?.(name, description, assignedTo); setShowAddForm(false); }}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}
          <div className="retainer-items">
            {clients.length === 0 && (
              <div className="empty-state">
                <Repeat size={36} />
                <p className="assistant-empty-title">
                  {mode === 'admin' ? 'No retainer clients added yet' : 'No retainer clients yet'}
                </p>
                {mode === 'admin' && (
                  <p className="assistant-empty-sub">Click the + button above to add your first monthly client.</p>
                )}
              </div>
            )}
            {clients.map(client => (
              editingId === client.id ? (
                <div key={client.id} className="pl-add-wrap">
                  <ClientForm users={allUsers} initial={client}
                    onSave={(name, description, assignedTo) => { onUpdate?.(client.id, { name, description, assignedTo }); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div key={client.id}>
                  {confirmDelete === client.id ? (
                    <div className="pl-confirm-delete">
                      <span>Remove "<strong>{client.name}</strong>" from retainers?</span>
                      <button className="btn-danger" onClick={() => { onDelete?.(client.id); setConfirmDelete(null); }}>Remove</button>
                      <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                    </div>
                  ) : (
                    <RetainerCard client={client} mode={mode}
                      onCheckIn={() => onCheckIn(client.id)}
                      onEdit={mode === 'admin' ? () => { setEditingId(client.id); setShowAddForm(false); } : undefined}
                      onDelete={mode === 'admin' ? () => setConfirmDelete(client.id) : undefined}
                    />
                  )}
                </div>
              )
            ))}
          </div>
        </main>
      )}

      {/* ── POST SCHEDULES TAB ── */}
      {activeTab === 'schedules' && mode === 'admin' && (
        <main className="retainer-list">
          <div className="tasks-section-head">
            <CalendarDays size={16} className="section-icon" />
            <span>Client Post Schedules</span>
            <span className="section-total-of">{schedules.length}</span>
            <button className="icon-btn accent" style={{ marginLeft: 'auto' }}
              onClick={() => { setShowAddSchedule(p => !p); setEditingScheduleId(null); }} title="Add schedule">
              {showAddSchedule ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {showAddSchedule && !editingScheduleId && (
            <div className="pl-add-wrap">
              <ScheduleForm clients={clients} users={allUsers}
                onSave={(cid, cname, days, assignedTo) => { onAddSchedule?.(cid, cname, days, assignedTo); setShowAddSchedule(false); }}
                onCancel={() => setShowAddSchedule(false)}
              />
            </div>
          )}

          <div className="retainer-items">
            {schedules.length === 0 && !showAddSchedule && (
              <div className="empty-state">
                <CalendarDays size={36} />
                <p className="assistant-empty-title">No post schedules yet</p>
                <p className="assistant-empty-sub">Click + to add a posting schedule for a client. Days will appear on the calendar.</p>
              </div>
            )}
            {schedules.map(s => (
              editingScheduleId === s.id ? (
                <div key={s.id} className="pl-add-wrap">
                  <ScheduleForm clients={clients} users={allUsers} initial={s}
                    onSave={(_, __, days, assignedTo) => { onUpdateSchedule?.(s.id, days, undefined, assignedTo); setEditingScheduleId(null); }}
                    onCancel={() => setEditingScheduleId(null)}
                  />
                </div>
              ) : (
                <div key={s.id} className="retainer-card" style={{ borderLeftColor: 'var(--accent)' }}>
                  <div className="retainer-card-main">
                    <div className="retainer-card-info">
                      <span className="retainer-card-name">{s.clientName}</span>
                      <div className="schedule-days-display">
                        {ALL_DAYS.map(d => (
                          <span key={d} className={`schedule-day-chip ${s.days.includes(d) ? 'on' : 'off'}`}>{d}</span>
                        ))}
                      </div>
                      <span className="retainer-card-desc">
                        → {s.assignedTo === 'all' ? 'Everyone' : (allUsers.find(u => u.id === s.assignedTo)?.displayName ?? s.assignedTo)}
                      </span>
                    </div>
                  </div>
                  <div className="retainer-card-actions">
                    <button className="icon-btn xs" onClick={() => { setEditingScheduleId(s.id); setShowAddSchedule(false); }} title="Edit"><Edit3 size={13} /></button>
                    <button className="icon-btn xs red-h" onClick={() => onDeleteSchedule?.(s.id)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            ))}
          </div>
        </main>
      )}

      {/* ── REMINDERS TAB ── */}
      {activeTab === 'reminders' && mode === 'admin' && (
        <main className="retainer-list">
          <div className="tasks-section-head">
            <Bell size={16} className="section-icon" />
            <span>Check-in Reminders</span>
            <span className="section-total-of">{reminders.length}</span>
            <button className="icon-btn accent" style={{ marginLeft: 'auto' }}
              onClick={() => { setShowAddReminder(p => !p); setEditingReminderId(null); }} title="Add reminder">
              {showAddReminder ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>

          <p className="retainer-reminder-sub" style={{ padding: '4px 0 8px' }}>
            Toggle a reminder ON to send it as a pop-up to your assistant's screen. Toggle it OFF to dismiss.
          </p>

          {showAddReminder && !editingReminderId && (
            <div className="pl-add-wrap">
              <ReminderForm users={allUsers}
                onSave={(title, message, schedule, assignedTo) => { onAddReminder?.(title, message, schedule, assignedTo); setShowAddReminder(false); }}
                onCancel={() => setShowAddReminder(false)}
              />
            </div>
          )}

          <div className="retainer-items">
            {reminders.length === 0 && !showAddReminder && (
              <div className="empty-state">
                <Bell size={36} />
                <p className="assistant-empty-title">No reminders yet</p>
                <p className="assistant-empty-sub">Click + to create a reminder. Toggle it active to show a pop-up on your assistant's screen.</p>
              </div>
            )}
            {reminders.map(r => (
              editingReminderId === r.id ? (
                <div key={r.id} className="pl-add-wrap">
                  <ReminderForm users={allUsers} initial={r}
                    onSave={(title, message, schedule, assignedTo) => { onUpdateReminder?.(r.id, { title, message, schedule, assignedTo }); setEditingReminderId(null); }}
                    onCancel={() => setEditingReminderId(null)}
                  />
                </div>
              ) : (
                <div key={r.id} className="retainer-card" style={{ borderLeftColor: r.active ? 'var(--amber)' : 'var(--border2)' }}>
                  <div className="retainer-card-main">
                    <div className="retainer-card-info">
                      <span className="retainer-card-name">{r.title}</span>
                      {r.message && <span className="retainer-card-desc">{r.message}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <div className={`retainer-status ${r.active ? 'pending' : 'ok'}`}>
                        {r.active ? <Bell size={13} /> : <BellOff size={13} />}
                        <span>{r.active ? 'Active' : 'Inactive'}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text4)' }}>
                        {r.schedule === 'daily' ? 'Every day' : r.schedule + 's only'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text4)' }}>
                        → {r.assignedTo === 'all' ? 'Everyone' : (allUsers.find(u => u.id === r.assignedTo)?.displayName ?? r.assignedTo)}
                      </span>
                    </div>
                  </div>
                  <div className="retainer-card-actions">
                    <button
                      className={`btn-ghost sm`}
                      style={r.active ? { color: 'var(--amber)', borderColor: 'var(--amber)' } : {}}
                      onClick={() => onToggleReminder?.(r.id)}
                      title={r.active ? 'Turn off' : 'Turn on'}
                    >
                      {r.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {r.active ? 'ON' : 'OFF'}
                    </button>
                    <button className="icon-btn xs" onClick={() => { setEditingReminderId(r.id); setShowAddReminder(false); }} title="Edit"><Edit3 size={13} /></button>
                    <button className="icon-btn xs red-h" onClick={() => onDeleteReminder?.(r.id)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            ))}
          </div>
        </main>
      )}
    </>
  );
}
