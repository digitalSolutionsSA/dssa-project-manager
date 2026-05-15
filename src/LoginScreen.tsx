import { useState, useRef, useEffect, FormEvent } from 'react';
import { Lock, User } from 'lucide-react';

interface Props {
  onLogin: (username: string, pin: string) => Promise<boolean>;
  error: string | null;
}

export default function LoginScreen({ onLogin, error }: Props) {
  const [username, setUsername] = useState('');
  const [pin, setPin]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);

  useEffect(() => { userRef.current?.focus(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !pin.trim()) return;
    setSubmitting(true);
    await onLogin(username.trim(), pin.trim());
    setSubmitting(false);
  }

  return (
    <div className="login-screen">
      {/* Background glows — same as main app */}
      <div className="bg-layer" aria-hidden="true">
        <div className="glow g1" /><div className="glow g2" /><div className="glow g3" />
        <div className="grid-overlay" />
      </div>

      <div className="login-card">
        <img src="/logo-bg.png" alt="Digital Solutions SA" className="login-logo" />
        <h1 className="login-title">Project Manager</h1>
        <p className="login-subtitle">Sign in to continue</p>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="login-field">
            <label className="field-label">Username</label>
            <div className="login-input-wrap">
              <User size={15} className="login-input-icon" />
              <input
                ref={userRef}
                className="field-input login-input"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="field-label">PIN</label>
            <div className="login-input-wrap">
              <Lock size={15} className="login-input-icon" />
              <input
                className="field-input login-input"
                type="password"
                inputMode="numeric"
                placeholder="Enter your PIN"
                value={pin}
                onChange={e => setPin(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="login-error">{error}</div>
          )}

          <button
            type="submit"
            className="btn-primary login-submit"
            disabled={submitting || !username.trim() || !pin.trim()}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
