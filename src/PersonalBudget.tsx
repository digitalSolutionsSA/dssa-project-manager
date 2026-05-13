import { useState } from 'react';
import { Plus, Trash2, Check, X, Edit3, ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertCircle, Wallet } from 'lucide-react';
import { BudgetIncomeItem, BudgetExpenseItem, UnforeseenExpense, BudgetIncomeCategory, BudgetExpenseCategory } from './types';
import { BUDGET_INCOME_CATEGORIES, BUDGET_EXPENSE_CATEGORIES, todayStr } from './useStore';

function fmtR(n: number) { return 'R\u00a0' + n.toLocaleString('en-ZA'); }

// ── CATEGORY COLOURS ──────────────────────────────────────────────
const INCOME_CAT_COLORS: Record<string, string> = {
  'Salary': '#10b981', 'Freelance': '#3b82f6', 'Business': '#8b5cf6',
  'Investment': '#f59e0b', 'Rental': '#06b6d4', 'Side Hustle': '#ec4899', 'Other': '#64748b',
};
const EXPENSE_CAT_COLORS: Record<string, string> = {
  'Housing': '#6366f1', 'Transport': '#3b82f6', 'Food & Groceries': '#10b981',
  'Utilities': '#06b6d4', 'Insurance': '#8b5cf6', 'Medical': '#ef4444',
  'Education': '#f59e0b', 'Entertainment': '#ec4899', 'Clothing': '#a855f7',
  'Personal Care': '#14b8a6', 'Savings': '#22c55e', 'Debt Repayment': '#dc2626',
  'Subscriptions': '#f97316', 'Family': '#0891b2', 'Pets': '#84cc16', 'Other': '#64748b',
};

// ── INLINE EDITABLE ROW ───────────────────────────────────────────
function IncomeRow({ item, onDelete, onUpdate }: {
  item: BudgetIncomeItem;
  onDelete: () => void;
  onUpdate: (name: string, amount: number, category: BudgetIncomeCategory, recurring: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(item.name);
  const [amount, setAmount]   = useState(String(item.amount));
  const [cat, setCat]         = useState(item.category);
  const [recurring, setRecurring] = useState(item.recurring);
  const save = () => { onUpdate(name.trim() || item.name, Number(amount) || 0, cat, recurring); setEditing(false); };
  const dot = INCOME_CAT_COLORS[item.category] || '#64748b';

  if (editing) return (
    <div className="budget-row editing">
      <input className="field-input flex1" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} autoFocus />
      <select className="field-select" value={cat} onChange={e => setCat(e.target.value as BudgetIncomeCategory)}>
        {BUDGET_INCOME_CATEGORIES.map(c => <option key={c}>{c}</option>)}
      </select>
      <label className="recurring-label">
        <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} /> Monthly
      </label>
      <div className="fin-input-wrap"><span>R</span>
        <input type="number" className="fin-num" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <button className="icon-btn accent" onClick={save}><Check size={14} /></button>
      <button className="icon-btn" onClick={() => setEditing(false)}><X size={14} /></button>
    </div>
  );

  return (
    <div className="budget-row">
      <span className="budget-cat-dot" style={{ background: dot }} />
      <span className="budget-item-name">{item.name}</span>
      <span className="budget-cat-tag" style={{ color: dot, borderColor: dot + '40', background: dot + '18' }}>{item.category}</span>
      {item.recurring && <span className="budget-recurring-tag">Monthly</span>}
      <span className="budget-amount income-amount">{fmtR(item.amount)}</span>
      <button className="icon-btn xs" onClick={() => setEditing(true)}><Edit3 size={13} /></button>
      <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={13} /></button>
    </div>
  );
}

function ExpenseRow({ item, onDelete, onUpdate }: {
  item: BudgetExpenseItem;
  onDelete: () => void;
  onUpdate: (name: string, amount: number, category: BudgetExpenseCategory, recurring: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(item.name);
  const [amount, setAmount]   = useState(String(item.amount));
  const [cat, setCat]         = useState(item.category);
  const [recurring, setRecurring] = useState(item.recurring);
  const save = () => { onUpdate(name.trim() || item.name, Number(amount) || 0, cat, recurring); setEditing(false); };
  const dot = EXPENSE_CAT_COLORS[item.category] || '#64748b';

  if (editing) return (
    <div className="budget-row editing">
      <input className="field-input flex1" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} autoFocus />
      <select className="field-select" value={cat} onChange={e => setCat(e.target.value as BudgetExpenseCategory)}>
        {BUDGET_EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
      </select>
      <label className="recurring-label">
        <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} /> Monthly
      </label>
      <div className="fin-input-wrap"><span>R</span>
        <input type="number" className="fin-num" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <button className="icon-btn accent" onClick={save}><Check size={14} /></button>
      <button className="icon-btn" onClick={() => setEditing(false)}><X size={14} /></button>
    </div>
  );

  return (
    <div className="budget-row">
      <span className="budget-cat-dot" style={{ background: dot }} />
      <span className="budget-item-name">{item.name}</span>
      <span className="budget-cat-tag" style={{ color: dot, borderColor: dot + '40', background: dot + '18' }}>{item.category}</span>
      {item.recurring && <span className="budget-recurring-tag">Monthly</span>}
      <span className="budget-amount expense-amount">{fmtR(item.amount)}</span>
      <button className="icon-btn xs" onClick={() => setEditing(true)}><Edit3 size={13} /></button>
      <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={13} /></button>
    </div>
  );
}

// ── UNFORESEEN ROW ────────────────────────────────────────────────
function UnforeseenRow({ item, onDelete, onUpdate, onTogglePaid }: {
  item: UnforeseenExpense;
  onDelete: () => void;
  onUpdate: (name: string, amount: number, date: string, notes: string) => void;
  onTogglePaid: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(item.name);
  const [amount, setAmount]   = useState(String(item.amount));
  const [date, setDate]       = useState(item.date);
  const [notes, setNotes]     = useState(item.notes);
  const save = () => { onUpdate(name.trim() || item.name, Number(amount) || 0, date, notes); setEditing(false); };

  if (editing) return (
    <div className="unforeseen-row editing">
      <input className="field-input flex1" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} autoFocus />
      <input className="field-input flex1" placeholder="Notes..." value={notes} onChange={e => setNotes(e.target.value)} />
      <input type="date" className="field-date" value={date} onChange={e => setDate(e.target.value)} />
      <div className="fin-input-wrap"><span>R</span>
        <input type="number" className="fin-num" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <button className="icon-btn accent" onClick={save}><Check size={14} /></button>
      <button className="icon-btn" onClick={() => setEditing(false)}><X size={14} /></button>
    </div>
  );

  return (
    <div className={`unforeseen-row ${item.paid ? 'paid' : ''}`}>
      <button className={`task-check ${item.paid ? 'checked' : ''}`}
        style={item.paid ? { background: '#10b981', borderColor: '#10b981' } : {}}
        onClick={onTogglePaid}>
        {item.paid && <Check size={11} strokeWidth={3} />}
      </button>
      <div className="unforeseen-info">
        <span className="unforeseen-name">{item.name}</span>
        {item.notes && <span className="unforeseen-notes">{item.notes}</span>}
      </div>
      <span className="unforeseen-date">{item.date}</span>
      <span className={`budget-amount ${item.paid ? 'paid-amount' : 'expense-amount'}`}>{fmtR(item.amount)}</span>
      {item.paid && <span className="badge-paid">Paid</span>}
      <button className="icon-btn xs" onClick={() => setEditing(true)}><Edit3 size={13} /></button>
      <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={13} /></button>
    </div>
  );
}

// ── ADD ROW FORMS ─────────────────────────────────────────────────
function AddIncomeForm({ onAdd }: { onAdd: (name: string, amount: number, category: BudgetIncomeCategory, recurring: boolean) => void }) {
  const [name, setName]     = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat]       = useState<BudgetIncomeCategory>('Salary');
  const [recurring, setRecurring] = useState(true);
  const submit = () => { if (name.trim()) { onAdd(name.trim(), Number(amount) || 0, cat, recurring); setName(''); setAmount(''); } };
  return (
    <div className="budget-add-row">
      <input className="field-input flex1" placeholder="Income source name..." value={name}
        onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
      <select className="field-select" value={cat} onChange={e => setCat(e.target.value as BudgetIncomeCategory)}>
        {BUDGET_INCOME_CATEGORIES.map(c => <option key={c}>{c}</option>)}
      </select>
      <label className="recurring-label">
        <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} /> Monthly
      </label>
      <div className="fin-input-wrap"><span>R</span>
        <input type="number" className="fin-num" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <button className="icon-btn accent" onClick={submit}><Check size={14} /></button>
    </div>
  );
}

function AddExpenseForm({ onAdd }: { onAdd: (name: string, amount: number, category: BudgetExpenseCategory, recurring: boolean) => void }) {
  const [name, setName]     = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat]       = useState<BudgetExpenseCategory>('Housing');
  const [recurring, setRecurring] = useState(true);
  const submit = () => { if (name.trim()) { onAdd(name.trim(), Number(amount) || 0, cat, recurring); setName(''); setAmount(''); } };
  return (
    <div className="budget-add-row">
      <input className="field-input flex1" placeholder="Expense name..." value={name}
        onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
      <select className="field-select" value={cat} onChange={e => setCat(e.target.value as BudgetExpenseCategory)}>
        {BUDGET_EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
      </select>
      <label className="recurring-label">
        <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} /> Monthly
      </label>
      <div className="fin-input-wrap"><span>R</span>
        <input type="number" className="fin-num" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <button className="icon-btn accent" onClick={submit}><Check size={14} /></button>
    </div>
  );
}

function AddUnforeseenForm({ onAdd }: { onAdd: (name: string, amount: number, date: string, notes: string) => void }) {
  const [name, setName]     = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate]     = useState(todayStr());
  const [notes, setNotes]   = useState('');
  const submit = () => { if (name.trim()) { onAdd(name.trim(), Number(amount) || 0, date, notes.trim()); setName(''); setAmount(''); setNotes(''); setDate(todayStr()); } };
  return (
    <div className="budget-add-row wrap">
      <input className="field-input flex1" placeholder="What happened? (e.g. Car repair)" value={name}
        onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
      <input className="field-input flex1" placeholder="Notes..." value={notes} onChange={e => setNotes(e.target.value)} />
      <input type="date" className="field-date" value={date} onChange={e => setDate(e.target.value)} />
      <div className="fin-input-wrap"><span>R</span>
        <input type="number" className="fin-num" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <button className="icon-btn accent" onClick={submit}><Check size={14} /></button>
    </div>
  );
}

// ── DONUT CHART (SVG) ─────────────────────────────────────────────
function DonutChart({ slices, size = 120 }: { slices: { value: number; color: string; label: string }[]; size?: number }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return null;
  const r = 40; const cx = 60; const cy = 60; const stroke = 18;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {slices.map((sl, i) => {
        const pct = sl.value / total;
        const dash = pct * circumference;
        const gap  = circumference - dash;
        const rotation = (offset / total) * 360 - 90;
        offset += sl.value;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={sl.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(${rotation} ${cx} ${cy})`}
            style={{ transition: 'all 0.3s' }}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="var(--bg2)" />
    </svg>
  );
}

// ── MAIN PERSONAL BUDGET COMPONENT ───────────────────────────────
export default function PersonalBudget({
  budgetIncome, budgetExpenses, unforeseenExpenses,
  onAddIncome, onDeleteIncome, onUpdateIncome,
  onAddExpense, onDeleteExpense, onUpdateExpense,
  onAddUnforeseen, onDeleteUnforeseen, onUpdateUnforeseen, onToggleUnforeseenPaid,
  totalBudgetIncome, totalBudgetExpenses, totalUnforeseen, budgetBalance,
}: {
  budgetIncome: BudgetIncomeItem[];
  budgetExpenses: BudgetExpenseItem[];
  unforeseenExpenses: UnforeseenExpense[];
  onAddIncome: (n: string, a: number, c: BudgetIncomeCategory, r: boolean) => void;
  onDeleteIncome: (id: string) => void;
  onUpdateIncome: (id: string, n: string, a: number, c: BudgetIncomeCategory, r: boolean) => void;
  onAddExpense: (n: string, a: number, c: BudgetExpenseCategory, r: boolean) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateExpense: (id: string, n: string, a: number, c: BudgetExpenseCategory, r: boolean) => void;
  onAddUnforeseen: (n: string, a: number, date: string, notes: string) => void;
  onDeleteUnforeseen: (id: string) => void;
  onUpdateUnforeseen: (id: string, n: string, a: number, date: string, notes: string) => void;
  onToggleUnforeseenPaid: (id: string) => void;
  totalBudgetIncome: number;
  totalBudgetExpenses: number;
  totalUnforeseen: number;
  budgetBalance: number;
}) {
  const [showAddIncome, setShowAddIncome]   = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddUnforeseen, setShowAddUnforeseen] = useState(false);
  const [incomeCollapsed, setIncomeCollapsed]     = useState(false);
  const [expenseCollapsed, setExpenseCollapsed]   = useState(false);
  const [unforeseenCollapsed, setUnforeseenCollapsed] = useState(false);

  const savingsRate = totalBudgetIncome > 0
    ? Math.max(0, Math.round(((totalBudgetIncome - totalBudgetExpenses) / totalBudgetIncome) * 100))
    : 0;

  // Group expenses by category for chart
  const expenseByCategory: Record<string, number> = {};
  budgetExpenses.forEach(e => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount; });
  const expenseSlices = Object.entries(expenseByCategory)
    .map(([label, value]) => ({ label, value, color: EXPENSE_CAT_COLORS[label] || '#64748b' }))
    .sort((a, b) => b.value - a.value);

  const incomeByCategory: Record<string, number> = {};
  budgetIncome.forEach(i => { incomeByCategory[i.category] = (incomeByCategory[i.category] || 0) + i.amount; });
  const incomeSlices = Object.entries(incomeByCategory)
    .map(([label, value]) => ({ label, value, color: INCOME_CAT_COLORS[label] || '#64748b' }))
    .sort((a, b) => b.value - a.value);

  const unpaidUnforeseen = unforeseenExpenses.filter(e => !e.paid);
  const paidUnforeseen   = unforeseenExpenses.filter(e => e.paid);

  return (
    <div className="personal-budget">

      {/* Summary Cards */}
      <div className="budget-summary-grid">
        <div className="budget-summary-card income-card">
          <div className="budget-summary-icon"><TrendingUp size={20} /></div>
          <div className="budget-summary-info">
            <span className="budget-summary-label">Total Income</span>
            <span className="budget-summary-value income-value">{fmtR(totalBudgetIncome)}</span>
          </div>
        </div>
        <div className="budget-summary-card expense-card">
          <div className="budget-summary-icon"><TrendingDown size={20} /></div>
          <div className="budget-summary-info">
            <span className="budget-summary-label">Monthly Expenses</span>
            <span className="budget-summary-value expense-value">{fmtR(totalBudgetExpenses)}</span>
          </div>
        </div>
        <div className="budget-summary-card unforeseen-card">
          <div className="budget-summary-icon"><AlertCircle size={20} /></div>
          <div className="budget-summary-info">
            <span className="budget-summary-label">Unforeseen (unpaid)</span>
            <span className="budget-summary-value unforeseen-value">{fmtR(totalUnforeseen)}</span>
          </div>
        </div>
        <div className={`budget-summary-card balance-card ${budgetBalance >= 0 ? 'positive' : 'negative'}`}>
          <div className="budget-summary-icon"><Wallet size={20} /></div>
          <div className="budget-summary-info">
            <span className="budget-summary-label">Net Balance</span>
            <span className={`budget-summary-value ${budgetBalance >= 0 ? 'income-value' : 'expense-value'}`}>{fmtR(budgetBalance)}</span>
          </div>
        </div>
        <div className="budget-summary-card savings-card">
          <div className="budget-summary-icon">💰</div>
          <div className="budget-summary-info">
            <span className="budget-summary-label">Savings Rate</span>
            <span className="budget-summary-value income-value">{savingsRate}%</span>
          </div>
          <div className="savings-bar-wrap">
            <div className="savings-bar">
              <div className="savings-bar-fill" style={{ width: `${Math.min(savingsRate, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      {(expenseSlices.length > 0 || incomeSlices.length > 0) && (
        <div className="budget-charts-row">
          {incomeSlices.length > 0 && (
            <div className="budget-chart-card">
              <h4 className="chart-title">Income Breakdown</h4>
              <div className="chart-inner">
                <DonutChart slices={incomeSlices} />
                <div className="chart-legend">
                  {incomeSlices.map(sl => (
                    <div key={sl.label} className="legend-item">
                      <span className="legend-dot" style={{ background: sl.color }} />
                      <span className="legend-label">{sl.label}</span>
                      <span className="legend-value">{fmtR(sl.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {expenseSlices.length > 0 && (
            <div className="budget-chart-card">
              <h4 className="chart-title">Expense Breakdown</h4>
              <div className="chart-inner">
                <DonutChart slices={expenseSlices} />
                <div className="chart-legend">
                  {expenseSlices.slice(0, 8).map(sl => (
                    <div key={sl.label} className="legend-item">
                      <span className="legend-dot" style={{ background: sl.color }} />
                      <span className="legend-label">{sl.label}</span>
                      <span className="legend-value">{fmtR(sl.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INCOME SECTION */}
      <div className="budget-section">
        <div className="budget-section-head income-head">
          <TrendingUp size={16} className="section-icon" />
          <span>Income</span>
          <span className="section-total income-total">{fmtR(totalBudgetIncome)}</span>
          <button className="icon-btn" onClick={() => setShowAddIncome(p => !p)}><Plus size={16} /></button>
          <button className="icon-btn" onClick={() => setIncomeCollapsed(p => !p)}>{incomeCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</button>
        </div>
        {!incomeCollapsed && (
          <>
            {showAddIncome && <AddIncomeForm onAdd={(n, a, c, r) => { onAddIncome(n, a, c, r); setShowAddIncome(false); }} />}
            <div className="budget-list">
              {budgetIncome.length === 0 && <p className="empty-msg">No income sources added yet. Click + to add.</p>}
              {budgetIncome.map(item => (
                <IncomeRow key={item.id} item={item}
                  onDelete={() => onDeleteIncome(item.id)}
                  onUpdate={(n, a, c, r) => onUpdateIncome(item.id, n, a, c, r)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* EXPENSES SECTION */}
      <div className="budget-section">
        <div className="budget-section-head expense-head">
          <TrendingDown size={16} className="section-icon" />
          <span>Monthly Expenses</span>
          <span className="section-total expense-total">{fmtR(totalBudgetExpenses)}</span>
          <button className="icon-btn" onClick={() => setShowAddExpense(p => !p)}><Plus size={16} /></button>
          <button className="icon-btn" onClick={() => setExpenseCollapsed(p => !p)}>{expenseCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</button>
        </div>
        {!expenseCollapsed && (
          <>
            {showAddExpense && <AddExpenseForm onAdd={(n, a, c, r) => { onAddExpense(n, a, c, r); setShowAddExpense(false); }} />}
            <div className="budget-list">
              {budgetExpenses.length === 0 && <p className="empty-msg">No expenses added yet. Click + to add.</p>}
              {/* Group by category */}
              {BUDGET_EXPENSE_CATEGORIES.filter(cat => budgetExpenses.some(e => e.category === cat)).map(cat => (
                <div key={cat} className="budget-cat-group">
                  <div className="budget-cat-group-label" style={{ borderLeftColor: EXPENSE_CAT_COLORS[cat] || '#64748b' }}>
                    <span className="budget-cat-dot" style={{ background: EXPENSE_CAT_COLORS[cat] || '#64748b' }} />
                    {cat}
                    <span className="budget-cat-subtotal">
                      {fmtR(budgetExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0))}
                    </span>
                  </div>
                  {budgetExpenses.filter(e => e.category === cat).map(item => (
                    <ExpenseRow key={item.id} item={item}
                      onDelete={() => onDeleteExpense(item.id)}
                      onUpdate={(n, a, c, r) => onUpdateExpense(item.id, n, a, c, r)} />
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* UNFORESEEN EXPENSES SECTION */}
      <div className="budget-section">
        <div className="budget-section-head unforeseen-head">
          <AlertCircle size={16} className="section-icon" />
          <span>Unforeseen Expenses</span>
          {unpaidUnforeseen.length > 0 && (
            <span className="unforeseen-badge">{unpaidUnforeseen.length} unpaid</span>
          )}
          <span className="section-total unforeseen-total">{fmtR(totalUnforeseen)}</span>
          <button className="icon-btn" onClick={() => setShowAddUnforeseen(p => !p)}><Plus size={16} /></button>
          <button className="icon-btn" onClick={() => setUnforeseenCollapsed(p => !p)}>{unforeseenCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</button>
        </div>
        {!unforeseenCollapsed && (
          <>
            {showAddUnforeseen && <AddUnforeseenForm onAdd={(n, a, d, no) => { onAddUnforeseen(n, a, d, no); setShowAddUnforeseen(false); }} />}
            <div className="budget-list">
              {unforeseenExpenses.length === 0 && <p className="empty-msg">No unforeseen expenses. Hopefully it stays that way! Click + to log one.</p>}

              {/* Unpaid first */}
              {unpaidUnforeseen.map(item => (
                <UnforeseenRow key={item.id} item={item}
                  onDelete={() => onDeleteUnforeseen(item.id)}
                  onUpdate={(n, a, d, no) => onUpdateUnforeseen(item.id, n, a, d, no)}
                  onTogglePaid={() => onToggleUnforeseenPaid(item.id)} />
              ))}

              {/* Paid collapsed */}
              {paidUnforeseen.length > 0 && (
                <details className="done-section" style={{ marginTop: 8 }}>
                  <summary>Paid / Resolved ({paidUnforeseen.length}) — {fmtR(paidUnforeseen.reduce((s, e) => s + e.amount, 0))}</summary>
                  {paidUnforeseen.map(item => (
                    <UnforeseenRow key={item.id} item={item}
                      onDelete={() => onDeleteUnforeseen(item.id)}
                      onUpdate={(n, a, d, no) => onUpdateUnforeseen(item.id, n, a, d, no)}
                      onTogglePaid={() => onToggleUnforeseenPaid(item.id)} />
                  ))}
                </details>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
