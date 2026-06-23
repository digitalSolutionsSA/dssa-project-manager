import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, X, Clock, CalendarDays, Edit3 } from 'lucide-react';
import { AppUser, CalendarEvent, PostSchedule, DayOfWeek } from './types';
import { todayStr } from './useStore';

const DOW_INDEX: Record<DayOfWeek, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const SCHEDULE_COLOURS = [
  '#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316',
];

interface Props {
  events: CalendarEvent[];
  currentUser: AppUser;
  onAddEvent: (title: string, date: string, time?: string, description?: string, createdBy?: string) => void;
  onUpdateEvent: (id: string, changes: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
  embedded?: boolean;
  postSchedules?: PostSchedule[];
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function dateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function CalendarPage({ events, currentUser, onAddEvent, onUpdateEvent, onDeleteEvent, embedded, postSchedules = [] }: Props) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected]   = useState<string>(todayStr());
  const [showAdd, setShowAdd]     = useState(false);
  const [title, setTitle]         = useState('');
  const [time, setTime]           = useState('');
  const [desc, setDesc]           = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset  = firstOfMonth.getDay();
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    if (!eventsByDate.has(ev.date)) eventsByDate.set(ev.date, []);
    eventsByDate.get(ev.date)!.push(ev);
  }

  const cells: { date: string; day: number; inMonth: boolean }[] = [];
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(viewYear, viewMonth, 1 - (startOffset - i));
    cells.push({ date: dateKey(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: dateKey(viewYear, viewMonth, d), day: d, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const d = new Date(last.date);
    d.setDate(d.getDate() + 1);
    cells.push({ date: dateKey(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: false });
  }

  const goPrev = () => {
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
  };
  const goNext = () => {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
  };
  const goToday = () => {
    setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelected(todayStr());
  };

  const selectedEvents = (eventsByDate.get(selected) || []).slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  function schedulesForDate(dateStr: string): PostSchedule[] {
    const dow = new Date(dateStr + 'T00:00:00').getDay() as 0|1|2|3|4|5|6;
    const dayName = (['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as DayOfWeek[])[dow];
    return postSchedules.filter(s => s.days.includes(dayName));
  }

  const selectedSchedules = schedulesForDate(selected);

  const resetForm = () => { setTitle(''); setTime(''); setDesc(''); setShowAdd(false); setEditingId(null); };

  const submit = () => {
    if (!title.trim()) return;
    if (editingId) {
      onUpdateEvent(editingId, { title: title.trim(), time: time || undefined, description: desc.trim() || undefined });
    } else {
      onAddEvent(title.trim(), selected, time || undefined, desc.trim() || undefined, currentUser.id);
    }
    resetForm();
  };

  const startEdit = (ev: CalendarEvent) => {
    setEditingId(ev.id);
    setTitle(ev.title);
    setTime(ev.time || '');
    setDesc(ev.description || '');
    setShowAdd(true);
  };

  const selectedLabel = new Date(selected + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {!embedded && (
        <div className="page-header">
          <h1 className="page-title">Calendar</h1>
          <span className="page-subtitle">Schedule &amp; meetings</span>
        </div>
      )}

      <main className="calendar-page">
        <div className="cal-grid-card">
          <div className="cal-nav">
            <button className="icon-btn" onClick={goPrev}><ChevronLeft size={16} /></button>
            <span className="cal-title">{MONTHS[viewMonth]} {viewYear}</span>
            <button className="icon-btn" onClick={goNext}><ChevronRight size={16} /></button>
            <button className="btn-ghost sm cal-today-btn" onClick={goToday}>Today</button>
          </div>
          <div className="cal-dow-row">
            {DOW.map(d => <div key={d} className="cal-dow">{d}</div>)}
          </div>
          <div className="cal-grid">
            {cells.map(c => {
              const dayEvents = eventsByDate.get(c.date) || [];
              const daySched = schedulesForDate(c.date);
              return (
                <button
                  key={c.date}
                  className={`cal-day ${c.inMonth ? '' : 'outside'} ${c.date === todayStr() ? 'today' : ''} ${c.date === selected ? 'selected' : ''} ${dayEvents.length > 0 || daySched.length > 0 ? 'has-events' : ''}`}
                  onClick={() => setSelected(c.date)}
                >
                  <span className="cal-day-num">{c.day}</span>
                  {daySched.length > 0 && c.inMonth && (
                    <span className="cal-sched-tags">
                      {daySched.slice(0, 2).map((s, i) => (
                        <span key={s.id} className="cal-sched-tag"
                          style={{ background: SCHEDULE_COLOURS[i % SCHEDULE_COLOURS.length] }}>
                          {s.clientName.split(' ')[0]}
                        </span>
                      ))}
                      {daySched.length > 2 && <span className="cal-sched-tag" style={{ background: 'var(--text4)' }}>+{daySched.length - 2}</span>}
                    </span>
                  )}
                  {dayEvents.length > 0 && (
                    <span className="cal-dots">
                      {dayEvents.slice(0, 3).map(e => <span key={e.id} className="cal-dot" aria-hidden="true" />)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="cal-events-card">
          <div className="cal-events-head">
            <CalendarDays size={15} />
            <span>{selectedLabel}</span>
            <button className="icon-btn accent" style={{ marginLeft: 'auto' }} onClick={() => { resetForm(); setShowAdd(p => !p); }}>
              {showAdd ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>

          {showAdd && (
            <div className="cal-event-form">
              <input className="field-input" placeholder="Meeting / event title..." value={title}
                onChange={e => setTitle(e.target.value)} autoFocus />
              <div className="cal-event-form-row">
                <input className="field-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
                <input className="field-input flex1" placeholder="Notes (optional)..." value={desc}
                  onChange={e => setDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
              </div>
              <div className="modal-actions">
                <button className="btn-ghost" onClick={resetForm}>Cancel</button>
                <button className="btn-primary" onClick={submit} disabled={!title.trim()}>
                  <Check size={14} /> {editingId ? 'Save' : 'Add Event'}
                </button>
              </div>
            </div>
          )}

          {selectedSchedules.length > 0 && (
            <div className="cal-sched-section">
              <span className="cal-sched-section-label">Scheduled Posts</span>
              {selectedSchedules.map((s, i) => (
                <div key={s.id} className="cal-sched-row">
                  <span className="cal-sched-dot" style={{ background: SCHEDULE_COLOURS[i % SCHEDULE_COLOURS.length] }} />
                  <span className="cal-sched-client">{s.clientName}</span>
                </div>
              ))}
            </div>
          )}

          {selectedEvents.length === 0 && !showAdd && selectedSchedules.length === 0 && (
            <div className="cal-no-events">
              <CalendarDays size={32} />
              <p>No events on this day</p>
            </div>
          )}

          <div className="cal-event-list">
            {selectedEvents.map(ev => (
              <div key={ev.id} className="cal-event-row">
                {ev.time && <span className="cal-event-time"><Clock size={12} /> {ev.time}</span>}
                <div className="cal-event-info">
                  <span className="cal-event-title">{ev.title}</span>
                  {ev.description && <span className="cal-event-desc">{ev.description}</span>}
                </div>
                <button className="icon-btn xs" onClick={() => startEdit(ev)}><Edit3 size={13} /></button>
                <button className="icon-btn xs red-h" onClick={() => onDeleteEvent(ev.id)}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
