import { useState } from 'react';
import { Save, Trash2, Edit3, Check, X, TrendingUp, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { MonthlySnapshot } from './types';

function fmtR(n: number) { return 'R\u00a0' + n.toLocaleString('en-ZA'); }

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
