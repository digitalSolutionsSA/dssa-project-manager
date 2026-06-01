import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Megaphone, Globe, Smartphone, Calendar,
  Building2, Tag, Users, BarChart3, UserCircle, Settings,
  Wifi, WifiOff, LogOut, CloudSun,
} from 'lucide-react';

export type NavPage =
  | 'home' | 'social' | 'web' | 'app' | 'calendar'
  | 'company' | 'prices' | 'users' | 'data' | 'customers' | 'settings';

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface WeatherData {
  temp: string;
  desc: string;
  emoji: string;
}

function weatherEmoji(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes('thunder') || d.includes('storm')) return '⛈️';
  if (d.includes('heavy rain') || d.includes('torrential')) return '🌧️';
  if (d.includes('drizzle') || d.includes('light rain')) return '🌦️';
  if (d.includes('rain') || d.includes('shower')) return '🌧️';
  if (d.includes('snow') || d.includes('sleet') || d.includes('blizzard')) return '❄️';
  if (d.includes('fog') || d.includes('mist') || d.includes('haze')) return '🌫️';
  if (d.includes('overcast') || d.includes('cloudy')) return '☁️';
  if (d.includes('partly cloudy') || d.includes('partly')) return '⛅';
  if (d.includes('sunny') || d.includes('clear')) return '☀️';
  if (d.includes('wind') || d.includes('breezy')) return '🌬️';
  return '🌤️';
}

interface Props {
  activePage: NavPage;
  onNavigate: (p: NavPage) => void;
  displayName: string;
  onLogout: () => void;
  fbReady: boolean;
  fbError: string | null;
  overdueCount: number;
}

export default function Sidebar({ activePage, onNavigate, displayName, onLogout, fbReady, fbError, overdueCount }: Props) {
  const [time, setTime]       = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Weather (wttr.in, no API key)
  useEffect(() => {
    fetch('https://wttr.in/Vereeniging?format=j1')
      .then(r => r.json())
      .then(d => {
        const c = d.current_condition?.[0];
        if (!c) return;
        const desc = c.weatherDesc?.[0]?.value ?? '';
        setWeather({ temp: c.temp_C, desc, emoji: weatherEmoji(desc) });
      })
      .catch(() => {});
  }, []);

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const dateStr = `${dayNames[time.getDay()]}, ${time.getDate()} ${monthNames[time.getMonth()]} ${time.getFullYear()}`;
  const timeStr = time.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const navItems: NavItem[] = [
    { id: 'home',      label: 'Home',                icon: <LayoutDashboard size={18} />, badge: overdueCount || undefined },
    { id: 'social',    label: 'Social Media',        icon: <Megaphone size={18} /> },
    { id: 'web',       label: 'Web Development',     icon: <Globe size={18} /> },
    { id: 'app',       label: 'App Development',     icon: <Smartphone size={18} /> },
    { id: 'calendar',  label: 'Calendar',            icon: <Calendar size={18} /> },
    { id: 'company',   label: 'Company',             icon: <Building2 size={18} /> },
    { id: 'prices',    label: 'Prices',              icon: <Tag size={18} /> },
    { id: 'users',     label: 'Users',               icon: <Users size={18} /> },
    { id: 'data',      label: 'Data',                icon: <BarChart3 size={18} /> },
    { id: 'customers', label: 'Customers',           icon: <UserCircle size={18} /> },
    { id: 'settings',  label: 'Settings',            icon: <Settings size={18} /> },
  ];


  return (
    <>
    {/* Bottom tab bar — mobile only (CSS controls visibility) */}
    <nav className="bottom-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`bottom-nav-item ${activePage === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.badge ? <span className="bottom-nav-badge">{item.badge}</span> : null}
        </button>
      ))}
    </nav>

    <aside className="sidebar">
      {/* Logo — centred */}
      <div className="sb-logo-wrap">
        <img src="/logo-bg.png" alt="Digital Solutions SA" className="sb-logo" />
      </div>

      {/* Date / Time */}
      <div className="sb-datetime">
        <div className="sb-date">{dateStr}</div>
        <div className="sb-time">{timeStr}</div>
      </div>

      {/* Weather */}
      <div className="sb-weather">
        {weather ? (
          <>
            <span className="sb-weather-icon">{weather.emoji}</span>
            <div className="sb-weather-info">
              <span className="sb-weather-temp">{weather.temp}°C</span>
              <span className="sb-weather-desc">{weather.desc}</span>
            </div>
          </>
        ) : (
          <>
            <CloudSun size={18} className="sb-weather-loading" />
            <span className="sb-weather-desc">Vereeniging</span>
          </>
        )}
        <span className="sb-weather-city">Vereeniging</span>
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
            {item.badge ? <span className="sb-nav-badge">{item.badge}</span> : null}
          </button>
        ))}
      </nav>

      {/* Bottom — centred */}
      <div className="sb-bottom">
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
