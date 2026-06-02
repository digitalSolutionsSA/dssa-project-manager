import { useState } from 'react';
import {
  Plus, Trash2, Edit3, Check, X, ChevronRight,
  Mail, Phone, MapPin, Building, FileText, Users,
} from 'lucide-react';
import { Customer, MeetingNote, DevProject, Client } from './types';
import { todayStr } from './useStore';

interface Props {
  customers: Customer[];
  meetingNotes: MeetingNote[];
  devProjects: DevProject[];
  clients: Client[];
  onAdd: (name: string, company?: string, email?: string, phone?: string, address?: string, notes?: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, name: string, company?: string, email?: string, phone?: string, address?: string, notes?: string) => void;
}

interface CustomerForm {
  name: string; company: string; email: string;
  phone: string; address: string; notes: string;
}

const EMPTY_FORM: CustomerForm = { name:'',company:'',email:'',phone:'',address:'',notes:'' };

function getInitials(name: string) {
  return name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
}

const AVATAR_COLORS = [
  '#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1',
];

export default function CustomersPage({ customers, meetingNotes, devProjects, clients, onAdd, onDelete, onUpdate }: Props) {
  const [selected, setSelected]     = useState<Customer | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Customer | null>(null);
  const [form, setForm]             = useState<CustomerForm>(EMPTY_FORM);
  const [search, setSearch]         = useState('');
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const startAdd = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(true);
  };

  const startEdit = (c: Customer) => {
    setForm({ name:c.name, company:c.company||'', email:c.email||'', phone:c.phone||'', address:c.address||'', notes:c.notes||'' });
    setEditing(c);
    setShowForm(true);
  };

  const submitForm = () => {
    if (!form.name.trim()) return;
    if (editing) {
      onUpdate(editing.id, form.name.trim(), form.company||undefined, form.email||undefined, form.phone||undefined, form.address||undefined, form.notes||undefined);
      if (selected?.id === editing.id) setSelected({ ...editing, ...form });
    } else {
      onAdd(form.name.trim(), form.company||undefined, form.email||undefined, form.phone||undefined, form.address||undefined, form.notes||undefined);
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    if (selected?.id === id) setSelected(null);
    setConfirmDel(null);
  };

  // Get linked data for selected customer
  const linkedNotes    = selected ? meetingNotes.filter(n => n.customerName.toLowerCase().includes(selected.name.toLowerCase())) : [];
  const linkedProjects = selected ? devProjects.filter(p => p.clientName.toLowerCase().includes(selected.name.toLowerCase()) || (selected.company && p.clientName.toLowerCase().includes(selected.company!.toLowerCase()))) : [];
  const linkedRetainer = selected ? clients.filter(c => c.name.toLowerCase().includes(selected.name.toLowerCase()) || (selected.company && c.name.toLowerCase().includes(selected.company!.toLowerCase()))) : [];

  const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <div className="customers-page">
      {/* Left: customer list */}
      <div className="customers-list-panel">
        <div className="customers-list-header">
          <input className="customers-search" placeholder="Search customers…" value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="btn-primary" onClick={startAdd}><Plus size={14}/> Add</button>
        </div>

        {filtered.length === 0 && (
          <div className="customers-empty">
            <Users size={40} />
            <p>{search ? 'No results.' : 'No customers yet. Click Add to get started.'}</p>
          </div>
        )}

        <div className="customers-list">
          {filtered.map(c => (
            <div key={c.id}
              className={`customer-list-item ${selected?.id===c.id ? 'active' : ''}`}
              onClick={() => setSelected(c)}>
              <div className="customer-avatar" style={{ background: avatarColor(c.id) }}>
                {getInitials(c.name)}
              </div>
              <div className="customer-list-info">
                <div className="customer-list-name">{c.name}</div>
                {c.company && <div className="customer-list-company">{c.company}</div>}
                {c.email && <div className="customer-list-email">{c.email}</div>}
              </div>
              <ChevronRight size={14} className="customer-list-arrow" />
            </div>
          ))}
        </div>
      </div>

      {/* Right: detail view */}
      <div className="customers-detail-panel">
        {selected ? (
          <>
            <div className="customer-detail-header">
              <div className="customer-detail-avatar" style={{ background: avatarColor(selected.id) }}>
                {getInitials(selected.name)}
              </div>
              <div className="customer-detail-title">
                <h2>{selected.name}</h2>
                {selected.company && <p>{selected.company}</p>}
              </div>
              <div className="customer-detail-actions">
                <button className="icon-btn" onClick={() => startEdit(selected)}><Edit3 size={15}/></button>
                {confirmDel === selected.id ? (
                  <>
                    <button className="btn-danger" onClick={() => handleDelete(selected.id)}>Delete?</button>
                    <button className="icon-btn" onClick={() => setConfirmDel(null)}><X size={14}/></button>
                  </>
                ) : (
                  <button className="icon-btn red-h" onClick={() => setConfirmDel(selected.id)}><Trash2 size={15}/></button>
                )}
              </div>
            </div>

            {/* Contact info */}
            <div className="customer-contact-grid">
              {selected.email && (
                <div className="customer-contact-item">
                  <Mail size={14}/> <a href={`mailto:${selected.email}`}>{selected.email}</a>
                </div>
              )}
              {selected.phone && (
                <div className="customer-contact-item">
                  <Phone size={14}/> <a href={`tel:${selected.phone}`}>{selected.phone}</a>
                </div>
              )}
              {selected.address && (
                <div className="customer-contact-item">
                  <MapPin size={14}/> <span>{selected.address}</span>
                </div>
              )}
            </div>

            {selected.notes && (
              <div className="customer-notes-block">
                <div className="customer-notes-label">Notes</div>
                <p>{selected.notes}</p>
              </div>
            )}

            {/* Linked retainer */}
            {linkedRetainer.length > 0 && (
              <div className="customer-linked-section">
                <div className="customer-linked-title"><Building size={13}/> Retainer / Social Media</div>
                {linkedRetainer.map(c => (
                  <div key={c.id} className="customer-linked-row" style={{ borderLeftColor: c.color }}>
                    <span>{c.icon} {c.name}</span>
                    <span className={`badge-${c.paidThisMonth?'paid':'overdue'}`}>{c.paidThisMonth?'Paid':'Unpaid'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Linked projects */}
            {linkedProjects.length > 0 && (
              <div className="customer-linked-section">
                <div className="customer-linked-title"><FileText size={13}/> Projects</div>
                {linkedProjects.map(p => (
                  <div key={p.id} className="customer-linked-row" style={{ borderLeftColor: p.color }}>
                    <span>{p.icon} {p.projectName}</span>
                    <span className={`badge-${p.status==='completed'?'paid':'inprog'}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Meeting notes */}
            <div className="customer-linked-section">
              <div className="customer-linked-title"><FileText size={13}/> Meeting Notes ({linkedNotes.length})</div>
              {linkedNotes.length === 0 ? (
                <p className="empty-msg" style={{padding:'8px 0'}}>No meeting notes for this customer.</p>
              ) : (
                linkedNotes.map(n => (
                  <div key={n.id} className="customer-note-row">
                    <div className="customer-note-meta">{n.date} — {n.title}</div>
                    <p>{n.notes}</p>
                    {n.followUp && <p className="customer-note-followup">↪ {n.followUp}</p>}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="customers-detail-empty">
            <Users size={48} />
            <p>Select a customer to view details</p>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="event-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{borderBottomColor:'var(--accent)'}}>
              <Users size={18} style={{color:'var(--accent)'}}/>
              <div>
                <h3 className="modal-title">{editing ? 'Edit Customer' : 'New Customer'}</h3>
              </div>
              <button className="icon-btn ml-auto" onClick={() => { setShowForm(false); setEditing(null); }}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <label className="field-label">Name *</label>
              <input className="field-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus placeholder="Full name" />
              <label className="field-label">Company</label>
              <input className="field-input" value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} placeholder="Company / Business" />
              <label className="field-label">Email</label>
              <input className="field-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com" />
              <label className="field-label">Phone</label>
              <input className="field-input" type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+27 XX XXX XXXX" />
              <label className="field-label">Address</label>
              <input className="field-input" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Street, City" />
              <label className="field-label">Notes</label>
              <textarea className="field-input field-ta" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} placeholder="Any additional notes…" />
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
                <button className="btn-primary" style={{background:'var(--accent)'}} onClick={submitForm} disabled={!form.name.trim()}>
                  <Check size={14}/> {editing ? 'Save' : 'Add Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
