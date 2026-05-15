import { useState } from 'react';
import { Plus, Trash2, Edit3, Check, X, Tag, ChevronDown, ChevronUp, Search, Users } from 'lucide-react';
import { PriceListItem, PriceCategory, AppUser } from './types';

function fmtR(n: number) { return 'R ' + n.toLocaleString('en-ZA'); }

export const PRICE_CATEGORIES: PriceCategory[] = [
  'Web Development', 'App Development', 'Social Media Marketing', 'Misc',
];

const CAT_COLORS: Record<PriceCategory, string> = {
  'Web Development':        '#3b82f6',
  'App Development':        '#8b5cf6',
  'Social Media Marketing': '#10b981',
  'Misc':                   '#f59e0b',
};

const CAT_ICONS: Record<PriceCategory, string> = {
  'Web Development':        '🌐',
  'App Development':        '📱',
  'Social Media Marketing': '📣',
  'Misc':                   '🗂️',
};

// ── Visibility selector (admin only) ──────────────────────────────
function VisibilityPicker({
  value, assistants, onChange,
}: {
  value: 'all' | string[];
  assistants: AppUser[];
  onChange: (v: 'all' | string[]) => void;
}) {
  const isAll = value === 'all';

  function toggleAssistant(id: string) {
    if (isAll) {
      // Switch from 'all' to specific list minus this one
      onChange(assistants.filter(a => a.id !== id).map(a => a.id));
    } else {
      const arr = value as string[];
      onChange(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
    }
  }

  return (
    <div className="pl-visibility">
      <button
        type="button"
        className={`pl-vis-all-btn ${isAll ? 'active' : ''}`}
        onClick={() => onChange('all')}
      >
        <Users size={13} /> All Assistants
      </button>
      {assistants.length > 0 && (
        <div className="pl-vis-assistants">
          {assistants.map(a => {
            const selected = isAll || (value as string[]).includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                className={`pl-vis-asst-btn ${selected ? 'active' : ''}`}
                onClick={() => toggleAssistant(a.id)}
              >
                <span className={`pl-vis-dot ${selected ? 'on' : ''}`} />
                {a.displayName || a.username}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Item form (add / edit) ─────────────────────────────────────────
function ItemForm({
  initial, assistants, onSave, onCancel,
}: {
  initial?: Partial<PriceListItem>;
  assistants: AppUser[];
  onSave: (data: Omit<PriceListItem, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [productCode, setProductCode] = useState(initial?.productCode ?? '');
  const [name, setName]               = useState(initial?.name ?? '');
  const [category, setCategory]       = useState<PriceCategory>(initial?.category ?? 'Web Development');
  const [price, setPrice]             = useState(String(initial?.price ?? ''));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [visibleTo, setVisibleTo]     = useState<'all' | string[]>(initial?.visibleTo ?? 'all');

  const valid = name.trim().length > 0;

  function submit() {
    if (!valid) return;
    onSave({
      productCode: productCode.trim(),
      name: name.trim(),
      category,
      price: Number(price) || 0,
      description: description.trim(),
      visibleTo,
    });
  }

  return (
    <div className="pl-item-form">
      <div className="pl-form-grid">
        <div className="pl-form-field">
          <label className="field-label">Product Code <span className="optional">(optional)</span></label>
          <input className="field-input" placeholder="e.g. WD-001" value={productCode}
            onChange={e => setProductCode(e.target.value)} />
        </div>
        <div className="pl-form-field">
          <label className="field-label">Service Name <span className="required">*</span></label>
          <input className="field-input" placeholder="e.g. 5-Page Business Website" value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
        </div>
        <div className="pl-form-field">
          <label className="field-label">Category</label>
          <select className="field-select" value={category} onChange={e => setCategory(e.target.value as PriceCategory)}>
            {PRICE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="pl-form-field">
          <label className="field-label">Price (R)</label>
          <div className="fin-input-wrap">
            <span>R</span>
            <input type="number" className="fin-num" placeholder="0" value={price}
              onChange={e => setPrice(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="pl-form-field">
        <label className="field-label">Description / What's Included</label>
        <textarea className="field-input field-ta" rows={3}
          placeholder="Describe what this service includes, deliverables, timeline..."
          value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      {assistants.length > 0 && (
        <div className="pl-form-field">
          <label className="field-label">Visible to</label>
          <VisibilityPicker value={visibleTo} assistants={assistants} onChange={setVisibleTo} />
        </div>
      )}
      <div className="modal-actions" style={{ marginTop: 8 }}>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={!valid}>
          <Check size={14} /> {initial?.id ? 'Save Changes' : 'Add Service'}
        </button>
      </div>
    </div>
  );
}

// ── Single price item card ────────────────────────────────────────
function PriceItemCard({
  item, assistants, mode, onEdit, onDelete,
}: {
  item: PriceListItem;
  assistants: AppUser[];
  mode: 'admin' | 'assistant';
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = CAT_COLORS[item.category];

  const visLabel = item.visibleTo === 'all'
    ? 'All assistants'
    : item.visibleTo.length === 0
      ? 'No one'
      : item.visibleTo.map(id => assistants.find(a => a.id === id)?.displayName || '?').join(', ');

  return (
    <div className="pl-item-card" style={{ borderLeftColor: color }}>
      <div className="pl-item-header" onClick={() => setExpanded(p => !p)}>
        <div className="pl-item-cat-icon" style={{ background: color + '22', color }}>
          {CAT_ICONS[item.category]}
        </div>
        <div className="pl-item-info">
          {item.productCode && <span className="pl-item-code">{item.productCode}</span>}
          <span className="pl-item-name">{item.name}</span>
          <span className="pl-item-cat" style={{ color, background: color + '18', borderColor: color + '44' }}>
            {item.category}
          </span>
        </div>
        <span className="pl-item-price">{fmtR(item.price)}</span>
        <div className="pl-item-actions" onClick={e => e.stopPropagation()}>
          {mode === 'admin' && onEdit && (
            <button className="icon-btn xs" onClick={onEdit} title="Edit"><Edit3 size={13} /></button>
          )}
          {mode === 'admin' && onDelete && (
            <button className="icon-btn xs red-h" onClick={onDelete} title="Delete"><Trash2 size={13} /></button>
          )}
          <button className="icon-btn xs">{expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>
        </div>
      </div>

      {expanded && (
        <div className="pl-item-body">
          {item.description ? (
            <p className="pl-item-desc">{item.description}</p>
          ) : (
            <p className="pl-item-desc empty">No description added.</p>
          )}
          {mode === 'admin' && assistants.length > 0 && (
            <div className="pl-item-vis">
              <Users size={12} /> {visLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN PRICE LIST COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function PriceList({
  items, assistants, userId, mode,
  onAdd, onUpdate, onDelete,
}: {
  items: PriceListItem[];
  assistants: AppUser[];
  userId?: string;       // current user's ID — used to filter in assistant mode
  mode: 'admin' | 'assistant';
  onAdd?: (data: Omit<PriceListItem, 'id' | 'createdAt'>) => void;
  onUpdate?: (id: string, data: Omit<PriceListItem, 'id' | 'createdAt'>) => void;
  onDelete?: (id: string) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<PriceCategory | 'all'>('all');
  const [search, setSearch]                 = useState('');
  const [showAddForm, setShowAddForm]       = useState(false);
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete]   = useState<string | null>(null);

  // For assistant mode, filter by what's visible to this user
  const accessible = mode === 'assistant' && userId
    ? items.filter(i => i.visibleTo === 'all' || (i.visibleTo as string[]).includes(userId))
    : items;

  // Apply category + search filters
  const filtered = accessible
    .filter(i => activeCategory === 'all' || i.category === activeCategory)
    .filter(i => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return i.name.toLowerCase().includes(q)
        || i.productCode.toLowerCase().includes(q)
        || i.description.toLowerCase().includes(q)
        || i.category.toLowerCase().includes(q);
    });

  // Group by category for display
  const byCategory = PRICE_CATEGORIES.reduce<Record<string, PriceListItem[]>>((acc, cat) => {
    acc[cat] = filtered.filter(i => i.category === cat);
    return acc;
  }, {} as Record<string, PriceListItem[]>);

  return (
    <div className="price-list">
      {/* Header */}
      <div className="section-head" style={{ marginBottom: 0 }}>
        <Tag size={16} className="section-icon" />
        <span>Price List</span>
        <span className="section-total">{accessible.length} service{accessible.length !== 1 ? 's' : ''}</span>
        {mode === 'admin' && (
          <button className="icon-btn accent" style={{ marginLeft: 'auto' }}
            onClick={() => { setShowAddForm(p => !p); setEditingId(null); }}
            title="Add service"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
          </button>
        )}
      </div>

      {/* Add form */}
      {mode === 'admin' && showAddForm && (
        <div className="pl-add-wrap">
          <ItemForm
            assistants={assistants}
            onSave={data => { onAdd?.(data); setShowAddForm(false); }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Search + category filter */}
      <div className="pl-controls">
        <div className="pl-search-wrap">
          <Search size={14} className="pl-search-icon" />
          <input
            className="pl-search"
            placeholder="Search services, codes, descriptions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="icon-btn xs" onClick={() => setSearch('')}><X size={12} /></button>
          )}
        </div>
        <div className="pl-cat-tabs">
          <button
            className={`pl-cat-tab ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >All</button>
          {PRICE_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`pl-cat-tab ${activeCategory === cat ? 'active' : ''}`}
              style={activeCategory === cat ? { background: CAT_COLORS[cat] + '22', color: CAT_COLORS[cat], borderColor: CAT_COLORS[cat] + '66' } : {}}
              onClick={() => setActiveCategory(cat)}
            >
              {CAT_ICONS[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items grouped by category */}
      <div className="pl-items">
        {filtered.length === 0 && (
          <div className="assistant-empty" style={{ paddingTop: 40 }}>
            <Tag size={36} style={{ opacity: 0.25, marginBottom: 12 }} />
            <p className="assistant-empty-title">
              {search ? 'No results for that search' : mode === 'admin' ? 'No services added yet' : 'No services available'}
            </p>
            {mode === 'admin' && !search && (
              <p className="assistant-empty-sub">Click the + button above to add your first service.</p>
            )}
          </div>
        )}

        {PRICE_CATEGORIES.filter(cat => byCategory[cat]?.length > 0).map(cat => (
          <div key={cat} className="pl-cat-group">
            <div className="pl-cat-group-label" style={{ color: CAT_COLORS[cat], borderLeftColor: CAT_COLORS[cat] }}>
              {CAT_ICONS[cat]} {cat}
              <span className="pl-cat-count">{byCategory[cat].length}</span>
            </div>
            {byCategory[cat].map(item => (
              editingId === item.id ? (
                <div key={item.id} className="pl-add-wrap">
                  <ItemForm
                    initial={item}
                    assistants={assistants}
                    onSave={data => { onUpdate?.(item.id, data); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div key={item.id}>
                  {confirmDelete === item.id ? (
                    <div className="pl-confirm-delete">
                      <span>Delete "<strong>{item.name}</strong>"?</span>
                      <button className="btn-danger" onClick={() => { onDelete?.(item.id); setConfirmDelete(null); }}>Delete</button>
                      <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                    </div>
                  ) : (
                    <PriceItemCard
                      item={item}
                      assistants={assistants}
                      mode={mode}
                      onEdit={mode === 'admin' ? () => { setEditingId(item.id); setShowAddForm(false); } : undefined}
                      onDelete={mode === 'admin' ? () => setConfirmDelete(item.id) : undefined}
                    />
                  )}
                </div>
              )
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
