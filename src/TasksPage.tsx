import { useState } from 'react';
import {
  Plus, Trash2, Check, X, Edit3, ChevronDown, ChevronRight,
  FolderKanban, ListTodo, Archive, ArchiveRestore, CornerDownRight, CalendarClock,
} from 'lucide-react';
import { Project, ProjectTask, AppUser } from './types';
import { todayStr } from './useStore';

// ══════════════════════════════════════════════════════════════════
// SUB-TASK ROW
// ══════════════════════════════════════════════════════════════════
function SubTaskRow({ title, completed, onToggle, onDelete }: {
  title: string; completed: boolean; onToggle: () => void; onDelete: () => void;
}) {
  return (
    <div className={`subtask-row ${completed ? 'done' : ''}`}>
      <CornerDownRight size={13} className="subtask-arrow" />
      <button className={`task-check sm ${completed ? 'checked' : ''}`} onClick={onToggle}>
        {completed && <Check size={10} strokeWidth={3} />}
      </button>
      <span className="subtask-title">{title}</span>
      <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={12} /></button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TASK ITEM (used for project tasks & standalone tasks)
// ══════════════════════════════════════════════════════════════════
function TaskItem({ task, assignableUsers, onToggle, onDelete, onEdit, onAssign,
  onAddSub, onToggleSub, onDeleteSub,
}: {
  task: ProjectTask;
  assignableUsers: AppUser[];
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (changes: { title?: string; dueDate?: string }) => void;
  onAssign: (userId: string | undefined) => void;
  onAddSub: (title: string) => void;
  onToggleSub: (sid: string) => void;
  onDeleteSub: (sid: string) => void;
}) {
  const [open, setOpen]           = useState(false);
  const [editing, setEditing]     = useState(false);
  const [editVal, setEditVal]     = useState(task.title);
  const [editingDue, setEditingDue] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const [subVal, setSubVal]       = useState('');

  const doneCount = task.subTasks.filter(s => s.completed).length;
  const saveEdit  = () => { if (editVal.trim()) { onEdit({ title: editVal.trim() }); setEditing(false); } else setEditVal(task.title); };
  const submitSub = () => { if (subVal.trim()) { onAddSub(subVal.trim()); setSubVal(''); setAddingSub(false); } };
  const assignedUser = assignableUsers.find(a => a.id === task.assignedTo);

  const today = todayStr();
  const isOverdue  = !!task.dueDate && task.dueDate < today && !task.completed;
  const isDueToday = !!task.dueDate && task.dueDate === today && !task.completed;

  return (
    <div className={`task-item ${task.completed ? 'done' : ''}`}>
      <div className="task-item-row">
        <button className={`task-check ${task.completed ? 'checked' : ''}`} onClick={onToggle}>
          {task.completed && <Check size={12} strokeWidth={3} />}
        </button>
        {editing ? (
          <input className="field-input flex1" value={editVal} onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveEdit()} onBlur={saveEdit} autoFocus />
        ) : (
          <span className="task-item-title" onDoubleClick={() => setEditing(true)}>{task.title}</span>
        )}
        {task.subTasks.length > 0 && <span className="sub-count">{doneCount}/{task.subTasks.length}</span>}
        {editingDue ? (
          <input className="field-input task-due-input" type="date" value={task.dueDate || ''}
            onChange={e => { onEdit({ dueDate: e.target.value || undefined }); }}
            onBlur={() => setEditingDue(false)} autoFocus />
        ) : task.dueDate ? (
          <button className={`task-due-badge ${isOverdue ? 'overdue' : isDueToday ? 'due-today' : ''}`}
            onClick={() => setEditingDue(true)} title="Edit due date">
            <CalendarClock size={12} />
            {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
          </button>
        ) : (
          <button className="icon-btn xs" title="Set due date" onClick={() => setEditingDue(true)}>
            <CalendarClock size={13} />
          </button>
        )}
        {assignableUsers.length > 0 && (
          <select className="task-assign-select" value={task.assignedTo || ''} onChange={e => onAssign(e.target.value || undefined)}>
            <option value="">Unassigned</option>
            {assignableUsers.map(a => <option key={a.id} value={a.id}>{a.displayName || a.username}</option>)}
          </select>
        )}
        {assignedUser && <span className="task-assigned-badge">{assignedUser.displayName || assignedUser.username}</span>}
        <button className="icon-btn xs" onClick={() => setOpen(p => !p)}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <button className="icon-btn xs" onClick={() => setEditing(p => !p)}><Edit3 size={13} /></button>
        <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={13} /></button>
      </div>
      {open && (
        <div className="subtask-list">
          {task.subTasks.map(s => (
            <SubTaskRow key={s.id} title={s.title} completed={s.completed}
              onToggle={() => onToggleSub(s.id)} onDelete={() => onDeleteSub(s.id)} />
          ))}
          {addingSub ? (
            <div className="subtask-add-row">
              <CornerDownRight size={13} className="subtask-arrow" />
              <input className="field-input flex1" placeholder="Sub-task..." value={subVal}
                onChange={e => setSubVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitSub()} autoFocus />
              <button className="icon-btn accent xs" onClick={submitSub}><Check size={13} /></button>
              <button className="icon-btn xs" onClick={() => setAddingSub(false)}><X size={13} /></button>
            </div>
          ) : (
            <button className="btn-add-sub" onClick={() => setAddingSub(true)}>
              <Plus size={12} /> Add sub-task
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ADD TASK FORM
// ══════════════════════════════════════════════════════════════════
function AddTaskForm({ assignableUsers, onAdd, placeholder = 'Add a task...' }: {
  assignableUsers: AppUser[];
  onAdd: (title: string, assignedTo?: string, dueDate?: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen]   = useState(false);
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const go = () => {
    if (title.trim()) {
      onAdd(title.trim(), assignedTo || undefined, dueDate || undefined);
      setTitle(''); setAssignedTo(''); setDueDate(''); setOpen(false);
    }
  };
  if (!open) return (
    <button className="btn-add-task" onClick={() => setOpen(true)}>
      <Plus size={14} /> {placeholder}
    </button>
  );
  return (
    <div className="add-task-form">
      <input className="field-input flex1" placeholder="Task title..." value={title}
        onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} autoFocus />
      <input className="field-input task-due-input" type="date" title="Due date (optional)" value={dueDate}
        onChange={e => setDueDate(e.target.value)} />
      {assignableUsers.length > 0 && (
        <select className="task-assign-select" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
          <option value="">Unassigned</option>
          {assignableUsers.map(a => <option key={a.id} value={a.id}>{a.displayName || a.username}</option>)}
        </select>
      )}
      <button className="icon-btn accent" onClick={go}><Check size={14} /></button>
      <button className="icon-btn" onClick={() => setOpen(false)}><X size={14} /></button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PROJECT CARD
// ══════════════════════════════════════════════════════════════════
function ProjectCard({ project, assignableUsers, onDelete, onUpdate, onArchive, onUnarchive,
  onAddTask, onToggleTask, onDeleteTask, onEditTask, onAssignTask,
  onAddSub, onToggleSub, onDeleteSub,
}: {
  project: Project;
  assignableUsers: AppUser[];
  onDelete: () => void;
  onUpdate: (changes: Partial<Project>) => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onAddTask: (title: string, assignedTo?: string, dueDate?: string) => void;
  onToggleTask: (tid: string) => void;
  onDeleteTask: (tid: string) => void;
  onEditTask: (tid: string, changes: { title?: string; dueDate?: string }) => void;
  onAssignTask: (tid: string, userId: string | undefined) => void;
  onAddSub: (tid: string, title: string) => void;
  onToggleSub: (tid: string, sid: string) => void;
  onDeleteSub: (tid: string, sid: string) => void;
}) {
  const [collapsed, setCollapsed]   = useState(false);
  const [editName, setEditName]     = useState(false);
  const [nameVal, setNameVal]       = useState(project.name);
  const [editDesc, setEditDesc]     = useState(false);
  const [descVal, setDescVal]       = useState(project.description || '');
  const [confirmDel, setConfirmDel] = useState(false);

  const done  = project.tasks.filter(t => t.completed).length;
  const total = project.tasks.length;
  const pending = project.tasks.filter(t => !t.completed);
  const completed = project.tasks.filter(t => t.completed);

  const saveName = () => { if (nameVal.trim()) onUpdate({ name: nameVal.trim() }); else setNameVal(project.name); setEditName(false); };
  const saveDesc = () => { onUpdate({ description: descVal.trim() }); setEditDesc(false); };

  return (
    <div className={`project-card ${project.archived ? 'archived' : ''}`}>
      <div className="project-header">
        <button className="icon-btn" onClick={() => setCollapsed(p => !p)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        <div className="project-title-block">
          {editName ? (
            <input className="field-input project-name-input" value={nameVal} onChange={e => setNameVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()} onBlur={saveName} autoFocus />
          ) : (
            <h3 className="project-name" onDoubleClick={() => setEditName(true)}>{project.name}</h3>
          )}
          {editDesc ? (
            <input className="field-input project-desc-input" placeholder="Description..." value={descVal}
              onChange={e => setDescVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveDesc()} onBlur={saveDesc} autoFocus />
          ) : (
            <p className="project-desc" onDoubleClick={() => setEditDesc(true)}>
              {project.description || <span className="muted">Add a description…</span>}
            </p>
          )}
        </div>
        <div className="project-header-actions">
          {total > 0 && <span className="project-count">{done}/{total}</span>}
          {project.archived ? (
            <button className="icon-btn" title="Restore project" onClick={onUnarchive}><ArchiveRestore size={15} /></button>
          ) : (
            <button className="icon-btn" title="Archive project" onClick={onArchive}><Archive size={15} /></button>
          )}
          {confirmDel ? (
            <span className="inline-confirm">
              <button className="btn-danger sm" onClick={onDelete}>Delete</button>
              <button className="btn-ghost sm" onClick={() => setConfirmDel(false)}>Cancel</button>
            </span>
          ) : (
            <button className="icon-btn red-h" title="Delete project" onClick={() => setConfirmDel(true)}><Trash2 size={15} /></button>
          )}
        </div>
      </div>
      {!collapsed && (
        <div className="project-body">
          {total === 0 && <p className="empty-msg">No tasks yet — add one below</p>}
          {pending.map(t => (
            <TaskItem key={t.id} task={t} assignableUsers={assignableUsers}
              onToggle={() => onToggleTask(t.id)} onDelete={() => onDeleteTask(t.id)}
              onEdit={changes => onEditTask(t.id, changes)} onAssign={uid => onAssignTask(t.id, uid)}
              onAddSub={title => onAddSub(t.id, title)} onToggleSub={sid => onToggleSub(t.id, sid)}
              onDeleteSub={sid => onDeleteSub(t.id, sid)} />
          ))}
          {completed.length > 0 && (
            <details className="done-section">
              <summary>Completed ({completed.length})</summary>
              {completed.map(t => (
                <TaskItem key={t.id} task={t} assignableUsers={assignableUsers}
                  onToggle={() => onToggleTask(t.id)} onDelete={() => onDeleteTask(t.id)}
                  onEdit={changes => onEditTask(t.id, changes)} onAssign={uid => onAssignTask(t.id, uid)}
                  onAddSub={title => onAddSub(t.id, title)} onToggleSub={sid => onToggleSub(t.id, sid)}
                  onDeleteSub={sid => onDeleteSub(t.id, sid)} />
              ))}
            </details>
          )}
          <AddTaskForm assignableUsers={assignableUsers} onAdd={onAddTask} placeholder="Add task" />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TASKS PAGE
// ══════════════════════════════════════════════════════════════════
export default function TasksPage({
  projects, standaloneTasks, assignableUsers,
  onAddProject, onDeleteProject, onUpdateProject, onArchiveProject, onUnarchiveProject,
  onAddProjectTask, onToggleProjectTask, onDeleteProjectTask, onEditProjectTask, onAssignProjectTask,
  onAddProjectSub, onToggleProjectSub, onDeleteProjectSub,
  onAddStandaloneTask, onToggleStandaloneTask, onDeleteStandaloneTask, onEditStandaloneTask, onAssignStandaloneTask,
  onAddStandaloneSub, onToggleStandaloneSub, onDeleteStandaloneSub,
}: {
  projects: Project[];
  standaloneTasks: ProjectTask[];
  assignableUsers: AppUser[];
  onAddProject: (name: string, description?: string) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProject: (id: string, changes: Partial<Project>) => void;
  onArchiveProject: (id: string) => void;
  onUnarchiveProject: (id: string) => void;
  onAddProjectTask: (pid: string, title: string, assignedTo?: string, dueDate?: string) => void;
  onToggleProjectTask: (pid: string, tid: string) => void;
  onDeleteProjectTask: (pid: string, tid: string) => void;
  onEditProjectTask: (pid: string, tid: string, changes: { title?: string; dueDate?: string }) => void;
  onAssignProjectTask: (pid: string, tid: string, userId: string | undefined) => void;
  onAddProjectSub: (pid: string, tid: string, title: string) => void;
  onToggleProjectSub: (pid: string, tid: string, sid: string) => void;
  onDeleteProjectSub: (pid: string, tid: string, sid: string) => void;
  onAddStandaloneTask: (title: string, assignedTo?: string, dueDate?: string) => void;
  onToggleStandaloneTask: (tid: string) => void;
  onDeleteStandaloneTask: (tid: string) => void;
  onEditStandaloneTask: (tid: string, changes: { title?: string; dueDate?: string }) => void;
  onAssignStandaloneTask: (tid: string, userId: string | undefined) => void;
  onAddStandaloneSub: (tid: string, title: string) => void;
  onToggleStandaloneSub: (tid: string, sid: string) => void;
  onDeleteStandaloneSub: (tid: string, sid: string) => void;
}) {
  const [showAddProject, setShowAddProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const active   = projects.filter(p => !p.archived);
  const archived = projects.filter(p => p.archived);

  const standalonePending   = standaloneTasks.filter(t => !t.completed);
  const standaloneCompleted = standaloneTasks.filter(t => t.completed);

  const totalTasks = projects.reduce((s, p) => s + p.tasks.length, 0) + standaloneTasks.length;
  const doneTasks  = projects.reduce((s, p) => s + p.tasks.filter(t => t.completed).length, 0)
    + standaloneTasks.filter(t => t.completed).length;

  const submitProject = () => {
    if (newName.trim()) { onAddProject(newName.trim(), newDesc.trim()); setNewName(''); setNewDesc(''); setShowAddProject(false); }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Tasks</h1>
        <span className="page-subtitle">{active.length} project{active.length !== 1 ? 's' : ''} · {doneTasks}/{totalTasks} tasks complete</span>
      </div>

      <main className="tasks-page">
        {/* ── Projects ───────────────────────────────────────────── */}
        <section className="tasks-section">
          <div className="tasks-section-head">
            <FolderKanban size={16} className="section-icon" />
            <span>Projects</span>
            <button className="icon-btn accent" style={{ marginLeft: 'auto' }} onClick={() => setShowAddProject(p => !p)}>
              {showAddProject ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {showAddProject && (
            <div className="add-project-form">
              <input className="field-input" placeholder="Project name..." value={newName}
                onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitProject()} autoFocus />
              <input className="field-input" placeholder="Description (optional)..." value={newDesc}
                onChange={e => setNewDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitProject()} />
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setShowAddProject(false)}>Cancel</button>
                <button className="btn-primary" onClick={submitProject} disabled={!newName.trim()}>
                  <Check size={14} /> Create Project
                </button>
              </div>
            </div>
          )}

          {active.length === 0 && !showAddProject && (
            <div className="empty-state">
              <FolderKanban size={36} />
              <p className="assistant-empty-title">No projects yet</p>
              <p className="assistant-empty-sub">Create a project to organise tasks into groups with sub-tasks.</p>
            </div>
          )}

          <div className="project-list">
            {active.map(p => (
              <ProjectCard key={p.id} project={p} assignableUsers={assignableUsers}
                onDelete={() => onDeleteProject(p.id)}
                onUpdate={changes => onUpdateProject(p.id, changes)}
                onArchive={() => onArchiveProject(p.id)} onUnarchive={() => onUnarchiveProject(p.id)}
                onAddTask={(title, uid, due) => onAddProjectTask(p.id, title, uid, due)}
                onToggleTask={tid => onToggleProjectTask(p.id, tid)}
                onDeleteTask={tid => onDeleteProjectTask(p.id, tid)}
                onEditTask={(tid, changes) => onEditProjectTask(p.id, tid, changes)}
                onAssignTask={(tid, uid) => onAssignProjectTask(p.id, tid, uid)}
                onAddSub={(tid, title) => onAddProjectSub(p.id, tid, title)}
                onToggleSub={(tid, sid) => onToggleProjectSub(p.id, tid, sid)}
                onDeleteSub={(tid, sid) => onDeleteProjectSub(p.id, tid, sid)} />
            ))}
          </div>

          {archived.length > 0 && (
            <details className="completed-dev-section" open={showArchived} onToggle={e => setShowArchived((e.target as HTMLDetailsElement).open)}>
              <summary>Archived Projects ({archived.length})</summary>
              <div className="project-list" style={{ marginTop: 12 }}>
                {archived.map(p => (
                  <ProjectCard key={p.id} project={p} assignableUsers={assignableUsers}
                    onDelete={() => onDeleteProject(p.id)}
                    onUpdate={changes => onUpdateProject(p.id, changes)}
                    onArchive={() => onArchiveProject(p.id)} onUnarchive={() => onUnarchiveProject(p.id)}
                    onAddTask={(title, uid, due) => onAddProjectTask(p.id, title, uid, due)}
                    onToggleTask={tid => onToggleProjectTask(p.id, tid)}
                    onDeleteTask={tid => onDeleteProjectTask(p.id, tid)}
                    onEditTask={(tid, changes) => onEditProjectTask(p.id, tid, changes)}
                    onAssignTask={(tid, uid) => onAssignProjectTask(p.id, tid, uid)}
                    onAddSub={(tid, title) => onAddProjectSub(p.id, tid, title)}
                    onToggleSub={(tid, sid) => onToggleProjectSub(p.id, tid, sid)}
                    onDeleteSub={(tid, sid) => onDeleteProjectSub(p.id, tid, sid)} />
                ))}
              </div>
            </details>
          )}
        </section>

        {/* ── Standalone Tasks ──────────────────────────────────────── */}
        <section className="tasks-section">
          <div className="tasks-section-head">
            <ListTodo size={16} className="section-icon" />
            <span>Individual Tasks</span>
            <span className="section-total-of">{standaloneCompleted.length}/{standaloneTasks.length}</span>
          </div>
          <div className="project-card standalone-card">
            <div className="project-body">
              {standaloneTasks.length === 0 && <p className="empty-msg">No individual tasks yet — add one below</p>}
              {standalonePending.map(t => (
                <TaskItem key={t.id} task={t} assignableUsers={assignableUsers}
                  onToggle={() => onToggleStandaloneTask(t.id)} onDelete={() => onDeleteStandaloneTask(t.id)}
                  onEdit={changes => onEditStandaloneTask(t.id, changes)} onAssign={uid => onAssignStandaloneTask(t.id, uid)}
                  onAddSub={title => onAddStandaloneSub(t.id, title)} onToggleSub={sid => onToggleStandaloneSub(t.id, sid)}
                  onDeleteSub={sid => onDeleteStandaloneSub(t.id, sid)} />
              ))}
              {standaloneCompleted.length > 0 && (
                <details className="done-section">
                  <summary>Completed ({standaloneCompleted.length})</summary>
                  {standaloneCompleted.map(t => (
                    <TaskItem key={t.id} task={t} assignableUsers={assignableUsers}
                      onToggle={() => onToggleStandaloneTask(t.id)} onDelete={() => onDeleteStandaloneTask(t.id)}
                      onEdit={changes => onEditStandaloneTask(t.id, changes)} onAssign={uid => onAssignStandaloneTask(t.id, uid)}
                      onAddSub={title => onAddStandaloneSub(t.id, title)} onToggleSub={sid => onToggleStandaloneSub(t.id, sid)}
                      onDeleteSub={sid => onDeleteStandaloneSub(t.id, sid)} />
                  ))}
                </details>
              )}
              <AddTaskForm assignableUsers={assignableUsers} onAdd={onAddStandaloneTask} placeholder="Add task" />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
