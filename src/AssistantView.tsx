import { useState } from 'react';
import { LogOut, ClipboardList, Clock, CheckCircle2, Circle, Loader2, AlertTriangle } from 'lucide-react';
import { AppUser, Client, TaskStatus } from './types';
import { todayStr } from './useStore';

interface Props {
  currentUser: AppUser;
  clients: Client[];
  onUpdateStatus: (cid: string, tid: string, status: TaskStatus) => void;
  onLogout: () => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  'not-started': { label: 'Not Started', icon: <Circle size={13} />,     cls: 'not-started' },
  'in-progress':  { label: 'In Progress', icon: <Loader2 size={13} />,   cls: 'in-progress' },
  'completed':    { label: 'Completed',   icon: <CheckCircle2 size={13}/>,cls: 'completed'   },
};

type Filter = 'all' | TaskStatus;

export default function AssistantView({ currentUser, clients, onUpdateStatus, onLogout }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  // Flatten all tasks assigned to this user
  const allTasks = clients.flatMap(client =>
    client.tasks
      .filter(t => t.assignedTo === currentUser.id)
      .map(t => ({ task: t, clientName: client.name, clientColor: client.color, clientId: client.id }))
  ).sort((a, b) => {
    const order: Record<TaskStatus, number> = { 'not-started': 0, 'in-progress': 1, 'completed': 2 };
    const s = order[a.task.status] - order[b.task.status];
    return s !== 0 ? s : a.task.dueDate.localeCompare(b.task.dueDate);
  });

  const visible = filter === 'all' ? allTasks : allTasks.filter(x => x.task.status === filter);

  const counts = {
    all:           allTasks.length,
    'not-started': allTasks.filter(x => x.task.status === 'not-started').length,
    'in-progress': allTasks.filter(x => x.task.status === 'in-progress').length,
    'completed':   allTasks.filter(x => x.task.status === 'completed').length,
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
          <span className="header-eyebrow">Project Manager</span>
          <h1 className="header-title">Digital Solutions SA</h1>
        </div>
        <div className="header-right">
          <span className="assistant-greeting">Hi, {currentUser.displayName || currentUser.username}</span>
          <button className="btn-logout" onClick={onLogout} title="Logout">
            <LogOut size={14} />
            <span className="btn-logout-label">Logout</span>
          </button>
        </div>
      </header>

      {/* Task board */}
      <main className="assistant-board">
        <div className="section-head">
          <ClipboardList size={16} />
          My Tasks
          <span className="section-total">{counts.all} task{counts.all !== 1 ? 's' : ''}</span>
        </div>

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

        {/* Task list */}
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
            {visible.map(({ task, clientName, clientColor, clientId }) => {
              const today = todayStr();
              const isOverdue = task.status !== 'completed' && task.dueDate < today;
              const isDueToday = task.status !== 'completed' && task.dueDate === today;

              return (
                <div
                  key={task.id}
                  className={`assistant-task-card ${task.status}`}
                  style={{ borderLeftColor: clientColor }}
                >
                  {/* Client + due date */}
                  <div className="assistant-task-meta">
                    <span
                      className="assistant-task-client"
                      style={{
                        background: clientColor + '22',
                        color: clientColor,
                        border: `1px solid ${clientColor}44`,
                      }}
                    >
                      {clientName}
                    </span>
                    <span className={`assistant-task-date ${isOverdue ? 'overdue' : isDueToday ? 'today' : ''}`}>
                      {isOverdue && <AlertTriangle size={11} />}
                      {isDueToday && <Clock size={11} />}
                      {task.dueDate}
                    </span>
                  </div>

                  {/* Title */}
                  <p className="assistant-task-title">{task.title}</p>

                  {/* Status buttons */}
                  <div className="assistant-status-row">
                    {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => (
                      <button
                        key={s}
                        className={`status-btn ${s} ${task.status === s ? 'active' : ''}`}
                        onClick={() => onUpdateStatus(clientId, task.id, s)}
                      >
                        {STATUS_CONFIG[s].icon}
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
