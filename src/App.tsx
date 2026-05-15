import { useState, useRef, useEffect } from 'react';
import {
  Plus, Trash2, Check, AlertTriangle, X, Edit3,
  DollarSign, ChevronDown, ChevronUp, Zap, Clock,
  Calendar, Palette, Code2, Receipt, ChevronRight,
  CircleCheck, RefreshCw, ChevronLeft, Wallet, Wifi, WifiOff, BookOpen, History,
  LogOut, Users,
} from 'lucide-react';
import { useStore, PRESET_COLORS, PRESET_ICONS, EVENT_COLORS, COST_CATEGORIES, todayStr } from './useStore';
import { useAuth } from './useAuth';
import { Client, Task, AppUser, CalendarEvent, CostItem, DevProject, DevTask } from './types';
import PersonalBudget from './PersonalBudget';
import OnceOffCosts from './OnceOffCosts';
import MonthlyHistory from './MonthlyHistory';
import MeetingNotes from './MeetingNotes';
import LoginScreen from './LoginScreen';
import AssistantView from './AssistantView';
import UserManagement from './UserManagement';

// ── helpers ────────────────────────────────────────────────────────────────
function addDays(base: Date, n: number) { const d = new Date(base); d.setDate(d.getDate() + n); return d; }
function dateStr(d: Date) { return d.toISOString().split('T')[0]; }
function fmt12(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function isOverdue(t: Task) { return t.status !== 'completed' && t.dueDate < todayStr(); }
function isDueToday(t: Task) { return t.status !== 'completed' && t.dueDate === todayStr(); }
function fmtR(n: number) { return 'R\u00a0' + n.toLocaleString('en-ZA'); }

const DAY_SHORT   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_3       = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ══════════════════════════════════════════════════════════════════
// MODAL OVERLAY
// ══════════════════════════════════════════════════════════════════
function Overlay({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <div className="modal-overlay" onClick={onClick}>{children}</div>;
}

// ══════════════════════════════════════════════════════════════════
// OVERDUE ALERT
// ══════════════════════════════════════════════════════════════════
function OverdueAlert({ task, clientName, onDismiss }: { task: Task; clientName: string; onDismiss: () => void }) {
  return (
    <Overlay onClick={onDismiss}>
      <div className="overdue-box" onClick={e => e.stopPropagation()}>
        <div className="overdue-icon">⚠️</div>
        <h2 className="overdue-title">Task Overdue</h2>
        <p className="overdue-body">
          <strong>{clientName}</strong><br />
          "{task.title}"<br />
          was due on <strong>{task.dueDate}</strong>
        </p>
        <button className="btn-danger" onClick={onDismiss}>Dismiss</button>
      </div>
    </Overlay>
  );
}

// ══════════════════════════════════════════════════════════════════
// COLOUR + ICON CUSTOMISER
// ══════════════════════════════════════════════════════════════════
function CustomiseModal({ color, icon, onClose, onColor, onIcon }: {
  color: string; icon: string;
  onClose: () => void; onColor: (c: string) => void; onIcon: (i: string) => void;
}) {
  return (
    <Overlay onClick={onClose}>
      <div className="customise-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottomColor: color }}>
          <span className="customise-preview" style={{ background: color }}>{icon}</span>
          <h3 className="modal-title">Customise Client</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="field-label">Colour</p>
          <div className="colour-grid">
            {PRESET_COLORS.map(c => (
              <button key={c} className={`swatch-color ${color === c ? 'sel' : ''}`}
                style={{ background: c, outline: color === c ? `3px solid white, 3px solid ${c}` : 'none',
                  boxShadow: color === c ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}` : 'none' }}
                onClick={() => onColor(c)} />
            ))}
          </div>
          <p className="field-label" style={{ marginTop: '16px' }}>Icon</p>
          <div className="icon-grid">
            {PRESET_ICONS.map(i => (
              <button key={i} className={`swatch-icon ${icon === i ? 'sel' : ''}`}
                style={icon === i ? { background: color, borderColor: color } : {}}
                onClick={() => onIcon(i)}>{i}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ══════════════════════════════════════════════════════════════════
// EVENT MODAL (shared by 3-day strip and full calendar)
// ══════════════════════════════════════════════════════════════════
function EventModal({ date, event, onSave, onClose }: {
  date: string; event?: CalendarEvent;
  onSave: (t: string, title: string, desc: string, color: string) => void;
  onClose: () => void;
}) {
  const [time, setTime]   = useState(event?.time || '09:00');
  const [title, setTitle] = useState(event?.title || '');
  const [desc, setDesc]   = useState(event?.description || '');
  const [color, setColor] = useState(event?.color || EVENT_COLORS[0]);
  const go = () => { if (title.trim()) onSave(time, title.trim(), desc.trim(), color); };

  // Format date nicely for display
  const displayDate = (() => {
    const [y, m, d] = date.split('-').map(Number);
    return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
  })();

  return (
    <Overlay onClick={onClose}>
      <div className="event-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottomColor: color }}>
          <div className="modal-dot" style={{ background: color }} />
          <div>
            <h3 className="modal-title">{event ? 'Edit Event' : 'New Event'}</h3>
            <p className="modal-sub">{displayDate}</p>
          </div>
          <button className="icon-btn ml-auto" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <label className="field-label">Time</label>
          <input type="time" className="field-input" value={time} onChange={e => setTime(e.target.value)} />
          <label className="field-label">Title</label>
          <input className="field-input" placeholder="Meeting, deadline, call..." value={title}
            onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} autoFocus />
          <label className="field-label">Notes <span className="optional">(optional)</span></label>
          <textarea className="field-input field-ta" placeholder="Location, agenda, notes..." value={desc}
            onChange={e => setDesc(e.target.value)} rows={3} />
          <label className="field-label">Colour</label>
          <div className="colour-grid sm">
            {EVENT_COLORS.map(c => (
              <button key={c} className={`swatch-color ${color === c ? 'sel' : ''}`}
                style={{ background: c, boxShadow: color === c ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}` : 'none' }}
                onClick={() => setColor(c)} />
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" style={{ background: color }} onClick={go} disabled={!title.trim()}>
              <Check size={15} /> Save Event
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ══════════════════════════════════════════════════════════════════
// FULL MONTH CALENDAR
// ══════════════════════════════════════════════════════════════════
function FullCalendar({ eventsForDate, onAddEvent, onDeleteEvent, onEditEvent }: {
  eventsForDate: (d: string) => CalendarEvent[];
  onAddEvent: (date: string, time: string, title: string, desc: string, color: string) => void;
  onDeleteEvent: (id: string) => void;
  onEditEvent: (id: string, time: string, title: string, desc: string, color: string) => void;
}) {
  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-based
  const [addFor, setAddFor]       = useState<string | null>(null);
  const [editing, setEditing]     = useState<CalendarEvent | null>(null);
  const [selected, setSelected]   = useState<string | null>(null); // selected day for detail view

  const today = todayStr();

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay  = new Date(viewYear, viewMonth + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  // Cells: nulls for padding + day numbers
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); };

  const cellDate = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${viewYear}-${m}-${d}`;
  };

  const selectedEvents = selected ? eventsForDate(selected) : [];

  return (
    <>
      {addFor && (
        <EventModal date={addFor}
          onSave={(t, ti, d, c) => { onAddEvent(addFor, t, ti, d, c); setAddFor(null); }}
          onClose={() => setAddFor(null)} />
      )}
      {editing && (
        <EventModal date={editing.date} event={editing}
          onSave={(t, ti, d, c) => { onEditEvent(editing.id, t, ti, d, c); setEditing(null); }}
          onClose={() => setEditing(null)} />
      )}

      <section className="full-cal">
        {/* Calendar header */}
        <div className="full-cal-header">
          <div className="full-cal-nav">
            <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
            <h2 className="full-cal-month">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
            <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
          </div>
          <button className="btn-today" onClick={goToday}>Today</button>
        </div>

        <div className="full-cal-body">
          {/* Day-of-week headers */}
          <div className="cal-grid">
            {DAY_SHORT.map(d => (
              <div key={d} className="cal-dow">{d}</div>
            ))}

            {/* Day cells */}
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`pad-${i}`} className="cal-cell empty" />;
              }
              const ds = cellDate(day);
              const dayEvents = eventsForDate(ds);
              const isToday = ds === today;
              const isSel   = ds === selected;
              const isWeekend = (i % 7 === 0 || i % 7 === 6);

              return (
                <div key={ds}
                  className={`cal-cell ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''} ${isWeekend ? 'weekend' : ''}`}
                  onClick={() => setSelected(isSel ? null : ds)}>
                  <div className="cal-cell-top">
                    <span className="cal-day-num">{day}</span>
                    <button className="cal-cell-add" onClick={e => { e.stopPropagation(); setAddFor(ds); }}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="cal-cell-events">
                    {dayEvents.slice(0, 3).map(evt => (
                      <div key={evt.id} className="cal-pill"
                        style={{ background: evt.color }}
                        title={`${fmt12(evt.time)} — ${evt.title}`}
                        onClick={e => { e.stopPropagation(); setEditing(evt); }}>
                        {evt.time && <span className="cal-pill-time">{fmt12(evt.time)}</span>}
                        <span className="cal-pill-title">{evt.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="cal-more">+{dayEvents.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected day detail panel */}
          {selected && (
            <div className="cal-detail">
              <div className="cal-detail-header">
                <div>
                  <p className="cal-detail-label">
                    {DAY_SHORT[new Date(selected + 'T12:00:00').getDay()]},
                  </p>
                  <h3 className="cal-detail-date">
                    {new Date(selected + 'T12:00:00').getDate()} {MONTH_NAMES[new Date(selected + 'T12:00:00').getMonth()]}
                  </h3>
                </div>
                <div className="cal-detail-actions">
                  <button className="btn-sm-primary" onClick={() => setAddFor(selected)}>
                    <Plus size={14} /> Add
                  </button>
                  <button className="icon-btn" onClick={() => setSelected(null)}><X size={16} /></button>
                </div>
              </div>
              {selectedEvents.length === 0 ? (
                <p className="cal-detail-empty">No events. Click + to add one.</p>
              ) : (
                <div className="cal-detail-events">
                  {selectedEvents.map(evt => (
                    <div key={evt.id} className="cal-detail-evt" style={{ borderLeftColor: evt.color }}>
                      <div className="cal-detail-evt-time" style={{ color: evt.color }}>
                        <Clock size={13} /> {fmt12(evt.time)}
                      </div>
                      <div className="cal-detail-evt-title">{evt.title}</div>
                      {evt.description && <div className="cal-detail-evt-desc">{evt.description}</div>}
                      <div className="cal-detail-evt-btns">
                        <button className="btn-icon-sm" onClick={() => setEditing(evt)}><Edit3 size={13} /> Edit</button>
                        <button className="btn-icon-sm danger" onClick={() => onDeleteEvent(evt.id)}><Trash2 size={13} /> Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// 3-DAY UPCOMING STRIP
// ══════════════════════════════════════════════════════════════════
function UpcomingStrip({ eventsForDate, onAddEvent, onDeleteEvent, onEditEvent }: {
  eventsForDate: (d: string) => CalendarEvent[];
  onAddEvent: (date: string, time: string, title: string, desc: string, color: string) => void;
  onDeleteEvent: (id: string) => void;
  onEditEvent: (id: string, time: string, title: string, desc: string, color: string) => void;
}) {
  const today = new Date();
  const days  = [0, 1, 2].map(n => addDays(today, n));
  const [addFor, setAddFor]   = useState<string | null>(null);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  return (
    <>
      {addFor && <EventModal date={addFor} onSave={(t, ti, d, c) => { onAddEvent(addFor, t, ti, d, c); setAddFor(null); }} onClose={() => setAddFor(null)} />}
      {editing && <EventModal date={editing.date} event={editing} onSave={(t, ti, d, c) => { onEditEvent(editing.id, t, ti, d, c); setEditing(null); }} onClose={() => setEditing(null)} />}

      <section className="upcoming-strip">
        <div className="section-head">
          <Calendar size={16} className="section-icon" />
          <span>Upcoming — Next 3 Days</span>
        </div>
        <div className="upcoming-days">
          {days.map((day, idx) => {
            const ds = dateStr(day);
            const evts = eventsForDate(ds);
            const isToday = idx === 0;
            return (
              <div key={ds} className={`upcoming-day ${isToday ? 'today' : ''}`}>
                <div className="upcoming-day-hd">
                  <div className="upcoming-day-label">
                    <span className="upcoming-dn">{DAY_3[day.getDay()]}</span>
                    <span className="upcoming-dd">{day.getDate()}</span>
                    <span className="upcoming-dm">{MONTH_NAMES[day.getMonth()].slice(0, 3)}</span>
                  </div>
                  {isToday && <span className="badge-today">Today</span>}
                  <button className="btn-add-sm" onClick={() => setAddFor(ds)}><Plus size={14} /></button>
                </div>
                <div className="upcoming-evts">
                  {evts.length === 0 && <p className="upcoming-empty">No events scheduled</p>}
                  {evts.map(e => (
                    <div key={e.id} className="upcoming-evt" style={{ borderLeftColor: e.color }}>
                      <div className="upcoming-evt-time" style={{ color: e.color }}><Clock size={12} /> {fmt12(e.time)}</div>
                      <div className="upcoming-evt-title">{e.title}</div>
                      {e.description && <div className="upcoming-evt-desc">{e.description}</div>}
                      <div className="upcoming-evt-actions">
                        <button className="icon-btn xs" onClick={() => setEditing(e)}><Edit3 size={13} /></button>
                        <button className="icon-btn xs red-h" onClick={() => onDeleteEvent(e.id)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// COSTS PANEL
// ══════════════════════════════════════════════════════════════════
function CostsPanel({ costs, onAdd, onDelete, onUpdate }: {
  costs: CostItem[];
  onAdd: (n: string, a: number, c: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, n: string, a: number, c: string) => void;
}) {
  const [adding, setAdding]     = useState(false);
  const [newName, setNewName]   = useState('');
  const [newAmt, setNewAmt]     = useState('');
  const [newCat, setNewCat]     = useState(COST_CATEGORIES[0]);
  const [editId, setEditId]     = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmt, setEditAmt]   = useState('');
  const [editCat, setEditCat]   = useState(COST_CATEGORIES[0]);
  const [collapsed, setCollapsed] = useState(false);

  const total = costs.reduce((s, c) => s + c.amount, 0);

  const submitAdd = () => {
    if (newName.trim()) { onAdd(newName.trim(), Number(newAmt) || 0, newCat); setNewName(''); setNewAmt(''); setAdding(false); }
  };
  const startEdit = (c: CostItem) => { setEditId(c.id); setEditName(c.name); setEditAmt(String(c.amount)); setEditCat(c.category); };
  const submitEdit = () => {
    if (editId && editName.trim()) { onUpdate(editId, editName.trim(), Number(editAmt) || 0, editCat); setEditId(null); }
  };

  const byCategory: Record<string, CostItem[]> = {};
  costs.forEach(c => { (byCategory[c.category] = byCategory[c.category] || []).push(c); });

  return (
    <section className="costs-section">
      <div className="section-head">
        <Receipt size={16} className="section-icon" />
        <span>Monthly Costs &amp; Subscriptions</span>
        <span className="section-total">{fmtR(total)}</span>
        <button className="icon-btn" style={{ marginLeft: 4 }} onClick={() => setAdding(p => !p)}><Plus size={16} /></button>
        <button className="icon-btn" onClick={() => setCollapsed(p => !p)}>{collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</button>
      </div>

      {!collapsed && (
        <>
          {adding && (
            <div className="cost-add-row">
              <input className="field-input" placeholder="Name (e.g. Adobe CC)" value={newName}
                onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitAdd()} autoFocus />
              <select className="field-select" value={newCat} onChange={e => setNewCat(e.target.value)}>
                {COST_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="fin-input-wrap"><span>R</span>
                <input type="number" className="fin-num" placeholder="0" value={newAmt} onChange={e => setNewAmt(e.target.value)} />
              </div>
              <button className="icon-btn accent" onClick={submitAdd}><Check size={15} /></button>
              <button className="icon-btn" onClick={() => setAdding(false)}><X size={15} /></button>
            </div>
          )}
          <div className="costs-list">
            {costs.length === 0 && <p className="empty-msg">No costs added yet. Click + to add.</p>}
            {Object.entries(byCategory).map(([cat, items]) => (
              <div key={cat} className="cost-group">
                <div className="cost-group-label">{cat}</div>
                {items.map(item => (
                  editId === item.id ? (
                    <div key={item.id} className="cost-row editing">
                      <input className="field-input" value={editName} onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submitEdit()} autoFocus />
                      <select className="field-select" value={editCat} onChange={e => setEditCat(e.target.value)}>
                        {COST_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                      <div className="fin-input-wrap"><span>R</span>
                        <input type="number" className="fin-num" value={editAmt} onChange={e => setEditAmt(e.target.value)} />
                      </div>
                      <button className="icon-btn accent" onClick={submitEdit}><Check size={15} /></button>
                      <button className="icon-btn" onClick={() => setEditId(null)}><X size={15} /></button>
                    </div>
                  ) : (
                    <div key={item.id} className="cost-row">
                      <span className="cost-name">{item.name}</span>
                      <span className="cost-amount">{fmtR(item.amount)}</span>
                      <button className="icon-btn xs" onClick={() => startEdit(item)}><Edit3 size={13} /></button>
                      <button className="icon-btn xs red-h" onClick={() => onDelete(item.id)}><Trash2 size={13} /></button>
                    </div>
                  )
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// DEV TASK ROW
// ══════════════════════════════════════════════════════════════════
function DevTaskRow({ task, projectColor,
  onToggle, onDelete, onEdit, onAddSub, onToggleSub, onDeleteSub
}: {
  task: DevTask; projectColor: string;
  onToggle: () => void; onDelete: () => void; onEdit: (t: string) => void;
  onAddSub: (t: string) => void; onToggleSub: (sid: string) => void; onDeleteSub: (sid: string) => void;
}) {
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState(false);
  const [editVal, setEditVal]   = useState(task.title);
  const [addingSub, setAddingSub] = useState(false);
  const [subVal, setSubVal]     = useState('');
  const doneCount = task.subTasks.filter(s => s.completed).length;

  const saveEdit = () => { if (editVal.trim()) { onEdit(editVal.trim()); setEditing(false); } };
  const submitSub = () => { if (subVal.trim()) { onAddSub(subVal.trim()); setSubVal(''); setAddingSub(false); } };

  return (
    <div className={`dev-task ${task.completed ? 'done' : ''}`}>
      <div className="dev-task-row">
        <button className={`task-check ${task.completed ? 'checked' : ''}`}
          style={task.completed ? { background: projectColor, borderColor: projectColor } : { borderColor: projectColor }}
          onClick={onToggle}>{task.completed && <Check size={12} strokeWidth={3} />}</button>
        {editing ? (
          <input className="field-input flex1" value={editVal} onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveEdit()} onBlur={saveEdit} autoFocus />
        ) : (
          <span className="dev-task-title">{task.title}</span>
        )}
        {task.subTasks.length > 0 && <span className="sub-count">{doneCount}/{task.subTasks.length}</span>}
        <button className="icon-btn xs" onClick={() => setOpen(p => !p)}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <button className="icon-btn xs" onClick={() => setEditing(p => !p)}><Edit3 size={13} /></button>
        <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={13} /></button>
      </div>
      {open && (
        <div className="sub-tasks">
          {task.subTasks.map(s => (
            <div key={s.id} className={`sub-task-row ${s.completed ? 'done' : ''}`}>
              <button className={`task-check sm ${s.completed ? 'checked' : ''}`}
                style={s.completed ? { background: projectColor, borderColor: projectColor } : { borderColor: projectColor }}
                onClick={() => onToggleSub(s.id)}>{s.completed && <Check size={10} strokeWidth={3} />}</button>
              <span className="sub-task-title">{s.title}</span>
              <button className="icon-btn xs red-h" onClick={() => onDeleteSub(s.id)}><Trash2 size={12} /></button>
            </div>
          ))}
          {addingSub ? (
            <div className="sub-add-row">
              <input className="field-input flex1" placeholder="Sub-task..." value={subVal}
                onChange={e => setSubVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitSub()} autoFocus />
              <button className="icon-btn accent xs" onClick={submitSub}><Check size={13} /></button>
              <button className="icon-btn xs" onClick={() => setAddingSub(false)}><X size={13} /></button>
            </div>
          ) : (
            <button className="btn-add-sub" style={{ color: projectColor }} onClick={() => setAddingSub(true)}>
              <Plus size={12} /> Add sub-task
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// DEV PROJECT CARD
// ══════════════════════════════════════════════════════════════════
function DevProjectCard({ project, onDelete, onUpdate, onComplete, onReopen,
  onUpdateColor, onUpdateIcon, onAddTask, onToggleTask, onDeleteTask, onEditTask,
  onAddSub, onToggleSub, onDeleteSub,
}: {
  project: DevProject;
  onDelete: () => void; onUpdate: (c: Partial<DevProject>) => void;
  onComplete: () => void; onReopen: () => void;
  onUpdateColor: (c: string) => void; onUpdateIcon: (i: string) => void;
  onAddTask: (t: string) => void; onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void; onEditTask: (id: string, t: string) => void;
  onAddSub: (tid: string, t: string) => void; onToggleSub: (tid: string, sid: string) => void;
  onDeleteSub: (tid: string, sid: string) => void;
}) {
  const [collapsed, setCollapsed]       = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);
  const [addingTask, setAddingTask]     = useState(false);
  const [newTask, setNewTask]           = useState('');
  const [editName, setEditName]         = useState(false);
  const [nameVal, setNameVal]           = useState(project.projectName);
  const [editClient, setEditClient]     = useState(false);
  const [clientVal, setClientVal]       = useState(project.clientName);

  const done  = project.tasks.filter(t => t.completed).length;
  const total = project.tasks.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const totalVal   = project.depositAmount + project.finalAmount;
  const paidVal    = (project.depositPaid ? project.depositAmount : 0) + (project.finalPaid ? project.finalAmount : 0);
  const pendingPay = totalVal - paidVal;

  const submitTask = () => { if (newTask.trim()) { onAddTask(newTask.trim()); setNewTask(''); setAddingTask(false); } };

  return (
    <>
      {showCustomise && (
        <CustomiseModal color={project.color} icon={project.icon}
          onClose={() => setShowCustomise(false)}
          onColor={onUpdateColor} onIcon={onUpdateIcon} />
      )}
      <div className={`dev-card ${project.status === 'completed' ? 'completed' : ''}`}
        style={{ '--proj-color': project.color } as React.CSSProperties}>
        <div className="dev-header" style={{ background: project.color }}>
          <span className="dev-icon">{project.icon}</span>
          <div className="dev-title-block">
            {editName
              ? <input className="dev-name-input" value={nameVal} onChange={e => setNameVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (onUpdate({ projectName: nameVal }), setEditName(false))}
                  onBlur={() => { onUpdate({ projectName: nameVal }); setEditName(false); }} autoFocus />
              : <span className="dev-name" onDoubleClick={() => setEditName(true)}>{project.projectName}</span>
            }
            {editClient
              ? <input className="dev-client-input" value={clientVal} onChange={e => setClientVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (onUpdate({ clientName: clientVal }), setEditClient(false))}
                  onBlur={() => { onUpdate({ clientName: clientVal }); setEditClient(false); }} autoFocus />
              : <span className="dev-client" onDoubleClick={() => setEditClient(true)}>{project.clientName}</span>
            }
          </div>
          {project.status === 'completed' && <span className="dev-done-badge">✓ Done</span>}
          <div className="dev-header-actions">
            <span className="dev-pct">{pct}%</span>
            <button className="icon-btn dark" onClick={() => setShowCustomise(true)}><Palette size={14} /></button>
            <button className="icon-btn dark" onClick={() => setCollapsed(p => !p)}>{collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</button>
            {project.status === 'active'
              ? <button className="icon-btn dark" title="Mark complete" onClick={onComplete}><CircleCheck size={14} /></button>
              : <button className="icon-btn dark" title="Reopen" onClick={onReopen}><RefreshCw size={14} /></button>
            }
            <button className="icon-btn dark-red" onClick={onDelete}><Trash2 size={14} /></button>
          </div>
        </div>

        <div className="dev-progress-bar">
          <div className="dev-progress-fill" style={{ width: `${pct}%`, background: project.color }} />
        </div>

        {!collapsed && (
          <div className="dev-body">
            <div className="dev-payment">
              <div className="pay-row">
                <span className="pay-label">Deposit</span>
                <div className="fin-input-wrap"><span>R</span>
                  <input type="number" className="fin-num" value={project.depositAmount || ''}
                    onChange={e => onUpdate({ depositAmount: Number(e.target.value) })} placeholder="0" />
                </div>
                <button className={`pay-toggle ${project.depositPaid ? 'paid' : ''}`}
                  onClick={() => onUpdate({ depositPaid: !project.depositPaid })}>
                  {project.depositPaid ? '✓ Paid' : 'Unpaid'}
                </button>
              </div>
              <div className="pay-row">
                <span className="pay-label">Final</span>
                <div className="fin-input-wrap"><span>R</span>
                  <input type="number" className="fin-num" value={project.finalAmount || ''}
                    onChange={e => onUpdate({ finalAmount: Number(e.target.value) })} placeholder="0" />
                </div>
                <button className={`pay-toggle ${project.finalPaid ? 'paid' : ''}`}
                  onClick={() => onUpdate({ finalPaid: !project.finalPaid })}>
                  {project.finalPaid ? '✓ Paid' : 'Unpaid'}
                </button>
              </div>
              <div className="pay-summary">
                <span>Total: <strong>{fmtR(totalVal)}</strong></span>
                <span className="pay-received">Received: <strong>{fmtR(paidVal)}</strong></span>
                {pendingPay > 0 && <span className="pay-pending">Pending: <strong>{fmtR(pendingPay)}</strong></span>}
              </div>
            </div>

            <div className="dev-tasks">
              {project.tasks.length === 0 && <p className="empty-msg">No tasks yet — add one below</p>}
              {project.tasks.map(task => (
                <DevTaskRow key={task.id} task={task} projectColor={project.color}
                  onToggle={() => onToggleTask(task.id)}
                  onDelete={() => onDeleteTask(task.id)}
                  onEdit={t => onEditTask(task.id, t)}
                  onAddSub={t => onAddSub(task.id, t)}
                  onToggleSub={sid => onToggleSub(task.id, sid)}
                  onDeleteSub={sid => onDeleteSub(task.id, sid)} />
              ))}
              {addingTask ? (
                <div className="dev-add-task-row">
                  <input className="field-input flex1" placeholder="Task title..." value={newTask}
                    onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitTask()} autoFocus />
                  <button className="icon-btn accent" onClick={submitTask}><Check size={15} /></button>
                  <button className="icon-btn" onClick={() => setAddingTask(false)}><X size={15} /></button>
                </div>
              ) : (
                <button className="btn-add-dev-task" style={{ borderColor: project.color, color: project.color }}
                  onClick={() => setAddingTask(true)}>
                  <Plus size={14} /> Add Task
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// TASK ROW (retainer)
// ══════════════════════════════════════════════════════════════════
function TaskRow({ task, clientColor, users, onToggle, onDelete, onEdit, onOverdueClick }: {
  task: Task; clientColor: string; users?: AppUser[];
  onToggle: () => void; onDelete: () => void;
  onEdit: (title: string, d: string) => void; onOverdueClick: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle]   = useState(task.title);
  const [eDate, setEDate]     = useState(task.dueDate);
  const over   = isOverdue(task);
  const dToday = isDueToday(task);
  const save   = () => { if (eTitle.trim()) { onEdit(eTitle.trim(), eDate); setEditing(false); } };

  if (editing) return (
    <div className="task-row editing">
      <input className="field-input flex1" value={eTitle} onChange={e => setETitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()} autoFocus />
      <input type="date" className="field-date" value={eDate} onChange={e => setEDate(e.target.value)} />
      <button className="icon-btn accent" onClick={save}><Check size={14} /></button>
      <button className="icon-btn" onClick={() => setEditing(false)}><X size={14} /></button>
    </div>
  );

  const done = task.status === 'completed';
  return (
    <div className={`task-row ${done ? 'done' : ''} ${over ? 'overdue' : ''} ${dToday ? 'due-today' : ''}`}
      style={{ borderLeftColor: clientColor }}>
      <button className={`task-check ${done ? 'checked' : ''}`}
        style={done ? { background: clientColor, borderColor: clientColor } : { borderColor: clientColor }}
        onClick={onToggle}>{done && <Check size={12} strokeWidth={3} />}</button>
      <span className="task-title">{task.title}</span>
      {task.assignedTo && users && (
        <span className="task-assigned-badge">
          {users.find(u => u.id === task.assignedTo)?.displayName
            || users.find(u => u.id === task.assignedTo)?.username
            || '?'}
        </span>
      )}
      <span className="task-date">{task.dueDate}</span>
      {over   && <button className="badge-overdue" onClick={onOverdueClick}><AlertTriangle size={11} /> Late</button>}
      {dToday && <span className="badge-today">Today</span>}
      <button className="icon-btn xs" onClick={() => setEditing(true)}><Edit3 size={13} /></button>
      <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={13} /></button>
    </div>
  );
}

function AddTaskForm({ clientColor, assistants, onAdd }: {
  clientColor: string;
  assistants: AppUser[];
  onAdd: (t: string, d: string, assignedTo?: string) => void;
}) {
  const [open, setOpen]         = useState(false);
  const [title, setTitle]       = useState('');
  const [date, setDate]         = useState(todayStr());
  const [assignedTo, setAssignedTo] = useState<string>('');
  const go = () => {
    if (title.trim()) {
      onAdd(title.trim(), date, assignedTo || undefined);
      setTitle(''); setDate(todayStr()); setAssignedTo(''); setOpen(false);
    }
  };
  if (!open) return (
    <button className="btn-add-task" style={{ borderColor: clientColor, color: clientColor }} onClick={() => setOpen(true)}>
      <Plus size={14} /> Add Task
    </button>
  );
  return (
    <div className="add-task-form">
      <input className="field-input flex1" placeholder="Task title..." value={title}
        onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} autoFocus />
      <input type="date" className="field-date" value={date} onChange={e => setDate(e.target.value)} />
      {assistants.length > 0 && (
        <select className="field-date task-assign-select" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
          <option value="">Unassigned</option>
          {assistants.map(u => <option key={u.id} value={u.id}>{u.displayName || u.username}</option>)}
        </select>
      )}
      <button className="icon-btn accent" onClick={go}><Check size={14} /></button>
      <button className="icon-btn" onClick={() => setOpen(false)}><X size={14} /></button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FINANCIALS PANEL
// ══════════════════════════════════════════════════════════════════
function FinancialsPanel({ client, onUpdate }: {
  client: Client;
  onUpdate: (f: 'monthlyIncome' | 'adSpend' | 'monthlyCost', v: number) => void;
}) {
  const profit = client.monthlyIncome - client.adSpend - client.monthlyCost;
  return (
    <div className="fin-panel">
      {(['monthlyIncome', 'adSpend', 'monthlyCost'] as const).map(field => (
        <div key={field} className="fin-row">
          <label>{field === 'monthlyIncome' ? 'Monthly Income' : field === 'adSpend' ? 'Ad Spend' : 'Client Costs'}</label>
          <div className="fin-input-wrap"><span>R</span>
            <input type="number" className="fin-num" value={client[field] || ''}
              onChange={e => onUpdate(field, Number(e.target.value))} placeholder="0" />
          </div>
        </div>
      ))}
      <div className={`fin-profit ${profit >= 0 ? 'pos' : 'neg'}`}>
        <span>Client Profit</span>
        <span>{fmtR(profit)}</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CLIENT CARD
// ══════════════════════════════════════════════════════════════════
function ClientCard({ client, users, assistants, onDeleteClient, onUpdateName, onUpdateColor, onUpdateIcon,
  onUpdateFinancials, onAddTask, onToggleTask, onDeleteTask, onEditTask
}: {
  client: Client; users: AppUser[]; assistants: AppUser[];
  onDeleteClient: () => void; onUpdateName: (n: string) => void;
  onUpdateColor: (c: string) => void; onUpdateIcon: (i: string) => void;
  onUpdateFinancials: (f: 'monthlyIncome' | 'adSpend' | 'monthlyCost', v: number) => void;
  onAddTask: (t: string, d: string, uid?: string) => void; onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void; onEditTask: (id: string, t: string, d: string) => void;
}) {
  const [collapsed, setCollapsed]       = useState(false);
  const [showFin, setShowFin]           = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);
  const [editingName, setEditingName]   = useState(false);
  const [nameVal, setNameVal]           = useState(client.name);
  const [alertTask, setAlertTask]       = useState<Task | null>(null);
  const overdueTasks = client.tasks.filter(isOverdue);
  const pending = client.tasks.filter(t => t.status !== 'completed').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const done    = client.tasks.filter(t => t.status === 'completed');
  const saveName = () => { if (nameVal.trim()) onUpdateName(nameVal.trim()); setEditingName(false); };

  return (
    <>
      {alertTask && <OverdueAlert task={alertTask} clientName={client.name} onDismiss={() => setAlertTask(null)} />}
      {showCustomise && <CustomiseModal color={client.color} icon={client.icon}
        onClose={() => setShowCustomise(false)} onColor={onUpdateColor} onIcon={onUpdateIcon} />}

      <div className="client-card" style={{ '--client-color': client.color } as React.CSSProperties}>
        <div className="client-header" style={{ background: client.color }}>
          <span className="client-emoji">{client.icon}</span>
          {editingName
            ? <input className="client-name-input" value={nameVal} onChange={e => setNameVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()} onBlur={saveName} autoFocus />
            : <h2 className="client-name" onDoubleClick={() => setEditingName(true)}>{client.name}</h2>
          }
          <div className="client-header-actions">
            {overdueTasks.length > 0 && (
              <span className="overdue-count" onClick={() => setAlertTask(overdueTasks[0])}>⚠ {overdueTasks.length}</span>
            )}
            <span className="task-count">{pending.length} open</span>
            <button className="icon-btn dark" onClick={() => setShowCustomise(true)}><Palette size={14} /></button>
            <button className="icon-btn dark" onClick={() => setShowFin(p => !p)}><DollarSign size={14} /></button>
            <button className="icon-btn dark" onClick={() => setCollapsed(p => !p)}>{collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</button>
            <button className="icon-btn dark-red" onClick={onDeleteClient}><Trash2 size={14} /></button>
          </div>
        </div>

        {!collapsed && (
          <div className="client-body">
            {showFin && <FinancialsPanel client={client} onUpdate={onUpdateFinancials} />}
            <div className="task-list">
              {pending.length === 0 && done.length === 0 && <p className="empty-msg">No tasks yet — add one below</p>}
              {pending.map(t => (
                <TaskRow key={t.id} task={t} clientColor={client.color} users={users}
                  onToggle={() => onToggleTask(t.id)} onDelete={() => onDeleteTask(t.id)}
                  onEdit={(ti, d) => onEditTask(t.id, ti, d)} onOverdueClick={() => setAlertTask(t)} />
              ))}
              {done.length > 0 && (
                <details className="done-section">
                  <summary>Completed ({done.length})</summary>
                  {done.map(t => (
                    <TaskRow key={t.id} task={t} clientColor={client.color} users={users}
                      onToggle={() => onToggleTask(t.id)} onDelete={() => onDeleteTask(t.id)}
                      onEdit={(ti, d) => onEditTask(t.id, ti, d)} onOverdueClick={() => setAlertTask(t)} />
                  ))}
                </details>
              )}
            </div>
            <AddTaskForm clientColor={client.color} assistants={assistants} onAdd={onAddTask} />
          </div>
        )}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// SUMMARY BAR
// ══════════════════════════════════════════════════════════════════
function SummaryBar({ totalIncome, totalAdSpend, totalCosts, totalPending, totalProfit }: {
  totalIncome: number; totalAdSpend: number; totalCosts: number;
  totalPending: number; totalProfit: number;
}) {
  return (
    <div className="summary-bar">
      <div className="sum-item income">
        <span className="sum-lbl">Monthly Income</span>
        <span className="sum-val">{fmtR(totalIncome)}</span>
      </div>
      <div className="sum-item pending">
        <span className="sum-lbl">Pending (Dev)</span>
        <span className="sum-val">{fmtR(totalPending)}</span>
      </div>
      <div className="sum-item spend">
        <span className="sum-lbl">Ad Spend</span>
        <span className="sum-val">{fmtR(totalAdSpend)}</span>
      </div>
      <div className="sum-item cost">
        <span className="sum-lbl">Total Costs</span>
        <span className="sum-val">{fmtR(totalCosts)}</span>
      </div>
      <div className={`sum-item profit ${totalProfit >= 0 ? 'pos' : 'neg'}`}>
        <span className="sum-lbl">Net Profit</span>
        <span className="sum-val">{fmtR(totalProfit)}</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const auth = useAuth();

  // Show login screen while loading or if not authenticated
  if (auth.isLoading) return (
    <div className="app-loading">
      <div className="app-loading-spinner" />
    </div>
  );
  if (!auth.currentUser) return (
    <LoginScreen onLogin={auth.login} error={auth.authError} />
  );
  // Assistant role — show simplified task board only
  if (auth.currentUser.role === 'assistant') {
    return <AssistantViewWrapper auth={auth} />;
  }
  return <AdminApp auth={auth} />;
}

// Wrapper so AssistantView can get store data
function AssistantViewWrapper({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const { clients, updateTaskStatus } = useStore();
  return (
    <AssistantView
      currentUser={auth.currentUser!}
      clients={clients}
      onUpdateStatus={updateTaskStatus}
      onLogout={auth.logout}
    />
  );
}

function AdminApp({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const {
    clients, addClient, deleteClient,
    updateClientName, updateClientColor, updateClientIcon, updateClientFinancials,
    addTask, toggleTask, deleteTask, editTask, assignTask, updateTaskStatus,
    costs, addCost, deleteCost, updateCost,
    devProjects, addDevProject, deleteDevProject, updateDevProject,
    completeDevProject, reopenDevProject, updateDevProjectColor, updateDevProjectIcon,
    addDevTask, toggleDevTask, deleteDevTask, editDevTask,
    addSubTask, toggleSubTask, deleteSubTask,
    addEvent, deleteEvent, editEvent, eventsForDate,
    budgetIncome, budgetExpenses, unforeseenExpenses,
    addBudgetIncome, deleteBudgetIncome, updateBudgetIncome,
    addBudgetExpense, deleteBudgetExpense, updateBudgetExpense,
    addUnforeseen, deleteUnforeseen, updateUnforeseen, toggleUnforeseenPaid,
    onceOffCosts, monthlySnapshots, meetingNotes,
    addOnceOffCost, deleteOnceOffCost, updateOnceOffCost, toggleOnceOffPaid,
    saveMonthSnapshot, deleteSnapshot, updateSnapshotNotes,
    addMeetingNote, deleteMeetingNote, updateMeetingNote,
    isFirebaseConfigured, fbReady, fbError,
    totalMonthlyIncome, totalAdSpend, totalCosts, totalOnceOffUnpaid, totalPendingIncome, totalProfit, overdueCount,
    totalBudgetIncome, totalBudgetExpenses, totalUnforeseen, budgetBalance,
    allTimeBusinessIncome, allTimeBusinessProfit, allTimePersonalBalance,
  } = useStore();

  const [newClientName, setNewClientName] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddDev, setShowAddDev]       = useState(false);
  const [newDevClient, setNewDevClient]   = useState('');
  const [newDevProject, setNewDevProject] = useState('');
  const [activeTab, setActiveTab]         = useState<'retainer' | 'dev' | 'calendar' | 'budget' | 'history' | 'notes' | 'users'>('retainer');
  const assistants = auth.users.filter(u => u.role === 'assistant');
  const clientInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (showAddClient) clientInputRef.current?.focus(); }, [showAddClient]);

  const handleAddClient = () => {
    if (newClientName.trim()) { addClient(newClientName.trim()); setNewClientName(''); setShowAddClient(false); }
  };
  const handleAddDev = () => {
    if (newDevClient.trim() && newDevProject.trim()) {
      addDevProject(newDevClient.trim(), newDevProject.trim());
      setNewDevClient(''); setNewDevProject(''); setShowAddDev(false);
    }
  };

  const activeDev    = devProjects.filter(p => p.status === 'active');
  const completedDev = devProjects.filter(p => p.status === 'completed');

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
          <div
            className={`firebase-status ${!isFirebaseConfigured ? 'local' : fbError ? 'error' : fbReady ? 'connected' : 'connecting'}`}
            title={!isFirebaseConfigured ? 'Local only — changes stay on this device' : fbError ? `Sync error: ${fbError}` : fbReady ? 'Synced across all devices' : 'Connecting to Firebase…'}
          >
            {!isFirebaseConfigured || fbError ? <WifiOff size={13}/> : <Wifi size={13}/>}
            <span className="fb-label">
              {!isFirebaseConfigured ? 'Local' : fbError ? 'Sync Error' : fbReady ? 'Synced' : 'Syncing…'}
            </span>
          </div>
          <button className="btn-logout" onClick={auth.logout} title="Logout">
            <LogOut size={14} />
            <span className="btn-logout-label">{auth.currentUser?.displayName || auth.currentUser?.username}</span>
          </button>
          {overdueCount > 0 && (
            <div className="header-overdue">
              <Zap size={14} /> {overdueCount}
            </div>
          )}
        </div>
      </header>

      {/* Summary */}
      <SummaryBar
        totalIncome={totalMonthlyIncome} totalAdSpend={totalAdSpend}
        totalCosts={totalCosts} totalPending={totalPendingIncome} totalProfit={totalProfit}
      />

      {/* Costs */}
      <CostsPanel costs={costs} onAdd={addCost} onDelete={deleteCost} onUpdate={updateCost} />

      <OnceOffCosts
        items={onceOffCosts}
        onAdd={addOnceOffCost}
        onDelete={deleteOnceOffCost}
        onUpdate={updateOnceOffCost}
        onTogglePaid={toggleOnceOffPaid}
        totalUnpaid={totalOnceOffUnpaid}
      />

      {/* Tab nav */}
      <div className="tab-nav" role="tablist">
        <button className={`tab-btn ${activeTab === 'retainer' ? 'active' : ''}`} onClick={() => setActiveTab('retainer')}>
          <DollarSign size={15} /><span className="tab-label"> Retainer</span>
          <span className="tab-count">{clients.length}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'dev' ? 'active' : ''}`} onClick={() => setActiveTab('dev')}>
          <Code2 size={15} /><span className="tab-label"> Dev</span>
          <span className="tab-count">{activeDev.length}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <Calendar size={15} /><span className="tab-label"> Calendar</span>
        </button>
        <button className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => setActiveTab('budget')}>
          <Wallet size={15} /><span className="tab-label"> Budget</span>
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <History size={15} /><span className="tab-label"> History</span>
        </button>
        <button className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
          <BookOpen size={15} /><span className="tab-label"> Notes</span>
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={15} /><span className="tab-label"> Users</span>
          {auth.users.length > 0 && <span className="tab-count">{auth.users.length}</span>}
        </button>
      </div>

      {/* RETAINER TAB */}
      {activeTab === 'retainer' && (
        <>
          <UpcomingStrip eventsForDate={eventsForDate} onAddEvent={addEvent} onDeleteEvent={deleteEvent} onEditEvent={editEvent} />
          <main className="client-grid">
            {clients.map(c => (
              <ClientCard key={c.id} client={c}
                users={auth.users} assistants={assistants}
                onDeleteClient={() => deleteClient(c.id)}
                onUpdateName={n => updateClientName(c.id, n)}
                onUpdateColor={col => updateClientColor(c.id, col)}
                onUpdateIcon={i => updateClientIcon(c.id, i)}
                onUpdateFinancials={(f, v) => updateClientFinancials(c.id, f, v)}
                onAddTask={(t, d, uid) => addTask(c.id, t, d, uid)}
                onToggleTask={tid => toggleTask(c.id, tid)}
                onDeleteTask={tid => deleteTask(c.id, tid)}
                onEditTask={(tid, t, d) => editTask(c.id, tid, t, d)} />
            ))}
            <div className="add-card">
              {showAddClient ? (
                <div className="add-card-form">
                  <input ref={clientInputRef} className="field-input" placeholder="Client name..."
                    value={newClientName} onChange={e => setNewClientName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddClient()} />
                  <button className="icon-btn accent" onClick={handleAddClient}><Check size={16} /></button>
                  <button className="icon-btn" onClick={() => setShowAddClient(false)}><X size={16} /></button>
                </div>
              ) : (
                <button className="add-card-btn" onClick={() => setShowAddClient(true)}>
                  <Plus size={24} /><span>New Client</span>
                </button>
              )}
            </div>
          </main>
        </>
      )}

      {/* DEVELOPMENT TAB */}
      {activeTab === 'dev' && (
        <main className="dev-section">
          <div className="dev-grid">
            {activeDev.map(p => (
              <DevProjectCard key={p.id} project={p}
                onDelete={() => deleteDevProject(p.id)}
                onUpdate={changes => updateDevProject(p.id, changes)}
                onComplete={() => completeDevProject(p.id)}
                onReopen={() => reopenDevProject(p.id)}
                onUpdateColor={c => updateDevProjectColor(p.id, c)}
                onUpdateIcon={i => updateDevProjectIcon(p.id, i)}
                onAddTask={t => addDevTask(p.id, t)}
                onToggleTask={tid => toggleDevTask(p.id, tid)}
                onDeleteTask={tid => deleteDevTask(p.id, tid)}
                onEditTask={(tid, t) => editDevTask(p.id, tid, t)}
                onAddSub={(tid, t) => addSubTask(p.id, tid, t)}
                onToggleSub={(tid, sid) => toggleSubTask(p.id, tid, sid)}
                onDeleteSub={(tid, sid) => deleteSubTask(p.id, tid, sid)} />
            ))}
            <div className="add-card">
              {showAddDev ? (
                <div className="add-dev-form">
                  <input className="field-input" placeholder="Client name..." value={newDevClient}
                    onChange={e => setNewDevClient(e.target.value)} autoFocus />
                  <input className="field-input" placeholder="Project name..." value={newDevProject}
                    onChange={e => setNewDevProject(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddDev()} />
                  <div className="add-dev-actions">
                    <button className="icon-btn accent" onClick={handleAddDev}><Check size={16} /></button>
                    <button className="icon-btn" onClick={() => setShowAddDev(false)}><X size={16} /></button>
                  </div>
                </div>
              ) : (
                <button className="add-card-btn" onClick={() => setShowAddDev(true)}>
                  <Code2 size={24} /><span>New Project</span>
                </button>
              )}
            </div>
          </div>

          {completedDev.length > 0 && (
            <details className="completed-dev-section">
              <summary>Completed Projects ({completedDev.length})</summary>
              <div className="dev-grid" style={{ marginTop: 16 }}>
                {completedDev.map(p => (
                  <DevProjectCard key={p.id} project={p}
                    onDelete={() => deleteDevProject(p.id)}
                    onUpdate={changes => updateDevProject(p.id, changes)}
                    onComplete={() => completeDevProject(p.id)}
                    onReopen={() => reopenDevProject(p.id)}
                    onUpdateColor={c => updateDevProjectColor(p.id, c)}
                    onUpdateIcon={i => updateDevProjectIcon(p.id, i)}
                    onAddTask={t => addDevTask(p.id, t)}
                    onToggleTask={tid => toggleDevTask(p.id, tid)}
                    onDeleteTask={tid => deleteDevTask(p.id, tid)}
                    onEditTask={(tid, t) => editDevTask(p.id, tid, t)}
                    onAddSub={(tid, t) => addSubTask(p.id, tid, t)}
                    onToggleSub={(tid, sid) => toggleSubTask(p.id, tid, sid)}
                    onDeleteSub={(tid, sid) => deleteSubTask(p.id, tid, sid)} />
                ))}
              </div>
            </details>
          )}
        </main>
      )}

      {/* CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <FullCalendar
          eventsForDate={eventsForDate}
          onAddEvent={addEvent}
          onDeleteEvent={deleteEvent}
          onEditEvent={editEvent}
        />
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <MonthlyHistory
          snapshots={monthlySnapshots}
          onSave={saveMonthSnapshot}
          onDelete={deleteSnapshot}
          onUpdateNotes={updateSnapshotNotes}
          allTimeBusinessIncome={allTimeBusinessIncome}
          allTimeBusinessProfit={allTimeBusinessProfit}
          allTimePersonalBalance={allTimePersonalBalance}
          currentBusinessIncome={totalMonthlyIncome}
          currentBusinessProfit={totalProfit}
          currentPersonalBalance={budgetBalance}
        />
      )}

      {/* NOTES TAB */}
      {activeTab === 'notes' && (
        <MeetingNotes
          notes={meetingNotes}
          onAdd={addMeetingNote}
          onDelete={deleteMeetingNote}
          onUpdate={updateMeetingNote}
        />
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <UserManagement
          users={auth.users}
          currentUserId={auth.currentUser!.id}
          onAddUser={auth.addUser}
          onDeleteUser={auth.deleteUser}
          onChangePin={auth.changePin}
        />
      )}

      {/* BUDGET TAB */}
      {activeTab === 'budget' && (
        <PersonalBudget
          budgetIncome={budgetIncome}
          budgetExpenses={budgetExpenses}
          unforeseenExpenses={unforeseenExpenses}
          onAddIncome={addBudgetIncome}
          onDeleteIncome={deleteBudgetIncome}
          onUpdateIncome={updateBudgetIncome}
          onAddExpense={addBudgetExpense}
          onDeleteExpense={deleteBudgetExpense}
          onUpdateExpense={updateBudgetExpense}
          onAddUnforeseen={addUnforeseen}
          onDeleteUnforeseen={deleteUnforeseen}
          onUpdateUnforeseen={updateUnforeseen}
          onToggleUnforeseenPaid={toggleUnforeseenPaid}
          totalBudgetIncome={totalBudgetIncome}
          totalBudgetExpenses={totalBudgetExpenses}
          totalUnforeseen={totalUnforeseen}
          budgetBalance={budgetBalance}
        />
      )}

      <footer className="app-footer">
        <img src="/logo.png" alt="Digital Solutions SA" className="footer-logo" />
        <span className="footer-text">Digital Solutions SA · {new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}</span>
        <span className="footer-text">All data saved locally</span>
      </footer>
    </div>
  );
}
