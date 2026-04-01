import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function AuthLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login({ email, password });
      nav('/');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authWrap">
      <div className="pageCard" style={{ width: 'min(440px, 100%)' }}>
        <div className="sectionTitle" style={{ fontSize: 18, marginBottom: 6 }}>Welcome back</div>
        <div className="sectionHint" style={{ marginBottom: 14 }}>Login to continue</div>

        <form onSubmit={submit}>
          <div className="field">
            <div className="label">Email</div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <div className="label">Password</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error ? (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{error}</div>
          ) : null}

          <button className="btn btnPrimary" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>

          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
            Don’t have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
