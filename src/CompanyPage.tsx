import { useState } from 'react';
import {
  Edit3, Check, X, Plus, Trash2, ChevronDown, ChevronUp,
  TrendingUp, Receipt, CalendarClock, Zap, Download, RefreshCw,
} from 'lucide-react';
import {
  Client, CostItem, OnceOffCost, IncomeSubscription,
  DevProject, UnexpectedIncome, Transaction,
} from './types';
import { todayStr, genId, COST_CATEGORIES } from './useStore';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function fmtR(n: number) { return 'R ' + n.toLocaleString('en-ZA'); }
function fmtDate(d: string) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  return `${day} ${MONTH_NAMES[parseInt(m)-1].slice(0,3)} ${y}`;
}

interface Props {
  currentBalance: number;
  onBalanceChange: (n: number) => void;
  clients: Client[];
  costs: CostItem[];
  onToggleCostPaid: (id: string) => void;
  onAddCost: (name: string, amount: number, category: string) => void;
  onDeleteCost: (id: string) => void;
  onUpdateCost: (id: string, name: string, amount: number, category: string) => void;
  onceOffCosts: OnceOffCost[];
  onToggleOnceOffPaid: (id: string) => void;
  onAddOnceOffCost: (name: string, amount: number, dueDate: string, notes: string) => void;
  onDeleteOnceOffCost: (id: string) => void;
  onUpdateOnceOffCost: (id: string, name: string, amount: number, dueDate: string, notes: string) => void;
  incomeSubscriptions: IncomeSubscription[];
  onToggleSubPaid: (id: string) => void;
  onAddSub: (customerName: string, amount: number, invoiceDate: string) => void;
  onDeleteSub: (id: string) => void;
  onUpdateSub: (id: string, customerName: string, amount: number, invoiceDate: string) => void;
  devProjects: DevProject[];
  onToggleDepositPaid: (id: string) => void;
  onToggleFinalPaid: (id: string) => void;
  unexpectedIncome: UnexpectedIncome[];
  onToggleUnexpectedPaid: (id: string) => void;
  onAddUnexpected: (name: string, amount: number, date: string, notes: string) => void;
  onDeleteUnexpected: (id: string) => void;
  onUpdateUnexpected: (id: string, name: string, amount: number, date: string, notes: string) => void;
  transactions: Transaction[];
  onClearTransactions: () => void;
  onToggleClientPaid: (id: string) => void;
  onResetMonth: () => void;
}

// ── Balance Card ──────────────────────────────────────────────────
function BalanceCard({ balance, onChange }: { balance: number; onChange: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw]         = useState('');

  return (
    <div className="company-balance-card">
      <div className="company-balance-label">Current Bank Balance</div>
      {editing ? (
        <div className="company-balance-edit">
          <span>R</span>
          <input type="number" className="company-balance-input" value={raw}
            onChange={e => setRaw(e.target.value)}
            onBlur={() => { onChange(parseFloat(raw.replace(/[^0-9.]/g,''))||0); setEditing(false); }}
            onKeyDown={e => { if(e.key==='Enter'){ onChange(parseFloat(raw.replace(/[^0-9.]/g,''))||0); setEditing(false); } }}
            autoFocus />
        </div>
      ) : (
        <button className="company-balance-val" onClick={() => { setRaw(String(balance)); setEditing(true); }}>
          {fmtR(balance)} <Edit3 size={14} />
        </button>
      )}
      <p className="company-balance-note">Click to manually update balance</p>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────
function SectionBlock({ title, icon, total, children }: {
  title: string; icon: React.ReactNode; total?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="company-section">
      <div className="company-section-head">
        {icon}
        <span>{title}</span>
        {total && <span className="company-section-total">{total}</span>}
        <button className="icon-btn ml-auto" onClick={() => setOpen(p=>!p)}>
          {open ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
        </button>
      </div>
      {open && <div className="company-section-body">{children}</div>}
    </div>
  );
}

// ── Paid toggle row ───────────────────────────────────────────────
function PaidRow({ label, amount, paid, onToggle, onDelete, date }: {
  label: string; amount: number; paid: boolean;
  onToggle: () => void; onDelete?: () => void; date?: string;
}) {
  return (
    <div className={`company-item-row ${paid ? 'paid' : ''}`}>
      <button className={`paid-toggle-btn ${paid ? 'paid' : ''}`} onClick={onToggle} title={paid ? 'Mark unpaid' : 'Mark paid'}>
        {paid && <Check size={11} strokeWidth={3}/>}
      </button>
      <span className="company-item-name">{label}</span>
      {date && <span className="company-item-date">{fmtDate(date)}</span>}
      {paid && <span className="badge-paid">Paid</span>}
      <span className={`company-item-amount ${paid ? 'paid-amount' : ''}`}>{fmtR(amount)}</span>
      {onDelete && <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={13}/></button>}
    </div>
  );
}

// ── Transaction PDF export ────────────────────────────────────────
function buildTxHtml(txs: Transaction[]): string {
  const now = new Date();
  const rows = txs.map(t =>
    `<tr><td>${t.date}</td><td>${t.description}</td><td>${t.category}</td>
     <td style="color:${t.type==='income'?'#059669':'#dc2626'}">${t.type==='income'?'+':'−'}${fmtR(t.amount)}</td></tr>`
  ).join('');
  const income  = txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Transaction Report — ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}</title>
<style>
body{font-family:'Segoe UI',sans-serif;color:#1a1a2e;padding:32px;}
h1{font-size:20px;margin-bottom:4px;color:#1e3a5f;}
.sub{color:#64748b;font-size:13px;margin-bottom:24px;}
table{width:100%;border-collapse:collapse;font-size:13px;}
th{background:#1e3a5f;color:#fff;padding:8px 12px;text-align:left;}
td{padding:8px 12px;border-bottom:1px solid #f1f5f9;}
tr:nth-child(even) td{background:#f8fafc;}
.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;}
.sum-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;}
.sum-label{font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:.07em;}
.sum-val{font-size:18px;font-weight:700;}
.green{color:#059669;} .red{color:#dc2626;} .blue{color:#2563eb;}
@media print{@page{margin:20mm;}}
</style></head><body>
<h1>Transaction Report — ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}</h1>
<p class="sub">Generated ${now.toLocaleDateString('en-ZA',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
<div class="summary">
  <div class="sum-card"><div class="sum-label">Total Income</div><div class="sum-val green">${fmtR(income)}</div></div>
  <div class="sum-card"><div class="sum-label">Total Expenses</div><div class="sum-val red">${fmtR(expense)}</div></div>
  <div class="sum-card"><div class="sum-label">Net</div><div class="sum-val ${income-expense>=0?'green':'red'}">${fmtR(income-expense)}</div></div>
</div>
<table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead>
<tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">No transactions recorded</td></tr>'}</tbody></table>
</body></html>`;
}

// ── Main Component ────────────────────────────────────────────────
export default function CompanyPage({
  currentBalance, onBalanceChange,
  clients, onToggleClientPaid,
  costs, onToggleCostPaid, onAddCost, onDeleteCost, onUpdateCost,
  onceOffCosts, onToggleOnceOffPaid, onAddOnceOffCost, onDeleteOnceOffCost, onUpdateOnceOffCost,
  incomeSubscriptions, onToggleSubPaid, onAddSub, onDeleteSub, onUpdateSub,
  devProjects, onToggleDepositPaid, onToggleFinalPaid,
  unexpectedIncome, onToggleUnexpectedPaid, onAddUnexpected, onDeleteUnexpected, onUpdateUnexpected,
  transactions, onClearTransactions,
  onResetMonth,
}: Props) {
  // Add cost state
  const [addingCost, setAddingCost]         = useState(false);
  const [newCostName, setNewCostName]       = useState('');
  const [newCostAmt, setNewCostAmt]         = useState('');
  const [newCostCat, setNewCostCat]         = useState(COST_CATEGORIES[0]);
  // Add once-off state
  const [addingOnceOff, setAddingOnceOff]   = useState(false);
  const [ooName, setOoName]                 = useState('');
  const [ooAmt, setOoAmt]                   = useState('');
  const [ooDate, setOoDate]                 = useState(todayStr());
  const [ooNotes, setOoNotes]               = useState('');
  // Add subscription state
  const [addingSub, setAddingSub]           = useState(false);
  const [subName, setSubName]               = useState('');
  const [subAmt, setSubAmt]                 = useState('');
  const [subDate, setSubDate]               = useState(todayStr());
  // Add unexpected income
  const [addingUnex, setAddingUnex]         = useState(false);
  const [unexName, setUnexName]             = useState('');
  const [unexAmt, setUnexAmt]               = useState('');
  const [unexDate, setUnexDate]             = useState(todayStr());
  const [unexNotes, setUnexNotes]           = useState('');

  const submitCost = () => {
    if (!newCostName.trim()) return;
    onAddCost(newCostName.trim(), Number(newCostAmt)||0, newCostCat);
    setNewCostName(''); setNewCostAmt(''); setAddingCost(false);
  };
  const submitOnceOff = () => {
    if (!ooName.trim()) return;
    onAddOnceOffCost(ooName.trim(), Number(ooAmt)||0, ooDate, ooNotes.trim());
    setOoName(''); setOoAmt(''); setOoDate(todayStr()); setOoNotes(''); setAddingOnceOff(false);
  };
  const submitSub = () => {
    if (!subName.trim()) return;
    onAddSub(subName.trim(), Number(subAmt)||0, subDate);
    setSubName(''); setSubAmt(''); setSubDate(todayStr()); setAddingSub(false);
  };
  const submitUnex = () => {
    if (!unexName.trim()) return;
    onAddUnexpected(unexName.trim(), Number(unexAmt)||0, unexDate, unexNotes.trim());
    setUnexName(''); setUnexAmt(''); setUnexDate(todayStr()); setUnexNotes(''); setAddingUnex(false);
  };

  const exportTransactions = () => {
    const html = buildTxHtml(transactions);
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    setTimeout(() => { if (win) win.print(); URL.revokeObjectURL(url); }, 600);
  };

  // Totals for display
  const totalExpectedIncome = clients.reduce((s,c)=>s+c.monthlyIncome,0)
    + incomeSubscriptions.reduce((s,i)=>s+i.amount,0);
  const totalMonthlyCosts   = costs.reduce((s,c)=>s+c.amount,0);
  const totalOnceOff        = onceOffCosts.filter(c=>!c.paid).reduce((s,c)=>s+c.amount,0);
  const totalUnexpected     = unexpectedIncome.reduce((s,i)=>s+i.amount,0);

  return (
    <div className="company-page">
      {/* Balance + reset row */}
      <div className="company-top-row">
        <BalanceCard balance={currentBalance} onChange={onBalanceChange} />
        <button className="btn-reset-month" onClick={onResetMonth} title="Reset all paid flags for new month">
          <RefreshCw size={13} /> New Month
        </button>
      </div>

      {/* Expected Income */}
      <SectionBlock title="Expected Income" icon={<TrendingUp size={15} className="section-icon"/>} total={fmtR(totalExpectedIncome)}>
        {/* Retainer clients */}
        <div className="company-sub-label">Retainer Clients</div>
        {clients.length === 0 && <p className="empty-msg">No retainer clients.</p>}
        {clients.map(c => (
          <PaidRow key={c.id} label={`${c.icon} ${c.name}`} amount={c.monthlyIncome}
            paid={!!c.paidThisMonth} onToggle={() => onToggleClientPaid(c.id)} />
        ))}
        {/* Subscriptions */}
        <div className="company-sub-label" style={{marginTop:8}}>
          Income Subscriptions
          <button className="icon-btn xs ml-8" onClick={()=>setAddingSub(p=>!p)}><Plus size={13}/></button>
        </div>
        {addingSub && (
          <div className="cost-add-row">
            <input className="field-input" placeholder="Customer / description…" value={subName} onChange={e=>setSubName(e.target.value)} autoFocus />
            <input type="date" className="field-date" value={subDate} onChange={e=>setSubDate(e.target.value)} />
            <div className="fin-input-wrap"><span>R</span>
              <input type="number" className="fin-num" placeholder="0" value={subAmt} onChange={e=>setSubAmt(e.target.value)} />
            </div>
            <button className="icon-btn accent" onClick={submitSub}><Check size={14}/></button>
            <button className="icon-btn" onClick={()=>setAddingSub(false)}><X size={14}/></button>
          </div>
        )}
        {incomeSubscriptions.map(s => (
          <PaidRow key={s.id} label={s.customerName} amount={s.amount} date={s.invoiceDate}
            paid={!!s.paid} onToggle={() => onToggleSubPaid(s.id)}
            onDelete={() => onDeleteSub(s.id)} />
        ))}
        {incomeSubscriptions.length===0 && !addingSub && <p className="empty-msg">No subscriptions.</p>}
        {/* Dev project payments */}
        {devProjects.filter(p=>p.status==='active').length > 0 && (
          <>
            <div className="company-sub-label" style={{marginTop:8}}>Development Projects</div>
            {devProjects.filter(p=>p.status==='active').map(p => (
              <div key={p.id}>
                {p.depositAmount > 0 && (
                  <PaidRow label={`${p.icon} ${p.clientName} — ${p.projectName} (Deposit)`}
                    amount={p.depositAmount} paid={p.depositPaid}
                    onToggle={() => onToggleDepositPaid(p.id)} />
                )}
                {p.finalAmount > 0 && (
                  <PaidRow label={`${p.icon} ${p.clientName} — ${p.projectName} (Final)`}
                    amount={p.finalAmount} paid={p.finalPaid}
                    onToggle={() => onToggleFinalPaid(p.id)} />
                )}
              </div>
            ))}
          </>
        )}
      </SectionBlock>

      {/* Monthly Costs */}
      <SectionBlock title="Monthly Costs & Subscriptions" icon={<Receipt size={15} className="section-icon"/>} total={fmtR(totalMonthlyCosts)}>
        {addingCost && (
          <div className="cost-add-row">
            <input className="field-input" placeholder="Name…" value={newCostName}
              onChange={e=>setNewCostName(e.target.value)} autoFocus />
            <select className="field-select" value={newCostCat} onChange={e=>setNewCostCat(e.target.value)}>
              {COST_CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <div className="fin-input-wrap"><span>R</span>
              <input type="number" className="fin-num" placeholder="0" value={newCostAmt} onChange={e=>setNewCostAmt(e.target.value)} />
            </div>
            <button className="icon-btn accent" onClick={submitCost}><Check size={14}/></button>
            <button className="icon-btn" onClick={()=>setAddingCost(false)}><X size={14}/></button>
          </div>
        )}
        <button className="btn-add-task" style={{borderColor:'var(--border2)',color:'var(--text3)',margin:'8px 16px'}}
          onClick={()=>setAddingCost(p=>!p)}>
          <Plus size={13}/> Add Cost
        </button>
        {costs.length===0 && <p className="empty-msg">No monthly costs added yet.</p>}
        {costs.map(c=>(
          <PaidRow key={c.id} label={c.name} amount={c.amount} paid={!!c.paid}
            onToggle={()=>onToggleCostPaid(c.id)} onDelete={()=>onDeleteCost(c.id)} />
        ))}
      </SectionBlock>

      {/* Once-Off Upcoming Costs */}
      <SectionBlock title="Once-Off Upcoming Costs" icon={<CalendarClock size={15} className="section-icon"/>} total={`${fmtR(totalOnceOff)} upcoming`}>
        {addingOnceOff && (
          <div className="cost-add-row" style={{flexWrap:'wrap'}}>
            <input className="field-input" placeholder="Description…" value={ooName} onChange={e=>setOoName(e.target.value)} autoFocus />
            <input type="date" className="field-date" value={ooDate} onChange={e=>setOoDate(e.target.value)} />
            <div className="fin-input-wrap"><span>R</span>
              <input type="number" className="fin-num" placeholder="0" value={ooAmt} onChange={e=>setOoAmt(e.target.value)} />
            </div>
            <input className="field-input" placeholder="Notes (optional)…" value={ooNotes} onChange={e=>setOoNotes(e.target.value)} />
            <button className="icon-btn accent" onClick={submitOnceOff}><Check size={14}/></button>
            <button className="icon-btn" onClick={()=>setAddingOnceOff(false)}><X size={14}/></button>
          </div>
        )}
        <button className="btn-add-task" style={{borderColor:'var(--border2)',color:'var(--text3)',margin:'8px 16px'}}
          onClick={()=>setAddingOnceOff(p=>!p)}>
          <Plus size={13}/> Add Once-Off Cost
        </button>
        {onceOffCosts.length===0 && <p className="empty-msg">No once-off costs added.</p>}
        {onceOffCosts.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).map(c=>(
          <PaidRow key={c.id} label={c.name} amount={c.amount} date={c.dueDate}
            paid={c.paid} onToggle={()=>onToggleOnceOffPaid(c.id)} onDelete={()=>onDeleteOnceOffCost(c.id)} />
        ))}
      </SectionBlock>

      {/* Unexpected Income */}
      <SectionBlock title="Unexpected Income" icon={<Zap size={15} className="section-icon"/>} total={fmtR(totalUnexpected)}>
        {addingUnex && (
          <div className="cost-add-row" style={{flexWrap:'wrap'}}>
            <input className="field-input" placeholder="Description…" value={unexName} onChange={e=>setUnexName(e.target.value)} autoFocus />
            <input type="date" className="field-date" value={unexDate} onChange={e=>setUnexDate(e.target.value)} />
            <div className="fin-input-wrap"><span>R</span>
              <input type="number" className="fin-num" placeholder="0" value={unexAmt} onChange={e=>setUnexAmt(e.target.value)} />
            </div>
            <input className="field-input" placeholder="Notes (optional)…" value={unexNotes} onChange={e=>setUnexNotes(e.target.value)} />
            <button className="icon-btn accent" onClick={submitUnex}><Check size={14}/></button>
            <button className="icon-btn" onClick={()=>setAddingUnex(false)}><X size={14}/></button>
          </div>
        )}
        <button className="btn-add-task" style={{borderColor:'var(--border2)',color:'var(--text3)',margin:'8px 16px'}}
          onClick={()=>setAddingUnex(p=>!p)}>
          <Plus size={13}/> Add Unexpected Income
        </button>
        {unexpectedIncome.length===0 && <p className="empty-msg">No unexpected income added.</p>}
        {unexpectedIncome.map(i=>(
          <PaidRow key={i.id} label={i.name} amount={i.amount} date={i.date}
            paid={i.paid} onToggle={()=>onToggleUnexpectedPaid(i.id)} onDelete={()=>onDeleteUnexpected(i.id)} />
        ))}
      </SectionBlock>

      {/* Transaction log */}
      <div className="company-section">
        <div className="company-section-head">
          <Download size={15} className="section-icon"/>
          <span>Transaction Log</span>
          <span className="company-section-total">{transactions.length} entries</span>
          <div className="ml-auto" style={{display:'flex',gap:8}}>
            <button className="btn-primary" style={{background:'var(--accent)'}} onClick={exportTransactions}>
              <Download size={13}/> Export PDF
            </button>
            {transactions.length > 0 && (
              <button className="btn-ghost" onClick={onClearTransactions}>Clear</button>
            )}
          </div>
        </div>
        <div className="company-section-body">
          {transactions.length === 0 ? (
            <p className="empty-msg">Transactions are logged automatically when you mark items as paid.</p>
          ) : (
            <div className="tx-list">
              {transactions.slice(0, 50).map(t => (
                <div key={t.id} className={`tx-row ${t.type}`}>
                  <span className="tx-date">{t.date}</span>
                  <span className="tx-desc">{t.description}</span>
                  <span className="tx-cat">{t.category}</span>
                  <span className={`tx-amount ${t.type}`}>{t.type==='income'?'+':'−'}{fmtR(t.amount)}</span>
                </div>
              ))}
              {transactions.length > 50 && <p style={{textAlign:'center',color:'var(--text3)',padding:'8px'}}>…and {transactions.length-50} more. Export to see all.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
