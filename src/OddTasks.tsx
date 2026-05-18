import { useState } from 'react';
import { Plus, Trash2, Check, X, Edit3, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { OddTask, OddTaskPriority, TaskStatus, AppUser } from './types';
import { todayStr } from './useStore';

function fmtR(n: number) { return n; } // unused but keep consistent
function isOverdue(t: OddTask) { return t.status !== 'completed' && t.dueDate < todayStr(); }
function isDueToday(t: OddTask) { return t.status !== 'completed' && t.dueDate === todayStr(); }

const PRIORITY_COLORS: Record<OddTaskPriority, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  completed: 'Done',
};

function OddTaskRow({ task, users, onDelete, onEdit, onStatusChange, onAssign }: {
  task: OddTask;
  users: AppUser[];
  onDelete: () => void;
  onEdit: (title: string, dueDate: string, notes: string, priority: OddTaskPriority) => void;
  onStatusChange: (s: TaskStatus) => void;
  onAssign: (userId: string | undefined) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle]   = useState(task.title);
  const [eDate, setEDate]     = useState(task.dueDate);
  const [eNotes, setENotes]   = useState(task.notes);
  const [ePrio, setEPrio]     = useState<OddTaskPriority>(task.priority);
  const [showNotes, setShowNotes] = useState(false);

  const over   = isOverdue(task);
  const dToday = isDueToday(task);
  const done   = task.status === 'completed';
  const assignedUser = users.find(u => u.id === task.assignedTo);

  const save = () => {
    if (eTitle.trim()) {
      onEdit(eTitle.trim(), eDate, eNotes.trim(), ePrio);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="odd-task-row editing">
        <div className="odd-edit-grid">
          <input className="field-input" placeholder="Task title..." value={eTitle}
            onChange={e => setETitle(e.target.value)} autoFocus />
          <input type="date" className="field-date" value={eDate} onChange={e => setEDate(e.target.value)} />
          <select className="field-select" value={ePrio} onChange={e => setEPrio(e.target.value as OddTaskPriority)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <textarea className="field-input field-ta" placeholder="Notes (optional)..." value={eNotes}
            onChange={e => setENotes(e.target.value)} rows={2} />
        </div>
        <div className="odd-edit-actions">
          <button className="icon-btn accent" onClick={save}><Check size={14} /></button>
          <button className="icon-btn" onClick={() => setEditing(false)}><X size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className={`odd-task-row ${done ? 'done' : ''} ${over ? 'overdue' : ''} ${dToday ? 'due-today' : ''}`}>
      <div className="odd-task-main">
        <span className="odd-prio-dot" style={{ background: PRIORITY_COLORS[task.priority] }} title={task.priority} />

        <select
          className="odd-status-select"
          value={task.status}
          onChange={e => onStatusChange(e.target.value as TaskStatus)}
          style={{ color: task.status === 'completed' ? 'var(--green)' : task.status === 'in-progress' ? 'var(--accent)' : 'var(--text3)' }}
        >
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Done</option>
        </select>

        <span className={`odd-task-title ${done ? 'strikethrough' : ''}`}>{task.title}</span>

        {assignedUser && (
          <span className="task-assigned-badge">
            {assignedUser.displayName || assignedUser.username}
          </span>
        )}

        <span className="task-date">{task.dueDate}</span>
        {over   && <span className="badge-overdue"><AlertTriangle size={11} /> Late</span>}
        {dToday && <span className="badge-today">Today</span>}

        {task.notes && (
          <button className="icon-btn xs" onClick={() => setShowNotes(p => !p)} title="Toggle notes">
            {showNotes ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}

        <button className="icon-btn xs" onClick={() => setEditing(true)}><Edit3 size={13} /></button>
        <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={13} /></button>
      </div>

      {showNotes && task.notes && (
        <div className="odd-task-notes">{task.notes}</div>
      )}

      {editing && (
        <div className="odd-assign-row">
          <label className="field-label" style={{ margin: 0, fontSize: '0.78rem' }}>Assign to</label>
          <select className="field-select" value={task.assignedTo || ''} onChange={e => onAssign(e.target.value || undefined)}>
            <option value="">Me (Admin)</option>
            {users.filter(u => u.role === 'assistant').map(u => (
              <option key={u.id} value={u.id}>{u.displayName || u.username}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default function OddTasks({ tasks, users, onAdd, onDelete, onUpdate, onStatusChange, onAssign }: {
  tasks: OddTask[];
  users: AppUser[];
  onAdd: (title: string, dueDate: string, notes: string, assignedTo?: string, priority?: OddTaskPriority) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string, dueDate: string, notes: string, priority: OddTaskPriority) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onAssign: (id: string, userId: string | undefined) => void;
}) {
  const [showAdd, setShowAdd]   = useState(false);
  const [title, setTitle]       = useState('');
  const [dueDate, setDueDate]   = useState(todayStr());
  const [notes, setNotes]       = useState('');
  const [priority, setPriority] = useState<OddTaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [filter, setFilter]     = useState<'all' | 'mine' | 'assigned' | 'open' | 'done'>('all');

  const assistants = users.filter(u => u.role === 'assistant');

  const submit = () => {
    if (title.trim()) {
      onAdd(title.trim(), dueDate, notes.trim(), assignedTo || undefined, priority);
      setTitle(''); setDueDate(todayStr()); setNotes(''); setPriority('medium'); setAssignedTo(''); setShowAdd(false);
    }
  };

  const filtered = tasks.filter(t => {
    if (filter === 'mine')     return !t.assignedTo;
    if (filter === 'assigned') return !!t.assignedTo;
    if (filter === 'open')     return t.status !== 'completed';
    if (filter === 'done')     return t.status === 'completed';
    return true;
  });

  const openCount     = tasks.filter(t => t.status !== 'completed').length;
  const overdueCount  = tasks.filter(isOverdue).length;
  const doneCount     = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="odd-tasks-panel">
      {/* Header */}
      <div className="odd-tasks-header">
        <div className="odd-tasks-stats">
          <span className="odd-stat open">{openCount} open</span>
          {overdueCount > 0 && <span className="odd-stat overdue">⚠ {overdueCount} overdue</span>}
          <span className="odd-stat done">{doneCount} done</span>
        </div>
        <div className="odd-filter-row">
          {(['all', 'mine', 'assigned', 'open', 'done'] as const).map(f => (
            <button key={f} className={`odd-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'mine' ? 'Mine' : f === 'assigned' ? 'Assigned' : f === 'open' ? 'Open' : 'Done'}
            </button>
          ))}
        </div>
        <button className="btn-sm-primary" onClick={() => setShowAdd(p => !p)}>
          <Plus size={14} /> Add Task
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="odd-add-form">
          <div className="odd-add-grid">
            <input className="field-input" placeholder="Task title..." value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
            <input type="date" className="field-date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            <select className="field-select" value={priority} onChange={e => setPriority(e.target.value as OddTaskPriority)}>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            {assistants.length > 0 && (
              <select className="field-select" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                <option value="">Assign to me</option>
                {assistants.map(u => <option key={u.id} value={u.id}>{u.displayName || u.username}</option>)}
              </select>
            )}
            <textarea className="field-input field-ta" placeholder="Notes (optional)..." value={notes}
              onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="odd-add-actions">
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn-primary" onClick={submit} disabled={!title.trim()}>
              <Check size={14} /> Add Task
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="odd-task-list">
        {filtered.length === 0 && (
          <p className="empty-msg">
            {filter === 'all' ? 'No standalone tasks yet. Click "Add Task" to get started.' : `No ${filter} tasks.`}
          </p>
        )}
        {filtered.map(t => (
          <OddTaskRow key={t.id} task={t} users={users}
            onDelete={() => onDelete(t.id)}
            onEdit={(ti, d, n, p) => onUpdate(t.id, ti, d, n, p)}
            onStatusChange={s => onStatusChange(t.id, s)}
            onAssign={uid => onAssign(t.id, uid)} />
        ))}
      </div>
    </div>
  );
}
