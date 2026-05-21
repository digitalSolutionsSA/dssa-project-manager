import { useState, useRef, useEffect } from 'react';
import {
  Plus, Trash2, Check, AlertTriangle, X, Edit3,
  DollarSign, ChevronDown, ChevronUp, Zap, Clock,
  Calendar, Palette, Code2, Receipt, ChevronRight,
  CircleCheck, RefreshCw, ChevronLeft, Wallet, Wifi, WifiOff, BookOpen, History,
  LogOut, Users, Tag, ClipboardList, TrendingUp, Download, EyeOff, Eye, FileText,
} from 'lucide-react';
import { useStore, PRESET_COLORS, PRESET_ICONS, EVENT_COLORS, COST_CATEGORIES, todayStr, genId } from './useStore';
import { useAuth } from './useAuth';
import {
  Client, Task, AppUser, CalendarEvent, CostItem, DevProject, DevTask, IncomeSubscription,
  BudgetIncomeItem, BudgetExpenseItem, UnforeseenExpense, MonthlySnapshot, MeetingNote,
  PriceListItem, OddTask,
} from './types';
import PersonalBudget from './PersonalBudget';
import OnceOffCosts from './OnceOffCosts';
import MonthlyHistory from './MonthlyHistory';
import MeetingNotes from './MeetingNotes';
import LoginScreen from './LoginScreen';
import AssistantView from './AssistantView';
import UserManagement from './UserManagement';
import PriceList from './PriceList';
import OddTasks from './OddTasks';
import WorkloadDashboard from './WorkloadDashboard';

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

function demoDate(offset: number): string {
  const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().split('T')[0];
}
function demoMonthKey(offset: number): string {
  const d = new Date(); d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function demoMonthLabel(offset: number): string {
  const d = new Date(); d.setMonth(d.getMonth() + offset);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

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
          <div className="custom-color-row">
            <label className="custom-color-label" htmlFor="custom-color-picker">
              <span className="custom-color-preview" style={{ background: color }} />
              Custom colour
            </label>
            <input
              id="custom-color-picker"
              type="color"
              value={color.startsWith('#') ? color : '#6c63ff'}
              onChange={e => onColor(e.target.value)}
              className="custom-color-input"
            />
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
// MONTHLY INCOME PANEL (subscriptions / recurring invoices)
// ══════════════════════════════════════════════════════════════════
function MonthlyIncomePanel({ subscriptions, onAdd, onDelete, onUpdate }: {
  subscriptions: IncomeSubscription[];
  onAdd: (customerName: string, amount: number, invoiceDate: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, customerName: string, amount: number, invoiceDate: string) => void;
}) {
  const [adding, setAdding]       = useState(false);
  const [newName, setNewName]     = useState('');
  const [newAmt, setNewAmt]       = useState('');
  const [newDate, setNewDate]     = useState(todayStr());
  const [editId, setEditId]       = useState<string | null>(null);
  const [editName, setEditName]   = useState('');
  const [editAmt, setEditAmt]     = useState('');
  const [editDate, setEditDate]   = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const total = subscriptions.reduce((s, i) => s + i.amount, 0);

  const submitAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim(), Number(newAmt) || 0, newDate);
      setNewName(''); setNewAmt(''); setNewDate(todayStr()); setAdding(false);
    }
  };
  const startEdit = (s: IncomeSubscription) => {
    setEditId(s.id); setEditName(s.customerName); setEditAmt(String(s.amount)); setEditDate(s.invoiceDate);
  };
  const submitEdit = () => {
    if (editId && editName.trim()) {
      onUpdate(editId, editName.trim(), Number(editAmt) || 0, editDate);
      setEditId(null);
    }
  };

  return (
    <section className="income-subs-section">
      <div className="section-head">
        <TrendingUp size={16} className="section-icon" />
        <span>Monthly Income</span>
        <span className="section-total" style={{ color: 'var(--green)' }}>{fmtR(total)}</span>
        <button className="icon-btn" style={{ marginLeft: 4 }} onClick={() => setAdding(p => !p)}><Plus size={16} /></button>
        <button className="icon-btn" onClick={() => setCollapsed(p => !p)}>{collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</button>
      </div>

      {!collapsed && (
        <>
          {adding && (
            <div className="cost-add-row">
              <input className="field-input" placeholder="Customer name..." value={newName}
                onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitAdd()} autoFocus />
              <input type="date" className="field-date" value={newDate} onChange={e => setNewDate(e.target.value)} />
              <div className="fin-input-wrap"><span>R</span>
                <input type="number" className="fin-num" placeholder="0" value={newAmt} onChange={e => setNewAmt(e.target.value)} />
              </div>
              <button className="icon-btn accent" onClick={submitAdd}><Check size={15} /></button>
              <button className="icon-btn" onClick={() => setAdding(false)}><X size={15} /></button>
            </div>
          )}
          <div className="costs-list">
            {subscriptions.length === 0 && <p className="empty-msg">No subscriptions yet. Click + to add a recurring income entry.</p>}
            {subscriptions.map(item => (
              editId === item.id ? (
                <div key={item.id} className="cost-row editing">
                  <input className="field-input" value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitEdit()} autoFocus />
                  <input type="date" className="field-date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                  <div className="fin-input-wrap"><span>R</span>
                    <input type="number" className="fin-num" value={editAmt} onChange={e => setEditAmt(e.target.value)} />
                  </div>
                  <button className="icon-btn accent" onClick={submitEdit}><Check size={15} /></button>
                  <button className="icon-btn" onClick={() => setEditId(null)}><X size={15} /></button>
                </div>
              ) : (
                <div key={item.id} className="cost-row">
                  <TrendingUp size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  <span className="cost-name">{item.customerName}</span>
                  <span className="inc-sub-date">{item.invoiceDate}</span>
                  <span className="cost-amount" style={{ color: 'var(--green)' }}>{fmtR(item.amount)}</span>
                  <button className="icon-btn xs" onClick={() => startEdit(item)}><Edit3 size={13} /></button>
                  <button className="icon-btn xs red-h" onClick={() => onDelete(item.id)}><Trash2 size={13} /></button>
                </div>
              )
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// DEMO DATA — comprehensive fake data for every tab
// ══════════════════════════════════════════════════════════════════
const DEMO_ASST_USER: AppUser = {
  id: 'demo-asst-1', username: 'sarah_m', displayName: 'Sarah Mitchell',
  role: 'assistant', pinHash: '', createdAt: '',
  calendarAccess: true, tasksAccess: true, pricesAccess: true,
};
const DEMO_USERS: AppUser[] = [
  { id: 'demo-admin-1', username: 'admin', displayName: 'Johan van der Berg', role: 'admin', pinHash: '', createdAt: '' },
  DEMO_ASST_USER,
  { id: 'demo-asst-2', username: 'mike_t', displayName: 'Mike Thompson', role: 'assistant', pinHash: '', createdAt: '', calendarAccess: false, tasksAccess: true, pricesAccess: false },
];

const DEMO_CLIENTS: Client[] = [
  { id: 'demo-1', name: 'Acme Technologies', color: '#3b82f6', icon: '💼',
    tasks: [
      { id: 'dt-1', title: 'Monthly social media report', dueDate: demoDate(3), status: 'in-progress', assignedTo: 'demo-asst-1', createdAt: '' },
      { id: 'dt-2', title: 'Create content calendar Q3', dueDate: demoDate(7), status: 'not-started', assignedTo: 'demo-asst-1', createdAt: '' },
      { id: 'dt-3', title: 'Google Ads campaign setup', dueDate: demoDate(5), status: 'not-started', createdAt: '' },
    ],
    monthlyIncome: 12000, adSpend: 2500, monthlyCost: 1500, paidThisMonth: true },
  { id: 'demo-2', name: 'Blue Ocean Retail', color: '#06b6d4', icon: '🏪',
    tasks: [
      { id: 'dt-4', title: 'Update Google Business profile', dueDate: demoDate(-1), status: 'completed', assignedTo: 'demo-asst-1', createdAt: '' },
      { id: 'dt-5', title: 'Design product carousel images', dueDate: demoDate(4), status: 'not-started', createdAt: '' },
    ],
    monthlyIncome: 8500, adSpend: 1800, monthlyCost: 800 },
  { id: 'demo-3', name: 'Sunrise Properties', color: '#10b981', icon: '🏠',
    tasks: [
      { id: 'dt-6', title: 'Write property listings copy', dueDate: demoDate(2), status: 'in-progress', assignedTo: 'demo-asst-2', createdAt: '' },
    ],
    monthlyIncome: 15000, adSpend: 3200, monthlyCost: 2000, paidThisMonth: true },
  { id: 'demo-4', name: 'Peak Performance Gym', color: '#f59e0b', icon: '💪',
    tasks: [
      { id: 'dt-7', title: 'Design summer campaign banners', dueDate: demoDate(6), status: 'not-started', assignedTo: 'demo-asst-1', createdAt: '' },
      { id: 'dt-8', title: 'Schedule Instagram posts', dueDate: demoDate(1), status: 'not-started', createdAt: '' },
    ],
    monthlyIncome: 6500, adSpend: 1200, monthlyCost: 600 },
];

const DEMO_COSTS: CostItem[] = [
  { id: 'dc-1', name: 'Design Software Suite', amount: 599, category: 'Subscription', paid: true },
  { id: 'dc-2', name: 'Cloud Hosting Services', amount: 450, category: 'Hosting', paid: false },
  { id: 'dc-3', name: 'Project Management Tool', amount: 299, category: 'Subscription', paid: true },
];

const DEMO_INCOME_SUBS: IncomeSubscription[] = [
  { id: 'dis-1', customerName: 'Peak Performance Gym', amount: 3500, invoiceDate: demoDate(5), createdAt: '' },
  { id: 'dis-2', customerName: 'Sunrise Properties Newsletter', amount: 1200, invoiceDate: demoDate(10), createdAt: '' },
];

const DEMO_DEV_PROJECTS: DevProject[] = [
  {
    id: 'dp-1', clientName: 'Acme Technologies', projectName: 'E-Commerce Website',
    color: '#3b82f6', icon: '🌐', status: 'active',
    depositAmount: 8500, depositPaid: true, finalAmount: 8500, finalPaid: false,
    tasks: [
      { id: 'dpt-1', title: 'Design mockups & wireframes', completed: true, subTasks: [] },
      { id: 'dpt-2', title: 'Frontend development', completed: true, subTasks: [
        { id: 'dpst-1', title: 'Homepage', completed: true },
        { id: 'dpst-2', title: 'Product pages', completed: true },
        { id: 'dpst-3', title: 'Shopping cart', completed: false },
      ]},
      { id: 'dpt-3', title: 'Backend API integration', completed: false, subTasks: [] },
      { id: 'dpt-4', title: 'Testing & QA', completed: false, subTasks: [] },
      { id: 'dpt-5', title: 'Deployment & handover', completed: false, subTasks: [] },
    ],
    createdAt: new Date(Date.now() - 30 * 864e5).toISOString(),
  },
  {
    id: 'dp-2', clientName: 'Sunrise Properties', projectName: 'Property Listing App',
    color: '#10b981', icon: '🏠', status: 'active',
    depositAmount: 5000, depositPaid: true, finalAmount: 10000, finalPaid: false,
    tasks: [
      { id: 'dpt-6', title: 'Requirements gathering', completed: true, subTasks: [] },
      { id: 'dpt-7', title: 'App UI/UX design', completed: false, subTasks: [] },
      { id: 'dpt-8', title: 'Database architecture', completed: false, subTasks: [] },
      { id: 'dpt-9', title: 'Mobile development', completed: false, subTasks: [] },
    ],
    createdAt: new Date(Date.now() - 14 * 864e5).toISOString(),
  },
  {
    id: 'dp-3', clientName: 'Blue Ocean Retail', projectName: 'Brand Identity Package',
    color: '#06b6d4', icon: '🎨', status: 'completed',
    depositAmount: 3500, depositPaid: true, finalAmount: 3500, finalPaid: true,
    tasks: [
      { id: 'dpt-10', title: 'Logo design', completed: true, subTasks: [] },
      { id: 'dpt-11', title: 'Brand guidelines document', completed: true, subTasks: [] },
      { id: 'dpt-12', title: 'Social media kit', completed: true, subTasks: [] },
    ],
    createdAt: new Date(Date.now() - 60 * 864e5).toISOString(),
    completedAt: new Date(Date.now() - 10 * 864e5).toISOString(),
  },
];

const DEMO_EVENTS: CalendarEvent[] = [
  { id: 'de-1', date: demoDate(1),  time: '09:00', title: 'Client strategy call — Acme', description: 'Monthly review and Q3 planning', color: '#3b82f6' },
  { id: 'de-2', date: demoDate(2),  time: '14:30', title: 'Website handover meeting', description: 'Blue Ocean Retail brand package delivery', color: '#06b6d4' },
  { id: 'de-3', date: demoDate(4),  time: '10:00', title: 'New client intro — Peak Performance', description: 'Discuss social media growth strategy', color: '#f59e0b' },
  { id: 'de-4', date: demoDate(7),  time: '11:00', title: 'Invoice follow-up calls', description: 'Follow up on outstanding payments', color: '#ef4444' },
  { id: 'de-5', date: demoDate(9),  time: '15:00', title: 'Weekly team standup', description: 'Progress update with Sarah & Mike', color: '#10b981' },
  { id: 'de-6', date: demoDate(12), time: '09:30', title: 'App design review', description: 'Sunrise Properties — design sign-off', color: '#8b5cf6' },
  { id: 'de-7', date: demoDate(-2), time: '13:00', title: 'Proposal presentation', description: 'Sunrise Properties app project scope', color: '#8b5cf6' },
  { id: 'de-8', date: demoDate(0),  time: '08:30', title: 'Monthly content planning', description: 'Plan all client content for next month', color: '#10b981' },
];

const DEMO_BUDGET_INCOME: BudgetIncomeItem[] = [
  { id: 'dbi-1', name: 'Business Director Salary', amount: 18000, category: 'Business',   recurring: true,  paid: true  },
  { id: 'dbi-2', name: 'Freelance Design Projects', amount: 4500, category: 'Freelance',  recurring: false, paid: false },
  { id: 'dbi-3', name: 'Property Rental Income',    amount: 6200, category: 'Rental',     recurring: true,  paid: true  },
];

const DEMO_BUDGET_EXPENSES: BudgetExpenseItem[] = [
  { id: 'dbe-1', name: 'Bond Repayment',      amount: 9500, category: 'Housing',           recurring: true,  paid: true  },
  { id: 'dbe-2', name: 'Car Finance',          amount: 4200, category: 'Transport',         recurring: true,  paid: true  },
  { id: 'dbe-3', name: 'Monthly Groceries',   amount: 3500, category: 'Food & Groceries',  recurring: true,  paid: false },
  { id: 'dbe-4', name: 'Streaming Services',  amount: 450,  category: 'Subscriptions',     recurring: true,  paid: true  },
  { id: 'dbe-5', name: 'Medical Aid',          amount: 2100, category: 'Medical',           recurring: true,  paid: true  },
  { id: 'dbe-6', name: 'Gym Membership',       amount: 650,  category: 'Personal Care',     recurring: true,  paid: false },
  { id: 'dbe-7', name: 'Fuel',                 amount: 1800, category: 'Transport',         recurring: false, paid: false },
];

const DEMO_UNFORESEEN: UnforeseenExpense[] = [
  { id: 'du-1', name: 'Vehicle service + tyre replacement', amount: 2800, date: demoDate(-5), notes: '80 000 km service', paid: false },
];

const DEMO_SNAPSHOTS: MonthlySnapshot[] = [
  {
    id: 'dms-1', monthKey: demoMonthKey(-1), label: demoMonthLabel(-1),
    savedAt: new Date(Date.now() - 30 * 864e5).toISOString(),
    businessIncome: 42000, businessAdSpend: 8700, businessCosts: 1348, businessProfit: 31952,
    devIncome: 12000, personalIncome: 28700, personalExpenses: 20400, personalUnforeseen: 2800, personalBalance: 5500,
    notes: 'Strong month — E-Commerce deposit received. Beat income target by 18%.',
  },
  {
    id: 'dms-2', monthKey: demoMonthKey(-2), label: demoMonthLabel(-2),
    savedAt: new Date(Date.now() - 60 * 864e5).toISOString(),
    businessIncome: 38500, businessAdSpend: 7200, businessCosts: 1348, businessProfit: 29952,
    devIncome: 7000, personalIncome: 28700, personalExpenses: 19800, personalUnforeseen: 0, personalBalance: 8900,
    notes: 'On target. Signed Blue Ocean Retail branding project.',
  },
  {
    id: 'dms-3', monthKey: demoMonthKey(-3), label: demoMonthLabel(-3),
    savedAt: new Date(Date.now() - 90 * 864e5).toISOString(),
    businessIncome: 36000, businessAdSpend: 6800, businessCosts: 1348, businessProfit: 27852,
    devIncome: 3500, personalIncome: 28700, personalExpenses: 20100, personalUnforeseen: 1200, personalBalance: 7400,
    notes: 'Steady growth. Added Peak Performance Gym as new retainer client.',
  },
];

const DEMO_NOTES: MeetingNote[] = [
  {
    id: 'dn-1', date: demoDate(-3), customerName: 'Acme Technologies', title: 'Q3 Strategy Review',
    notes: 'Client happy with social media performance. Instagram engagement up 34% MoM. Wants to explore TikTok for Q4. Agreed to increase ad budget by R500/month from next month.',
    followUp: 'Send TikTok strategy proposal by end of week. Prepare Q4 content calendar.',
    createdAt: new Date(Date.now() - 3 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 3 * 864e5).toISOString(),
  },
  {
    id: 'dn-2', date: demoDate(-7), customerName: 'Peak Performance Gym', title: 'Initial Discovery Meeting',
    notes: 'New client. No existing social media presence. 3 branches in the Vaal Triangle. Target audience 25-45. Ad budget starting at R1200/month. Owner very enthusiastic.',
    followUp: 'Send onboarding contract and payment details. Create first month content plan.',
    createdAt: new Date(Date.now() - 7 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 7 * 864e5).toISOString(),
  },
  {
    id: 'dn-3', date: demoDate(-14), customerName: 'Sunrise Properties', title: 'App Project Kickoff',
    notes: 'Presented wireframes and project scope. Client approved phased approach. Phase 1: listings & search. Phase 2: agent portal. Phase 3: tenant portal. Timeline: 4 months for Phase 1.',
    followUp: 'Send signed SLA. Request property data export for migration planning.',
    createdAt: new Date(Date.now() - 14 * 864e5).toISOString(), updatedAt: new Date(Date.now() - 14 * 864e5).toISOString(),
  },
];

const DEMO_PRICES: PriceListItem[] = [
  { id: 'dpl-1', productCode: 'SMM-001', name: 'Social Media Starter',   category: 'Social Media Marketing', price: 4500,  description: '3 posts/week, 1 platform, monthly performance report', visibleTo: 'all', createdAt: '' },
  { id: 'dpl-2', productCode: 'SMM-002', name: 'Social Media Growth',    category: 'Social Media Marketing', price: 8500,  description: '5 posts/week, 2 platforms, ad management up to R3000/month', visibleTo: 'all', createdAt: '' },
  { id: 'dpl-3', productCode: 'WEB-001', name: 'Business Website 5-page', category: 'Web Development',       price: 12000, description: 'Responsive 5-page website, CMS, contact form, SEO basics', visibleTo: 'all', createdAt: '' },
  { id: 'dpl-4', productCode: 'WEB-002', name: 'E-Commerce Store',       category: 'Web Development',        price: 18000, description: 'Full e-commerce, payment gateway, inventory management', visibleTo: 'all', createdAt: '' },
  { id: 'dpl-5', productCode: 'APP-001', name: 'Mobile App (React Native)', category: 'App Development',    price: 45000, description: 'Cross-platform mobile app, 3-month development, first year support', visibleTo: 'all', createdAt: '' },
  { id: 'dpl-6', productCode: 'MISC-001', name: 'Logo & Brand Identity', category: 'Misc',                  price: 6500,  description: 'Logo design + brand guidelines + social media templates', visibleTo: 'all', createdAt: '' },
];

const DEMO_ODD_TASKS: OddTask[] = [
  { id: 'dot-1', title: 'Update company portfolio website', dueDate: demoDate(5),  notes: 'Add last 3 projects, refresh testimonials', status: 'in-progress', assignedTo: undefined,        priority: 'high',   createdAt: '' },
  { id: 'dot-2', title: 'Research Meta vs TikTok performance', dueDate: demoDate(8),  notes: 'Compare performance data, prepare recommendation', status: 'not-started', assignedTo: 'demo-asst-1', priority: 'medium', createdAt: '' },
  { id: 'dot-3', title: 'Create staff onboarding checklist',  dueDate: demoDate(14), notes: 'Document tools, access levels, processes', status: 'not-started', assignedTo: undefined,        priority: 'low',    createdAt: '' },
  { id: 'dot-4', title: 'Q2 client satisfaction survey',      dueDate: demoDate(-1), notes: 'Send to all retainer clients via email', status: 'completed', assignedTo: 'demo-asst-1',       priority: 'medium', createdAt: '' },
];

// ══════════════════════════════════════════════════════════════════
// PDF EXPORT MODAL
// ══════════════════════════════════════════════════════════════════
function ExportModal({
  clients, costs, devProjects, incomeSubscriptions, onClose,
  totalMonthlyIncome, totalAdSpend, totalCosts, totalProfit, currentBalance,
}: {
  clients: Client[]; costs: CostItem[]; devProjects: DevProject[];
  incomeSubscriptions: IncomeSubscription[];
  onClose: () => void;
  totalMonthlyIncome: number; totalAdSpend: number; totalCosts: number;
  totalProfit: number; currentBalance: number;
}) {
  const now = new Date();
  const [exportType, setExportType] = useState<'month' | 'range'>('month');
  const [selYear, setSelYear]   = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth()); // 0-based
  const [fromDate, setFromDate] = useState(now.toISOString().split('T')[0].substring(0, 7) + '-01');
  const [toDate, setToDate]     = useState(now.toISOString().split('T')[0]);

  const years  = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  function buildReportHTML() {
    const title = exportType === 'month'
      ? `${MONTH_NAMES[selMonth]} ${selYear} — Business Report`
      : `Report: ${fromDate} to ${toDate}`;

    const isInRange = (dateStr: string) => {
      if (exportType === 'month') {
        const [y, m] = dateStr.split('-').map(Number);
        return y === selYear && m === selMonth + 1;
      }
      return dateStr >= fromDate && dateStr <= toDate;
    };

    const clientRows = clients.map(c =>
      `<tr><td>${c.icon} ${c.name}</td><td>R ${c.monthlyIncome.toLocaleString('en-ZA')}</td><td>R ${c.adSpend.toLocaleString('en-ZA')}</td><td>R ${c.monthlyCost.toLocaleString('en-ZA')}</td><td>${c.paidThisMonth ? '✓ Paid' : 'Pending'}</td></tr>`
    ).join('');

    const devRows = devProjects.filter(p => isInRange(p.createdAt.split('T')[0]) || p.status === 'active').map(p =>
      `<tr><td>${p.icon} ${p.clientName} — ${p.projectName}</td><td>R ${p.depositAmount.toLocaleString('en-ZA')}</td><td>${p.depositPaid ? '✓' : '—'}</td><td>R ${p.finalAmount.toLocaleString('en-ZA')}</td><td>${p.finalPaid ? '✓' : '—'}</td></tr>`
    ).join('');

    const subsRows = incomeSubscriptions.map(s =>
      `<tr><td>${s.customerName}</td><td>${s.invoiceDate}</td><td>R ${s.amount.toLocaleString('en-ZA')}</td></tr>`
    ).join('');

    const costRows = costs.map(c =>
      `<tr><td>${c.name}</td><td>${c.category}</td><td>R ${c.amount.toLocaleString('en-ZA')}</td><td>${c.paid ? '✓ Paid' : 'Unpaid'}</td></tr>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${title}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;margin:0;padding:32px;font-size:14px;}
  h1{font-size:22px;margin:0 0 4px;color:#1e3a5f;}
  .subtitle{color:#64748b;font-size:13px;margin-bottom:28px;}
  .logo-bar{display:flex;align-items:center;gap:16px;margin-bottom:24px;border-bottom:2px solid #3b82f6;padding-bottom:16px;}
  .company{font-size:18px;font-weight:700;color:#1e3a5f;}
  section{margin-bottom:28px;}
  h2{font-size:15px;font-weight:700;color:#1e3a5f;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;}
  .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
  .sum-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;}
  .sum-card-label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px;}
  .sum-card-val{font-size:20px;font-weight:700;color:#1e3a5f;}
  .sum-card-val.green{color:#059669;}
  .sum-card-val.red{color:#dc2626;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{background:#1e3a5f;color:#fff;padding:8px 12px;text-align:left;font-weight:600;font-size:12px;}
  td{padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155;}
  tr:nth-child(even) td{background:#f8fafc;}
  .footer{margin-top:40px;border-top:1px solid #e2e8f0;padding-top:14px;font-size:12px;color:#94a3b8;display:flex;justify-content:space-between;}
  @media print{body{padding:16px;}@page{margin:20mm;}}
</style>
</head><body>
<div class="logo-bar">
  <div><div class="company">Digital Solutions SA</div><div style="color:#64748b;font-size:12px;">Business Report</div></div>
</div>
<h1>${title}</h1>
<p class="subtitle">Generated on ${new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

<section>
<h2>Financial Summary</h2>
<div class="summary-grid">
  <div class="sum-card"><div class="sum-card-label">Monthly Income</div><div class="sum-card-val green">R ${totalMonthlyIncome.toLocaleString('en-ZA')}</div></div>
  <div class="sum-card"><div class="sum-card-label">Ad Spend</div><div class="sum-card-val">R ${totalAdSpend.toLocaleString('en-ZA')}</div></div>
  <div class="sum-card"><div class="sum-card-label">Total Costs</div><div class="sum-card-val">R ${totalCosts.toLocaleString('en-ZA')}</div></div>
  <div class="sum-card"><div class="sum-card-label">Net Profit</div><div class="sum-card-val ${totalProfit >= 0 ? 'green' : 'red'}">R ${totalProfit.toLocaleString('en-ZA')}</div></div>
</div>
</section>

${clients.length > 0 ? `<section>
<h2>Retainer Clients (${clients.length})</h2>
<table><thead><tr><th>Client</th><th>Income</th><th>Ad Spend</th><th>Client Costs</th><th>Status</th></tr></thead>
<tbody>${clientRows}</tbody></table></section>` : ''}

${incomeSubscriptions.length > 0 ? `<section>
<h2>Monthly Income Subscriptions (${incomeSubscriptions.length})</h2>
<table><thead><tr><th>Customer</th><th>Invoice Date</th><th>Amount</th></tr></thead>
<tbody>${subsRows}</tbody></table></section>` : ''}

${devProjects.length > 0 ? `<section>
<h2>Development Projects</h2>
<table><thead><tr><th>Project</th><th>Deposit</th><th>Dep. Paid</th><th>Final</th><th>Final Paid</th></tr></thead>
<tbody>${devRows}</tbody></table></section>` : ''}

${costs.length > 0 ? `<section>
<h2>Monthly Costs &amp; Subscriptions</h2>
<table><thead><tr><th>Name</th><th>Category</th><th>Amount</th><th>Status</th></tr></thead>
<tbody>${costRows}</tbody></table></section>` : ''}

<div class="footer">
  <span>Digital Solutions SA — Confidential</span>
  <span>Bank Balance: R ${currentBalance.toLocaleString('en-ZA')}</span>
</div>
</body></html>`;
  }

  const handleExport = () => {
    const html = buildReportHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    setTimeout(() => { if (win) win.print(); URL.revokeObjectURL(url); }, 600);
    onClose();
  };

  return (
    <Overlay onClick={onClose}>
      <div className="event-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottomColor: '#3b82f6' }}>
          <FileText size={18} style={{ color: '#3b82f6' }} />
          <div>
            <h3 className="modal-title">Export to PDF</h3>
            <p className="modal-sub">Choose what period to include in the report</p>
          </div>
          <button className="icon-btn ml-auto" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <label className="field-label">Export Type</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              className={`export-type-btn ${exportType === 'month' ? 'active' : ''}`}
              onClick={() => setExportType('month')}>
              Specific Month
            </button>
            <button
              className={`export-type-btn ${exportType === 'range' ? 'active' : ''}`}
              onClick={() => setExportType('range')}>
              Date Range
            </button>
          </div>

          {exportType === 'month' ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Month</label>
                <select className="field-select" value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}>
                  {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Year</label>
                <select className="field-select" value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">From</label>
                <input type="date" className="field-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">To</label>
                <input type="date" className="field-input" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.82rem', color: 'var(--text3)', marginTop: 12 }}>
            The report will open in a new tab. Use your browser's <strong>Print → Save as PDF</strong> to save it.
          </p>

          <div className="modal-actions">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" style={{ background: '#3b82f6' }} onClick={handleExport}>
              <Download size={15} /> Export Report
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ══════════════════════════════════════════════════════════════════
// COSTS PANEL
// ══════════════════════════════════════════════════════════════════
function CostsPanel({ costs, onAdd, onDelete, onUpdate, onTogglePaid }: {
  costs: CostItem[];
  onAdd: (n: string, a: number, c: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, n: string, a: number, c: string) => void;
  onTogglePaid: (id: string) => void;
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

  const total     = costs.reduce((s, c) => s + c.amount, 0);
  const totalPaid = costs.filter(c => c.paid).reduce((s, c) => s + c.amount, 0);
  const unpaidCount = costs.filter(c => !c.paid).length;

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
        {unpaidCount > 0 && <span className="unforeseen-badge">{unpaidCount} unpaid</span>}
        <span className="section-total">{fmtR(totalPaid)} <span className="section-total-of">/ {fmtR(total)}</span></span>
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
                    <div key={item.id} className={`cost-row ${item.paid ? 'cost-paid' : ''}`}>
                      <button
                        className={`paid-toggle-btn ${item.paid ? 'paid' : ''}`}
                        onClick={() => onTogglePaid(item.id)}
                        title={item.paid ? 'Mark as unpaid' : 'Mark as paid'}
                      >
                        {item.paid ? <Check size={11} strokeWidth={3} /> : null}
                      </button>
                      <span className="cost-name">{item.name}</span>
                      {item.paid && <span className="badge-paid">Paid</span>}
                      <span className={`cost-amount ${item.paid ? 'paid-amount' : ''}`}>{fmtR(item.amount)}</span>
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
function FinancialsPanel({ client, onUpdate, onToggleAdSpendPaid }: {
  client: Client;
  onUpdate: (f: 'monthlyIncome' | 'adSpend' | 'monthlyCost', v: number) => void;
  onToggleAdSpendPaid: () => void;
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
          {field === 'adSpend' && client.adSpend > 0 && (
            <button
              className={`paid-toggle-btn ${client.adSpendPaid ? 'paid' : ''}`}
              onClick={onToggleAdSpendPaid}
              title={client.adSpendPaid ? 'Ad spend paid ✓ — click to undo' : 'Mark ad spend as paid'}
            >
              {client.adSpendPaid ? <Check size={11} strokeWidth={3} /> : null}
            </button>
          )}
          {field === 'adSpend' && client.adSpend > 0 && client.adSpendPaid && (
            <span className="badge-paid">Paid</span>
          )}
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
  onUpdateFinancials, onTogglePaid, onToggleAdSpendPaid, onAddTask, onToggleTask, onDeleteTask, onEditTask
}: {
  client: Client; users: AppUser[]; assistants: AppUser[];
  onDeleteClient: () => void; onUpdateName: (n: string) => void;
  onUpdateColor: (c: string) => void; onUpdateIcon: (i: string) => void;
  onUpdateFinancials: (f: 'monthlyIncome' | 'adSpend' | 'monthlyCost', v: number) => void;
  onTogglePaid: () => void; onToggleAdSpendPaid: () => void;
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
          {/* Top row: emoji + all action buttons */}
          <div className="client-header-top">
            <span className="client-emoji">{client.icon}</span>
            <div className="client-header-actions">
            {overdueTasks.length > 0 && (
              <span className="overdue-count" onClick={() => setAlertTask(overdueTasks[0])}>⚠ {overdueTasks.length}</span>
            )}
            <span className="task-count">{pending.length} open</span>
            <button
              className={`client-paid-btn ${client.paidThisMonth ? 'paid' : ''}`}
              onClick={onTogglePaid}
              title={client.paidThisMonth ? 'Paid this month ✓ — click to undo' : 'Mark as paid this month'}
            >
              <CircleCheck size={14} />
              <span>{client.paidThisMonth ? 'Paid' : 'Unpaid'}</span>
            </button>
            <button className="icon-btn dark" onClick={() => setShowCustomise(true)}><Palette size={14} /></button>
            <button className="icon-btn dark" onClick={() => setShowFin(p => !p)}><DollarSign size={14} /></button>
            <button className="icon-btn dark" onClick={() => setCollapsed(p => !p)}>{collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</button>
            <button className="icon-btn dark-red" onClick={onDeleteClient}><Trash2 size={14} /></button>
            </div>{/* end client-header-actions */}
          </div>{/* end client-header-top */}

          {/* Bottom row: client name */}
          {editingName
            ? <input className="client-name-input" value={nameVal} onChange={e => setNameVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()} onBlur={saveName} autoFocus />
            : <h2 className="client-name" onDoubleClick={() => setEditingName(true)}>{client.name}</h2>
          }
        </div>

        {!collapsed && (
          <div className="client-body">
            {showFin && <FinancialsPanel client={client} onUpdate={onUpdateFinancials} onToggleAdSpendPaid={onToggleAdSpendPaid} />}
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
function SummaryBar({
  currentBalance, onBalanceChange,
  totalIncome, totalReceivedIncome, totalAdSpend, totalCosts,
  totalPending, totalProfit, businessBalance,
  onResetMonth,
}: {
  currentBalance: number; onBalanceChange: (n: number) => void;
  totalIncome: number; totalReceivedIncome: number; totalAdSpend: number;
  totalCosts: number; totalPending: number; totalProfit: number;
  businessBalance: number; onResetMonth: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw]         = useState('');

  function startEdit() { setRaw(currentBalance === 0 ? '' : String(currentBalance)); setEditing(true); }
  function commitEdit() {
    const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
    onBalanceChange(isNaN(n) ? 0 : n);
    setEditing(false);
  }

  const unpaidCount = Math.round((totalIncome - totalReceivedIncome) / (totalIncome || 1) * 100);

  return (
    <div className="summary-wrap">
      {/* Balance row */}
      <div className="balance-row">
        <div className="balance-card">
          <span className="balance-lbl">Current Bank Balance</span>
          {editing ? (
            <div className="balance-edit-row">
              <span className="balance-prefix">R</span>
              <input
                className="balance-input"
                type="number"
                value={raw}
                onChange={e => setRaw(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
                autoFocus
                placeholder="0"
              />
            </div>
          ) : (
            <button className="balance-val" onClick={startEdit} title="Click to edit balance">
              {fmtR(currentBalance)}
              <Edit3 size={12} className="balance-edit-icon" />
            </button>
          )}
        </div>
        <div className={`balance-card total ${businessBalance >= 0 ? 'pos' : 'neg'}`}>
          <span className="balance-lbl">Available Balance</span>
          <span className="balance-val-display">{fmtR(businessBalance)}</span>
          <span className="balance-formula">Bank + Received − Paid Costs</span>
        </div>
        <button className="btn-reset-month" onClick={onResetMonth} title="Clear all paid flags for a new month">
          <RefreshCw size={13} /> New Month
        </button>
      </div>

      {/* Income progress bar */}
      {totalIncome > 0 && (
        <div className="income-progress-wrap">
          <div className="income-progress-labels">
            <span>Received <strong>{fmtR(totalReceivedIncome)}</strong></span>
            <span style={{ color: 'var(--text3)' }}>Expected <strong>{fmtR(totalIncome)}</strong>
              {totalReceivedIncome < totalIncome && <span className="income-outstanding"> · {fmtR(totalIncome - totalReceivedIncome)} outstanding</span>}
            </span>
          </div>
          <div className="income-progress-bar">
            <div
              className="income-progress-fill"
              style={{ width: `${Math.min(100, (totalReceivedIncome / totalIncome) * 100)}%` }}
            />
          </div>
          <span className="income-progress-pct">{Math.round((totalReceivedIncome / totalIncome) * 100)}% collected</span>
        </div>
      )}

      {/* Stats row */}
      <div className="summary-bar">
        <div className="sum-item income">
          <span className="sum-lbl">Expected Income</span>
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
  const { clients, updateTaskStatus, eventsForDate, priceList, oddTasks, updateOddTaskStatus } = useStore();
  const assistants = auth.users.filter(u => u.role === 'assistant');
  return (
    <AssistantView
      currentUser={auth.currentUser!}
      clients={clients}
      oddTasks={oddTasks}
      onUpdateStatus={updateTaskStatus}
      onUpdateOddTaskStatus={updateOddTaskStatus}
      onLogout={auth.logout}
      eventsForDate={eventsForDate}
      priceList={priceList}
      allAssistants={assistants}
    />
  );
}

function AdminApp({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const {
    clients, addClient, deleteClient,
    updateClientName, updateClientColor, updateClientIcon, updateClientFinancials,
    addTask, toggleTask, deleteTask, editTask, assignTask, updateTaskStatus,
    costs, addCost, deleteCost, updateCost, toggleCostPaid,
    devProjects, addDevProject, deleteDevProject, updateDevProject,
    completeDevProject, reopenDevProject, updateDevProjectColor, updateDevProjectIcon,
    addDevTask, toggleDevTask, deleteDevTask, editDevTask,
    addSubTask, toggleSubTask, deleteSubTask,
    addEvent, deleteEvent, editEvent, eventsForDate,
    budgetIncome, budgetExpenses, unforeseenExpenses,
    addBudgetIncome, deleteBudgetIncome, updateBudgetIncome, toggleBudgetIncomePaid,
    addBudgetExpense, deleteBudgetExpense, updateBudgetExpense, toggleBudgetExpensePaid,
    addUnforeseen, deleteUnforeseen, updateUnforeseen, toggleUnforeseenPaid,
    onceOffCosts, monthlySnapshots, meetingNotes,
    addOnceOffCost, deleteOnceOffCost, updateOnceOffCost, toggleOnceOffPaid,
    saveMonthSnapshot, deleteSnapshot, updateSnapshotNotes,
    addMeetingNote, deleteMeetingNote, updateMeetingNote,
    priceList, addPriceItem, deletePriceItem, updatePriceItem,
    oddTasks, addOddTask, deleteOddTask, updateOddTask, updateOddTaskStatus, assignOddTask,
    incomeSubscriptions, addIncomeSubscription, deleteIncomeSubscription, updateIncomeSubscription,
    isFirebaseConfigured, fbReady, fbError,
    currentBalance, setCurrentBalance,
    totalMonthlyIncome, totalReceivedIncome, totalAdSpend, totalCosts, totalOnceOffUnpaid,
    totalPendingIncome, totalProfit, businessBalance, overdueCount,
    totalBudgetIncome, totalPaidBudgetIncome, totalBudgetExpenses, totalPaidBudgetExpenses,
    totalUnforeseen, budgetBalance,
    allTimeBusinessIncome, allTimeBusinessProfit, allTimePersonalBalance,
    toggleClientPaid, toggleClientAdSpendPaid, resetMonthlyPayments,
  } = useStore();

  const [newClientName, setNewClientName]   = useState('');
  const [showAddClient, setShowAddClient]   = useState(false);
  const [showAddDev, setShowAddDev]         = useState(false);
  const [newDevClient, setNewDevClient]     = useState('');
  const [newDevProject, setNewDevProject]   = useState('');
  const [activeTab, setActiveTab]           = useState<'retainer' | 'dev' | 'calendar' | 'budget' | 'history' | 'notes' | 'users' | 'prices' | 'tasks'>('retainer');
  const [isDemoMode, setIsDemoMode]         = useState(false);
  const [showExport, setShowExport]         = useState(false);
  const [showAssistantView, setShowAssistantView] = useState(false);
  const assistants = auth.users.filter(u => u.role === 'assistant');
  const clientInputRef = useRef<HTMLInputElement>(null);

  // ── Demo display overrides ────────────────────────────────────────
  const D = isDemoMode; // shorthand
  const displayClients   = D ? DEMO_CLIENTS         : clients;
  const displayCosts     = D ? DEMO_COSTS           : costs;
  const displayDevProjs  = D ? DEMO_DEV_PROJECTS    : devProjects;
  const displayUsers     = D ? DEMO_USERS           : auth.users;
  const displayOddTasks  = D ? DEMO_ODD_TASKS       : oddTasks;
  const displayNotes     = D ? DEMO_NOTES           : meetingNotes;
  const displayPrices    = D ? DEMO_PRICES          : priceList;
  const displaySnapshots = D ? DEMO_SNAPSHOTS       : monthlySnapshots;
  const displayBudgetInc = D ? DEMO_BUDGET_INCOME   : budgetIncome;
  const displayBudgetExp = D ? DEMO_BUDGET_EXPENSES : budgetExpenses;
  const displayUnforeseen= D ? DEMO_UNFORESEEN      : unforeseenExpenses;
  const displayIncSubs   = D ? DEMO_INCOME_SUBS     : incomeSubscriptions;
  const demoEventsForDate = (date: string) => DEMO_EVENTS.filter(e => e.date === date).sort((a,b) => a.time.localeCompare(b.time));
  const displayEventsForDate = D ? demoEventsForDate : eventsForDate;

  // Demo financial totals
  const demoIncome    = D ? DEMO_CLIENTS.reduce((s,c)=>s+c.monthlyIncome,0) : totalMonthlyIncome;
  const demoAdSpend   = D ? DEMO_CLIENTS.reduce((s,c)=>s+c.adSpend,0)       : totalAdSpend;
  const demoCosts     = D ? DEMO_COSTS.reduce((s,c)=>s+c.amount,0)          : totalCosts;
  const demoProfit    = D ? demoIncome - demoAdSpend - demoCosts             : totalProfit;
  const demoReceived  = D ? DEMO_CLIENTS.filter(c=>c.paidThisMonth).reduce((s,c)=>s+c.monthlyIncome,0) : totalReceivedIncome;
  const demoBalance   = D ? 48750 : currentBalance;
  const demoAvailable = D ? demoBalance + demoReceived - demoCosts : businessBalance;
  const demoPending   = D ? DEMO_DEV_PROJECTS.reduce((s,p)=>{ let v=0; if(!p.depositPaid)v+=p.depositAmount; if(!p.finalPaid)v+=p.finalAmount; return s+v; },0) : totalPendingIncome;

  // Demo budget totals
  const demoBudgetIncTotal  = D ? DEMO_BUDGET_INCOME.reduce((s,i)=>s+i.amount,0)  : totalBudgetIncome;
  const demoPaidBudgetInc   = D ? DEMO_BUDGET_INCOME.filter(i=>i.paid).reduce((s,i)=>s+i.amount,0)  : totalPaidBudgetIncome;
  const demoBudgetExpTotal  = D ? DEMO_BUDGET_EXPENSES.reduce((s,e)=>s+e.amount,0) : totalBudgetExpenses;
  const demoPaidBudgetExp   = D ? DEMO_BUDGET_EXPENSES.filter(e=>e.paid).reduce((s,e)=>s+e.amount,0) : totalPaidBudgetExpenses;
  const demoUnforeseenTotal = D ? DEMO_UNFORESEEN.filter(e=>!e.paid).reduce((s,e)=>s+e.amount,0)    : totalUnforeseen;
  const demoBudgetBalance   = D ? demoPaidBudgetInc - demoPaidBudgetExp - demoUnforeseenTotal        : budgetBalance;

  // Demo history totals
  const demoAllTimeInc     = D ? DEMO_SNAPSHOTS.reduce((s,sn)=>s+(sn.businessIncome||0)+(sn.devIncome||0),0)   : allTimeBusinessIncome;
  const demoAllTimeProfit  = D ? DEMO_SNAPSHOTS.reduce((s,sn)=>s+(sn.businessProfit||0)+(sn.devIncome||0),0)   : allTimeBusinessProfit;
  const demoAllTimeBalance = D ? DEMO_SNAPSHOTS.reduce((s,sn)=>s+(sn.personalBalance||0),0)                    : allTimePersonalBalance;

  const displayActiveDev    = displayDevProjs.filter(p => p.status === 'active');
  const displayCompletedDev = displayDevProjs.filter(p => p.status === 'completed');

  const noop = () => {};
  const noopStr = (_: string) => {};

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

  const activeDev    = devProjects.filter(p => p.status === 'active');   // real, used elsewhere
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
          <span className="header-eyebrow">Hi, {auth.currentUser?.displayName || auth.currentUser?.username} 👋</span>
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
          <button className="btn-export" onClick={() => setShowExport(true)} title="Export data to PDF">
            <Download size={14} />
            <span className="btn-export-label">Export</span>
          </button>
          <button
            className={`btn-demo ${isDemoMode ? 'active' : ''}`}
            onClick={() => setIsDemoMode(p => !p)}
            title={isDemoMode ? 'Exit demo mode — show real data' : 'Demo mode — hide real client data'}
          >
            {isDemoMode ? <Eye size={14} /> : <EyeOff size={14} />}
            <span className="btn-demo-label">{isDemoMode ? 'Real' : 'Demo'}</span>
          </button>
          <button className="btn-logout" onClick={auth.logout}>
            <LogOut size={14} />
            <span className="btn-logout-label">Sign Out</span>
          </button>
          {overdueCount > 0 && (
            <div className="header-overdue">
              <Zap size={14} /> {overdueCount}
            </div>
          )}
        </div>
      </header>

      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="demo-banner">
          <EyeOff size={16} />
          <span>DEMO MODE — Showing sample data. Your real data is safe and hidden.</span>
          <button className="demo-banner-asst" onClick={() => setShowAssistantView(true)}>
            👤 Assistant View
          </button>
          <button onClick={() => setIsDemoMode(false)}>Exit Demo</button>
        </div>
      )}

      {/* Assistant quickview overlay */}
      {showAssistantView && (
        <div className="asst-preview-overlay">
          <div className="asst-preview-bar">
            <span>👤 Assistant Preview — <strong>Sarah Mitchell</strong> (Tasks + Calendar + Prices enabled)</span>
            <button className="asst-preview-close" onClick={() => setShowAssistantView(false)}>
              <X size={16} /> Close Preview
            </button>
          </div>
          <div className="asst-preview-content">
            <AssistantView
              currentUser={DEMO_ASST_USER}
              clients={DEMO_CLIENTS}
              oddTasks={DEMO_ODD_TASKS}
              onUpdateStatus={noop as never}
              onUpdateOddTaskStatus={noop as never}
              onLogout={() => setShowAssistantView(false)}
              eventsForDate={demoEventsForDate}
              priceList={DEMO_PRICES}
              allAssistants={DEMO_USERS.filter(u => u.role === 'assistant')}
            />
          </div>
        </div>
      )}

      {/* Export modal */}
      {showExport && (
        <ExportModal
          clients={displayClients}
          costs={displayCosts}
          devProjects={displayDevProjs}
          incomeSubscriptions={displayIncSubs}
          onClose={() => setShowExport(false)}
          totalMonthlyIncome={demoIncome}
          totalAdSpend={demoAdSpend}
          totalCosts={demoCosts}
          totalProfit={demoProfit}
          currentBalance={demoBalance}
        />
      )}

      {/* Summary */}
      <SummaryBar
        currentBalance={demoBalance} onBalanceChange={isDemoMode ? () => {} : setCurrentBalance}
        totalIncome={demoIncome} totalReceivedIncome={demoReceived}
        totalAdSpend={demoAdSpend} totalCosts={demoCosts}
        totalPending={demoPending} totalProfit={demoProfit}
        businessBalance={demoAvailable} onResetMonth={isDemoMode ? () => {} : resetMonthlyPayments}
      />

      {/* Monthly Income (subscriptions) */}
      <MonthlyIncomePanel
        subscriptions={displayIncSubs}
        onAdd={D ? noop as never : addIncomeSubscription}
        onDelete={D ? noopStr : deleteIncomeSubscription}
        onUpdate={D ? noop as never : updateIncomeSubscription}
      />

      {/* Costs */}
      <CostsPanel costs={displayCosts} onAdd={addCost} onDelete={deleteCost} onUpdate={updateCost} onTogglePaid={toggleCostPaid} />

      {!isDemoMode && (
        <OnceOffCosts
          items={onceOffCosts}
          onAdd={addOnceOffCost}
          onDelete={deleteOnceOffCost}
          onUpdate={updateOnceOffCost}
          onTogglePaid={toggleOnceOffPaid}
          totalUnpaid={totalOnceOffUnpaid}
        />
      )}

      {/* Tab nav */}
      <div className="tab-nav" role="tablist">
        <button className={`tab-btn ${activeTab === 'retainer' ? 'active' : ''}`} onClick={() => setActiveTab('retainer')}>
          <DollarSign size={15} /><span className="tab-label"> Retainer</span>
          <span className="tab-count">{displayClients.length}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'dev' ? 'active' : ''}`} onClick={() => setActiveTab('dev')}>
          <Code2 size={15} /><span className="tab-label"> Dev</span>
          <span className="tab-count">{displayActiveDev.length}</span>
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
        <button className={`tab-btn ${activeTab === 'prices' ? 'active' : ''}`} onClick={() => setActiveTab('prices')}>
          <Tag size={15} /><span className="tab-label"> Prices</span>
          {displayPrices.length > 0 && <span className="tab-count">{displayPrices.length}</span>}
        </button>
        <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          <ClipboardList size={15} /><span className="tab-label"> Tasks</span>
          {displayOddTasks.filter(t => t.status !== 'completed').length > 0 && (
            <span className="tab-count">{displayOddTasks.filter(t => t.status !== 'completed').length}</span>
          )}
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={15} /><span className="tab-label"> Users</span>
          {displayUsers.length > 0 && <span className="tab-count">{displayUsers.length}</span>}
        </button>
      </div>

      {/* RETAINER TAB */}
      {activeTab === 'retainer' && (
        <>
          {!isDemoMode && <UpcomingStrip eventsForDate={eventsForDate} onAddEvent={addEvent} onDeleteEvent={deleteEvent} onEditEvent={editEvent} />}
          <main className="client-grid">
            {displayClients.map(c => (
              <ClientCard key={c.id} client={c}
                users={auth.users} assistants={assistants}
                onDeleteClient={() => deleteClient(c.id)}
                onUpdateName={n => updateClientName(c.id, n)}
                onUpdateColor={col => updateClientColor(c.id, col)}
                onUpdateIcon={i => updateClientIcon(c.id, i)}
                onUpdateFinancials={(f, v) => updateClientFinancials(c.id, f, v)}
                onTogglePaid={() => toggleClientPaid(c.id)}
                onToggleAdSpendPaid={() => toggleClientAdSpendPaid(c.id)}
                onAddTask={(t, d, uid) => addTask(c.id, t, d, uid)}
                onToggleTask={tid => toggleTask(c.id, tid)}
                onDeleteTask={tid => deleteTask(c.id, tid)}
                onEditTask={(tid, t, d) => editTask(c.id, tid, t, d)} />
            ))}
            {!isDemoMode && (
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
            )}
          </main>
        </>
      )}

      {/* DEVELOPMENT TAB */}
      {activeTab === 'dev' && (
        <main className="dev-section">
          <div className="dev-grid">
            {displayActiveDev.map(p => (
              <DevProjectCard key={p.id} project={p}
                onDelete={D ? noop : () => deleteDevProject(p.id)}
                onUpdate={D ? noop as never : changes => updateDevProject(p.id, changes)}
                onComplete={D ? noop : () => completeDevProject(p.id)}
                onReopen={D ? noop : () => reopenDevProject(p.id)}
                onUpdateColor={D ? noopStr : c => updateDevProjectColor(p.id, c)}
                onUpdateIcon={D ? noopStr : i => updateDevProjectIcon(p.id, i)}
                onAddTask={D ? noopStr : t => addDevTask(p.id, t)}
                onToggleTask={D ? noopStr : tid => toggleDevTask(p.id, tid)}
                onDeleteTask={D ? noopStr : tid => deleteDevTask(p.id, tid)}
                onEditTask={D ? noop as never : (tid, t) => editDevTask(p.id, tid, t)}
                onAddSub={D ? noop as never : (tid, t) => addSubTask(p.id, tid, t)}
                onToggleSub={D ? noop as never : (tid, sid) => toggleSubTask(p.id, tid, sid)}
                onDeleteSub={D ? noop as never : (tid, sid) => deleteSubTask(p.id, tid, sid)} />
            ))}
            {!D && (
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
            )}
          </div>

          {displayCompletedDev.length > 0 && (
            <details className="completed-dev-section">
              <summary>Completed Projects ({displayCompletedDev.length})</summary>
              <div className="dev-grid" style={{ marginTop: 16 }}>
                {displayCompletedDev.map(p => (
                  <DevProjectCard key={p.id} project={p}
                    onDelete={D ? noop : () => deleteDevProject(p.id)}
                    onUpdate={D ? noop as never : changes => updateDevProject(p.id, changes)}
                    onComplete={D ? noop : () => completeDevProject(p.id)}
                    onReopen={D ? noop : () => reopenDevProject(p.id)}
                    onUpdateColor={D ? noopStr : c => updateDevProjectColor(p.id, c)}
                    onUpdateIcon={D ? noopStr : i => updateDevProjectIcon(p.id, i)}
                    onAddTask={D ? noopStr : t => addDevTask(p.id, t)}
                    onToggleTask={D ? noopStr : tid => toggleDevTask(p.id, tid)}
                    onDeleteTask={D ? noopStr : tid => deleteDevTask(p.id, tid)}
                    onEditTask={D ? noop as never : (tid, t) => editDevTask(p.id, tid, t)}
                    onAddSub={D ? noop as never : (tid, t) => addSubTask(p.id, tid, t)}
                    onToggleSub={D ? noop as never : (tid, sid) => toggleSubTask(p.id, tid, sid)}
                    onDeleteSub={D ? noop as never : (tid, sid) => deleteSubTask(p.id, tid, sid)} />
                ))}
              </div>
            </details>
          )}
        </main>
      )}

      {/* CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <FullCalendar
          eventsForDate={displayEventsForDate}
          onAddEvent={D ? noop as never : addEvent}
          onDeleteEvent={D ? noopStr : deleteEvent}
          onEditEvent={D ? noop as never : editEvent}
        />
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <MonthlyHistory
          snapshots={displaySnapshots}
          onSave={D ? noop as never : saveMonthSnapshot}
          onDelete={D ? noopStr : deleteSnapshot}
          onUpdateNotes={D ? noop as never : updateSnapshotNotes}
          allTimeBusinessIncome={demoAllTimeInc}
          allTimeBusinessProfit={demoAllTimeProfit}
          allTimePersonalBalance={demoAllTimeBalance}
          currentBusinessIncome={D ? demoIncome : totalMonthlyIncome}
          currentBusinessProfit={D ? demoProfit : totalProfit}
          currentPersonalBalance={D ? demoBudgetBalance : budgetBalance}
        />
      )}

      {/* NOTES TAB */}
      {activeTab === 'notes' && (
        <MeetingNotes
          notes={displayNotes}
          onAdd={D ? noop as never : addMeetingNote}
          onDelete={D ? noopStr : deleteMeetingNote}
          onUpdate={D ? noop as never : updateMeetingNote}
        />
      )}

      {/* PRICES TAB */}
      {activeTab === 'prices' && (
        <main className="dev-section">
          <PriceList
            items={displayPrices}
            assistants={D ? DEMO_USERS.filter(u => u.role === 'assistant') : assistants}
            mode="admin"
            onAdd={D ? noop as never : data => addPriceItem(data.productCode, data.name, data.category, data.price, data.description, data.visibleTo)}
            onUpdate={D ? noop as never : (id, data) => updatePriceItem(id, data.productCode, data.name, data.category, data.price, data.description, data.visibleTo)}
            onDelete={D ? noopStr : deletePriceItem}
          />
        </main>
      )}

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <main className="dev-section">
          <WorkloadDashboard
            clients={displayClients}
            oddTasks={displayOddTasks}
            users={displayUsers}
          />
          <OddTasks
            tasks={displayOddTasks}
            users={displayUsers}
            onAdd={D ? noop as never : (title, dueDate, notes, assignedTo, priority) => addOddTask(title, dueDate, notes, assignedTo, priority)}
            onDelete={D ? noopStr : deleteOddTask}
            onUpdate={D ? noop as never : (id, title, dueDate, notes, priority) => updateOddTask(id, title, dueDate, notes, priority)}
            onStatusChange={D ? noop as never : (id, status) => updateOddTaskStatus(id, status)}
            onAssign={D ? noop as never : (id, uid) => assignOddTask(id, uid)}
          />
        </main>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <UserManagement
          users={displayUsers}
          currentUserId={auth.currentUser!.id}
          onAddUser={D ? noop as never : auth.addUser}
          onDeleteUser={D ? noop as never : auth.deleteUser}
          onChangePin={D ? noop as never : auth.changePin}
          onUpdatePermissions={D ? noop as never : auth.updateUserPermissions}
        />
      )}

      {/* BUDGET TAB */}
      {activeTab === 'budget' && (
        <PersonalBudget
          budgetIncome={displayBudgetInc}
          budgetExpenses={displayBudgetExp}
          unforeseenExpenses={displayUnforeseen}
          onAddIncome={D ? noop as never : addBudgetIncome}
          onDeleteIncome={D ? noopStr : deleteBudgetIncome}
          onUpdateIncome={D ? noop as never : updateBudgetIncome}
          onToggleIncomePaid={D ? noopStr : toggleBudgetIncomePaid}
          onAddExpense={D ? noop as never : addBudgetExpense}
          onDeleteExpense={D ? noopStr : deleteBudgetExpense}
          onUpdateExpense={D ? noop as never : updateBudgetExpense}
          onToggleExpensePaid={D ? noopStr : toggleBudgetExpensePaid}
          onAddUnforeseen={D ? noop as never : addUnforeseen}
          onDeleteUnforeseen={D ? noopStr : deleteUnforeseen}
          onUpdateUnforeseen={D ? noop as never : updateUnforeseen}
          onToggleUnforeseenPaid={D ? noopStr : toggleUnforeseenPaid}
          totalBudgetIncome={demoBudgetIncTotal}
          totalPaidBudgetIncome={demoPaidBudgetInc}
          totalBudgetExpenses={demoBudgetExpTotal}
          totalPaidBudgetExpenses={demoPaidBudgetExp}
          totalUnforeseen={demoUnforeseenTotal}
          budgetBalance={demoBudgetBalance}
        />
      )}

      <footer className="app-footer">
        <img src="/logo-bg.png" alt="Digital Solutions SA" className="footer-logo" />
        <span className="footer-text">Digital Solutions SA · {new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}</span>
        <span className="footer-text">All data saved locally</span>
      </footer>
    </div>
  );
}
