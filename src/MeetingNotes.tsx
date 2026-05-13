import { useState } from 'react';
import { Plus, Trash2, Check, X, Edit3, Search, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { MeetingNote } from './types';
import { todayStr } from './useStore';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(d: string) {
  const [y,m,day] = d.split('-').map(Number);
  return `${day} ${MONTH_NAMES[m-1]} ${y}`;
}

function NoteCard({ note, onDelete, onUpdate }: {
  note: MeetingNote;
  onDelete: () => void;
  onUpdate: (date: string, customer: string, title: string, notes: string, followUp: string) => void;
}) {
  const [editing, setEditing]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [date, setDate]         = useState(note.date);
  const [customer, setCustomer] = useState(note.customerName);
  const [title, setTitle]       = useState(note.title);
  const [notes, setNotes]       = useState(note.notes);
  const [followUp, setFollowUp] = useState(note.followUp);

  const save = () => {
    if (customer.trim() && title.trim()) {
      onUpdate(date, customer.trim(), title.trim(), notes.trim(), followUp.trim());
      setEditing(false);
    }
  };

  if (editing) return (
    <div className="note-card editing">
      <div className="note-edit-row">
        <input type="date" className="field-date" value={date} onChange={e => setDate(e.target.value)} />
        <input className="field-input flex1" placeholder="Customer / Company name" value={customer}
          onChange={e => setCustomer(e.target.value)} autoFocus />
        <input className="field-input flex1" placeholder="Meeting title / subject" value={title}
          onChange={e => setTitle(e.target.value)} />
      </div>
      <label className="field-label" style={{ marginTop: 8 }}>Meeting Notes</label>
      <textarea className="field-input field-ta" placeholder="What was discussed..." value={notes}
        onChange={e => setNotes(e.target.value)} rows={5} />
      <label className="field-label" style={{ marginTop: 8 }}>Follow-up Actions</label>
      <textarea className="field-input field-ta" placeholder="Action items, next steps..." value={followUp}
        onChange={e => setFollowUp(e.target.value)} rows={3} />
      <div className="note-edit-actions">
        <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
        <button className="btn-primary" style={{ background: 'var(--accent)' }} onClick={save}>
          <Check size={14} /> Save Note
        </button>
      </div>
    </div>
  );

  return (
    <div className={`note-card ${expanded ? 'expanded' : ''}`}>
      <div className="note-header" onClick={() => setExpanded(p => !p)}>
        <div className="note-meta">
          <span className="note-date">{fmtDate(note.date)}</span>
          <span className="note-customer">{note.customerName}</span>
        </div>
        <span className="note-title">{note.title}</span>
        <div className="note-header-actions" onClick={e => e.stopPropagation()}>
          <button className="icon-btn xs" onClick={() => { setEditing(true); setExpanded(false); }}><Edit3 size={13} /></button>
          <button className="icon-btn xs red-h" onClick={onDelete}><Trash2 size={13} /></button>
          <button className="icon-btn xs">{expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>
        </div>
      </div>

      {expanded && (
        <div className="note-body">
          {note.notes && (
            <div className="note-section">
              <p className="note-section-label">Meeting Notes</p>
              <p className="note-text">{note.notes}</p>
            </div>
          )}
          {note.followUp && (
            <div className="note-section follow-up">
              <p className="note-section-label">Follow-up Actions</p>
              <p className="note-text">{note.followUp}</p>
            </div>
          )}
          <p className="note-updated">Last updated: {new Date(note.updatedAt).toLocaleDateString('en-ZA')}</p>
        </div>
      )}
    </div>
  );
}

export default function MeetingNotes({ notes, onAdd, onDelete, onUpdate }: {
  notes: MeetingNote[];
  onAdd: (date: string, customer: string, title: string, notes: string, followUp: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, date: string, customer: string, title: string, notes: string, followUp: string) => void;
}) {
  const [adding, setAdding]       = useState(false);
  const [search, setSearch]       = useState('');
  const [date, setDate]           = useState(todayStr());
  const [customer, setCustomer]   = useState('');
  const [title, setTitle]         = useState('');
  const [noteText, setNoteText]   = useState('');
  const [followUp, setFollowUp]   = useState('');

  const submit = () => {
    if (customer.trim() && title.trim()) {
      onAdd(date, customer.trim(), title.trim(), noteText.trim(), followUp.trim());
      setDate(todayStr()); setCustomer(''); setTitle(''); setNoteText(''); setFollowUp('');
      setAdding(false);
    }
  };

  const filtered = notes.filter(n =>
    !search ||
    n.customerName.toLowerCase().includes(search.toLowerCase()) ||
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.notes.toLowerCase().includes(search.toLowerCase())
  );

  // Group by month
  const byMonth: Record<string, MeetingNote[]> = {};
  filtered.forEach(n => {
    const [y,m] = n.date.split('-');
    const key = `${MONTH_NAMES[parseInt(m)-1]} ${y}`;
    (byMonth[key] = byMonth[key] || []).push(n);
  });

  return (
    <div className="meeting-notes">
      {/* Toolbar */}
      <div className="notes-toolbar">
        <div className="notes-search-wrap">
          <Search size={16} className="notes-search-icon" />
          <input className="notes-search" placeholder="Search by customer, title, or notes..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="icon-btn xs" onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
        <button className="btn-primary" style={{ background: 'var(--accent2)' }} onClick={() => setAdding(p => !p)}>
          <Plus size={15} /> New Meeting Note
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="note-card editing" style={{ marginBottom: 16 }}>
          <h4 className="note-add-title"><FileText size={15} /> New Meeting Note</h4>
          <div className="note-edit-row">
            <input type="date" className="field-date" value={date} onChange={e => setDate(e.target.value)} />
            <input className="field-input flex1" placeholder="Customer / Company name" value={customer}
              onChange={e => setCustomer(e.target.value)} autoFocus />
            <input className="field-input flex1" placeholder="Meeting title / subject" value={title}
              onChange={e => setTitle(e.target.value)} />
          </div>
          <label className="field-label" style={{ marginTop: 10 }}>Meeting Notes</label>
          <textarea className="field-input field-ta" placeholder="What was discussed, decisions made..." value={noteText}
            onChange={e => setNoteText(e.target.value)} rows={5} />
          <label className="field-label" style={{ marginTop: 8 }}>Follow-up Actions</label>
          <textarea className="field-input field-ta" placeholder="Action items, send proposal, schedule call..." value={followUp}
            onChange={e => setFollowUp(e.target.value)} rows={3} />
          <div className="note-edit-actions">
            <button className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn-primary" style={{ background: 'var(--accent)' }} onClick={submit}
              disabled={!customer.trim() || !title.trim()}>
              <Check size={14} /> Save Note
            </button>
          </div>
        </div>
      )}

      {/* Notes grouped by month */}
      {notes.length === 0 && !adding && (
        <p className="empty-msg">No meeting notes yet. Click "New Meeting Note" to log your first one.</p>
      )}
      {filtered.length === 0 && search && (
        <p className="empty-msg">No notes match "{search}".</p>
      )}
      {Object.entries(byMonth).map(([month, monthNotes]) => (
        <div key={month} className="notes-month-group">
          <h4 className="notes-month-label">{month} <span className="notes-month-count">{monthNotes.length}</span></h4>
          {monthNotes.map(note => (
            <NoteCard key={note.id} note={note}
              onDelete={() => onDelete(note.id)}
              onUpdate={(d, c, ti, no, f) => onUpdate(note.id, d, c, ti, no, f)} />
          ))}
        </div>
      ))}
    </div>
  );
}
