import { useState } from 'react';
import { Settings, Eye, EyeOff, RefreshCw, Download, Info } from 'lucide-react';

interface Props {
  isDemoMode: boolean;
  onToggleDemo: () => void;
  onExport: () => void;
  fbReady: boolean;
  fbError: string | null;
  onForcSync: () => void;
  appVersion?: string;
}

export default function SettingsPage({ isDemoMode, onToggleDemo, onExport, fbReady, fbError, onForcSync }: Props) {
  const [syncing, setSyncing] = useState(false);

  const handleForceSync = async () => {
    setSyncing(true);
    await onForcSync();
    setTimeout(() => setSyncing(false), 1500);
  };

  return (
    <div className="settings-page">
      <h2 className="settings-title"><Settings size={20}/> Settings</h2>

      <div className="settings-group">
        <div className="settings-group-title">Display</div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Demo Mode</div>
            <div className="settings-row-sub">Show sample data instead of real data (useful for client presentations)</div>
          </div>
          <button className={`settings-toggle ${isDemoMode ? 'on' : ''}`} onClick={onToggleDemo}>
            {isDemoMode ? <><Eye size={14}/> On</> : <><EyeOff size={14}/> Off</>}
          </button>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Data & Sync</div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Sync Status</div>
            <div className="settings-row-sub">{fbError ? `Error: ${fbError}` : fbReady ? 'Connected and synced to Supabase' : 'Connecting…'}</div>
          </div>
          <div className={`settings-badge ${fbError ? 'error' : fbReady ? 'ok' : 'connecting'}`}>
            {fbError ? 'Error' : fbReady ? 'Synced' : 'Syncing…'}
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Force Sync</div>
            <div className="settings-row-sub">Push all local data to the cloud (use if data seems out of sync)</div>
          </div>
          <button className="btn-ghost" onClick={handleForceSync} disabled={syncing}>
            <RefreshCw size={13} className={syncing ? 'spin' : ''}/> {syncing ? 'Syncing…' : 'Force Sync'}
          </button>
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Export Report</div>
            <div className="settings-row-sub">Generate a PDF report of this month's financial data</div>
          </div>
          <button className="btn-ghost" onClick={onExport}>
            <Download size={13}/> Export PDF
          </button>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">About</div>
        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Digital Solutions SA</div>
            <div className="settings-row-sub">Project Manager v1.0 · Built with React + Vite + TypeScript</div>
          </div>
          <Info size={16} style={{color:'var(--text3)'}}/>
        </div>
      </div>

      <div className="settings-coming-soon">
        <Settings size={32}/>
        <p>More settings coming soon — integrations, notifications, and more.</p>
      </div>
    </div>
  );
}
