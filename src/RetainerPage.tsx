import { useState } from 'react';
import { Plus, Trash2, Edit3, Check, X, Repeat, CheckCircle2, AlertCircle } from 'lucide-react';
import { RetainerClient } from './types';
import { needsCheckIn } from './useStore';

// ── Add / edit form ─────────────────────────────────────────────────
function ClientForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<RetainerClient>;
  onSave: (name: string, description: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  const valid = name.trim().length > 0;

  function submit() {
    if (!valid) return;
    onSave(name.trim(), description.trim());
  }

  return (
    <div className="pl-item-form">
      <div className="pl-form-field">
        <label className="field-label">Client Name <span className="required">*</span></label>
        <input className="field-input" placeholder="e.g. Vaal Exotics" value={name}
          onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
      </div>
      <div className="pl-form-field">
        <label className="field-label">Description <span className="optional">(optional)</span></label>
        <textarea className="field-input field-ta" rows={3}
          placeholder="Notes about this retainer client — what we manage for them, contact details, etc."
          value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="modal-actions" style={{ marginTop: 8 }}>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={!valid}>
          <Check size={14} /> {initial?.id ? 'Save Changes' : 'Add Client'}
        </button>
      </div>
    </div>
  );
}

// ── Single client card ──────────────────────────────────────────────
function RetainerCard({
  client, mode, onCheckIn, onEdit, onDelete,
}: {
  client: RetainerClient;
  mode: 'admin' | 'assistant';
  onCheckIn: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const pending = needsCheckIn(client);

  return (
    <div className="retainer-card" style={{ borderLeftColor: pending ? 'var(--amber)' : 'var(--green)' }}>
      <div className="retainer-card-main">
        <div className="retainer-card-info">
          <span className="retainer-card-name">{client.name}</span>
          {client.description && <span className="retainer-card-desc">{client.description}</span>}
        </div>
        <div className={`retainer-status ${pending ? 'pending' : 'ok'}`}>
          {pending ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
          <span>{pending ? 'Needs check-in this week' : 'Checked in this week'}</span>
        </div>
      </div>
      <div className="retainer-card-actions">
        {pending && (
          <button className="btn-primary sm" onClick={onCheckIn}>
            <Check size={13} /> Mark Checked In
          </button>
        )}
        {mode === 'admin' && onEdit && (
          <button className="icon-btn xs" onClick={onEdit} title="Edit"><Edit3 size={13} /></button>
        )}
        {mode === 'admin' && onDelete && (
          <button className="icon-btn xs red-h" onClick={onDelete} title="Remove client"><Trash2 size={13} /></button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// RETAINER PAGE
// ══════════════════════════════════════════════════════════════════
export default function RetainerPage({
  clients, mode, onAdd, onUpdate, onDelete, onCheckIn,
}: {
  clients: RetainerClient[];
  mode: 'admin' | 'assistant';
  onAdd?: (name: string, description: string) => void;
  onUpdate?: (id: string, changes: Partial<RetainerClient>) => void;
  onDelete?: (id: string) => void;
  onCheckIn: (id: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const pendingCount = clients.filter(needsCheckIn).length;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Retainer Clients</h1>
        <span className="page-subtitle">
          {clients.length} client{clients.length !== 1 ? 's' : ''}
          {pendingCount > 0 ? ` · ${pendingCount} need${pendingCount === 1 ? 's' : ''} a check-in this week` : ' · all checked in this week'}
        </span>
      </div>

      <main className="retainer-list">
        {mode === 'admin' && (
          <div className="tasks-section-head">
            <Repeat size={16} className="section-icon" />
            <span>Monthly Retainer Clients</span>
            <span className="section-total-of">{clients.length}</span>
            <button className="icon-btn accent" style={{ marginLeft: 'auto' }}
              onClick={() => { setShowAddForm(p => !p); setEditingId(null); }} title="Add client">
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>
        )}

        {mode === 'admin' && showAddForm && (
          <div className="pl-add-wrap">
            <ClientForm
              onSave={(name, description) => { onAdd?.(name, description); setShowAddForm(false); }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        <div className="retainer-items">
          {clients.length === 0 && (
            <div className="empty-state">
              <Repeat size={36} />
              <p className="assistant-empty-title">
                {mode === 'admin' ? 'No retainer clients added yet' : 'No retainer clients yet'}
              </p>
              {mode === 'admin' && (
                <p className="assistant-empty-sub">Click the + button above to add your first monthly client.</p>
              )}
            </div>
          )}

          {clients.map(client => (
            editingId === client.id ? (
              <div key={client.id} className="pl-add-wrap">
                <ClientForm initial={client}
                  onSave={(name, description) => { onUpdate?.(client.id, { name, description }); setEditingId(null); }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div key={client.id}>
                {confirmDelete === client.id ? (
                  <div className="pl-confirm-delete">
                    <span>Remove "<strong>{client.name}</strong>" from retainers?</span>
                    <button className="btn-danger" onClick={() => { onDelete?.(client.id); setConfirmDelete(null); }}>Remove</button>
                    <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                  </div>
                ) : (
                  <RetainerCard client={client} mode={mode}
                    onCheckIn={() => onCheckIn(client.id)}
                    onEdit={mode === 'admin' ? () => { setEditingId(client.id); setShowAddForm(false); } : undefined}
                    onDelete={mode === 'admin' ? () => setConfirmDelete(client.id) : undefined}
                  />
                )}
              </div>
            )
          ))}
        </div>
      </main>
    </>
  );
}
