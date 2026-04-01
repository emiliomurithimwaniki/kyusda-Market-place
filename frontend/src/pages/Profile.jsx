import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Profile() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');
  const [saving, setLoadingSaving] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '' });
  const [myListings, setMyListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.me();
        if (alive) {
          setMe(data);
          setEditData({ name: data.name || '', phone: data.phone || '' });
        }
      } catch {
        try {
          const hasToken = !!localStorage.getItem('kyusda_access_token') || !!localStorage.getItem('kyusda_refresh_token');
          if (!hasToken) throw new Error('No token');

          const { data } = await api.getProfile();
          if (alive) {
            setMe(data);
            setEditData({ name: data.name || '', phone: data.phone || '' });
          }
        } catch {
          if (alive) setMe(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!me?.id) return;
      setListingsLoading(true);
      setListingsError(null);
      try {
        const res = await api.getProducts({ sellerId: me.id });
        const payload = res?.data;
        const results = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : []);
        if (alive) setMyListings(results);
      } catch {
        if (alive) {
          setListingsError('Unable to load data. Please check your internet connection and try again.');
          setMyListings([]);
        }
      } finally {
        if (alive) setListingsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [me?.id]);

  const handleSaveSettings = async () => {
    setLoadingSaving(true);
    try {
      // Check name change constraint
      if (editData.name !== me.name) {
        const lastChanged = me.last_name_change ? new Date(me.last_name_change) : null;
        const now = new Date();
        if (lastChanged && (now - lastChanged) < (30 * 24 * 60 * 60 * 1000)) {
          const daysLeft = Math.ceil((30 * 24 * 60 * 60 * 1000 - (now - lastChanged)) / (24 * 60 * 60 * 1000));
          alert(`You can only change your name once every 30 days. Please try again in ${daysLeft} days.`);
          setLoadingSaving(false);
          return;
        }
      }

      const updated = await api.updateProfile(editData);
      const next = { ...me, ...updated };
      setMe(next);
      setEditData({ name: next.name || '', phone: next.phone || '' });
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoadingSaving(false);
    }
  };

  function logout() {
    api.clearToken();
    nav('/login');
  }

  if (loading) {
    return (
      <div className="pageCard" style={{ animation: 'fadeIn 0.5s ease' }}>
        <div className="sectionTitle">Profile</div>
        <div className="sectionHint">Loading your account details...</div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="pageCard" style={{ textAlign: 'center', padding: '64px 32px', animation: 'fadeIn 0.5s ease' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>👤</div>
        <div className="sectionTitle" style={{ fontSize: 24 }}>You’re not logged in</div>
        <div className="sectionHint" style={{ marginTop: 8, marginBottom: 32 }}>Login to manage your listings, orders, and profile settings.</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link className="btn btnPrimary" to="/login" style={{ padding: '12px 32px' }}>Login</Link>
          <Link className="btn btnGhost" to="/register" style={{ padding: '12px 32px', border: '1px solid var(--border)' }}>Register</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Profile Header Card */}
      <div className="pageCard" style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ height: 120, background: 'linear-gradient(135deg, var(--primary), var(--primary-2))', opacity: 0.9 }}></div>
        <div style={{ padding: '0 32px 32px', marginTop: -40 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 28, 
              background: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: 48,
              border: '4px solid white',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
              👤
            </div>
            <div style={{ flex: 1, minWidth: 200, paddingBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.8px', margin: 0 }}>{me.name}</h1>
                <div className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', fontWeight: 800 }}>{me.role?.toUpperCase()}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                <span>{me.email}</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border)' }}></span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{me.phone || 'No phone added'}</span>
                  {me.phone && (
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(me.phone);
                        alert('Phone number copied!');
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0, color: 'var(--primary)' }}
                      title="Copy phone number"
                    >
                      📋
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, paddingBottom: 8 }}>
              <button className="btn btnGhost" style={{ border: '1px solid var(--border)', padding: '10px 20px' }}>Edit Profile</button>
              <button className="btn btnDangerGhost" onClick={logout} style={{ color: 'var(--danger)', padding: '10px 20px' }}>Logout</button>
            </div>
          </div>
        </div>
      </div>

      <div className="profileLayout">
        {/* Left: Stats & Quick Actions */}
        <div className="stickySidebar">
          <div className="pageCard" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Account Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.02)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>{me?.orders_count || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Orders</div>
              </div>
              <div style={{ padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.02)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>{myListings.length}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Active Listings</div>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/dashboard" className="btn btnGhost" style={{ justifyContent: 'flex-start', padding: '12px 16px', fontSize: 14 }}>📊 Seller Dashboard</Link>
              <Link to="/messages" className="btn btnGhost" style={{ justifyContent: 'flex-start', padding: '12px 16px', fontSize: 14 }}>💬 Messages</Link>
              <Link to="/add" className="btn btnGhost" style={{ justifyContent: 'flex-start', padding: '12px 16px', fontSize: 14 }}>➕ Add New Listing</Link>
            </div>
          </div>

          <div className="pageCard" style={{ padding: 24, background: 'rgba(0,0,0,0.01)', border: '1px dashed var(--border)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800 }}>Help & Support</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>Need help with an order or listing? Contact our campus support team.</p>
            <button className="btn btnGhost" style={{ width: '100%', marginTop: 12, fontSize: 12, border: '1px solid var(--border)' }}>Get Help</button>
          </div>
        </div>

        {/* Right: Tabs Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="pageCard" style={{ padding: '8px' }}>
            <div className="pillRow" style={{ gap: 8, padding: 0 }}>
              <button 
                className={`tabBtn ${activeTab === 'listings' ? 'active' : ''}`}
                onClick={() => setActiveTab('listings')}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: activeTab === 'listings' ? 'var(--primary)' : 'transparent', color: activeTab === 'listings' ? 'white' : 'var(--muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                My Listings
              </button>
              <button 
                className={`tabBtn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: activeTab === 'orders' ? 'var(--primary)' : 'transparent', color: activeTab === 'orders' ? 'white' : 'var(--muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                My Orders
              </button>
              <button 
                className={`tabBtn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: activeTab === 'settings' ? 'var(--primary)' : 'transparent', color: activeTab === 'settings' ? 'white' : 'var(--muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Settings
              </button>
            </div>
          </div>

          <div style={{ minHeight: 400 }}>
            {activeTab === 'listings' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div className="sectionHeader" style={{ marginTop: 0 }}>
                  <div className="sectionTitle">Active Listings</div>
                  <div className="sectionHint">Items you are currently selling on the marketplace</div>
                </div>
                {listingsLoading ? null : listingsError ? (
                  <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
                    <div className="sectionTitle">Network Error</div>
                    <div className="sectionHint">{listingsError}</div>
                  </div>
                ) : myListings.length > 0 ? (
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                    {myListings.map((p) => (
                      <div key={p.id} style={{ position: 'relative' }}>
                        <ProductCard product={p} />
                        <Link
                          to={`/product/${p.id}/edit`}
                          className="btn btnGhost"
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            padding: '6px 10px',
                            fontSize: 12,
                            border: '1px solid var(--border)',
                            background: 'rgba(255,255,255,0.9)',
                          }}
                        >
                          Edit
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
                    <div className="sectionTitle">No information</div>
                    <div className="sectionHint">There are no listings to show on this page.</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div className="sectionHeader" style={{ marginTop: 0 }}>
                  <div className="sectionTitle">Recent Orders</div>
                  <div className="sectionHint">Status of items you have purchased</div>
                </div>
                <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
                  <div className="sectionTitle">No information</div>
                  <div className="sectionHint">There are no orders to show on this page.</div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div className="sectionHeader" style={{ marginTop: 0 }}>
                  <div className="sectionTitle">Account Settings</div>
                  <div className="sectionHint">Manage your personal information and preferences</div>
                </div>
                <div className="pageCard" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="field">
                    <div className="label">Full Name</div>
                    <input 
                      className="input" 
                      value={editData.name} 
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      placeholder="Your full name"
                    />
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                      Name can only be changed once every 30 days.
                    </div>
                  </div>
                  <div className="field">
                    <div className="label">Phone Number</div>
                    <input 
                      className="input" 
                      value={editData.phone} 
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      placeholder="e.g. 0712345678"
                    />
                  </div>
                  <div className="field">
                    <div className="label">Email Address</div>
                    <input className="input" value={me.email} disabled style={{ opacity: 0.8, cursor: 'not-allowed', background: 'rgba(0,0,0,0.02)' }} />
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                      Email address cannot be changed.
                    </div>
                  </div>
                  <button 
                    className="btn btnPrimary" 
                    style={{ marginTop: 8 }} 
                    onClick={handleSaveSettings}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
