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
  Client, Task, AppUser, CalendarEvent, CostItem, DevProject, IncomeSubscription,
  BudgetIncomeItem, BudgetExpenseItem, UnforeseenExpense, MonthlySnapshot, MeetingNote,
  PriceListItem, OddTask, TaskStatus,
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
import Sidebar, { NavPage } from './Sidebar';
import HomePage from './HomePage';
import CompanyPage from './CompanyPage';
import CustomersPage from './CustomersPage';
import DataPage from './DataPage';
import SettingsPage from './SettingsPage';

// ── helpers ────────────────────────────────────────────────────────────────
function addDays(base: Date, n: number) { const d = new Date(base); d.setDate(d.getDate() + n); return d; }
function dateStr(d: Date) { return d.toISOString().split('T')[0]; }
function fmt12(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function isOverdue(t: Task) { return t.status !== 'completed' && t.status !== 'delayed' && t.dueDate < todayStr(); }
function isDueToday(t: Task) { return t.status !== 'completed' && t.dueDate === todayStr(); }
function fmtR(n: number) { return 'R ' + n.toLocaleString('en-ZA'); }

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
                style={{ background: c, boxShadow: color === c ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}` : 'none' }}
                onClick={() => onColor(c)} />
            ))}
          </div>
          <div className="custom-color-row">
            <label className="custom-color-label" htmlFor="custom-color-picker">
              <span className="custom-color-preview" style={{ background: color }} />
              Custom colour
            </label>
            <input id="custom-color-picker" type="color"
              value={color.startsWith('#') ? color : '#6c63ff'}
              onChange={e => onColor(e.target.value)} className="custom-color-input" />
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
// EVENT MODAL
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
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [addFor, setAddFor]       = useState<string | null>(null);
  const [editing, setEditing]     = useState<CalendarEvent | null>(null);
  const [selected, setSelected]   = useState<string | null>(null);
  const today = todayStr();

  const firstDay    = new Date(viewYear, viewMonth, 1);
  const lastDay     = new Date(viewYear, viewMonth + 1, 0);
  const startDow    = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => { if (viewMonth===0){setViewYear(y=>y-1);setViewMonth(11);}else setViewMonth(m=>m-1); };
  const nextMonth = () => { if (viewMonth===11){setViewYear(y=>y+1);setViewMonth(0);}else setViewMonth(m=>m+1); };
  const goToday   = () => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); };
  const cellDate  = (day: number) => `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const selectedEvents = selected ? eventsForDate(selected) : [];

  return (
    <>
      {addFor && <EventModal date={addFor} onSave={(t,ti,d,c)=>{onAddEvent(addFor,t,ti,d,c);setAddFor(null);}} onClose={()=>setAddFor(null)} />}
      {editing && <EventModal date={editing.date} event={editing} onSave={(t,ti,d,c)=>{onEditEvent(editing.id,t,ti,d,c);setEditing(null);}} onClose={()=>setEditing(null)} />}
      <section className="full-cal">
        <div className="full-cal-header">
          <div className="full-cal-nav">
            <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={18}/></button>
            <h2 className="full-cal-month">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
            <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={18}/></button>
          </div>
          <button className="btn-today" onClick={goToday}>Today</button>
        </div>
        <div className="full-cal-body">
          <div className="cal-grid">
            {DAY_SHORT.map(d=><div key={d} className="cal-dow">{d}</div>)}
            {cells.map((day,i) => {
              if (day===null) return <div key={`pad-${i}`} className="cal-cell empty"/>;
              const ds = cellDate(day);
              const dayEvents = eventsForDate(ds);
              const isToday   = ds===today;
              const isSel     = ds===selected;
              const isWeekend = (i%7===0||i%7===6);
              return (
                <div key={ds} className={`cal-cell ${isToday?'today':''} ${isSel?'selected':''} ${isWeekend?'weekend':''}`}
                  onClick={()=>setSelected(isSel?null:ds)}>
                  <div className="cal-cell-top">
                    <span className="cal-day-num">{day}</span>
                    <button className="cal-cell-add" onClick={e=>{e.stopPropagation();setAddFor(ds);}}><Plus size={12}/></button>
                  </div>
                  <div className="cal-cell-events">
                    {dayEvents.slice(0,3).map(evt=>(
                      <div key={evt.id} className="cal-pill" style={{background:evt.color}}
                        title={`${fmt12(evt.time)} — ${evt.title}`}
                        onClick={e=>{e.stopPropagation();setEditing(evt);}}>
                        {evt.time&&<span className="cal-pill-time">{fmt12(evt.time)}</span>}
                        <span className="cal-pill-title">{evt.title}</span>
                      </div>
                    ))}
                    {dayEvents.length>3&&<span className="cal-more">+{dayEvents.length-3} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
          {selected && (
            <div className="cal-detail">
              <div className="cal-detail-header">
                <div>
                  <p className="cal-detail-label">{DAY_SHORT[new Date(selected+'T12:00:00').getDay()]},</p>
                  <h3 className="cal-detail-date">{new Date(selected+'T12:00:00').getDate()} {MONTH_NAMES[new Date(selected+'T12:00:00').getMonth()]}</h3>
                </div>
                <div className="cal-detail-actions">
                  <button className="btn-sm-primary" onClick={()=>setAddFor(selected)}><Plus size={14}/> Add</button>
                  <button className="icon-btn" onClick={()=>setSelected(null)}><X size={16}/></button>
                </div>
              </div>
              {selectedEvents.length===0 ? (
                <p className="cal-detail-empty">No events. Click + to add one.</p>
              ) : (
                <div className="cal-detail-events">
                  {selectedEvents.map(evt=>(
                    <div key={evt.id} className="cal-detail-evt" style={{borderLeftColor:evt.color}}>
                      <div className="cal-detail-evt-time" style={{color:evt.color}}><Clock size={13}/> {fmt12(evt.time)}</div>
                      <div className="cal-detail-evt-title">{evt.title}</div>
                      {evt.description&&<div className="cal-detail-evt-desc">{evt.description}</div>}
                      <div className="cal-detail-evt-btns">
                        <button className="btn-icon-sm" onClick={()=>setEditing(evt)}><Edit3 size={13}/> Edit</button>
                        <button className="btn-icon-sm danger" onClick={()=>onDeleteEvent(evt.id)}><Trash2 size={13}/> Delete</button>
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
// PDF EXPORT MODAL
// ══════════════════════════════════════════════════════════════════
function ExportModal({ clients, costs, devProjects, incomeSubscriptions, onClose,
  totalMonthlyIncome, totalAdSpend, totalCosts, totalProfit, currentBalance,
}: {
  clients: Client[]; costs: CostItem[]; devProjects: DevProject[];
  incomeSubscriptions: IncomeSubscription[];
  onClose: () => void;
  totalMonthlyIncome: number; totalAdSpend: number; totalCosts: number;
  totalProfit: number; currentBalance: number;
}) {
  const now = new Date();
  const [exportType, setExportType] = useState<'month'|'range'>('month');
  const [selYear, setSelYear]   = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [fromDate, setFromDate] = useState(now.toISOString().split('T')[0].substring(0,7)+'-01');
  const [toDate, setToDate]     = useState(now.toISOString().split('T')[0]);
  const years = [now.getFullYear()-1,now.getFullYear(),now.getFullYear()+1];

  function buildReportHTML() {
    const title = exportType==='month' ? `${MONTH_NAMES[selMonth]} ${selYear} — Business Report` : `Report: ${fromDate} to ${toDate}`;
    const clientRows = clients.map(c=>`<tr><td>${c.icon} ${c.name}</td><td>R ${c.monthlyIncome.toLocaleString('en-ZA')}</td><td>R ${c.adSpend.toLocaleString('en-ZA')}</td><td>R ${c.monthlyCost.toLocaleString('en-ZA')}</td><td>${c.paidThisMonth?'✓ Paid':'Pending'}</td></tr>`).join('');
    const devRows = devProjects.map(p=>`<tr><td>${p.icon} ${p.clientName} — ${p.projectName}</td><td>R ${p.depositAmount.toLocaleString('en-ZA')}</td><td>${p.depositPaid?'✓':'—'}</td><td>R ${p.finalAmount.toLocaleString('en-ZA')}</td><td>${p.finalPaid?'✓':'—'}</td></tr>`).join('');
    const subsRows = incomeSubscriptions.map(s=>`<tr><td>${s.customerName}</td><td>${s.invoiceDate}</td><td>R ${s.amount.toLocaleString('en-ZA')}</td></tr>`).join('');
    const costRows = costs.map(c=>`<tr><td>${c.name}</td><td>${c.category}</td><td>R ${c.amount.toLocaleString('en-ZA')}</td><td>${c.paid?'✓ Paid':'Unpaid'}</td></tr>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;margin:0;padding:32px;font-size:14px;}h1{font-size:22px;margin:0 0 4px;color:#1e3a5f;}.subtitle{color:#64748b;font-size:13px;margin-bottom:28px;}.logo-bar{display:flex;align-items:center;gap:16px;margin-bottom:24px;border-bottom:2px solid #3b82f6;padding-bottom:16px;}.company{font-size:18px;font-weight:700;color:#1e3a5f;}section{margin-bottom:28px;}h2{font-size:15px;font-weight:700;color:#1e3a5f;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em;}.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}.sum-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;}.sum-card-label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px;}.sum-card-val{font-size:20px;font-weight:700;color:#1e3a5f;}.sum-card-val.green{color:#059669;}.sum-card-val.red{color:#dc2626;}table{width:100%;border-collapse:collapse;font-size:13px;}th{background:#1e3a5f;color:#fff;padding:8px 12px;text-align:left;font-weight:600;font-size:12px;}td{padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155;}tr:nth-child(even) td{background:#f8fafc;}.footer{margin-top:40px;border-top:1px solid #e2e8f0;padding-top:14px;font-size:12px;color:#94a3b8;display:flex;justify-content:space-between;}@media print{body{padding:16px;}@page{margin:20mm;}}</style></head><body>
<div class="logo-bar"><div><div class="company">Digital Solutions SA</div><div style="color:#64748b;font-size:12px;">Business Report</div></div></div>
<h1>${title}</h1><p class="subtitle">Generated on ${new Date().toLocaleDateString('en-ZA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
<section><h2>Financial Summary</h2><div class="summary-grid">
<div class="sum-card"><div class="sum-card-label">Monthly Income</div><div class="sum-card-val green">R ${totalMonthlyIncome.toLocaleString('en-ZA')}</div></div>
<div class="sum-card"><div class="sum-card-label">Ad Spend</div><div class="sum-card-val">R ${totalAdSpend.toLocaleString('en-ZA')}</div></div>
<div class="sum-card"><div class="sum-card-label">Total Costs</div><div class="sum-card-val">R ${totalCosts.toLocaleString('en-ZA')}</div></div>
<div class="sum-card"><div class="sum-card-label">Net Profit</div><div class="sum-card-val ${totalProfit>=0?'green':'red'}">R ${totalProfit.toLocaleString('en-ZA')}</div></div>
</div></section>
${clients.length>0?`<section><h2>Social Media Clients (${clients.length})</h2><table><thead><tr><th>Client</th><th>Income</th><th>Ad Spend</th><th>Client Costs</th><th>Status</th></tr></thead><tbody>${clientRows}</tbody></table></section>`:''}
${incomeSubscriptions.length>0?`<section><h2>Income Subscriptions</h2><table><thead><tr><th>Customer</th><th>Invoice Date</th><th>Amount</th></tr></thead><tbody>${subsRows}</tbody></table></section>`:''}
${devProjects.length>0?`<section><h2>Development Projects</h2><table><thead><tr><th>Project</th><th>Deposit</th><th>Dep. Paid</th><th>Final</th><th>Final Paid</th></tr></thead><tbody>${devRows}</tbody></table></section>`:''}
${costs.length>0?`<section><h2>Monthly Costs</h2><table><thead><tr><th>Name</th><th>Category</th><th>Amount</th><th>Status</th></tr></thead><tbody>${costRows}</tbody></table></section>`:''}
<div class="footer"><span>Digital Solutions SA — Confidential</span><span>Bank Balance: R ${currentBalance.toLocaleString('en-ZA')}</span></div>
</body></html>`;
  }

  const handleExport = () => {
    const html = buildReportHTML();
    const blob = new Blob([html],{type:'text/html'});
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url,'_blank');
    setTimeout(()=>{if(win)win.print();URL.revokeObjectURL(url);},600);
    onClose();
  };

  return (
    <Overlay onClick={onClose}>
      <div className="event-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{borderBottomColor:'#3b82f6'}}>
          <FileText size={18} style={{color:'#3b82f6'}}/>
          <div><h3 className="modal-title">Export to PDF</h3><p className="modal-sub">Choose report period</p></div>
          <button className="icon-btn ml-auto" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">
          <label className="field-label">Export Type</label>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            <button className={`export-type-btn ${exportType==='month'?'active':''}`} onClick={()=>setExportType('month')}>Specific Month</button>
            <button className={`export-type-btn ${exportType==='range'?'active':''}`} onClick={()=>setExportType('range')}>Date Range</button>
          </div>
          {exportType==='month' ? (
            <div style={{display:'flex',gap:8}}>
              <div style={{flex:1}}><label className="field-label">Month</label>
                <select className="field-select" value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))}>
                  {MONTH_NAMES.map((m,i)=><option key={m} value={i}>{m}</option>)}
                </select></div>
              <div style={{flex:1}}><label className="field-label">Year</label>
                <select className="field-select" value={selYear} onChange={e=>setSelYear(Number(e.target.value))}>
                  {years.map(y=><option key={y} value={y}>{y}</option>)}
                </select></div>
            </div>
          ) : (
            <div style={{display:'flex',gap:8}}>
              <div style={{flex:1}}><label className="field-label">From</label><input type="date" className="field-input" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></div>
              <div style={{flex:1}}><label className="field-label">To</label><input type="date" className="field-input" value={toDate} onChange={e=>setToDate(e.target.value)}/></div>
            </div>
          )}
          <p style={{fontSize:'0.82rem',color:'var(--text3)',marginTop:12}}>Opens in new tab. Use <strong>Print → Save as PDF</strong>.</p>
          <div className="modal-actions">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" style={{background:'#3b82f6'}} onClick={handleExport}><Download size={15}/> Export Report</button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ══════════════════════════════════════════════════════════════════
// DEV TASK ROW
// ══════════════════════════════════════════════════════════════════
function DevTaskRow({ task, projectColor, onToggle, onDelete, onEdit, onAddSub, onToggleSub, onDeleteSub }: {
  task: any; projectColor: string;
  onToggle: () => void; onDelete: () => void; onEdit: (t: string) => void;
  onAddSub: (t: string) => void; onToggleSub: (sid: string) => void; onDeleteSub: (sid: string) => void;
}) {
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(task.title);
  const [addingSub, setAddingSub] = useState(false);
  const [subVal, setSubVal]   = useState('');
  const doneCount = task.subTasks.filter((s:any) => s.completed).length;
  const saveEdit = () => { if (editVal.trim()) { onEdit(editVal.trim()); setEditing(false); } };
  const submitSub = () => { if (subVal.trim()) { onAddSub(subVal.trim()); setSubVal(''); setAddingSub(false); } };

  return (
    <div className={`dev-task ${task.completed?'done':''}`}>
      <div className="dev-task-row">
        <button className={`task-check ${task.completed?'checked':''}`}
          style={task.completed?{background:projectColor,borderColor:projectColor}:{borderColor:projectColor}}
          onClick={onToggle}>{task.completed&&<Check size={12} strokeWidth={3}/>}</button>
        {editing ? (
          <input className="field-input flex1" value={editVal} onChange={e=>setEditVal(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&saveEdit()} onBlur={saveEdit} autoFocus/>
        ) : <span className="dev-task-title">{task.title}</span>}
        {task.subTasks.length>0&&<span className="sub-count">{doneCount}/{task.subTasks.length}</span>}
        <button className="icon-btn xs" onClick={()=>setOpen(p=>!p)}>{open?<ChevronDown size={13}/>:<ChevronRight size={13}/>}</button>
        <button className="icon-btn xs" onClick={()=>setEditing(p=>!p)}><Edit3 size={13}/></button>
        <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={13}/></button>
      </div>
      {open && (
        <div className="sub-tasks">
          {task.subTasks.map((s:any) => (
            <div key={s.id} className={`sub-task-row ${s.completed?'done':''}`}>
              <button className={`task-check sm ${s.completed?'checked':''}`}
                style={s.completed?{background:projectColor,borderColor:projectColor}:{borderColor:projectColor}}
                onClick={()=>onToggleSub(s.id)}>{s.completed&&<Check size={10} strokeWidth={3}/>}</button>
              <span className="sub-task-title">{s.title}</span>
              <button className="icon-btn xs red-h" onClick={()=>onDeleteSub(s.id)}><Trash2 size={12}/></button>
            </div>
          ))}
          {addingSub ? (
            <div className="sub-add-row">
              <input className="field-input flex1" placeholder="Sub-task..." value={subVal}
                onChange={e=>setSubVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitSub()} autoFocus/>
              <button className="icon-btn accent xs" onClick={submitSub}><Check size={13}/></button>
              <button className="icon-btn xs" onClick={()=>setAddingSub(false)}><X size={13}/></button>
            </div>
          ) : (
            <button className="btn-add-sub" style={{color:projectColor}} onClick={()=>setAddingSub(true)}>
              <Plus size={12}/> Add sub-task
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
  const [collapsed, setCollapsed]         = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);
  const [addingTask, setAddingTask]       = useState(false);
  const [newTask, setNewTask]             = useState('');
  const [editName, setEditName]           = useState(false);
  const [nameVal, setNameVal]             = useState(project.projectName);
  const [editClient, setEditClient]       = useState(false);
  const [clientVal, setClientVal]         = useState(project.clientName);

  const done  = project.tasks.filter(t=>t.completed).length;
  const total = project.tasks.length;
  const pct   = total>0 ? Math.round((done/total)*100) : 0;
  const totalVal   = project.depositAmount + project.finalAmount;
  const paidVal    = (project.depositPaid?project.depositAmount:0) + (project.finalPaid?project.finalAmount:0);
  const pendingPay = totalVal - paidVal;
  const submitTask = () => { if(newTask.trim()){onAddTask(newTask.trim());setNewTask('');setAddingTask(false);} };

  return (
    <>
      {showCustomise && <CustomiseModal color={project.color} icon={project.icon}
        onClose={()=>setShowCustomise(false)} onColor={onUpdateColor} onIcon={onUpdateIcon}/>}
      <div className={`dev-card ${project.status==='completed'?'completed':''}`}
        style={{'--proj-color':project.color} as React.CSSProperties}>
        <div className="dev-header" style={{background:project.color}}>
          <span className="dev-icon">{project.icon}</span>
          <div className="dev-title-block">
            {editName
              ? <input className="dev-name-input" value={nameVal} onChange={e=>setNameVal(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&(onUpdate({projectName:nameVal}),setEditName(false))}
                  onBlur={()=>{onUpdate({projectName:nameVal});setEditName(false);}} autoFocus/>
              : <span className="dev-name" onDoubleClick={()=>setEditName(true)}>{project.projectName}</span>}
            {editClient
              ? <input className="dev-client-input" value={clientVal} onChange={e=>setClientVal(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&(onUpdate({clientName:clientVal}),setEditClient(false))}
                  onBlur={()=>{onUpdate({clientName:clientVal});setEditClient(false);}} autoFocus/>
              : <span className="dev-client" onDoubleClick={()=>setEditClient(true)}>{project.clientName}</span>}
          </div>
          {project.status==='completed'&&<span className="dev-done-badge">✓ Done</span>}
          <div className="dev-header-actions">
            <span className="dev-pct">{pct}%</span>
            <button className="icon-btn dark" onClick={()=>setShowCustomise(true)}><Palette size={14}/></button>
            <button className="icon-btn dark" onClick={()=>setCollapsed(p=>!p)}>{collapsed?<ChevronDown size={14}/>:<ChevronUp size={14}/>}</button>
            {project.status==='active'
              ?<button className="icon-btn dark" title="Mark complete" onClick={onComplete}><CircleCheck size={14}/></button>
              :<button className="icon-btn dark" title="Reopen" onClick={onReopen}><RefreshCw size={14}/></button>}
            <button className="icon-btn dark-red" onClick={onDelete}><Trash2 size={14}/></button>
          </div>
        </div>
        <div className="dev-progress-bar"><div className="dev-progress-fill" style={{width:`${pct}%`,background:project.color}}/></div>
        {!collapsed && (
          <div className="dev-body">
            <div className="dev-payment">
              <div className="pay-row">
                <span className="pay-label">Deposit</span>
                <div className="fin-input-wrap"><span>R</span>
                  <input type="number" className="fin-num" value={project.depositAmount||''}
                    onChange={e=>onUpdate({depositAmount:Number(e.target.value)})} placeholder="0"/>
                </div>
                <button className={`pay-toggle ${project.depositPaid?'paid':''}`} onClick={()=>onUpdate({depositPaid:!project.depositPaid})}>
                  {project.depositPaid?'✓ Paid':'Unpaid'}
                </button>
              </div>
              <div className="pay-row">
                <span className="pay-label">Final</span>
                <div className="fin-input-wrap"><span>R</span>
                  <input type="number" className="fin-num" value={project.finalAmount||''}
                    onChange={e=>onUpdate({finalAmount:Number(e.target.value)})} placeholder="0"/>
                </div>
                <button className={`pay-toggle ${project.finalPaid?'paid':''}`} onClick={()=>onUpdate({finalPaid:!project.finalPaid})}>
                  {project.finalPaid?'✓ Paid':'Unpaid'}
                </button>
              </div>
              <div className="pay-summary">
                <span>Total: <strong>{fmtR(totalVal)}</strong></span>
                <span className="pay-received">Received: <strong>{fmtR(paidVal)}</strong></span>
                {pendingPay>0&&<span className="pay-pending">Pending: <strong>{fmtR(pendingPay)}</strong></span>}
              </div>
            </div>
            <div className="dev-tasks">
              {project.tasks.length===0&&<p className="empty-msg">No tasks yet — add one below</p>}
              {project.tasks.map(task=>(
                <DevTaskRow key={task.id} task={task} projectColor={project.color}
                  onToggle={()=>onToggleTask(task.id)} onDelete={()=>onDeleteTask(task.id)}
                  onEdit={t=>onEditTask(task.id,t)} onAddSub={t=>onAddSub(task.id,t)}
                  onToggleSub={sid=>onToggleSub(task.id,sid)} onDeleteSub={sid=>onDeleteSub(task.id,sid)}/>
              ))}
              {addingTask ? (
                <div className="dev-add-task-row">
                  <input className="field-input flex1" placeholder="Task title..." value={newTask}
                    onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitTask()} autoFocus/>
                  <button className="icon-btn accent" onClick={submitTask}><Check size={15}/></button>
                  <button className="icon-btn" onClick={()=>setAddingTask(false)}><X size={15}/></button>
                </div>
              ) : (
                <button className="btn-add-dev-task" style={{borderColor:project.color,color:project.color}}
                  onClick={()=>setAddingTask(true)}><Plus size={14}/> Add Task</button>
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
  const save   = () => { if(eTitle.trim()){onEdit(eTitle.trim(),eDate);setEditing(false);} };

  if (editing) return (
    <div className="task-row editing">
      <input className="field-input flex1" value={eTitle} onChange={e=>setETitle(e.target.value)}
        onKeyDown={e=>e.key==='Enter'&&save()} autoFocus/>
      <input type="date" className="field-date" value={eDate} onChange={e=>setEDate(e.target.value)}/>
      <button className="icon-btn accent" onClick={save}><Check size={14}/></button>
      <button className="icon-btn" onClick={()=>setEditing(false)}><X size={14}/></button>
    </div>
  );

  const done = task.status==='completed';
  return (
    <div className={`task-row ${done?'done':''} ${over?'overdue':''} ${dToday?'due-today':''}`}
      style={{borderLeftColor:clientColor}}>
      <button className={`task-check ${done?'checked':''}`}
        style={done?{background:clientColor,borderColor:clientColor}:{borderColor:clientColor}}
        onClick={onToggle}>{done&&<Check size={12} strokeWidth={3}/>}</button>
      <span className="task-title">{task.title}</span>
      {task.assignedTo&&users&&(
        <span className="task-assigned-badge">
          {users.find(u=>u.id===task.assignedTo)?.displayName||users.find(u=>u.id===task.assignedTo)?.username||'?'}
        </span>
      )}
      <span className="task-date">{task.dueDate}</span>
      {over&&<button className="badge-overdue" onClick={onOverdueClick}><AlertTriangle size={11}/> Late</button>}
      {dToday&&<span className="badge-today">Today</span>}
      <button className="icon-btn xs" onClick={()=>setEditing(true)}><Edit3 size={13}/></button>
      <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={13}/></button>
    </div>
  );
}

function AddTaskForm({ clientColor, assistants, onAdd }: {
  clientColor: string; assistants: AppUser[];
  onAdd: (t: string, d: string, assignedTo?: string) => void;
}) {
  const [open, setOpen]           = useState(false);
  const [title, setTitle]         = useState('');
  const [date, setDate]           = useState(todayStr());
  const [assignedTo, setAssignedTo] = useState<string>('');
  const go = () => { if(title.trim()){onAdd(title.trim(),date,assignedTo||undefined);setTitle('');setDate(todayStr());setAssignedTo('');setOpen(false);} };
  if (!open) return (
    <button className="btn-add-task" style={{borderColor:clientColor,color:clientColor}} onClick={()=>setOpen(true)}>
      <Plus size={14}/> Add Task
    </button>
  );
  return (
    <div className="add-task-form">
      <input className="field-input flex1" placeholder="Task title..." value={title}
        onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} autoFocus/>
      <input type="date" className="field-date" value={date} onChange={e=>setDate(e.target.value)}/>
      {assistants.length>0&&(
        <select className="field-date task-assign-select" value={assignedTo} onChange={e=>setAssignedTo(e.target.value)}>
          <option value="">Unassigned</option>
          {assistants.map(u=><option key={u.id} value={u.id}>{u.displayName||u.username}</option>)}
        </select>
      )}
      <button className="icon-btn accent" onClick={go}><Check size={14}/></button>
      <button className="icon-btn" onClick={()=>setOpen(false)}><X size={14}/></button>
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
  onUpdateFinancials: (f: 'monthlyIncome'|'adSpend'|'monthlyCost', v: number) => void;
  onTogglePaid: () => void; onToggleAdSpendPaid: () => void;
  onAddTask: (t: string, d: string, uid?: string) => void; onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void; onEditTask: (id: string, t: string, d: string) => void;
}) {
  const [collapsed, setCollapsed]         = useState(false);
  const [showFin, setShowFin]             = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);
  const [editingName, setEditingName]     = useState(false);
  const [nameVal, setNameVal]             = useState(client.name);
  const [alertTask, setAlertTask]         = useState<Task|null>(null);
  const overdueTasks = client.tasks.filter(isOverdue);
  const pending = client.tasks.filter(t=>t.status!=='completed').sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const done    = client.tasks.filter(t=>t.status==='completed');
  const profit  = client.monthlyIncome - client.adSpend - client.monthlyCost;
  const saveName = () => { if(nameVal.trim())onUpdateName(nameVal.trim()); setEditingName(false); };

  return (
    <>
      {alertTask&&<OverdueAlert task={alertTask} clientName={client.name} onDismiss={()=>setAlertTask(null)}/>}
      {showCustomise&&<CustomiseModal color={client.color} icon={client.icon}
        onClose={()=>setShowCustomise(false)} onColor={onUpdateColor} onIcon={onUpdateIcon}/>}
      <div className="client-card" style={{'--client-color':client.color} as React.CSSProperties}>
        <div className="client-header" style={{background:client.color}}>
          <div className="client-header-top">
            <span className="client-emoji">{client.icon}</span>
            <div className="client-header-actions">
              {overdueTasks.length>0&&<span className="overdue-count" onClick={()=>setAlertTask(overdueTasks[0])}>⚠ {overdueTasks.length}</span>}
              <span className="task-count">{pending.length} open</span>
              <button className={`client-paid-btn ${client.paidThisMonth?'paid':''}`} onClick={onTogglePaid}
                title={client.paidThisMonth?'Paid this month ✓ — click to undo':'Mark as paid this month'}>
                <CircleCheck size={14}/><span>{client.paidThisMonth?'Paid':'Unpaid'}</span>
              </button>
              <button className="icon-btn dark" onClick={()=>setShowCustomise(true)}><Palette size={14}/></button>
              <button className="icon-btn dark" onClick={()=>setShowFin(p=>!p)}><DollarSign size={14}/></button>
              <button className="icon-btn dark" onClick={()=>setCollapsed(p=>!p)}>{collapsed?<ChevronDown size={14}/>:<ChevronUp size={14}/>}</button>
              <button className="icon-btn dark-red" onClick={onDeleteClient}><Trash2 size={14}/></button>
            </div>
          </div>
          {editingName
            ?<input className="client-name-input" value={nameVal} onChange={e=>setNameVal(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&saveName()} onBlur={saveName} autoFocus/>
            :<h2 className="client-name" onDoubleClick={()=>setEditingName(true)}>{client.name}</h2>}
        </div>
        {!collapsed && (
          <div className="client-body">
            {showFin && (
              <div className="fin-panel">
                {(['monthlyIncome','adSpend','monthlyCost'] as const).map(field=>(
                  <div key={field} className="fin-row">
                    <label>{field==='monthlyIncome'?'Monthly Income':field==='adSpend'?'Ad Spend':'Client Costs'}</label>
                    <div className="fin-input-wrap"><span>R</span>
                      <input type="number" className="fin-num" value={client[field]||''}
                        onChange={e=>onUpdateFinancials(field,Number(e.target.value))} placeholder="0"/>
                    </div>
                    {field==='adSpend'&&client.adSpend>0&&(
                      <button className={`paid-toggle-btn ${client.adSpendPaid?'paid':''}`} onClick={onToggleAdSpendPaid}
                        title={client.adSpendPaid?'Ad spend paid ✓':'Mark ad spend as paid'}>
                        {client.adSpendPaid&&<Check size={11} strokeWidth={3}/>}
                      </button>
                    )}
                  </div>
                ))}
                <div className={`fin-profit ${profit>=0?'pos':'neg'}`}><span>Client Profit</span><span>{fmtR(profit)}</span></div>
              </div>
            )}
            <div className="task-list">
              {pending.length===0&&done.length===0&&<p className="empty-msg">No tasks yet — add one below</p>}
              {pending.map(t=>(
                <TaskRow key={t.id} task={t} clientColor={client.color} users={users}
                  onToggle={()=>onToggleTask(t.id)} onDelete={()=>onDeleteTask(t.id)}
                  onEdit={(ti,d)=>onEditTask(t.id,ti,d)} onOverdueClick={()=>setAlertTask(t)}/>
              ))}
              {done.length>0&&(
                <details className="done-section">
                  <summary>Completed ({done.length})</summary>
                  {done.map(t=>(
                    <TaskRow key={t.id} task={t} clientColor={client.color} users={users}
                      onToggle={()=>onToggleTask(t.id)} onDelete={()=>onDeleteTask(t.id)}
                      onEdit={(ti,d)=>onEditTask(t.id,ti,d)} onOverdueClick={()=>setAlertTask(t)}/>
                  ))}
                </details>
              )}
            </div>
            <AddTaskForm clientColor={client.color} assistants={assistants} onAdd={onAddTask}/>
          </div>
        )}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// APP ENTRY
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const auth = useAuth();
  if (auth.isLoading) return <div className="app-loading"><div className="app-loading-spinner"/></div>;
  if (!auth.currentUser) return <LoginScreen onLogin={auth.login} error={auth.authError}/>;
  if (auth.currentUser.role==='assistant') return <AssistantViewWrapper auth={auth}/>;
  return <AdminApp auth={auth}/>;
}

function AssistantViewWrapper({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const { clients, updateTaskStatus, eventsForDate, priceList, oddTasks, updateOddTaskStatus } = useStore();
  const assistants = auth.users.filter(u=>u.role==='assistant');
  return (
    <AssistantView
      currentUser={auth.currentUser!}
      clients={clients}
      oddTasks={oddTasks}
      onUpdateStatus={updateTaskStatus as never}
      onUpdateOddTaskStatus={updateOddTaskStatus as never}
      onLogout={auth.logout}
      eventsForDate={eventsForDate}
      priceList={priceList}
      allAssistants={assistants}
    />
  );
}

// ══════════════════════════════════════════════════════════════════
// DEMO DATA
// ══════════════════════════════════════════════════════════════════
const DEMO_ASST_USER: AppUser = {
  id:'demo-asst-1',username:'sarah_m',displayName:'Sarah Mitchell',role:'assistant',pinHash:'',createdAt:'',
  calendarAccess:true,tasksAccess:true,pricesAccess:true,
};
const DEMO_USERS: AppUser[] = [
  {id:'demo-admin-1',username:'admin',displayName:'Johan van der Berg',role:'admin',pinHash:'',createdAt:''},
  DEMO_ASST_USER,
  {id:'demo-asst-2',username:'mike_t',displayName:'Mike Thompson',role:'assistant',pinHash:'',createdAt:'',calendarAccess:false,tasksAccess:true,pricesAccess:false},
];
const DEMO_CLIENTS: Client[] = [
  {id:'demo-1',name:'Acme Technologies',color:'#3b82f6',icon:'💼',
    tasks:[{id:'dt-1',title:'Monthly social media report',dueDate:demoDate(3),status:'in-progress',assignedTo:'demo-asst-1',createdAt:''},
           {id:'dt-2',title:'Create content calendar Q3',dueDate:demoDate(7),status:'not-started',assignedTo:'demo-asst-1',createdAt:''},
           {id:'dt-3',title:'Google Ads campaign setup',dueDate:demoDate(5),status:'not-started',createdAt:''}],
    monthlyIncome:12000,adSpend:2500,monthlyCost:1500,paidThisMonth:true},
  {id:'demo-2',name:'Blue Ocean Retail',color:'#06b6d4',icon:'🏪',
    tasks:[{id:'dt-4',title:'Update Google Business profile',dueDate:demoDate(-1),status:'completed',assignedTo:'demo-asst-1',createdAt:''},
           {id:'dt-5',title:'Design product carousel images',dueDate:demoDate(4),status:'not-started',createdAt:''}],
    monthlyIncome:8500,adSpend:1800,monthlyCost:800},
];
const DEMO_EVENTS: CalendarEvent[] = [
  {id:'de-1',date:demoDate(1),time:'09:00',title:'Client strategy call — Acme',description:'Monthly review',color:'#3b82f6'},
  {id:'de-2',date:demoDate(2),time:'14:30',title:'Website handover meeting',description:'Blue Ocean brand delivery',color:'#06b6d4'},
];
const DEMO_DEV_PROJECTS: DevProject[] = [
  {id:'dp-1',clientName:'Acme Technologies',projectName:'E-Commerce Website',color:'#3b82f6',icon:'🌐',category:'web',status:'active',depositAmount:8500,depositPaid:true,finalAmount:8500,finalPaid:false,
    tasks:[{id:'dpt-1',title:'Design mockups',completed:true,subTasks:[]},{id:'dpt-2',title:'Frontend development',completed:false,subTasks:[]}],
    createdAt:new Date(Date.now()-30*864e5).toISOString()},
];
const DEMO_COSTS: CostItem[] = [
  {id:'dc-1',name:'Design Software Suite',amount:599,category:'Subscription',paid:true},
  {id:'dc-2',name:'Cloud Hosting',amount:450,category:'Hosting',paid:false},
];
const DEMO_PRICES: PriceListItem[] = [
  {id:'dpl-1',productCode:'SMM-001',name:'Social Media Starter',category:'Social Media Marketing',price:4500,description:'3 posts/week, 1 platform',visibleTo:'all',createdAt:''},
  {id:'dpl-2',productCode:'WEB-001',name:'Business Website 5-page',category:'Web Development',price:12000,description:'Responsive 5-page website',visibleTo:'all',createdAt:''},
];
const DEMO_ODD_TASKS: OddTask[] = [
  {id:'dot-1',title:'Update portfolio website',dueDate:demoDate(5),notes:'',status:'in-progress',priority:'high',createdAt:''},
];
const DEMO_NOTES: MeetingNote[] = [
  {id:'dn-1',date:demoDate(-3),customerName:'Acme Technologies',title:'Q3 Strategy Review',
    notes:'Client happy with social performance. Instagram up 34% MoM.',followUp:'Send TikTok proposal.',
    createdAt:new Date(Date.now()-3*864e5).toISOString(),updatedAt:new Date(Date.now()-3*864e5).toISOString()},
];
const DEMO_SUBS: IncomeSubscription[] = [
  {id:'dis-1',customerName:'Peak Performance Gym',amount:3500,invoiceDate:demoDate(5),paid:false,createdAt:''},
];

// ══════════════════════════════════════════════════════════════════
// ADMIN APP
// ══════════════════════════════════════════════════════════════════
function AdminApp({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const store = useStore();
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
    onceOffCosts, meetingNotes,
    addOnceOffCost, deleteOnceOffCost, updateOnceOffCost, toggleOnceOffPaid,
    addMeetingNote, deleteMeetingNote, updateMeetingNote,
    priceList, addPriceItem, deletePriceItem, updatePriceItem,
    oddTasks, addOddTask, deleteOddTask, updateOddTask, updateOddTaskStatus, assignOddTask,
    incomeSubscriptions, addIncomeSubscription, deleteIncomeSubscription, updateIncomeSubscription, toggleIncomeSubPaid,
    customers, addCustomer, deleteCustomer, updateCustomer,
    unexpectedIncome, addUnexpectedIncome, deleteUnexpectedIncome, updateUnexpectedIncome, toggleUnexpectedIncomePaid,
    transactions, clearTransactions,
    currentBalance, setCurrentBalance,
    totalMonthlyIncome, totalReceivedIncome, totalAdSpend, totalCosts,
    totalPendingIncome, totalProfit, businessBalance, overdueCount,
    totalPaidIncome, totalPaidExpenses,
    isFirebaseConfigured, fbReady, fbError,
    toggleClientPaid, toggleClientAdSpendPaid, resetMonthlyPayments,
  } = store;

  const [activePage, setActivePage] = useState<NavPage>('home');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [showAddDev, setShowAddDev]       = useState(false);
  const [newDevClient, setNewDevClient]   = useState('');
  const [newDevProject, setNewDevProject] = useState('');
  const [newDevCat, setNewDevCat]         = useState<'web'|'app'>('web');
  const clientInputRef = useRef<HTMLInputElement>(null);
  const assistants = auth.users.filter(u=>u.role==='assistant');

  const D = isDemoMode;
  const displayClients  = D ? DEMO_CLIENTS  : clients;
  const displayCosts    = D ? DEMO_COSTS    : costs;
  const displayDevProjs = D ? DEMO_DEV_PROJECTS : devProjects;
  const displayUsers    = D ? DEMO_USERS    : auth.users;
  const displayOddTasks = D ? DEMO_ODD_TASKS : oddTasks;
  const displayNotes    = D ? DEMO_NOTES    : meetingNotes;
  const displayPrices   = D ? DEMO_PRICES   : priceList;
  const displayIncSubs  = D ? DEMO_SUBS     : incomeSubscriptions;
  const demoEventsForDate = (date: string) => DEMO_EVENTS.filter(e=>e.date===date).sort((a,b)=>a.time.localeCompare(b.time));
  const displayEventsForDate = D ? demoEventsForDate : eventsForDate;

  const demoIncome  = D ? DEMO_CLIENTS.reduce((s,c)=>s+c.monthlyIncome,0) : totalMonthlyIncome;
  const demoAdSpend = D ? DEMO_CLIENTS.reduce((s,c)=>s+c.adSpend,0) : totalAdSpend;
  const demoCosts   = D ? DEMO_COSTS.reduce((s,c)=>s+c.amount,0) : totalCosts;
  const demoProfit  = D ? demoIncome-demoAdSpend-demoCosts : totalProfit;
  const demoBalance = D ? 48750 : currentBalance;

  const displayWebProjs  = displayDevProjs.filter(p => !p.category || p.category === 'web');
  const displayAppProjs  = displayDevProjs.filter(p => p.category === 'app');

  const noop = () => {};
  const noopStr = (_: string) => {};

  useEffect(() => { if (showAddClient) clientInputRef.current?.focus(); }, [showAddClient]);

  const handleAddClient = () => {
    if (newClientName.trim()) { addClient(newClientName.trim()); setNewClientName(''); setShowAddClient(false); }
  };
  const handleAddDev = () => {
    if (newDevClient.trim()&&newDevProject.trim()) {
      addDevProject(newDevClient.trim(), newDevProject.trim(), newDevCat);
      setNewDevClient(''); setNewDevProject(''); setShowAddDev(false);
    }
  };

  // Dev section shared renderer
  const renderDevSection = (projects: DevProject[], category: 'web'|'app') => {
    const active    = projects.filter(p=>p.status==='active');
    const completed = projects.filter(p=>p.status==='completed');
    const label     = category === 'web' ? 'Web Project' : 'App Project';
    return (
      <main className="dev-section">
        <div className="dev-grid">
          {active.map(p => (
            <DevProjectCard key={p.id} project={p}
              onDelete={D?noop:()=>deleteDevProject(p.id)}
              onUpdate={D?noop as never:changes=>updateDevProject(p.id,changes)}
              onComplete={D?noop:()=>completeDevProject(p.id)}
              onReopen={D?noop:()=>reopenDevProject(p.id)}
              onUpdateColor={D?noopStr:c=>updateDevProjectColor(p.id,c)}
              onUpdateIcon={D?noopStr:i=>updateDevProjectIcon(p.id,i)}
              onAddTask={D?noopStr:t=>addDevTask(p.id,t)}
              onToggleTask={D?noopStr:tid=>toggleDevTask(p.id,tid)}
              onDeleteTask={D?noopStr:tid=>deleteDevTask(p.id,tid)}
              onEditTask={D?noop as never:(tid,t)=>editDevTask(p.id,tid,t)}
              onAddSub={D?noop as never:(tid,t)=>addSubTask(p.id,tid,t)}
              onToggleSub={D?noop as never:(tid,sid)=>toggleSubTask(p.id,tid,sid)}
              onDeleteSub={D?noop as never:(tid,sid)=>deleteSubTask(p.id,tid,sid)}/>
          ))}
          {!D && (
            <div className="add-card">
              {showAddDev&&newDevCat===category ? (
                <div className="add-dev-form">
                  <input className="field-input" placeholder="Client name..." value={newDevClient}
                    onChange={e=>setNewDevClient(e.target.value)} autoFocus/>
                  <input className="field-input" placeholder="Project name..." value={newDevProject}
                    onChange={e=>setNewDevProject(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAddDev()}/>
                  <div className="add-dev-actions">
                    <button className="icon-btn accent" onClick={handleAddDev}><Check size={16}/></button>
                    <button className="icon-btn" onClick={()=>setShowAddDev(false)}><X size={16}/></button>
                  </div>
                </div>
              ) : (
                <button className="add-card-btn" onClick={()=>{ setNewDevCat(category); setShowAddDev(true); }}>
                  <Code2 size={24}/><span>New {label}</span>
                </button>
              )}
            </div>
          )}
        </div>
        {completed.length>0&&(
          <details className="completed-dev-section">
            <summary>Completed Projects ({completed.length})</summary>
            <div className="dev-grid" style={{marginTop:16}}>
              {completed.map(p=>(
                <DevProjectCard key={p.id} project={p}
                  onDelete={D?noop:()=>deleteDevProject(p.id)}
                  onUpdate={D?noop as never:changes=>updateDevProject(p.id,changes)}
                  onComplete={D?noop:()=>completeDevProject(p.id)}
                  onReopen={D?noop:()=>reopenDevProject(p.id)}
                  onUpdateColor={D?noopStr:c=>updateDevProjectColor(p.id,c)}
                  onUpdateIcon={D?noopStr:i=>updateDevProjectIcon(p.id,i)}
                  onAddTask={D?noopStr:t=>addDevTask(p.id,t)}
                  onToggleTask={D?noopStr:tid=>toggleDevTask(p.id,tid)}
                  onDeleteTask={D?noopStr:tid=>deleteDevTask(p.id,tid)}
                  onEditTask={D?noop as never:(tid,t)=>editDevTask(p.id,tid,t)}
                  onAddSub={D?noop as never:(tid,t)=>addSubTask(p.id,tid,t)}
                  onToggleSub={D?noop as never:(tid,sid)=>toggleSubTask(p.id,tid,sid)}
                  onDeleteSub={D?noop as never:(tid,sid)=>deleteSubTask(p.id,tid,sid)}/>
              ))}
            </div>
          </details>
        )}
      </main>
    );
  };

  return (
    <div className="layout">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        displayName={auth.currentUser?.displayName || auth.currentUser?.username || 'Admin'}
        onLogout={auth.logout}
        fbReady={fbReady}
        fbError={fbError}
        overdueCount={overdueCount}
      />

      <div className="main-content">
        {/* Demo banner */}
        {D && (
          <div className="demo-banner">
            <EyeOff size={16}/>
            <span>DEMO MODE — Showing sample data. Your real data is safe.</span>
            <button onClick={()=>setIsDemoMode(false)}>Exit Demo</button>
          </div>
        )}

        {/* Export modal */}
        {showExport && (
          <ExportModal clients={displayClients} costs={displayCosts} devProjects={displayDevProjs}
            incomeSubscriptions={displayIncSubs} onClose={()=>setShowExport(false)}
            totalMonthlyIncome={demoIncome} totalAdSpend={demoAdSpend} totalCosts={demoCosts}
            totalProfit={demoProfit} currentBalance={demoBalance}/>
        )}

        {/* HOME */}
        {activePage==='home' && (
          <HomePage
            clients={displayClients}
            oddTasks={displayOddTasks}
            users={displayUsers}
            eventsForDate={displayEventsForDate}
            meetingNotes={displayNotes}
            totalPaidIncome={D ? DEMO_CLIENTS.filter(c=>c.paidThisMonth).reduce((s,c)=>s+c.monthlyIncome,0) : totalPaidIncome}
            totalPaidExpenses={D ? DEMO_COSTS.filter(c=>c.paid).reduce((s,c)=>s+c.amount,0) : totalPaidExpenses}
            onUpdateTaskStatus={(cid,tid,status,reason)=>{ if(!D) updateTaskStatus(cid,tid,status,reason); }}
            onUpdateOddTaskStatus={(id,status,reason)=>{ if(!D) updateOddTaskStatus(id,status,reason); }}
            onDeleteOddTask={(id)=>{ if(!D) deleteOddTask(id); }}
            onUpdateOddTaskDueDate={(id,due)=>{ if(!D){ const t=oddTasks.find(x=>x.id===id); if(t) updateOddTask(id,t.title,due,t.notes,t.priority); }}}
            onToggleClientPaid={(id)=>{ if(!D) toggleClientPaid(id); }}
            onNavigateToNotes={()=>setActivePage('customers')}
            onAddRetainerTask={(cid,title,due)=>{ if(!D) addTask(cid,title,due); }}
            onAddOddTask={(title,due)=>{ if(!D) addOddTask(title,due,''); }}
          />
        )}

        {/* SOCIAL MEDIA */}
        {activePage==='social' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Social Media Marketing</h1>
              <span className="page-subtitle">Retainer clients & monthly tasks</span>
            </div>
            <main className="client-grid">
              {displayClients.map(c=>(
                <ClientCard key={c.id} client={c} users={auth.users} assistants={assistants}
                  onDeleteClient={D?noop:()=>deleteClient(c.id)}
                  onUpdateName={D?noopStr:n=>updateClientName(c.id,n)}
                  onUpdateColor={D?noopStr:col=>updateClientColor(c.id,col)}
                  onUpdateIcon={D?noopStr:i=>updateClientIcon(c.id,i)}
                  onUpdateFinancials={D?noop as never:(f,v)=>updateClientFinancials(c.id,f,v)}
                  onTogglePaid={D?noop:()=>toggleClientPaid(c.id)}
                  onToggleAdSpendPaid={D?noop:()=>toggleClientAdSpendPaid(c.id)}
                  onAddTask={D?noop as never:(t,d,uid)=>addTask(c.id,t,d,uid)}
                  onToggleTask={D?noopStr:tid=>toggleTask(c.id,tid)}
                  onDeleteTask={D?noopStr:tid=>deleteTask(c.id,tid)}
                  onEditTask={D?noop as never:(tid,t,d)=>editTask(c.id,tid,t,d)}/>
              ))}
              {!D && (
                <div className="add-card">
                  {showAddClient ? (
                    <div className="add-card-form">
                      <input ref={clientInputRef} className="field-input" placeholder="Client name..."
                        value={newClientName} onChange={e=>setNewClientName(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&handleAddClient()}/>
                      <button className="icon-btn accent" onClick={handleAddClient}><Check size={16}/></button>
                      <button className="icon-btn" onClick={()=>setShowAddClient(false)}><X size={16}/></button>
                    </div>
                  ) : (
                    <button className="add-card-btn" onClick={()=>setShowAddClient(true)}>
                      <Plus size={24}/><span>New Client</span>
                    </button>
                  )}
                </div>
              )}
            </main>
          </>
        )}

        {/* WEB DEVELOPMENT */}
        {activePage==='web' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Web Development</h1>
              <span className="page-subtitle">Active & completed web projects</span>
            </div>
            {renderDevSection(displayWebProjs, 'web')}
          </>
        )}

        {/* APP DEVELOPMENT */}
        {activePage==='app' && (
          <>
            <div className="page-header">
              <h1 className="page-title">App Development</h1>
              <span className="page-subtitle">Active & completed app projects</span>
            </div>
            {renderDevSection(displayAppProjs, 'app')}
          </>
        )}

        {/* CALENDAR */}
        {activePage==='calendar' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Calendar</h1>
            </div>
            <FullCalendar
              eventsForDate={displayEventsForDate}
              onAddEvent={D?noop as never:addEvent}
              onDeleteEvent={D?noopStr:deleteEvent}
              onEditEvent={D?noop as never:editEvent}/>
          </>
        )}

        {/* COMPANY */}
        {activePage==='company' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Company</h1>
              <span className="page-subtitle">Finances, costs, income & transaction log</span>
            </div>
            <CompanyPage
              currentBalance={currentBalance}
              onBalanceChange={setCurrentBalance}
              clients={clients}
              onToggleClientPaid={toggleClientPaid}
              costs={costs}
              onToggleCostPaid={toggleCostPaid}
              onAddCost={addCost}
              onDeleteCost={deleteCost}
              onUpdateCost={updateCost}
              onceOffCosts={onceOffCosts}
              onToggleOnceOffPaid={toggleOnceOffPaid}
              onAddOnceOffCost={addOnceOffCost}
              onDeleteOnceOffCost={deleteOnceOffCost}
              onUpdateOnceOffCost={updateOnceOffCost}
              incomeSubscriptions={incomeSubscriptions}
              onToggleSubPaid={toggleIncomeSubPaid}
              onAddSub={addIncomeSubscription}
              onDeleteSub={deleteIncomeSubscription}
              onUpdateSub={updateIncomeSubscription}
              devProjects={devProjects}
              onToggleDepositPaid={id=>updateDevProject(id,{depositPaid:!devProjects.find(p=>p.id===id)?.depositPaid})}
              onToggleFinalPaid={id=>updateDevProject(id,{finalPaid:!devProjects.find(p=>p.id===id)?.finalPaid})}
              unexpectedIncome={unexpectedIncome}
              onToggleUnexpectedPaid={toggleUnexpectedIncomePaid}
              onAddUnexpected={addUnexpectedIncome}
              onDeleteUnexpected={deleteUnexpectedIncome}
              onUpdateUnexpected={updateUnexpectedIncome}
              transactions={transactions}
              onClearTransactions={clearTransactions}
              onResetMonth={resetMonthlyPayments}
            />
          </>
        )}

        {/* PRICES */}
        {activePage==='prices' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Price List</h1>
            </div>
            <main className="dev-section">
              <PriceList
                items={displayPrices}
                assistants={D?DEMO_USERS.filter(u=>u.role==='assistant'):assistants}
                mode="admin"
                onAdd={D?noop as never:data=>addPriceItem(data.productCode,data.name,data.category,data.price,data.description,data.visibleTo)}
                onUpdate={D?noop as never:(id,data)=>updatePriceItem(id,data.productCode,data.name,data.category,data.price,data.description,data.visibleTo)}
                onDelete={D?noopStr:deletePriceItem}/>
            </main>
          </>
        )}

        {/* USERS */}
        {activePage==='users' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Users</h1>
              <span className="page-subtitle">Manage team access & permissions</span>
            </div>
            <UserManagement
              users={displayUsers}
              currentUserId={auth.currentUser!.id}
              onAddUser={D?noop as never:auth.addUser}
              onDeleteUser={D?noop as never:auth.deleteUser}
              onChangePin={D?noop as never:auth.changePin}
              onUpdatePermissions={D?noop as never:auth.updateUserPermissions}/>
          </>
        )}

        {/* DATA */}
        {activePage==='data' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Data & Analytics</h1>
              <span className="page-subtitle">Efficiency, performance & progress</span>
            </div>
            <DataPage
              clients={displayClients}
              oddTasks={displayOddTasks}
              users={displayUsers}
              devProjects={displayDevProjs}/>
          </>
        )}

        {/* CUSTOMERS */}
        {activePage==='customers' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Customers</h1>
              <span className="page-subtitle">CRM — contacts, meeting notes & project history</span>
            </div>
            <CustomersPage
              customers={customers}
              meetingNotes={meetingNotes}
              devProjects={devProjects}
              clients={clients}
              onAdd={addCustomer}
              onDelete={deleteCustomer}
              onUpdate={updateCustomer}/>
          </>
        )}

        {/* SETTINGS */}
        {activePage==='settings' && (
          <SettingsPage
            isDemoMode={isDemoMode}
            onToggleDemo={()=>setIsDemoMode(p=>!p)}
            onExport={()=>setShowExport(true)}
            fbReady={fbReady}
            fbError={fbError}
            onForcSync={async()=>{}}
          />
        )}

        {/* NOTES (accessed via Home → View All) */}
        {/* Keep MeetingNotes accessible but not in sidebar — embedded in Customers */}
      </div>
    </div>
  );
}
