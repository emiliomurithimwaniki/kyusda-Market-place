import { useState, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import DesktopSidebar from './components/DesktopSidebar.jsx';
import TopBar from './components/TopBar.jsx';
import AddListing from './pages/AddListing.jsx';
import Chat from './pages/Chat.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Home from './pages/Home.jsx';
import Market from './pages/Market.jsx';
import Messages from './pages/Messages.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import EditProduct from './pages/EditProduct.jsx';
import Profile from './pages/Profile.jsx';
import SellerProfile from './pages/SellerProfile.jsx';
import FlashSale from './pages/FlashSale.jsx';
import AuthLogin from './pages/AuthLogin.jsx';
import AuthRegister from './pages/AuthRegister.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import TransactionStatus from './pages/TransactionStatus.jsx';

export default function App() {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const toast = null;
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.search input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hideChrome = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/verify-email';

  return (
    <div className="appShell">
      <DesktopSidebar />

      <main className="mainCol">
        {!hideChrome ? (
          <TopBar 
            query={query} 
            setQuery={setQuery} 
            showFilters={showFilters} 
            setShowFilters={setShowFilters} 
          />
        ) : null}

        <Routes>
          <Route path="/" element={<Home query={query} category={category} setCategory={setCategory} />} />
          <Route path="/market" element={<Market query={query} showFilters={showFilters} setShowFilters={setShowFilters} />} />
          <Route path="/flash" element={<FlashSale />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/product/:id/edit" element={<EditProduct />} />
          <Route path="/add" element={<AddListing />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<SellerProfile />} />
          <Route path="/status" element={<TransactionStatus />} />
          <Route path="/login" element={<AuthLogin />} />
          <Route path="/register" element={<AuthRegister />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {!hideChrome ? <BottomNav /> : null}

        {toast && (
          <div style={{
            position: 'fixed',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--text)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow)',
            zIndex: 1000,
            fontSize: '14px',
            fontWeight: '600',
            animation: 'fadeIn 0.3s ease'
          }}>
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}
