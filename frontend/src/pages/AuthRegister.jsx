import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function AuthRegister() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [success, setSuccess] = useState('');
  const [pendingVerify, setPendingVerify] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsRegistering(true);
    try {
      await api.register({ name, email, phone, password, role });
      setPendingVerify(true);
      setSuccess('We sent a verification code to your email. Enter the code to create your account.');
      nav(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <div className="authWrap">
      <div className="pageCard" style={{ width: 'min(520px, 100%)' }}>
        <div className="sectionTitle" style={{ fontSize: 18, marginBottom: 6 }}>Create account</div>
        <div className="sectionHint" style={{ marginBottom: 14 }}>Join KYUSDA Marketplace</div>

        <form onSubmit={submit}>
          <div className="authGrid">
            <div className="field">
              <div className="label">Name</div>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="field">
              <div className="label">Phone</div>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07xx..." />
            </div>
          </div>

          <div className="authGrid">
            <div className="field">
              <div className="label">Email</div>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <div className="label">Role</div>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          <div className="field">
            <div className="label">Password</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
          </div>

          {error ? (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{error}</div>
          ) : null}

          {success ? (
            <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 10 }}>{success}</div>
          ) : null}

          <button className="btn btnPrimary" type="submit" style={{ width: '100%' }} disabled={isRegistering}>
            {isRegistering ? 'Registering...' : pendingVerify ? 'Verify email' : 'Register'}
          </button>

          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
