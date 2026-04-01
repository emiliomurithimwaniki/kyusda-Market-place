import { Link, NavLink } from 'react-router-dom';
import { IconBag, IconChat, IconHome, IconPlus, IconUser } from './Icons.jsx';

const SIDEBAR_CATEGORIES = [
  { name: 'All Items', icon: '🛍️', path: '/market' },
  { name: 'Phones & Tech', icon: '📱', path: '/market?cat=Phones' },
  { name: 'Fashion', icon: '👕', path: '/market?cat=Fashion' },
  { name: 'Food & Drinks', icon: '🍱', path: '/market?cat=Food' },
  { name: 'Hostels', icon: '🏠', path: '/market?cat=Hostels' },
  { name: 'Books', icon: '📚', path: '/market?cat=Books' },
];

export default function DesktopSidebar() {
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
          {SIDEBAR_CATEGORIES.map(cat => (
            <Link key={cat.name} to={cat.path} className="btn btnGhost" style={{ justifyContent: 'flex-start', gap: 12, fontSize: 13 }}>
              <span>{cat.icon}</span> {cat.name}
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
