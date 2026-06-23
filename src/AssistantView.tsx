import { useState } from 'react';
import {
  LogOut, ClipboardList, Tag, Check, ChevronDown, ChevronRight,
  CornerDownRight, CheckCircle2, Sun, Moon, FolderKanban, Calendar, Repeat,
  CalendarDays, Bell,
} from 'lucide-react';
import { AppUser, Project, ProjectTask, PriceListItem, CalendarEvent, RetainerClient, PostSchedule, CheckInReminder, ThemeMode } from './types';
import PricingPage from './PricingPage';
import CalendarPage from './CalendarPage';
import RetainerPage from './RetainerPage';
import RetainerReminder from './RetainerReminder';
import CheckInReminderOverlay from './CheckInReminderOverlay';
import { needsCheckIn } from './useStore';

interface TaskEntry {
  task: ProjectTask;
  projectId: string | null;
  projectName: string | null;
}

interface Props {
  currentUser: AppUser;
  projects: Project[];
  standaloneTasks: ProjectTask[];
  priceList: PriceListItem[];
  allAssistants: AppUser[];
  calendarEvents: CalendarEvent[];
  retainerClients: RetainerClient[];
  onCheckInRetainer: (id: string) => void;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onToggleProjectTask: (pid: string, tid: string) => void;
  onToggleProjectSub: (pid: string, tid: string, sid: string) => void;
  onToggleStandaloneTask: (tid: string) => void;
  onToggleStandaloneSub: (tid: string, sid: string) => void;
  onAddCalendarEvent: (title: string, date: string, time?: string, description?: string, createdBy?: string) => void;
  onUpdateCalendarEvent: (id: string, changes: Partial<CalendarEvent>) => void;
  onDeleteCalendarEvent: (id: string) => void;
  postSchedules?: PostSchedule[];
  checkInReminders?: CheckInReminder[];
}

type Tab = 'tasks' | 'calendar' | 'prices' | 'retainer';

// ── My Task Card ────────────────────────────────────────────────────
function MyTaskCard({ entry, onToggle, onToggleSub }: {
  entry: TaskEntry;
  onToggle: () => void;
  onToggleSub: (sid: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { task, projectName } = entry;
  const doneCount = task.subTasks.filter(s => s.completed).length;

  return (
    <div className={`my-task-card ${task.completed ? 'done' : ''}`}>
      <div className="my-task-row">
        <button className={`task-check ${task.completed ? 'checked' : ''}`} onClick={onToggle}>
          {task.completed && <Check size={12} strokeWidth={3} />}
        </button>
        <div className="my-task-info">
          <span className="my-task-title">{task.title}</span>
          <span className="my-task-source">
            {projectName ? <><FolderKanban size={11} /> {projectName}</> : 'Individual task'}
          </span>
        </div>
        {task.subTasks.length > 0 && (
          <>
            <span className="sub-count">{doneCount}/{task.subTasks.length}</span>
            <button className="icon-btn xs" onClick={() => setOpen(p => !p)}>
              {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          </>
        )}
      </div>
      {open && task.subTasks.length > 0 && (
        <div className="subtask-list">
          {task.subTasks.map(s => (
            <div key={s.id} className={`subtask-row ${s.completed ? 'done' : ''}`}>
              <CornerDownRight size={13} className="subtask-arrow" />
              <button className={`task-check sm ${s.completed ? 'checked' : ''}`} onClick={() => onToggleSub(s.id)}>
                {s.completed && <Check size={10} strokeWidth={3} />}
              </button>
              <span className="subtask-title">{s.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Three-Day Widget ─────────────────────────────────────────────
const DOW_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as const;
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SCHED_COLOURS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

function ThreeDayWidget({
  postSchedules, reminders, retainerClients, onCheckIn,
}: {
  postSchedules: import('./types').PostSchedule[];
  reminders: import('./types').CheckInReminder[];
  retainerClients: import('./types').RetainerClient[];
  onCheckIn: (id: string) => void;
}) {
  const [doneReminders, setDoneReminders] = useState<Set<string>>(new Set());
  const [doneCheckins, setDoneCheckins] = useState<Set<string>>(new Set());

  const days = [0, 1, 2].map(offset => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  });

  const pendingCheckins = retainerClients.filter(c => {
    if (!c.lastCheckIn) return true;
    const last = new Date(c.lastCheckIn);
    const today = new Date();
    return last.toDateString() !== today.toDateString();
  });

  const hasAnything = days.some((d, i) => {
    const dow = DOW_NAMES[d.getDay()];
    const posts = postSchedules.filter(s => s.days.includes(dow as import('./types').DayOfWeek));
    const rems = reminders.filter(r => r.active && (r.schedule === 'daily' || r.schedule === dow));
    const checkins = i === 0 ? pendingCheckins : [];
    return posts.length > 0 || rems.length > 0 || checkins.length > 0;
  });

  if (!hasAnything) return null;

  return (
    <div className="three-day-widget">
      <div className="three-day-header">
        <CalendarDays size={15} />
        <span>Next 3 Days</span>
      </div>
      <div className="three-day-cols">
        {days.map((d, i) => {
          const dow = DOW_NAMES[d.getDay()];
          const dayPosts = postSchedules.filter(s => s.days.includes(dow as import('./types').DayOfWeek));
          const dayRems = reminders.filter(r => r.active && (r.schedule === 'daily' || r.schedule === dow));
          const dayCheckins = i === 0 ? pendingCheckins : [];
          const isEmpty = dayPosts.length === 0 && dayRems.length === 0 && dayCheckins.length === 0;

          return (
            <div key={i} className={`three-day-col ${i === 0 ? 'today' : ''}`}>
              <div className="three-day-col-head">
                <span className="three-day-label">{i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dow}</span>
                <span className="three-day-date">{d.getDate()} {MONTH_SHORT[d.getMonth()]}</span>
              </div>
              {isEmpty && <p className="three-day-empty">Nothing scheduled</p>}

              {dayCheckins.length > 0 && (
                <div className="three-day-section">
                  <span className="three-day-section-label">Check-ins</span>
                  {dayCheckins.map(c => (
                    <label key={c.id} className={`three-day-item checkin ${doneCheckins.has(c.id) ? 'done' : ''}`}>
                      <button
                        className={`tday-check ${doneCheckins.has(c.id) ? 'checked' : ''}`}
                        onClick={() => {
                          onCheckIn(c.id);
                          setDoneCheckins(s => new Set([...s, c.id]));
                        }}
                      >
                        {doneCheckins.has(c.id) && <Check size={10} strokeWidth={3} />}
                      </button>
                      <span className="three-day-item-text">{c.name}</span>
                    </label>
                  ))}
                </div>
              )}

              {dayRems.length > 0 && (
                <div className="three-day-section">
                  <span className="three-day-section-label">Reminders</span>
                  {dayRems.map(r => (
                    <label key={r.id} className={`three-day-item reminder ${doneReminders.has(r.id) ? 'done' : ''}`}>
                      <button
                        className={`tday-check ${doneReminders.has(r.id) ? 'checked' : ''}`}
                        onClick={() => setDoneReminders(s => {
                          const n = new Set(s);
                          n.has(r.id) ? n.delete(r.id) : n.add(r.id);
                          return n;
                        })}
                      >
                        {doneReminders.has(r.id) && <Check size={10} strokeWidth={3} />}
                      </button>
                      <div className="three-day-item-body">
                        <span className="three-day-item-text">{r.title}</span>
                        {r.message && <span className="three-day-item-sub">{r.message}</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {dayPosts.length > 0 && (
                <div className="three-day-section">
                  <span className="three-day-section-label">Scheduled Posts</span>
                  {dayPosts.map((s, si) => (
                    <div key={s.id} className="three-day-item post">
                      <span className="three-day-post-dot" style={{ background: SCHED_COLOURS[si % SCHED_COLOURS.length] }} />
                      <span className="three-day-item-text">{s.clientName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ASSISTANT VIEW
// ══════════════════════════════════════════════════════════════════
export default function AssistantView({
  currentUser, projects, standaloneTasks, priceList, allAssistants, calendarEvents,
  retainerClients, onCheckInRetainer, onLogout,
  theme, onToggleTheme,
  onToggleProjectTask, onToggleProjectSub, onToggleStandaloneTask, onToggleStandaloneSub,
  onAddCalendarEvent, onUpdateCalendarEvent, onDeleteCalendarEvent,
  postSchedules = [], checkInReminders = [],
}: Props) {
  const hasTasks    = currentUser.tasksAccess !== false;
  const hasPrices   = !!currentUser.pricesAccess;
  const hasCalendar = currentUser.calendarAccess !== false;
  const hasRetainer = !!currentUser.retainerAccess;
  const myPrices = hasPrices
    ? priceList.filter(i => i.visibleTo === 'all' || (i.visibleTo as string[]).includes(currentUser.id))
    : [];
  function isAssignedToMe(assignedTo: string | undefined) {
    return !assignedTo || assignedTo === 'all' || assignedTo === currentUser.id;
  }
  const pendingRetainers = hasRetainer
    ? retainerClients.filter(c => needsCheckIn(c) && isAssignedToMe(c.assignedTo))
    : [];
  const mySchedules = postSchedules.filter(s => isAssignedToMe(s.assignedTo));
  const myReminders = checkInReminders.filter(r => isAssignedToMe(r.assignedTo));

  const defaultTab: Tab = hasTasks ? 'tasks' : 'prices';
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  // ── My tasks across projects + standalone ──────────────────────
  const projectEntries: TaskEntry[] = projects.flatMap(p =>
    p.tasks.filter(t => t.assignedTo === currentUser.id)
      .map(t => ({ task: t, projectId: p.id, projectName: p.name }))
  );
  const standaloneEntries: TaskEntry[] = standaloneTasks
    .filter(t => t.assignedTo === currentUser.id)
    .map(t => ({ task: t, projectId: null, projectName: null }));

  const allEntries = [...projectEntries, ...standaloneEntries];
  const pending   = allEntries.filter(e => !e.task.completed);
  const completed = allEntries.filter(e => e.task.completed);

  function toggleTask(entry: TaskEntry) {
    if (entry.projectId) onToggleProjectTask(entry.projectId, entry.task.id);
    else onToggleStandaloneTask(entry.task.id);
  }
  function toggleSub(entry: TaskEntry, sid: string) {
    if (entry.projectId) onToggleProjectSub(entry.projectId, entry.task.id, sid);
    else onToggleStandaloneSub(entry.task.id, sid);
  }

  return (
    <div className="app assistant-app">
      <div className="bg-layer" aria-hidden="true">
        <div className="glow g1" /><div className="glow g2" /><div className="glow g3" />
        <div className="grid-overlay" />
      </div>

      <RetainerReminder clients={pendingRetainers} onCheckIn={onCheckInRetainer} />
      <CheckInReminderOverlay reminders={myReminders} />

      {/* Header */}
      <header className="app-header">
        <div className="header-logo-wrap">
          <img src="/logo-bg.png" alt="Digital Solutions SA" className="header-logo" />
        </div>
        <div className="header-title-block">
          <span className="header-eyebrow">Hi, {currentUser.displayName || currentUser.username}</span>
          <h1 className="header-title">Digital Solutions SA</h1>
        </div>
        <div className="header-right">
          <button className="icon-btn" onClick={onToggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
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
            {pending.length > 0 && <span className="tab-count">{pending.length}</span>}
          </button>
        )}
        {hasCalendar && (
          <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
            <Calendar size={15} /><span className="tab-label"> Calendar</span>
          </button>
        )}
        {hasPrices && (
          <button className={`tab-btn ${activeTab === 'prices' ? 'active' : ''}`} onClick={() => setActiveTab('prices')}>
            <Tag size={15} /><span className="tab-label"> Price List</span>
            {myPrices.length > 0 && <span className="tab-count">{myPrices.length}</span>}
          </button>
        )}
        {hasRetainer && (
          <button className={`tab-btn ${activeTab === 'retainer' ? 'active' : ''}`} onClick={() => setActiveTab('retainer')}>
            <Repeat size={15} /><span className="tab-label"> Retainer</span>
            {pendingRetainers.length > 0 && <span className="tab-count">{pendingRetainers.length}</span>}
          </button>
        )}
      </div>

      {/* ── TASKS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'tasks' && hasTasks && (
        <main className="assistant-board tasks-layout">
          {/* Left: 3-day widget */}
          <div className="tasks-left-col">
            <ThreeDayWidget
              postSchedules={mySchedules}
              reminders={myReminders}
              retainerClients={retainerClients.filter(c => isAssignedToMe(c.assignedTo))}
              onCheckIn={onCheckInRetainer}
            />
          </div>

          {/* Right: My Tasks list */}
          <div className="tasks-right-col">
            <div className="tasks-col-head">
              <ClipboardList size={15} />
              <span>My Tasks</span>
              {pending.length > 0 && <span className="tab-count">{pending.length}</span>}
            </div>
            {allEntries.length === 0 ? (
              <div className="assistant-empty" style={{ padding: '40px 16px' }}>
                <ClipboardList size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p className="assistant-empty-title">No tasks assigned yet</p>
                <p className="assistant-empty-sub">Your admin will assign tasks to you here.</p>
              </div>
            ) : (
              <div className="assistant-task-list">
                {pending.map(entry => (
                  <MyTaskCard key={entry.task.id} entry={entry}
                    onToggle={() => toggleTask(entry)} onToggleSub={sid => toggleSub(entry, sid)} />
                ))}
                {completed.length > 0 && (
                  <details className="done-section">
                    <summary><CheckCircle2 size={13} /> Completed ({completed.length})</summary>
                    {completed.map(entry => (
                      <MyTaskCard key={entry.task.id} entry={entry}
                        onToggle={() => toggleTask(entry)} onToggleSub={sid => toggleSub(entry, sid)} />
                    ))}
                  </details>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── CALENDAR TAB ──────────────────────────────────────────── */}
      {activeTab === 'calendar' && hasCalendar && (
        <main className="assistant-board">
          <CalendarPage
            events={calendarEvents}
            currentUser={currentUser}
            onAddEvent={onAddCalendarEvent}
            onUpdateEvent={onUpdateCalendarEvent}
            onDeleteEvent={onDeleteCalendarEvent}
            postSchedules={mySchedules}
            embedded
          />
        </main>
      )}

      {/* ── PRICE LIST TAB ────────────────────────────────────────── */}
      {activeTab === 'prices' && hasPrices && (
        <PricingPage
          items={myPrices}
          assistants={allAssistants}
          userId={currentUser.id}
          mode="assistant"
        />
      )}

      {/* ── RETAINER TAB ──────────────────────────────────────────── */}
      {activeTab === 'retainer' && hasRetainer && (
        <main className="assistant-board">
          <RetainerPage
            clients={retainerClients}
            mode="assistant"
            onCheckIn={onCheckInRetainer}
          />
        </main>
      )}
    </div>
  );
}
