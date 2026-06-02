import { useState } from 'react';
import {
  CheckCircle2, Clock3, AlertTriangle, Plus, Check, X,
  CalendarDays, TrendingUp, TrendingDown,
  BookOpen, Flag, BarChart3, Receipt,
} from 'lucide-react';
import { Client, Task, OddTask, CalendarEvent, MeetingNote, AppUser, TaskStatus } from './types';
import { todayStr } from './useStore';
import WorkloadDashboard from './WorkloadDashboard';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmt12(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

interface TodayTask {
  id: string;
  title: string;
  source: string;
  sourceColor: string;
  status: TaskStatus;
  dueDate: string;
  delayReason?: string;
  kind: 'retainer' | 'odd';
  clientId?: string;
}

// ── Money Bar ────────────────────────────────────────────────────────
function MoneyBar({ paidIn, paidOut }: { paidIn: number; paidOut: number }) {
  const total   = paidIn + paidOut;
  const inPct   = total > 0 ? (paidIn  / total) * 100 : 50;
  const outPct  = total > 0 ? (paidOut / total) * 100 : 50;
  const healthy = paidIn >= paidOut;

  return (
    <div className="money-bar-card">
      <div className="money-bar-header">
        <span className="money-bar-title">Money In vs Out</span>
        <span className={`money-bar-status ${healthy ? 'healthy' : 'warning'}`}>
          {healthy ? '✓ Earning more' : '⚠ Spending more'}
        </span>
      </div>
      <div className="money-bar-track">
        <div className="money-bar-in"  style={{ width: `${inPct}%` }}  title="Paid income" />
        <div className="money-bar-out" style={{ width: `${outPct}%` }} title="Paid expenses" />
      </div>
      <div className="money-bar-labels">
        <div className="money-bar-label in"><TrendingUp  size={12} /> Income received</div>
        <div className="money-bar-label out">Expenses paid <TrendingDown size={12} /></div>
      </div>
      {total === 0 && <p className="money-bar-empty">Mark income/costs as paid in Company tab.</p>}
    </div>
  );
}

// ── Upcoming — stacked vertically ────────────────────────────────────
function UpcomingMini({ eventsForDate }: { eventsForDate: (d: string) => CalendarEvent[] }) {
  const today = new Date();
  const days  = [0, 1, 2].map(n => addDays(today, n));

  return (
    <div className="home-upcoming">
      <div className="home-section-title"><CalendarDays size={15} /> Upcoming — Next 3 Days</div>
      <div className="home-upcoming-days-v">
        {days.map((day, idx) => {
          const ds   = day.toISOString().split('T')[0];
          const evts = eventsForDate(ds);
          return (
            <div key={ds} className={`home-upcoming-day-v ${idx === 0 ? 'today' : ''}`}>
              <div className="home-upcoming-day-hd-v">
                <span className="home-upcoming-dn">{DAY_SHORT[day.getDay()]}</span>
                <span className="home-upcoming-dd">{day.getDate()}</span>
                <span className="home-upcoming-dm">{MONTH_NAMES[day.getMonth()].slice(0,3)}</span>
                {idx === 0 && <span className="badge-today-sm">Today</span>}
              </div>
              <div className="home-upcoming-evts-v">
                {evts.length === 0
                  ? <span className="home-upcoming-empty">No events</span>
                  : evts.map(e => (
                      <div key={e.id} className="home-upcoming-evt-v" style={{ borderLeftColor: e.color }}>
                        <span className="home-upcoming-evt-time" style={{ color: e.color }}>{fmt12(e.time)}</span>
                        <span className="home-upcoming-evt-name">{e.title}</span>
                      </div>
                    ))
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Task Tile (compact) ───────────────────────────────────────────────
function TaskTile({ task, onClick }: { task: TodayTask; onClick: () => void }) {
  const today    = todayStr();
  const isOverdue = task.status !== 'completed' && task.status !== 'delayed' && task.dueDate < today;
  let state = '';
  if      (task.status === 'in-progress') state = 'inprog';
  else if (task.status === 'delayed')     state = 'delayed';
  else if (isOverdue)                     state = 'overdue';

  return (
    <button
      className={`task-tile ${state}`}
      onClick={onClick}
      style={{ '--tile-color': task.sourceColor } as React.CSSProperties}
    >
      <span className="task-tile-client" style={{ color: task.sourceColor }}>
        {task.source.split(' ')[0]}
      </span>
      <span className="task-tile-title">{task.title}</span>
      {isOverdue && <span className="task-tile-late">LATE</span>}
      {task.status === 'in-progress' && <span className="task-tile-badge inprog">●</span>}
      {task.status === 'delayed'     && <span className="task-tile-badge delayed">⏸</span>}
    </button>
  );
}

// ── Task Detail Modal ─────────────────────────────────────────────────
function TaskModal({
  task, notes, onClose, onStatus, onNoteChange,
}: {
  task: TodayTask;
  notes: string;
  onClose: () => void;
  onStatus: (id: string, kind: 'retainer'|'odd', status: TaskStatus, clientId?: string, reason?: string) => void;
  onNoteChange: (id: string, val: string) => void;
}) {
  const today     = todayStr();
  const [showDelay, setShowDelay] = useState(false);
  const [delayReason, setDelayReason] = useState(task.delayReason || '');
  const isOverdue  = task.status !== 'completed' && task.status !== 'delayed' && task.dueDate < today;

  const doStatus = (s: TaskStatus, reason?: string) => {
    onStatus(task.id, task.kind, s, task.clientId, reason);
    onClose();
  };

  const submitDelay = () => {
    if (!delayReason.trim()) return;
    doStatus('delayed', delayReason.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="task-detail-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="tdm-header" style={{ borderLeftColor: task.sourceColor }}>
          <div className="tdm-meta">
            <span className="tdm-source" style={{ background: task.sourceColor + '22', color: task.sourceColor }}>
              {task.source}
            </span>
            <span className={`tdm-date ${isOverdue ? 'overdue' : ''}`}>
              {isOverdue ? '⚠ OVERDUE · ' : 'Due: '}{task.dueDate}
            </span>
          </div>
          <button className="icon-btn xs" onClick={onClose}><X size={14}/></button>
        </div>

        {/* Title */}
        <div className="tdm-title">{task.title}</div>

        {/* Current status */}
        <div className="tdm-status-row">
          <button
            className={`tdm-btn inprog ${task.status === 'in-progress' ? 'active' : ''}`}
            onClick={() => doStatus('in-progress')}
          >
            <Clock3 size={13}/> In Progress
          </button>
          <button
            className={`tdm-btn done ${task.status === 'completed' ? 'active' : ''}`}
            onClick={() => doStatus('completed')}
          >
            <CheckCircle2 size={13}/> Done ✓
          </button>
          {task.status !== 'completed' && (
            <button
              className={`tdm-btn delay ${task.status === 'delayed' ? 'active' : ''}`}
              onClick={() => setShowDelay(s => !s)}
            >
              <AlertTriangle size={13}/> Delay
            </button>
          )}
          {task.status === 'completed' && (
            <button className="tdm-btn undo" onClick={() => doStatus('not-started')}>
              ↩ Undo
            </button>
          )}
        </div>

        {/* Delay reason form */}
        {showDelay && (
          <div className="tdm-delay-form">
            <input
              className="field-input"
              placeholder="Reason for delay…"
              value={delayReason}
              onChange={e => setDelayReason(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitDelay()}
              autoFocus
            />
            <button className="btn-primary" style={{ padding: '7px 14px', fontSize: '0.8rem' }} onClick={submitDelay}>
              <Check size={13}/> Confirm
            </button>
          </div>
        )}

        {task.status === 'delayed' && task.delayReason && (
          <div className="tdm-delay-reason">⏸ {task.delayReason}</div>
        )}

        {/* Notes */}
        <div className="tdm-notes-section">
          <label className="field-label">Notes</label>
          <textarea
            className="field-input field-ta tdm-ta"
            placeholder="Add notes for this task…"
            value={notes}
            onChange={e => onNoteChange(task.id, e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

// ── Today Tasks Section ───────────────────────────────────────────────
function TodayTasksSection({
  todayTasks, allClients, taskNotes, onStatus, onAddRetainerTask, onAddOddTask, onNoteChange,
}: {
  todayTasks: TodayTask[];
  allClients: Client[];
  taskNotes: Record<string, string>;
  onStatus: (id: string, kind: 'retainer'|'odd', status: TaskStatus, clientId?: string, reason?: string) => void;
  onAddRetainerTask: (clientId: string, title: string, dueDate: string) => void;
  onAddOddTask: (title: string, dueDate: string) => void;
  onNoteChange: (id: string, val: string) => void;
}) {
  const today = todayStr();
  const [expandedKey, setExpandedKey]   = useState<string | null>(null);
  const [showAdd, setShowAdd]           = useState(false);
  const [addKind, setAddKind]           = useState<'retainer'|'odd'>('retainer');
  const [addClientId, setAddClientId]   = useState('');
  const [addTitle, setAddTitle]         = useState('');
  const [addDue, setAddDue]             = useState(today);

  const active    = todayTasks.filter(t => t.status !== 'completed');
  const completed = todayTasks.filter(t => t.status === 'completed').length;
  const expandedTask = expandedKey ? todayTasks.find(t => t.id + t.kind === expandedKey) : null;

  const submitAdd = () => {
    if (!addTitle.trim()) return;
    if (addKind === 'retainer' && addClientId) onAddRetainerTask(addClientId, addTitle.trim(), addDue);
    else if (addKind === 'odd')                onAddOddTask(addTitle.trim(), addDue);
    setAddTitle(''); setShowAdd(false);
  };

  return (
    <div className="home-tasks-panel">
      {/* Head bar */}
      <div className="home-tasks-head">
        <span className="hth-title"><CheckCircle2 size={14}/> Today's Tasks</span>
        <span className="hth-legend">
          <span className="htl-dot inprog"/>in-progress
          <span className="htl-dot overdue" style={{marginLeft:8}}/>late
          <span className="htl-dot delayed" style={{marginLeft:8}}/>delayed
        </span>
        <span className="hth-stats">{active.length} unfinished · {completed} completed</span>
        <button className="btn-primary hth-add" onClick={() => setShowAdd(s => !s)}>New +</button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="home-add-form">
          <select className="field-select" value={addKind} onChange={e => setAddKind(e.target.value as 'retainer'|'odd')}>
            <option value="retainer">Client Task</option>
            <option value="odd">Once-Off Task</option>
          </select>
          {addKind === 'retainer' && (
            <select className="field-select" value={addClientId} onChange={e => setAddClientId(e.target.value)}>
              <option value="">Select client…</option>
              {allClients.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          )}
          <input
            className="field-input flex1"
            placeholder="Task title…"
            value={addTitle}
            onChange={e => setAddTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitAdd()}
            autoFocus
          />
          <input type="date" className="field-date" value={addDue} onChange={e => setAddDue(e.target.value)} />
          <button className="icon-btn accent xs" onClick={submitAdd}><Check size={13}/></button>
          <button className="icon-btn xs" onClick={() => setShowAdd(false)}><X size={13}/></button>
        </div>
      )}

      {/* Tile grid */}
      {active.length === 0 ? (
        <div className="home-tasks-empty-tile">
          <CheckCircle2 size={34}/>
          <p>All clear for today!</p>
          {completed > 0 && <small>{completed} task{completed > 1 ? 's' : ''} completed ✓</small>}
        </div>
      ) : (
        <div className="task-tiles-grid">
          {active.map(t => (
            <TaskTile
              key={t.id + t.kind}
              task={t}
              onClick={() => setExpandedKey(t.id + t.kind)}
            />
          ))}
        </div>
      )}

      {/* Task detail modal */}
      {expandedTask && (
        <TaskModal
          task={expandedTask}
          notes={taskNotes[expandedTask.id] || ''}
          onClose={() => setExpandedKey(null)}
          onNoteChange={onNoteChange}
          onStatus={(id, kind, status, clientId, reason) => {
            onStatus(id, kind, status, clientId, reason);
            if (status === 'completed') setExpandedKey(null);
          }}
        />
      )}
    </div>
  );
}

// ── Once-Off Task Edit Modal ──────────────────────────────────────────
function OddTaskEditModal({
  task, onClose, onSaveDueDate, onDelete,
}: {
  task: OddTask;
  onClose: () => void;
  onSaveDueDate: (id: string, dueDate: string) => void;
  onDelete: (id: string) => void;
}) {
  const [dueDate, setDueDate] = useState(task.dueDate);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="task-detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <div className="tdm-header" style={{ borderLeftColor: '#f59e0b' }}>
          <span className="tdm-source" style={{ background: '#f59e0b22', color: '#f59e0b' }}>Once-off</span>
          <button className="icon-btn xs" onClick={onClose}><X size={14}/></button>
        </div>
        <div className="tdm-title">{task.title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <label className="field-label">Due Date</label>
          <input type="date" className="field-date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              className="btn-primary"
              style={{ flex: 1 }}
              onClick={() => { onSaveDueDate(task.id, dueDate); onClose(); }}
            >
              <Check size={13}/> Save
            </button>
            <button
              className="icon-btn xs red-h"
              style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => { onDelete(task.id); onClose(); }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Once-Off Tasks (tile grid) ────────────────────────────────────────
function OnceOffTiles({
  tasks, taskNotes, onStatusChange, onAddOddTask, onNoteChange, onDeleteOddTask, onUpdateDueDate,
}: {
  tasks: OddTask[];
  taskNotes: Record<string, string>;
  onStatusChange: (id: string, status: TaskStatus, reason?: string) => void;
  onAddOddTask: (title: string, dueDate: string) => void;
  onNoteChange: (id: string, val: string) => void;
  onDeleteOddTask: (id: string) => void;
  onUpdateDueDate: (id: string, dueDate: string) => void;
}) {
  const today  = todayStr();
  const active = tasks.filter(t => t.status !== 'completed');
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDue, setAddDue]     = useState(today);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId]   = useState<string | null>(null);

  const submitAdd = () => {
    if (!addTitle.trim()) return;
    onAddOddTask(addTitle.trim(), addDue);
    setAddTitle(''); setShowAdd(false);
  };

  const asTodayTask = (t: OddTask): TodayTask => ({
    id: t.id, title: t.title, source: 'Once-off', sourceColor: '#f59e0b',
    status: t.status, dueDate: t.dueDate, delayReason: t.delayReason,
    kind: 'odd',
  });

  const expandedTask = expandedId ? tasks.find(t => t.id === expandedId) : null;
  const editingTask  = editingId  ? tasks.find(t => t.id === editingId)  : null;

  return (
    <div className="home-oncoff">
      <div className="home-section-title">
        <Plus size={14}/> Once-Off Tasks
        <button className="home-section-action" onClick={() => setShowAdd(s => !s)}>
          <Plus size={12}/> Add
        </button>
      </div>

      {showAdd && (
        <div className="home-add-form">
          <input
            className="field-input flex1"
            placeholder="Task title…"
            value={addTitle}
            onChange={e => setAddTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitAdd()}
            autoFocus
          />
          <input type="date" className="field-date" value={addDue} onChange={e => setAddDue(e.target.value)} />
          <button className="icon-btn accent xs" onClick={submitAdd}><Check size={13}/></button>
          <button className="icon-btn xs" onClick={() => setShowAdd(false)}><X size={13}/></button>
        </div>
      )}

      {active.length === 0 && !showAdd
        ? <p className="home-empty">No open once-off tasks.</p>
        : (
          <div className="task-tiles-grid oncoff-tiles">
            {active.map(t => {
              const isOverdue = t.dueDate < today && t.status !== 'delayed';
              let state = '';
              if      (t.status === 'in-progress') state = 'inprog';
              else if (t.status === 'delayed')     state = 'delayed';
              else if (isOverdue)                  state = 'overdue';
              return (
                <div key={t.id} className="task-tile-wrap" style={{ position: 'relative' }}>
                  <button
                    className={`task-tile ${state}`}
                    style={{ '--tile-color': '#f59e0b' } as React.CSSProperties}
                    onClick={() => setExpandedId(t.id)}
                  >
                    <span className="task-tile-client" style={{ color: '#f59e0b' }}>Once-off</span>
                    <span className="task-tile-title">{t.title}</span>
                    <span className="task-tile-due">{t.dueDate}</span>
                    {isOverdue && <span className="task-tile-late">LATE</span>}
                    {t.status === 'in-progress' && <span className="task-tile-badge inprog">●</span>}
                    {t.status === 'delayed'     && <span className="task-tile-badge delayed">⏸</span>}
                  </button>
                  <button
                    className="icon-btn xs oncoff-edit-btn"
                    title="Edit / Delete"
                    onClick={e => { e.stopPropagation(); setEditingId(t.id); }}
                  >
                    ✎
                  </button>
                </div>
              );
            })}
          </div>
        )
      }

      {expandedTask && (
        <TaskModal
          task={asTodayTask(expandedTask)}
          notes={taskNotes[expandedTask.id] || ''}
          onClose={() => setExpandedId(null)}
          onNoteChange={onNoteChange}
          onStatus={(id, _kind, status, _clientId, reason) => {
            onStatusChange(id, status, reason);
            if (status === 'completed') setExpandedId(null);
          }}
        />
      )}

      {editingTask && (
        <OddTaskEditModal
          task={editingTask}
          onClose={() => setEditingId(null)}
          onSaveDueDate={onUpdateDueDate}
          onDelete={onDeleteOddTask}
        />
      )}
    </div>
  );
}

// ── Invoice Reminder Modal ────────────────────────────────────────────
function InvoiceReminder({
  clients, onTogglePaid,
}: {
  clients: Client[];
  onTogglePaid: (id: string) => void;
}) {
  const due = clients.filter(c => c.monthlyIncome > 0 && !c.paidThisMonth);
  if (due.length === 0) return null;

  const fmt = (n: number) => `R ${n.toLocaleString('en-ZA')}`;

  return (
    <div className="modal-overlay invoice-reminder-overlay">
      <div className="invoice-reminder-modal">
        <div className="irm-header">
          <Receipt size={20} className="irm-icon" />
          <div>
            <div className="irm-title">Invoice Reminder</div>
            <div className="irm-sub">{due.length} client{due.length > 1 ? 's' : ''} still outstanding this month</div>
          </div>
        </div>

        <div className="irm-list">
          {due.map(c => (
            <div key={c.id} className="irm-row">
              <span className="irm-dot" style={{ background: c.color }} />
              <span className="irm-icon-emoji">{c.icon}</span>
              <div className="irm-client-info">
                <span className="irm-client-name">{c.name}</span>
                <span className="irm-amount">{fmt(c.monthlyIncome)}</span>
              </div>
              <button
                className="btn-primary irm-btn"
                onClick={() => onTogglePaid(c.id)}
              >
                <Check size={13}/> Done &amp; Paid
              </button>
            </div>
          ))}
        </div>

        <p className="irm-note">This reminder stays until all retainer clients are marked as paid.</p>
      </div>
    </div>
  );
}

// ── Recent Meeting Notes ──────────────────────────────────────────────
function RecentNotes({ notes, onViewAll }: { notes: MeetingNote[]; onViewAll: () => void }) {
  const recent = notes.slice(0, 4);
  return (
    <div className="home-notes">
      <div className="home-section-title">
        <BookOpen size={14}/> Recent Meeting Notes
        <button className="home-section-action" onClick={onViewAll}>View all</button>
      </div>
      {recent.length === 0 ? (
        <p className="home-empty">No meeting notes yet.</p>
      ) : (
        <div className="home-notes-list">
          {recent.map(n => (
            <div key={n.id} className="home-note-card">
              <div className="home-note-top">
                <span className="home-note-customer">{n.customerName}</span>
                <span className="home-note-date">{n.date}</span>
              </div>
              <div className="home-note-title">{n.title}</div>
              {n.followUp && <div className="home-note-followup"><Flag size={10}/> {n.followUp}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main HomePage ──────────────────────────────────────────────────────
interface HomePageProps {
  clients: Client[];
  oddTasks: OddTask[];
  users: AppUser[];
  eventsForDate: (d: string) => CalendarEvent[];
  meetingNotes: MeetingNote[];
  totalPaidIncome: number;
  totalPaidExpenses: number;
  invoiceFromDay?: number; // day of month from which to show invoice reminder (default 20)
  onUpdateTaskStatus: (cid: string, tid: string, status: TaskStatus, reason?: string) => void;
  onUpdateOddTaskStatus: (id: string, status: TaskStatus, reason?: string) => void;
  onDeleteOddTask: (id: string) => void;
  onUpdateOddTaskDueDate: (id: string, dueDate: string) => void;
  onToggleClientPaid: (id: string) => void;
  onNavigateToNotes: () => void;
  onAddRetainerTask: (clientId: string, title: string, dueDate: string) => void;
  onAddOddTask: (title: string, dueDate: string) => void;
}

export default function HomePage({
  clients, oddTasks, users, eventsForDate, meetingNotes,
  totalPaidIncome, totalPaidExpenses, invoiceFromDay = 20,
  onUpdateTaskStatus, onUpdateOddTaskStatus, onDeleteOddTask, onUpdateOddTaskDueDate,
  onToggleClientPaid, onNavigateToNotes, onAddRetainerTask, onAddOddTask,
}: HomePageProps) {
  const today = todayStr();
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});

  const handleNoteChange = (id: string, val: string) =>
    setTaskNotes(prev => ({ ...prev, [id]: val }));

  // All tasks due today or overdue (not-completed)
  const todayTasks: TodayTask[] = [
    ...clients.flatMap(c =>
      c.tasks
        .filter(t => t.dueDate === today || (t.status !== 'completed' && t.dueDate < today))
        .map(t => ({
          id: t.id, title: t.title, source: c.name, sourceColor: c.color,
          status: t.status, dueDate: t.dueDate, delayReason: t.delayReason,
          kind: 'retainer' as const, clientId: c.id,
        }))
    ),
    ...oddTasks
      .filter(t => t.dueDate === today || (t.status !== 'completed' && t.dueDate < today))
      .map(t => ({
        id: t.id, title: t.title, source: 'Once-off', sourceColor: '#f59e0b',
        status: t.status, dueDate: t.dueDate, delayReason: t.delayReason,
        kind: 'odd' as const,
      })),
  ].sort((a, b) => {
    const order: Record<TaskStatus, number> = { 'in-progress': 0, 'not-started': 1, 'delayed': 2, 'completed': 3 };
    return order[a.status] - order[b.status] || a.dueDate.localeCompare(b.dueDate);
  });

  const handleStatus = (id: string, kind: 'retainer'|'odd', status: TaskStatus, clientId?: string, reason?: string) => {
    if (kind === 'retainer' && clientId) onUpdateTaskStatus(clientId, id, status, reason);
    else onUpdateOddTaskStatus(id, status, reason);
  };

  // Show invoice reminder from invoiceFromDay of the month until all retainer clients are paid
  const showInvoiceReminder = new Date().getDate() >= invoiceFromDay
    && clients.some(c => c.monthlyIncome > 0 && !c.paidThisMonth);

  return (
    <div className="home-page">
      {showInvoiceReminder && (
        <InvoiceReminder clients={clients} onTogglePaid={onToggleClientPaid} />
      )}
      {/* Top row: task tiles + right column */}
      <div className="home-top-row">
        <TodayTasksSection
          todayTasks={todayTasks}
          allClients={clients}
          taskNotes={taskNotes}
          onStatus={handleStatus}
          onAddRetainerTask={onAddRetainerTask}
          onAddOddTask={onAddOddTask}
          onNoteChange={handleNoteChange}
        />

        <div className="home-right-col">
          <MoneyBar paidIn={totalPaidIncome} paidOut={totalPaidExpenses} />
          <UpcomingMini eventsForDate={eventsForDate} />
        </div>
      </div>

      {/* Workload overview */}
      <div className="home-workload-section">
        <div className="home-section-title"><BarChart3 size={15}/> Workload Overview</div>
        <WorkloadDashboard clients={clients} oddTasks={oddTasks} users={users} />
      </div>

      {/* Bottom row */}
      <div className="home-bottom-row">
        <OnceOffTiles
          tasks={oddTasks}
          taskNotes={taskNotes}
          onStatusChange={(id, status, reason) => onUpdateOddTaskStatus(id, status, reason)}
          onAddOddTask={onAddOddTask}
          onNoteChange={handleNoteChange}
          onDeleteOddTask={onDeleteOddTask}
          onUpdateDueDate={onUpdateOddTaskDueDate}
        />
        <RecentNotes notes={meetingNotes} onViewAll={onNavigateToNotes} />
      </div>
    </div>
  );
}
