import { NavLink, Link, useLocation } from 'react-router-dom';
import { IconBag, IconChat, IconHome, IconPlus, IconUser, IconCart } from './Icons.jsx';
import { useCart } from '../context/CartContext';

export default function BottomNav() {
  const location = useLocation();
  const { cartItems, cartCount } = useCart();
  const active = location.pathname;

  return (
    <nav className="bottomNav" aria-label="Bottom navigation">
      <div className="navRow">
        <NavLink to="/" className={({ isActive }) => `navItem ${isActive ? 'navItemActive' : ''}`}
          end
        >
          <IconHome />
          <span>Home</span>
        </NavLink>

        <NavLink to="/market" className={({ isActive }) => `navItem ${isActive ? 'navItemActive' : ''}`}
        >
          <IconBag />
          <span>Market</span>
        </NavLink>

        <Link to="/add" className="navItem centerAction">
          <div className="centerBtn">
            <IconPlus />
          </div>
        </Link>

        <Link to="/cart" className={`navItem ${active === '/cart' ? 'navItemActive' : ''}`}>
          <div style={{ position: 'relative' }}>
            <IconCart />
            {cartCount > 0 && (
              <div style={{
                position: 'absolute',
                top: -8,
                right: -8,
                background: 'var(--danger)',
                color: 'white',
                fontSize: 10,
                fontWeight: 900,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid white'
              }}>
                {cartCount}
              </div>
            )}
          </div>
          <span>Cart</span>
        </Link>

        <Link to="/profile" className={`navItem ${active === '/profile' ? 'navItemActive' : ''}`}>
          <IconUser />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
