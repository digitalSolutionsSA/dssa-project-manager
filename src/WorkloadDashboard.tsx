import { Client, OddTask, AppUser, Task } from './types';
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

// ── SVG Ring component ─────────────────────────────────────────────
function Ring({ pct, color, radius, strokeWidth, children }: {
  pct: number; color: string; radius: number; strokeWidth: number;
  children?: React.ReactNode;
}) {
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, pct / 100)));

  return (
    <g>
      {/* Track */}
      <circle
        cx={0} cy={0} r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={strokeWidth}
      />
      {/* Fill */}
      <circle
        cx={0} cy={0} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      {children}
    </g>
  );
}

// ── Three-ring health chart (like Apple Watch) ─────────────────────
function RingChart({ stats, label, size = 140 }: { stats: TaskStats; label: string; size?: number }) {
  const cx = size / 2;
  const sw = size * 0.095;       // stroke width ~9.5% of size
  const gap = sw * 0.35;
  const r1 = cx - sw / 2 - 2;                 // outermost: completion
  const r2 = r1 - sw - gap;                    // middle: in-progress
  const r3 = r2 - sw - gap;                    // inner: on-time (non-overdue open)

  const completionPct = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const inProgressPct = stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0;
  // On-time = open tasks that are not overdue / total open tasks
  const openTasks = stats.total - stats.completed;
  const onTimePct = openTasks > 0 ? ((openTasks - stats.overdue) / openTasks) * 100 : 100;

  return (
    <div className="ring-chart-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${cx},${cx})`}>
          <Ring pct={completionPct} color="#10b981" radius={r1} strokeWidth={sw} />
          <Ring pct={inProgressPct} color="#6366f1" radius={r2} strokeWidth={sw} />
          <Ring pct={onTimePct}     color="#f59e0b" radius={r3} strokeWidth={sw} />
        </g>
        {/* Center text */}
        <text x={cx} y={cx - 6} textAnchor="middle" className="ring-pct-text" fontSize={size * 0.16} fontWeight="700" fill="var(--text)">
          {Math.round(completionPct)}%
        </text>
        <text x={cx} y={cx + size * 0.13} textAnchor="middle" fontSize={size * 0.09} fill="var(--text3)">
          done
        </text>
      </svg>
      <p className="ring-chart-label">{label}</p>
      <div className="ring-legend">
        <span className="ring-leg-item"><span className="ring-leg-dot" style={{ background: '#10b981' }} />Completed</span>
        <span className="ring-leg-item"><span className="ring-leg-dot" style={{ background: '#6366f1' }} />In Progress</span>
        <span className="ring-leg-item"><span className="ring-leg-dot" style={{ background: '#f59e0b' }} />On Track</span>
      </div>
    </div>
  );
}

// ── Stat pills under each ring ─────────────────────────────────────
function StatPills({ stats }: { stats: TaskStats }) {
  return (
    <div className="ring-stat-pills">
      <div className="ring-stat-pill total">
        <span className="rsp-val">{stats.total}</span>
        <span className="rsp-lbl">Total</span>
      </div>
      <div className="ring-stat-pill completed">
        <span className="rsp-val">{stats.completed}</span>
        <span className="rsp-lbl">Done</span>
      </div>
      <div className="ring-stat-pill in-progress">
        <span className="rsp-val">{stats.inProgress}</span>
        <span className="rsp-lbl">Active</span>
      </div>
      {stats.overdue > 0 && (
        <div className="ring-stat-pill overdue">
          <span className="rsp-val">{stats.overdue}</span>
          <span className="rsp-lbl">Overdue</span>
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
  const allClientTasks = clients.flatMap(c => c.tasks);
  const allTasks       = [...allClientTasks, ...oddTasks];

  const companyStats = computeStats(allTasks);
  const assistants   = users.filter(u => u.role === 'assistant');

  // Per-assistant stats
  const assistantStats = assistants.map(u => {
    const tasks = allTasks.filter(t => t.assignedTo === u.id);
    return { user: u, stats: computeStats(tasks) };
  });

  // Admin own tasks (no assignedTo = admin)
  const adminTasks = allTasks.filter(t => !t.assignedTo);
  const adminStats = computeStats(adminTasks);

  return (
    <div className="workload-dashboard">
      <div className="wd-section-title">Workload & Efficiency</div>

      {/* Legend explanation */}
      <div className="wd-legend-bar">
        <span className="wd-legend-item"><span className="wd-legend-dot green" />Completion Rate</span>
        <span className="wd-legend-item"><span className="wd-legend-dot purple" />In-Progress Rate</span>
        <span className="wd-legend-item"><span className="wd-legend-dot amber" />On-Track (open, not overdue)</span>
      </div>

      <div className="wd-rings-row">
        {/* Company overall */}
        <div className="wd-ring-card">
          <div className="wd-ring-title">Company Overall</div>
          <RingChart stats={companyStats} label="" size={150} />
          <StatPills stats={companyStats} />
        </div>

        {/* Admin own workload */}
        <div className="wd-ring-card">
          <div className="wd-ring-title">My Tasks (Admin)</div>
          <RingChart stats={adminStats} label="" size={130} />
          <StatPills stats={adminStats} />
        </div>

        {/* Per assistant */}
        {assistantStats.map(({ user, stats }) => (
          <div key={user.id} className="wd-ring-card">
            <div className="wd-ring-title">{user.displayName || user.username}</div>
            {stats.total === 0 ? (
              <div className="wd-no-tasks">No tasks assigned</div>
            ) : (
              <>
                <RingChart stats={stats} label="" size={130} />
                <StatPills stats={stats} />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Per-client breakdown */}
      {clients.length > 0 && (
        <div className="wd-client-breakdown">
          <div className="wd-section-subtitle">Client Task Breakdown</div>
          <div className="wd-client-grid">
            {clients.map(c => {
              const s = computeStats(c.tasks);
              const completionPct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
              return (
                <div key={c.id} className="wd-client-row">
                  <span className="wd-client-icon" style={{ background: c.color }}>{c.icon}</span>
                  <span className="wd-client-name">{c.name}</span>
                  <div className="wd-mini-bar-wrap">
                    <div className="wd-mini-bar">
                      <div className="wd-mini-bar-done" style={{ width: `${completionPct}%`, background: c.color }} />
                    </div>
                    <span className="wd-mini-pct">{completionPct}%</span>
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
