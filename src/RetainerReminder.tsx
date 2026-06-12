import { Check, Repeat } from 'lucide-react';
import { RetainerClient } from './types';

export default function RetainerReminder({
  clients, onCheckIn,
}: {
  clients: RetainerClient[];
  onCheckIn: (id: string) => void;
}) {
  if (clients.length === 0) return null;

  return (
    <div className="retainer-reminder-overlay">
      <div className="retainer-reminder-modal">
        <div className="retainer-reminder-head">
          <Repeat size={18} />
          <h2>Weekly Retainer Check-In</h2>
        </div>
        <p className="retainer-reminder-sub">
          Tick off each client below once you've checked in with them this week. This reminder stays
          until every client has been marked.
        </p>
        <div className="retainer-reminder-list">
          {clients.map(c => (
            <div key={c.id} className="retainer-reminder-item">
              <div className="retainer-reminder-info">
                <span className="retainer-reminder-name">{c.name}</span>
                {c.description && <span className="retainer-reminder-desc">{c.description}</span>}
              </div>
              <button className="btn-primary sm" onClick={() => onCheckIn(c.id)}>
                <Check size={13} /> Checked In
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
