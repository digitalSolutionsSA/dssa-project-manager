import { useState } from 'react';
import {
  LogOut, ClipboardList, Tag, Check, ChevronDown, ChevronRight,
  CornerDownRight, CheckCircle2, Sun, Moon, FolderKanban, Calendar,
} from 'lucide-react';
import { AppUser, Project, ProjectTask, PriceListItem, CalendarEvent, ThemeMode } from './types';
import PricingPage from './PricingPage';
import CalendarPage from './CalendarPage';

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
}

type Tab = 'tasks' | 'calendar' | 'prices';

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

// ══════════════════════════════════════════════════════════════════
// ASSISTANT VIEW
// ══════════════════════════════════════════════════════════════════
export default function AssistantView({
  currentUser, projects, standaloneTasks, priceList, allAssistants, calendarEvents, onLogout,
  theme, onToggleTheme,
  onToggleProjectTask, onToggleProjectSub, onToggleStandaloneTask, onToggleStandaloneSub,
  onAddCalendarEvent, onUpdateCalendarEvent, onDeleteCalendarEvent,
}: Props) {
  const hasTasks    = currentUser.tasksAccess !== false;
  const hasPrices   = !!currentUser.pricesAccess;
  const hasCalendar = currentUser.calendarAccess !== false;
  const myPrices = hasPrices
    ? priceList.filter(i => i.visibleTo === 'all' || (i.visibleTo as string[]).includes(currentUser.id))
    : [];

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
      </div>

      {/* ── TASKS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'tasks' && hasTasks && (
        <main className="assistant-board">
          {allEntries.length === 0 ? (
            <div className="assistant-empty">
              <ClipboardList size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
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
    </div>
  );
}
