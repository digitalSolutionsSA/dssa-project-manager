import { useState } from 'react';
import { Plus, Trash2, Check, X, Edit3, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { OnceOffCost } from './types';
import { todayStr } from './useStore';

function fmtR(n: number) { return 'R\u00a0' + n.toLocaleString('en-ZA'); }

function OnceOffRow({ item, onDelete, onUpdate, onTogglePaid }: {
  item: OnceOffCost;
  onDelete: () => void;
  onUpdate: (name: string, amount: number, dueDate: string, notes: string) => void;
  onTogglePaid: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(item.name);
  const [amount, setAmount]   = useState(String(item.amount));
  const [date, setDate]       = useState(item.dueDate);
  const [notes, setNotes]     = useState(item.notes);

  const save = () => {
    onUpdate(name.trim() || item.name, Number(amount) || 0, date, notes.trim());
    setEditing(false);
  };

  const isOverdue = !item.paid && item.dueDate < todayStr();
  const isDueSoon = !item.paid && !isOverdue &&
    new Date(item.dueDate) <= new Date(Date.now() + 7 * 86400000);

  if (editing) return (
    <div className="cost-row editing">
      <input className="field-input flex1" value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()} autoFocus placeholder="Description" />
      <input className="field-input flex1" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" />
      <input type="date" className="field-date" value={date} onChange={e => setDate(e.target.value)} />
      <div className="fin-input-wrap"><span>R</span>
        <input type="number" className="fin-num" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <button className="icon-btn accent" onClick={save}><Check size={14} /></button>
      <button className="icon-btn" onClick={() => setEditing(false)}><X size={14} /></button>
    </div>
  );

  return (
    <div className={`cost-row once-off-row ${item.paid ? 'paid-row' : ''} ${isOverdue ? 'overdue-row' : ''} ${isDueSoon ? 'due-soon-row' : ''}`}>
      <button className={`task-check ${item.paid ? 'checked' : ''}`}
        style={item.paid ? { background: '#10b981', borderColor: '#10b981' } : {}}
        onClick={onTogglePaid}>
        {item.paid && <Check size={11} strokeWidth={3} />}
      </button>
      <div className="once-off-info">
        <span className="cost-name">{item.name}</span>
        {item.notes && <span className="once-off-notes">{item.notes}</span>}
      </div>
      <span className="once-off-date">
        {isOverdue && <AlertCircle size={13} style={{ color: 'var(--red)', marginRight: 4 }} />}
        {item.dueDate}
      </span>
      {isOverdue  && <span className="badge-status overdue">Overdue</span>}
      {isDueSoon  && <span className="badge-status due-soon">Due soon</span>}
      {item.paid  && <span className="badge-status paid">Paid</span>}
      <span className={`cost-amount ${item.paid ? 'paid-amount' : 'expense-amount'}`}>{fmtR(item.amount)}</span>
      <button className="icon-btn xs" onClick={() => setEditing(true)}><Edit3 size={13} /></button>
      <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={13} /></button>
    </div>
  );
}

export default function OnceOffCosts({ items, onAdd, onDelete, onUpdate, onTogglePaid, totalUnpaid }: {
  items: OnceOffCost[];
  onAdd: (name: string, amount: number, dueDate: string, notes: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, name: string, amount: number, dueDate: string, notes: string) => void;
  onTogglePaid: (id: string) => void;
  totalUnpaid: number;
}) {
  const [adding, setAdding]   = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [name, setName]       = useState('');
  const [amount, setAmount]   = useState('');
  const [date, setDate]       = useState(todayStr());
  const [notes, setNotes]     = useState('');

  const submit = () => {
    if (name.trim()) {
      onAdd(name.trim(), Number(amount) || 0, date, notes.trim());
      setName(''); setAmount(''); setDate(todayStr()); setNotes('');
      setAdding(false);
    }
  };

  const unpaid = items.filter(i => !i.paid);
  const paid   = items.filter(i => i.paid);

  return (
    <section className="costs-section">
      <div className="section-head">
        <AlertCircle size={16} className="section-icon" style={{ color: 'var(--amber)' }} />
        <span>Once-Off Upcoming Costs</span>
        {unpaid.length > 0 && <span className="unforeseen-badge">{unpaid.length} unpaid</span>}
        <span className="section-total" style={{ color: 'var(--amber)' }}>{fmtR(totalUnpaid)}</span>
        <button className="icon-btn" onClick={() => setAdding(p => !p)}><Plus size={16} /></button>
        <button className="icon-btn" onClick={() => setCollapsed(p => !p)}>{collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</button>
      </div>

      {!collapsed && (
        <>
          {adding && (
            <div className="cost-add-row">
              <input className="field-input flex1" placeholder="What is it? (e.g. Car service)" value={name}
                onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
              <input className="field-input flex1" placeholder="Notes (optional)" value={notes}
                onChange={e => setNotes(e.target.value)} />
              <input type="date" className="field-date" value={date} onChange={e => setDate(e.target.value)} />
              <div className="fin-input-wrap"><span>R</span>
                <input type="number" className="fin-num" placeholder="0" value={amount}
                  onChange={e => setAmount(e.target.value)} />
              </div>
              <button className="icon-btn accent" onClick={submit}><Check size={14} /></button>
              <button className="icon-btn" onClick={() => setAdding(false)}><X size={14} /></button>
            </div>
          )}

          <div className="costs-list">
            {items.length === 0 && <p className="empty-msg">No once-off costs planned. Click + to add one.</p>}
            {unpaid.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(item => (
              <OnceOffRow key={item.id} item={item}
                onDelete={() => onDelete(item.id)}
                onUpdate={(n, a, d, no) => onUpdate(item.id, n, a, d, no)}
                onTogglePaid={() => onTogglePaid(item.id)} />
            ))}
            {paid.length > 0 && (
              <details className="done-section" style={{ padding: '0 18px 4px' }}>
                <summary>Paid ({paid.length}) — {fmtR(paid.reduce((s, i) => s + i.amount, 0))}</summary>
                {paid.map(item => (
                  <OnceOffRow key={item.id} item={item}
                    onDelete={() => onDelete(item.id)}
                    onUpdate={(n, a, d, no) => onUpdate(item.id, n, a, d, no)}
                    onTogglePaid={() => onTogglePaid(item.id)} />
                ))}
              </details>
            )}
          </div>
        </>
      )}
    </section>
  );
}
