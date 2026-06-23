import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { CheckInReminder, DayOfWeek } from './types';

const TODAY_DOW = (['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as DayOfWeek[])[new Date().getDay()];

export default function CheckInReminderOverlay({ reminders }: { reminders: CheckInReminder[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = reminders.filter(r =>
    r.active &&
    !dismissed.has(r.id) &&
    (r.schedule === 'daily' || r.schedule === TODAY_DOW)
  );
  if (visible.length === 0) return null;

  return (
    <div className="checkin-reminder-overlay">
      <div className="checkin-reminder-modal">
        <div className="retainer-reminder-head">
          <Bell size={18} />
          <h2>Reminder{visible.length > 1 ? 's' : ''} from Admin</h2>
        </div>
        <div className="checkin-reminder-list">
          {visible.map(r => (
            <div key={r.id} className="checkin-reminder-item">
              <div className="checkin-reminder-info">
                <span className="retainer-reminder-name">{r.title}</span>
                {r.message && <span className="retainer-reminder-desc">{r.message}</span>}
              </div>
              <button className="icon-btn xs" onClick={() => setDismissed(s => new Set([...s, r.id]))} title="Dismiss">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <p className="retainer-reminder-sub" style={{ marginTop: 10, fontSize: '0.78rem' }}>
          Reminders set by your admin for today ({TODAY_DOW}). Dismiss to hide for this session.
        </p>
      </div>
    </div>
  );
}
