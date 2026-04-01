import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { IconPlus, IconSearch } from './Icons.jsx';
import { api } from '../lib/api.js';

export default function TopBar({ query, setQuery, showFilters, setShowFilters }) {
  const location = useLocation();
  const nav = useNavigate();
  const isMarketplace = location.pathname === '/market';
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let interval;
    const fetchCount = async () => {
      try {
        const res = await api.getUnreadCount();
        setUnreadCount(res.data.unread_count || 0);
      } catch (err) {
        // Silently ignore or set 0 if not logged in
        setUnreadCount(0);
      }
    };

    fetchCount();
    interval = setInterval(fetchCount, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <header className="topBar">
      <div className="brand" style={{ minWidth: 140 }}>
        <div className="brandTitle" style={{ fontSize: 20, fontWeight: 900, background: 'linear-gradient(135deg, var(--primary), var(--primary-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KYUSDA</div>
        <div className="brandTagline" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Marketplace</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, justifyContent: 'center', position: 'relative' }}>
        <div className="search" role="search" style={{ flex: 1, maxWidth: 600, height: 46 }}>
          <IconSearch style={{ color: 'var(--primary)', width: 20, height: 20 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, sellers, or categories..."
            aria-label="Search"
            style={{ fontSize: 15, fontWeight: 500 }}
          />
          
          {isMarketplace && (
            <button 
              className={`btn ${showFilters ? 'btnPrimary' : 'btnGhost'}`} 
              style={{ padding: '6px 12px', fontSize: 12, borderRadius: 10, height: 32, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <span>{showFilters ? '✕' : '⌥'}</span>
              <span>Filters</span>
            </button>
          )}

          <div style={{ padding: '4px 8px', background: 'var(--bg)', borderRadius: 8, fontSize: 10, fontWeight: 800, color: 'var(--muted)', border: '1px solid var(--border)', marginLeft: 8 }} className="desktop-only">
            CMD + K
          </div>
        </div>
      </div>

      <div className="topBarActions" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 140, justifyContent: 'flex-end' }}>
        <div 
          className="iconBtn" 
          title="Messages" 
          onClick={() => nav('/messages')}
          style={{ cursor: 'pointer', position: 'relative' }}
        >
          <span style={{ fontSize: 18 }}>🔔</span>
          {unreadCount > 0 && (
            <div style={{ 
              position: 'absolute', 
              top: -4, 
              right: -4, 
              minWidth: 18, 
              height: 18, 
              background: 'var(--danger)', 
              borderRadius: 10, 
              border: '2px solid white',
              color: 'white',
              fontSize: 10,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
        <Link to="/profile" style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--border)', overflow: 'hidden', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.2s' }} className="hover-ring avatarWrapper">
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)' }}>👤</div>
        </Link>
      </div>
    </header>
  );
}
