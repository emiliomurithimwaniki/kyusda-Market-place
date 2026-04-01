import { NavLink } from 'react-router-dom';
import { IconBag, IconChat, IconHome, IconPlus, IconUser } from './Icons.jsx';

export default function BottomNav() {
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

        <NavLink to="/add" className={({ isActive }) => `navItem ${isActive ? 'navItemActive' : ''}`}
        >
          <div className="fab" aria-hidden="true">
            <IconPlus />
          </div>
          <span style={{ marginTop: -10 }}>Add</span>
        </NavLink>

        <NavLink to="/messages" className={({ isActive }) => `navItem ${isActive ? 'navItemActive' : ''}`}
        >
          <IconChat />
          <span>Messages</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `navItem ${isActive ? 'navItemActive' : ''}`}
        >
          <IconUser />
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
