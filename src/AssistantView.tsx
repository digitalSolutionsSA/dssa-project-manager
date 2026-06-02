import { useState } from 'react';
import {
  LogOut, ClipboardList, Clock, CheckCircle2, Circle, Loader2,
  AlertTriangle, Calendar, Tag,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { AppUser, Client, TaskStatus, CalendarEvent, PriceListItem, OddTask } from './types';
import { todayStr } from './useStore';
import PriceList from './PriceList';

interface Props {
  currentUser: AppUser;
  clients: Client[];
  oddTasks: OddTask[];
  onUpdateStatus: (cid: string, tid: string, status: TaskStatus) => void;
  onUpdateOddTaskStatus: (id: string, status: TaskStatus) => void;
  onLogout: () => void;
  eventsForDate: (date: string) => CalendarEvent[];
  priceList: PriceListItem[];
  allAssistants: AppUser[];
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  'not-started': { label: 'Not Started', icon: <Circle size={13} />,       cls: 'not-started' },
  'in-progress':  { label: 'In Progress', icon: <Loader2 size={13} />,     cls: 'in-progress' },
  'completed':    { label: 'Completed',   icon: <CheckCircle2 size={13}/>, cls: 'completed'   },
  'delayed':      { label: 'Delayed',     icon: <Circle size={13} />,      cls: 'not-started' },
};

type Filter = 'all' | TaskStatus;

// ── Helpers ───────────────────────────────────────────────────────
function fmt12(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Read-Only Calendar ────────────────────────────────────────────
function AssistantCalendar({ eventsForDate }: { eventsForDate: (d: string) => CalendarEvent[] }) {
  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected, setSelected]   = useState<string | null>(null);
  const today = todayStr();

  const firstDay    = new Date(viewYear, viewMonth, 1);
  const lastDay     = new Date(viewYear, viewMonth + 1, 0);
  const startDow    = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedEvents = selected ? eventsForDate(selected) : [];

  return (
    <div className="asst-calendar">
      {/* Nav */}
      <div className="asst-cal-nav">
        <button className="icon-btn" onClick={prevMonth}><ChevronLeft size={16} /></button>
        <span className="asst-cal-title">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button className="icon-btn" onClick={nextMonth}><ChevronRight size={16} /></button>
      </div>

      {/* Day headers */}
      <div className="asst-cal-grid">
        {DAY_SHORT.map(d => (
          <div key={d} className="asst-cal-dow">{d}</div>
        ))}

        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = eventsForDate(dStr);
          const isToday   = dStr === today;
          const isSel     = dStr === selected;

          return (
            <div
              key={dStr}
              className={`asst-cal-day ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''} ${dayEvents.length ? 'has-events' : ''}`}
              onClick={() => setSelected(isSel ? null : dStr)}
            >
              <span className="asst-cal-day-num">{day}</span>
              {dayEvents.length > 0 && (
                <div className="asst-cal-dots">
                  {dayEvents.slice(0, 3).map(ev => (
                    <span key={ev.id} className="asst-cal-dot" style={{ background: ev.color }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day events */}
      {selected && (
        <div className="asst-cal-events">
          <div className="asst-cal-events-head">
            {new Date(selected + 'T00:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          {selectedEvents.length === 0 ? (
            <p className="asst-cal-no-events">No events on this day.</p>
          ) : (
            selectedEvents.map(ev => (
              <div key={ev.id} className="asst-cal-event-row" style={{ borderLeftColor: ev.color }}>
                <span className="asst-cal-event-time">{fmt12(ev.time)}</span>
                <div className="asst-cal-event-info">
                  <span className="asst-cal-event-title">{ev.title}</span>
                  {ev.description && <span className="asst-cal-event-desc">{ev.description}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ASSISTANT VIEW
// ══════════════════════════════════════════════════════════════════
type Tab = 'tasks' | 'calendar' | 'prices';

export default function AssistantView({
  currentUser, clients, oddTasks, onUpdateStatus, onUpdateOddTaskStatus, onLogout,
  eventsForDate, priceList, allAssistants,
}: Props) {
  // tasksAccess defaults to true if not explicitly set to false
  const hasTasks    = currentUser.tasksAccess !== false;
  const hasCalendar = !!currentUser.calendarAccess;
  // pricesAccess is an explicit opt-in; if granted, filter to items visible to this user
  const hasPrices   = !!currentUser.pricesAccess;
  const myPrices = hasPrices
    ? priceList.filter(i => i.visibleTo === 'all' || (i.visibleTo as string[]).includes(currentUser.id))
    : [];

  const defaultTab: Tab = hasTasks ? 'tasks' : hasCalendar ? 'calendar' : 'prices';
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [filter, setFilter]       = useState<Filter>('all');

  // ── Client tasks assigned to me ────────────────────────────────
  const clientTaskItems = clients.flatMap(client =>
    client.tasks
      .filter(t => t.assignedTo === currentUser.id)
      .map(t => ({ task: t, clientName: client.name, clientColor: client.color, clientId: client.id, isOdd: false as const, oddId: '' }))
  );

  // ── Odd tasks assigned to me ───────────────────────────────────
  const oddTaskItems = (oddTasks || [])
    .filter(t => t.assignedTo === currentUser.id)
    .map(t => ({
      task: { id: t.id, title: t.title, dueDate: t.dueDate, status: t.status, assignedTo: t.assignedTo, createdAt: t.createdAt },
      clientName: '📋 Standalone',
      clientColor: '#6366f1',
      clientId: '',
      isOdd: true as const,
      oddId: t.id,
    }));

  const allTasks = [...clientTaskItems, ...oddTaskItems].sort((a, b) => {
    const order: Record<TaskStatus, number> = { 'not-started': 0, 'in-progress': 1, 'delayed': 2, 'completed': 3 };
    const s = order[a.task.status] - order[b.task.status];
    return s !== 0 ? s : a.task.dueDate.localeCompare(b.task.dueDate);
  });

  const visible = filter === 'all' ? allTasks : allTasks.filter(x => x.task.status === filter);
  const counts = {
    all:           allTasks.length,
    'not-started': allTasks.filter(x => x.task.status === 'not-started').length,
    'in-progress': allTasks.filter(x => x.task.status === 'in-progress').length,
    'completed':   allTasks.filter(x => x.task.status === 'completed').length,
    'delayed':     allTasks.filter(x => x.task.status === 'delayed').length,
  };

  return (
    <div className="app">
      <div className="bg-layer" aria-hidden="true">
        <div className="glow g1" /><div className="glow g2" /><div className="glow g3" />
        <div className="grid-overlay" />
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="header-logo-wrap">
          <img src="/logo-bg.png" alt="Digital Solutions SA" className="header-logo" />
        </div>
        <div className="header-title-block">
          <span className="header-eyebrow">Hi, {currentUser.displayName || currentUser.username} 👋</span>
          <h1 className="header-title">Digital Solutions SA</h1>
        </div>
        <div className="header-right">
          <button className="btn-logout" onClick={onLogout} title="Sign Out">
            <LogOut size={14} />
            <span className="btn-logout-label">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Tab nav */}
      <div className="tab-nav" role="tablist">
        {hasTasks && (
          <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <ClipboardList size={15} /><span className="tab-label"> My Tasks</span>
            {counts.all > 0 && <span className="tab-count">{counts['not-started'] + counts['in-progress']}</span>}
          </button>
        )}
        {hasCalendar && (
          <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
            <Calendar size={15} /><span className="tab-label"> Schedule</span>
          </button>
        )}
        {hasPrices && (
          <button className={`tab-btn ${activeTab === 'prices' ? 'active' : ''}`} onClick={() => setActiveTab('prices')}>
            <Tag size={15} /><span className="tab-label"> Price List</span>
            {myPrices.length > 0 && <span className="tab-count">{myPrices.length}</span>}
          </button>
        )}
      </div>

      {/* ── TASKS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'tasks' && hasTasks && (
        <main className="assistant-board">
          {/* Filter tabs */}
          <div className="assistant-filter-tabs">
            {(['all', 'not-started', 'in-progress', 'completed'] as Filter[]).map(f => (
              <button
                key={f}
                className={`assistant-filter-btn ${filter === f ? 'active' : ''} ${f !== 'all' ? f : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : STATUS_CONFIG[f as TaskStatus].label}
                <span className="assistant-filter-count">{counts[f]}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="assistant-empty">
              {allTasks.length === 0 ? (
                <>
                  <ClipboardList size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
                  <p className="assistant-empty-title">No tasks assigned yet</p>
                  <p className="assistant-empty-sub">Your admin will assign tasks to you here.</p>
                </>
              ) : (
                <>
                  <CheckCircle2 size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
                  <p className="assistant-empty-title">No tasks in this category</p>
                </>
              )}
            </div>
          ) : (
            <div className="assistant-task-list">
              {visible.map(({ task, clientName, clientColor, clientId, isOdd, oddId }) => {
                const today  = todayStr();
                const isOver = task.status !== 'completed' && task.dueDate < today;
                const isTdy  = task.status !== 'completed' && task.dueDate === today;
                return (
                  <div key={task.id} className={`assistant-task-card ${task.status}`}
                    style={{ borderLeftColor: clientColor }}>
                    <div className="assistant-task-meta">
                      <span className="assistant-task-client"
                        style={{ background: clientColor + '22', color: clientColor, border: `1px solid ${clientColor}44` }}>
                        {clientName}
                      </span>
                      <span className={`assistant-task-date ${isOver ? 'overdue' : isTdy ? 'today' : ''}`}>
                        {isOver && <AlertTriangle size={11} />}
                        {isTdy  && <Clock size={11} />}
                        {task.dueDate}
                      </span>
                    </div>
                    <p className="assistant-task-title">{task.title}</p>
                    <div className="assistant-status-row">
                      {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => (
                        <button key={s} className={`status-btn ${s} ${task.status === s ? 'active' : ''}`}
                          onClick={() => isOdd ? onUpdateOddTaskStatus(oddId, s) : onUpdateStatus(clientId, task.id, s)}>
                          {STATUS_CONFIG[s].icon}{STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* ── CALENDAR TAB ──────────────────────────────────────────── */}
      {activeTab === 'calendar' && hasCalendar && (
        <main className="assistant-board">
          <AssistantCalendar eventsForDate={eventsForDate} />
        </main>
      )}

      {/* ── PRICE LIST TAB ────────────────────────────────────────── */}
      {activeTab === 'prices' && hasPrices && (
        <main className="assistant-board">
          <PriceList
            items={myPrices}
            assistants={allAssistants}
            userId={currentUser.id}
            mode="assistant"
          />
        </main>
      )}
    </div>
  );
}
