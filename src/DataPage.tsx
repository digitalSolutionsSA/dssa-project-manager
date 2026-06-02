import { Client, OddTask, AppUser, DevProject } from './types';
import { todayStr } from './useStore';
import WorkloadDashboard from './WorkloadDashboard';

interface Props {
  clients: Client[];
  oddTasks: OddTask[];
  users: AppUser[];
  devProjects: DevProject[];
}

function statPct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function MiniStatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="data-stat-card">
      <div className="data-stat-label">{label}</div>
      <div className="data-stat-value" style={{ color: color || 'var(--text)' }}>{value}</div>
      {sub && <div className="data-stat-sub">{sub}</div>}
    </div>
  );
}

export default function DataPage({ clients, oddTasks, users, devProjects }: Props) {
  const today = todayStr();

  // All tasks across retainer clients
  const allClientTasks = clients.flatMap(c => c.tasks);
  const allOdd         = oddTasks;

  const totalRetainer   = allClientTasks.length;
  const doneRetainer    = allClientTasks.filter(t => t.status === 'completed').length;
  const inProgRetainer  = allClientTasks.filter(t => t.status === 'in-progress').length;
  const overdueRetainer = allClientTasks.filter(t => t.status !== 'completed' && t.dueDate < today).length;
  const delayedRetainer = allClientTasks.filter(t => t.status === 'delayed').length;

  const totalOdd    = allOdd.length;
  const doneOdd     = allOdd.filter(t => t.status === 'completed').length;
  const overdueOdd  = allOdd.filter(t => t.status !== 'completed' && t.dueDate < today).length;
  const delayedOdd  = allOdd.filter(t => t.status === 'delayed').length;

  const activeProjects    = devProjects.filter(p => p.status === 'active');
  const completedProjects = devProjects.filter(p => p.status === 'completed');

  // Per-user stats
  const assistants = users.filter(u => u.role === 'assistant');

  const efficiencyScore = (() => {
    const total = totalRetainer + totalOdd;
    const done  = doneRetainer + doneOdd;
    const over  = overdueRetainer + overdueOdd;
    if (total === 0) return 100;
    const completionRate = (done / total) * 100;
    const overdueRate    = (over / (total - done || 1)) * 100;
    return Math.max(0, Math.round(completionRate - overdueRate * 0.3));
  })();

  return (
    <div className="data-page">
      <h2 className="data-page-title">Analytics & Efficiency</h2>

      {/* Overall stats */}
      <div className="data-stats-grid">
        <MiniStatCard label="Efficiency Score" value={`${efficiencyScore}%`}
          color={efficiencyScore >= 80 ? 'var(--green)' : efficiencyScore >= 60 ? 'var(--amber)' : 'var(--red)'}
          sub="Completion rate adjusted for overdue" />
        <MiniStatCard label="Retainer Tasks" value={`${doneRetainer}/${totalRetainer}`}
          sub={`${statPct(doneRetainer,totalRetainer)}% complete`} color="var(--accent)" />
        <MiniStatCard label="Once-Off Tasks" value={`${doneOdd}/${totalOdd}`}
          sub={`${statPct(doneOdd,totalOdd)}% complete`} color="var(--violet)" />
        <MiniStatCard label="Overdue" value={overdueRetainer + overdueOdd}
          color={overdueRetainer + overdueOdd > 0 ? 'var(--red)' : 'var(--green)'}
          sub="Tasks past due date" />
        <MiniStatCard label="Delayed" value={delayedRetainer + delayedOdd}
          color={delayedRetainer + delayedOdd > 0 ? 'var(--amber)' : 'var(--green)'}
          sub="Tasks marked delayed" />
        <MiniStatCard label="Active Projects" value={activeProjects.length}
          sub={`${completedProjects.length} completed`} color="var(--cyan)" />
      </div>

      {/* Workload rings */}
      <div className="data-section-title">Workload by User</div>
      <WorkloadDashboard clients={clients} oddTasks={oddTasks} users={users} />

      {/* Per-user breakdown */}
      {assistants.length > 0 && (
        <>
          <div className="data-section-title">Assistant Performance</div>
          <div className="data-user-grid">
            {assistants.map(user => {
              const assigned = allClientTasks.filter(t => t.assignedTo === user.id);
              const oddAssigned = allOdd.filter(t => t.assignedTo === user.id);
              const all      = [...assigned, ...oddAssigned];
              const done     = all.filter(t => t.status === 'completed').length;
              const overdue  = all.filter(t => t.status !== 'completed' && t.dueDate < today).length;
              const pct      = statPct(done, all.length);
              return (
                <div key={user.id} className="data-user-card">
                  <div className="data-user-avatar">{(user.displayName || user.username).charAt(0).toUpperCase()}</div>
                  <div className="data-user-info">
                    <div className="data-user-name">{user.displayName || user.username}</div>
                    <div className="data-user-stats">
                      <span className="data-user-stat completed">{done} done</span>
                      <span className="data-user-stat total">{all.length} total</span>
                      {overdue > 0 && <span className="data-user-stat overdue">{overdue} overdue</span>}
                    </div>
                    <div className="data-user-bar">
                      <div className="data-user-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="data-user-pct">{pct}% completion</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Client efficiency */}
      <div className="data-section-title">Client Task Breakdown</div>
      <div className="data-client-table">
        <div className="data-table-head">
          <span>Client</span>
          <span>Total</span>
          <span>Done</span>
          <span>In Progress</span>
          <span>Overdue</span>
          <span>Rate</span>
        </div>
        {clients.map(c => {
          const tasks = c.tasks;
          const done  = tasks.filter(t=>t.status==='completed').length;
          const inp   = tasks.filter(t=>t.status==='in-progress').length;
          const over  = tasks.filter(t=>t.status!=='completed'&&t.dueDate<today).length;
          return (
            <div key={c.id} className="data-table-row" style={{ borderLeftColor: c.color }}>
              <span className="data-client-name"><span>{c.icon}</span> {c.name}</span>
              <span>{tasks.length}</span>
              <span style={{color:'var(--green)'}}>{done}</span>
              <span style={{color:'var(--violet)'}}>{inp}</span>
              <span style={{color:over>0?'var(--red)':'var(--text3)'}}>{over}</span>
              <span style={{color:statPct(done,tasks.length)>=80?'var(--green)':'var(--amber)'}}>
                {statPct(done,tasks.length)}%
              </span>
            </div>
          );
        })}
        {clients.length === 0 && <p className="empty-msg">No retainer clients.</p>}
      </div>
    </div>
  );
}
