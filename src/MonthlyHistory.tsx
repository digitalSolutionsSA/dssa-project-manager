import { useState } from 'react';
import { Save, Trash2, Edit3, Check, X, TrendingUp, BarChart3, ChevronDown, ChevronUp, FileDown } from 'lucide-react';
import { MonthlySnapshot } from './types';

function fmtR(n: number) { return 'R\u00a0' + n.toLocaleString('en-ZA'); }

// \u2500\u2500 PDF Export \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function exportSnapshotToPdf(snap: MonthlySnapshot) {
  const netBusiness = snap.businessProfit + snap.devIncome;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Financial Report \u2014 ${snap.label}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; padding: 40px; font-size: 13px; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; color: #1a1a2e; }
  .subtitle { color: #64748b; font-size: 12px; margin-bottom: 28px; }
  .logo-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; border-bottom: 2px solid #6c63ff; padding-bottom: 16px; }
  .biz-name { font-size: 18px; font-weight: 700; color: #6c63ff; }
  .report-label { font-size: 13px; color: #64748b; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .section { background: #f8f9fc; border-radius: 10px; padding: 18px; }
  .section h2 { font-size: 14px; font-weight: 700; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; color: #6c63ff; letter-spacing: 0.5px; text-transform: uppercase; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eef0f5; }
  .row:last-child { border: none; }
  .row.total { margin-top: 8px; padding-top: 10px; border-top: 2px solid #6c63ff; font-weight: 700; font-size: 14px; }
  .income { color: #10b981; font-weight: 600; }
  .expense { color: #ef4444; font-weight: 600; }
  .profit-pos { color: #10b981; font-weight: 700; }
  .profit-neg { color: #ef4444; font-weight: 700; }
  .notes-section { background: #f8f9fc; border-radius: 10px; padding: 18px; margin-bottom: 24px; }
  .notes-section h2 { font-size: 14px; font-weight: 700; margin-bottom: 10px; color: #6c63ff; }
  .notes-text { color: #475569; line-height: 1.6; }
  .footer { color: #94a3b8; font-size: 11px; text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="logo-row">
    <div>
      <div class="biz-name">Digital Solutions SA</div>
      <div class="report-label">Monthly Financial Report</div>
    </div>
  </div>
  <h1>${snap.label}</h1>
  <div class="subtitle">Saved on ${new Date(snap.savedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

  <div class="cols">
    <div class="section">
      <h2>Business</h2>
      <div class="row"><span>Retainer Income</span><span class="income">${fmtR(snap.businessIncome)}</span></div>
      <div class="row"><span>Dev Income (received)</span><span class="income">${fmtR(snap.devIncome)}</span></div>
      <div class="row"><span>Ad Spend</span><span class="expense">${fmtR(snap.businessAdSpend)}</span></div>
      <div class="row"><span>Monthly Costs</span><span class="expense">${fmtR(snap.businessCosts)}</span></div>
      <div class="row total"><span>Net Business Profit</span><span class="${netBusiness >= 0 ? 'profit-pos' : 'profit-neg'}">${fmtR(netBusiness)}</span></div>
    </div>
    <div class="section">
      <h2>Personal Budget</h2>
      <div class="row"><span>Income Received</span><span class="income">${fmtR(snap.personalIncome)}</span></div>
      <div class="row"><span>Expenses Paid</span><span class="expense">${fmtR(snap.personalExpenses)}</span></div>
      <div class="row"><span>Unforeseen Expenses</span><span class="expense">${fmtR(snap.personalUnforeseen)}</span></div>
      <div class="row total"><span>Net Personal Balance</span><span class="${snap.personalBalance >= 0 ? 'profit-pos' : 'profit-neg'}">${fmtR(snap.personalBalance)}</span></div>
    </div>
  </div>

  ${snap.notes ? `<div class="notes-section"><h2>Month Notes</h2><p class="notes-text">${snap.notes.replace(/\n/g, '<br/>')}</p></div>` : ''}

  <div class="footer">
    Digital Solutions SA &mdash; Generated ${new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
  </div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (w) { w.document.write(html); w.document.close(); }
}

function SnapshotCard({ snap, onDelete, onUpdateNotes }: {
  snap: MonthlySnapshot;
  onDelete: () => void;
  onUpdateNotes: (notes: string) => void;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal]         = useState(snap.notes);
  const [expanded, setExpanded]         = useState(false);

  const saveNotes = () => { onUpdateNotes(notesVal); setEditingNotes(false); };

  const netBusiness = snap.businessProfit + snap.devIncome;

  return (
    <div className="snapshot-card">
      <div className="snapshot-header" onClick={() => setExpanded(p => !p)}>
        <div className="snapshot-label">
          <span className="snapshot-month">{snap.label}</span>
          <span className="snapshot-saved">Saved {new Date(snap.savedAt).toLocaleDateString('en-ZA')}</span>
        </div>
        <div className="snapshot-quick">
          <span className={`snapshot-profit ${netBusiness >= 0 ? 'pos' : 'neg'}`}>
            Biz: {fmtR(netBusiness)}
          </span>
          <span className={`snapshot-profit ${snap.personalBalance >= 0 ? 'pos' : 'neg'}`}>
            Personal: {fmtR(snap.personalBalance)}
          </span>
        </div>
        <div className="snapshot-actions" onClick={e => e.stopPropagation()}>
          <button className="icon-btn xs" title="Export to PDF" onClick={() => exportSnapshotToPdf(snap)}>
            <FileDown size={13} />
          </button>
          <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={13} /></button>
          <button className="icon-btn xs">{expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>
        </div>
      </div>

      {expanded && (
        <div className="snapshot-body">
          <div className="snapshot-cols">
            {/* Business */}
            <div className="snapshot-col">
              <h4 className="snapshot-col-title">Business</h4>
              <div className="snapshot-row"><span>Retainer Income</span><span className="snap-val income">{fmtR(snap.businessIncome)}</span></div>
              <div className="snapshot-row"><span>Dev Income (received)</span><span className="snap-val income">{fmtR(snap.devIncome)}</span></div>
              <div className="snapshot-row"><span>Ad Spend</span><span className="snap-val expense">{fmtR(snap.businessAdSpend)}</span></div>
              <div className="snapshot-row"><span>Costs</span><span className="snap-val expense">{fmtR(snap.businessCosts)}</span></div>
              <div className="snapshot-row total"><span>Net Profit</span><span className={`snap-val ${snap.businessProfit >= 0 ? 'income' : 'expense'}`}>{fmtR(snap.businessProfit)}</span></div>
            </div>
            {/* Personal */}
            <div className="snapshot-col">
              <h4 className="snapshot-col-title">Personal</h4>
              <div className="snapshot-row"><span>Income</span><span className="snap-val income">{fmtR(snap.personalIncome)}</span></div>
              <div className="snapshot-row"><span>Expenses</span><span className="snap-val expense">{fmtR(snap.personalExpenses)}</span></div>
              <div className="snapshot-row"><span>Unforeseen</span><span className="snap-val expense">{fmtR(snap.personalUnforeseen)}</span></div>
              <div className="snapshot-row total"><span>Balance</span><span className={`snap-val ${snap.personalBalance >= 0 ? 'income' : 'expense'}`}>{fmtR(snap.personalBalance)}</span></div>
            </div>
          </div>

          {/* Notes */}
          <div className="snapshot-notes-area">
            <div className="snapshot-notes-head">
              <span className="field-label">Month Notes</span>
              {!editingNotes && (
                <button className="icon-btn xs" onClick={() => setEditingNotes(true)}><Edit3 size={13} /></button>
              )}
            </div>
            {editingNotes ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <textarea className="field-input field-ta" value={notesVal}
                  onChange={e => setNotesVal(e.target.value)} rows={3} autoFocus />
                <button className="icon-btn accent" onClick={saveNotes}><Check size={14} /></button>
                <button className="icon-btn" onClick={() => setEditingNotes(false)}><X size={14} /></button>
              </div>
            ) : (
              <p className="snapshot-notes-text">{snap.notes || 'No notes for this month.'}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MonthlyHistory({ snapshots, onSave, onDelete, onUpdateNotes,
  allTimeBusinessIncome, allTimeBusinessProfit, allTimePersonalBalance,
  currentBusinessIncome, currentBusinessProfit, currentPersonalBalance,
}: {
  snapshots: MonthlySnapshot[];
  onSave: (notes: string) => void;
  onDelete: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  allTimeBusinessIncome: number;
  allTimeBusinessProfit: number;
  allTimePersonalBalance: number;
  currentBusinessIncome: number;
  currentBusinessProfit: number;
  currentPersonalBalance: number;
}) {
  const [savingNotes, setSavingNotes] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const handleSave = () => {
    onSave(savingNotes);
    setSavingNotes('');
    setShowSaveForm(false);
  };

  return (
    <div className="monthly-history">

      {/* All-time totals */}
      <div className="history-totals">
        <h3 className="history-totals-title"><BarChart3 size={17} /> Cumulative Totals (all saved months)</h3>
        <div className="history-totals-grid">
          <div className="history-total-card">
            <span className="history-total-label">Total Business Income</span>
            <span className="history-total-val income">{fmtR(allTimeBusinessIncome)}</span>
          </div>
          <div className="history-total-card">
            <span className="history-total-label">Total Business Profit</span>
            <span className={`history-total-val ${allTimeBusinessProfit >= 0 ? 'income' : 'expense'}`}>{fmtR(allTimeBusinessProfit)}</span>
          </div>
          <div className="history-total-card">
            <span className="history-total-label">Total Personal Balance</span>
            <span className={`history-total-val ${allTimePersonalBalance >= 0 ? 'income' : 'expense'}`}>{fmtR(allTimePersonalBalance)}</span>
          </div>
          <div className="history-total-card current">
            <span className="history-total-label">This Month (unsaved)</span>
            <span className={`history-total-val ${currentBusinessProfit >= 0 ? 'income' : 'expense'}`}>
              Biz {fmtR(currentBusinessProfit)} / Personal {fmtR(currentPersonalBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Save this month */}
      <div className="history-save-block">
        {showSaveForm ? (
          <div className="history-save-form">
            <p className="history-save-label">Save a snapshot of this month's financials</p>
            <textarea className="field-input field-ta" placeholder="Optional: notes about this month..." value={savingNotes}
              onChange={e => setSavingNotes(e.target.value)} rows={2} autoFocus />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowSaveForm(false)}>Cancel</button>
              <button className="btn-primary" style={{ background: 'var(--green)' }} onClick={handleSave}>
                <Save size={14} /> Save This Month
              </button>
            </div>
          </div>
        ) : (
          <button className="btn-save-month" onClick={() => setShowSaveForm(true)}>
            <Save size={15} /> Save This Month's Snapshot
          </button>
        )}
      </div>

      {/* Snapshots list */}
      <div className="snapshots-list">
        {snapshots.length === 0 && (
          <p className="empty-msg">No monthly snapshots saved yet. Hit "Save This Month" to start your records.</p>
        )}
        {snapshots.map(snap => (
          <SnapshotCard key={snap.id} snap={snap}
            onDelete={() => onDelete(snap.id)}
            onUpdateNotes={notes => onUpdateNotes(snap.id, notes)} />
        ))}
      </div>
    </div>
  );
}
