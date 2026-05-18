import { Client, OddTask, AppUser } from './types';
import { todayStr } from './useStore';

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
}

function computeStats(tasks: { status: string; dueDate: string }[]): TaskStats {
  const today = todayStr();
  return {
    total:      tasks.length,
    completed:  tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    notStarted: tasks.filter(t => t.status === 'not-started').length,
    overdue:    tasks.filter(t => t.status !== 'completed' && t.dueDate < today).length,
  };
}

// ── Single arc ring ────────────────────────────────────────────────
function Arc({ pct, color, r, sw }: { pct: number; color: string; r: number; sw: number }) {
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, Math.max(0, pct / 100)));
  return (
    <g>
      <circle cx={0} cy={0} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
      <circle cx={0} cy={0} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </g>
  );
}

// ── Ring + side legend card ────────────────────────────────────────
function RingCard({ stats, title }: { stats: TaskStats; title: string }) {
  const size = 120;
  const cx   = size / 2;
  const sw   = 11;
  const gap  = 4;
  const r1   = cx - sw / 2 - 2;
  const r2   = r1 - sw - gap;
  const r3   = r2 - sw - gap;

  const completionPct = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const inProgressPct = stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0;
  const openTasks     = stats.total - stats.completed;
  const onTimePct     = openTasks > 0 ? ((openTasks - stats.overdue) / openTasks) * 100 : 100;

  const rows = [
    { label: 'Completed',   color: '#10b981', pct: completionPct, count: stats.completed },
    { label: 'In Progress', color: '#6366f1', pct: inProgressPct, count: stats.inProgress },
    { label: 'On Track',    color: '#f59e0b', pct: onTimePct,     count: openTasks - stats.overdue },
  ];

  return (
    <div className="wd-ring-card">
      <div className="wd-ring-title">{title}</div>

      {stats.total === 0 ? (
        <div className="wd-no-tasks">No tasks assigned</div>
      ) : (
        <div className="wd-ring-inner">
          {/* SVG rings */}
          <div className="wd-svg-wrap">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <g transform={`translate(${cx},${cx})`}>
                <Arc pct={completionPct} color="#10b981" r={r1} sw={sw} />
                <Arc pct={inProgressPct} color="#6366f1" r={r2} sw={sw} />
                <Arc pct={onTimePct}     color="#f59e0b" r={r3} sw={sw} />
              </g>
              <text x={cx} y={cx - 5}  textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text)">
                {Math.round(completionPct)}%
              </text>
              <text x={cx} y={cx + 13} textAnchor="middle" fontSize="10" fill="var(--text3)">done</text>
            </svg>
          </div>

          {/* Side stats */}
          <div className="wd-ring-stats">
            <div className="wd-ring-total">
              <span className="wdr-total-num">{stats.total}</span>
              <span className="wdr-total-lbl">total tasks</span>
            </div>
            {rows.map(row => (
              <div key={row.label} className="wd-ring-stat-row">
                <span className="wdr-dot" style={{ background: row.color }} />
                <span className="wdr-label">{row.label}</span>
                <div className="wdr-bar-wrap">
                  <div className="wdr-bar">
                    <div className="wdr-bar-fill" style={{ width: `${row.pct}%`, background: row.color }} />
                  </div>
                </div>
                <span className="wdr-pct" style={{ color: row.color }}>{Math.round(row.pct)}%</span>
                <span className="wdr-count">({row.count})</span>
              </div>
            ))}
            {stats.overdue > 0 && (
              <div className="wd-ring-stat-row overdue-row">
                <span className="wdr-dot" style={{ background: '#ef4444' }} />
                <span className="wdr-label">Overdue</span>
                <div className="wdr-bar-wrap">
                  <div className="wdr-bar">
                    <div className="wdr-bar-fill" style={{ width: `${(stats.overdue / stats.total) * 100}%`, background: '#ef4444' }} />
                  </div>
                </div>
                <span className="wdr-pct" style={{ color: '#ef4444' }}>{Math.round((stats.overdue / stats.total) * 100)}%</span>
                <span className="wdr-count">({stats.overdue})</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────
export default function WorkloadDashboard({ clients, oddTasks, users }: {
  clients: Client[];
  oddTasks: OddTask[];
  users: AppUser[];
}) {
  const allTasks     = [...clients.flatMap(c => c.tasks), ...oddTasks];
  const companyStats = computeStats(allTasks);
  const assistants   = users.filter(u => u.role === 'assistant');
  const adminStats   = computeStats(allTasks.filter(t => !t.assignedTo));

  return (
    <div className="workload-dashboard">
      <div className="wd-section-title">Workload &amp; Efficiency</div>

      <div className="wd-rings-row">
        <RingCard stats={companyStats} title="Company Overall" />
        <RingCard stats={adminStats}   title="My Tasks (Admin)" />
        {assistants.map(u => (
          <RingCard key={u.id}
            stats={computeStats(allTasks.filter(t => t.assignedTo === u.id))}
            title={u.displayName || u.username} />
        ))}
      </div>

      {/* Per-client breakdown */}
      {clients.length > 0 && (
        <div className="wd-client-breakdown">
          <div className="wd-section-subtitle">Client Task Breakdown</div>
          <div className="wd-client-grid">
            {clients.map(c => {
              const s = computeStats(c.tasks);
              const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
              const inProgPct = s.total > 0 ? Math.round((s.inProgress / s.total) * 100) : 0;
              return (
                <div key={c.id} className="wd-client-row">
                  <span className="wd-client-icon" style={{ background: c.color }}>{c.icon}</span>
                  <span className="wd-client-name">{c.name}</span>
                  <div className="wd-client-bars">
                    <div className="wd-client-bar-row">
                      <span className="wd-client-bar-lbl">Done</span>
                      <div className="wd-mini-bar">
                        <div className="wd-mini-bar-done" style={{ width: `${pct}%`, background: c.color }} />
                      </div>
                      <span className="wd-mini-pct">{pct}%</span>
                    </div>
                    <div className="wd-client-bar-row">
                      <span className="wd-client-bar-lbl">Active</span>
                      <div className="wd-mini-bar">
                        <div className="wd-mini-bar-done" style={{ width: `${inProgPct}%`, background: '#6366f1' }} />
                      </div>
                      <span className="wd-mini-pct">{inProgPct}%</span>
                    </div>
                  </div>
                  <span className="wd-client-counts">
                    {s.completed}/{s.total}
                    {s.overdue > 0 && <span className="wd-overdue-flag"> ⚠{s.overdue}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
