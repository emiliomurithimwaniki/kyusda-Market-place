import { Link, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { IconBag, IconChat, IconHome, IconPlus, IconUser } from './Icons.jsx';
import { api } from '../lib/api.js';

export default function DesktopSidebar() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getCategories();
        if (mounted) setCategories(res?.data || []);
      } catch {
        if (mounted) setCategories([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside className="desktopSidebar">
      <div className="sidebarCard">
        <div className="sidebarTitle">KYUSDA</div>
        <div className="sidebarSub">Marketplace navigation</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <NavLink to="/" className={({ isActive }) => `btn ${isActive ? 'btnPrimary' : 'btnGhost'}`} end>
            <IconHome /> Home
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) => `btn ${isActive ? 'btnPrimary' : 'btnGhost'}`}>
            <IconChat /> Messages
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `btn ${isActive ? 'btnPrimary' : 'btnGhost'}`}>
            <IconUser /> My Account
          </NavLink>
        </div>

        <div style={{ margin: '20px 0 12px', height: 1, background: 'var(--border)' }}></div>
        
        <div style={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: 1, marginBottom: 12, paddingLeft: 12 }}>
          Categories
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Link to="/market" className="btn btnGhost" style={{ justifyContent: 'flex-start', gap: 12, fontSize: 13 }}>
            <span>🛍️</span> All Items
          </Link>

          {categories.map((cat) => (
            <Link key={cat.id} to={`/market?cat=${encodeURIComponent(cat.name)}`} className="btn btnGhost" style={{ justifyContent: 'flex-start', gap: 12, fontSize: 13 }}>
              {cat.image ? (
                <img src={cat.image} alt={cat.name} style={{ width: 20, height: 20, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
              ) : (
                <span style={{ width: 20, textAlign: 'center' }}>🏷️</span>
              )}
              {cat.name}
            </Link>
          ))}
        </div>

        <div style={{ margin: '20px 0 16px', height: 1, background: 'var(--border)' }}></div>
        
        <NavLink to="/add" className="btn btnPrimary" style={{ width: '100%', justifyContent: 'center', gap: 10, boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>
          <IconPlus /> Add Listing
        </NavLink>

        <div style={{ marginTop: 24, padding: '16px 12px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(124, 58, 237, 0.05))', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🚀</span> Pro Seller
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.4 }}>Boost your visibility and sell 3x faster with Pro features.</div>
          <button className="btn btnGhost" style={{ width: '100%', marginTop: 10, fontSize: 11, padding: '6px 0', background: 'white' }}>Upgrade Now</button>
        </div>
      </div>
    </aside>
  );
}
