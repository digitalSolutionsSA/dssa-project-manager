import { useState, useEffect } from 'react';
import {
  ClipboardList, Tag, Settings, Sun, Moon, LogOut, Wifi, WifiOff, Calendar, Repeat,
} from 'lucide-react';
import { ThemeMode } from './types';

export type NavPage = 'tasks' | 'calendar' | 'pricing' | 'retainer' | 'settings';

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  activePage: NavPage;
  onNavigate: (p: NavPage) => void;
  displayName: string;
  onLogout: () => void;
  fbReady: boolean;
  fbError: string | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export default function Sidebar({ activePage, onNavigate, displayName, onLogout, fbReady, fbError, theme, onToggleTheme }: Props) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr = `${dayNames[time.getDay()]}, ${time.getDate()} ${monthNames[time.getMonth()]}`;
  const timeStr = time.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

  const navItems: NavItem[] = [
    { id: 'tasks',    label: 'Tasks',    icon: <ClipboardList size={18} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={18} /> },
    { id: 'pricing',  label: 'Pricing',  icon: <Tag size={18} /> },
    { id: 'retainer', label: 'Retainer', icon: <Repeat size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* Bottom tab bar — mobile only */}
      <nav className="bottom-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`bottom-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <aside className="sidebar">
        {/* Logo */}
        <div className="sb-logo-wrap">
          <img
            src="/logo-bg.png"
            alt="Digital Solutions SA"
            className="sb-logo"
            onError={e => { (e.target as HTMLImageElement).src = '/logo.png'; }}
          />
        </div>

        {/* Date / Time */}
        <div className="sb-datetime">
          <div className="sb-date">{dateStr}</div>
          <div className="sb-time">{timeStr}</div>
        </div>

        <div className="sb-divider" />

        {/* Nav */}
        <nav className="sb-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`sb-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="sb-nav-icon">{item.icon}</span>
              <span className="sb-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="sb-bottom">
          <button className="sb-theme-toggle" onClick={onToggleTheme} title="Toggle theme">
            <span className={`sb-theme-track ${theme}`}>
              <span className="sb-theme-thumb">
                {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
              </span>
            </span>
            <span className="sb-theme-label">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
          </button>

          <div className="sb-user">
            <div className="sb-user-avatar">{displayName.charAt(0).toUpperCase()}</div>
            <span className="sb-user-name">{displayName}</span>
          </div>
          <div className="sb-status-row">
            <div className={`sb-sync ${fbError ? 'error' : fbReady ? 'ok' : 'connecting'}`}>
              {fbError || !fbReady ? <WifiOff size={12} /> : <Wifi size={12} />}
              <span>{fbError ? 'Error' : fbReady ? 'Synced' : 'Syncing…'}</span>
            </div>
            <button className="sb-logout" onClick={onLogout} title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
