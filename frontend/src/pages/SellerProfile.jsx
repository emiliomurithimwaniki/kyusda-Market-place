import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import Skeleton from '../components/Skeleton.jsx';
import ProductCardSkeleton from '../components/skeletons/ProductCardSkeleton.jsx';
import { api } from '../lib/api.js';

export default function SellerProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      setSeller(null);
      setProducts([]);
      try {
        const [sellerRes, productsRes] = await Promise.all([
          api.getSeller(id),
          api.getProducts({ sellerId: id }),
        ]);
        if (mounted) {
          setSeller(sellerRes?.data || null);
          const data = productsRes?.data;
          const results = Array.isArray(data?.results)
            ? data.results
            : (Array.isArray(data) ? data : []);
          setProducts(results);
        }
      } catch {
        if (mounted) setError('Unable to load data. Please check your internet connection and try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  const featuredProducts = useMemo(() => {
    return (Array.isArray(products) ? products : []).filter((p) => p?.featured);
  }, [products]);

  const followerCount = Number.isFinite(Number(seller?.follower_count)) ? Number(seller.follower_count) : 0;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('kyusda_following_sellers');
      const map = raw ? JSON.parse(raw) : {};
      const isFollowing = Boolean(map && map[String(id)]);
      setFollowing(isFollowing);
    } catch {
      setFollowing(false);
    }
  }, [id]);

  const toggleFollow = async () => {
    if (!seller || toggling) return;
    const token = window.localStorage.getItem('kyusda_access_token');
    if (!token) {
      alert('Please log in to follow a store.');
      const next = encodeURIComponent(location.pathname + location.search);
      nav(`/login?next=${next}`);
      return;
    }
    setToggling(true);
    try {
      if (following) {
        await api.unfollowSeller(seller.id);
        setFollowing(false);
        setSeller((prev) => prev ? ({ ...prev, follower_count: Math.max(0, Number(prev.follower_count || 0) - 1) }) : prev);

        try {
          const raw = window.localStorage.getItem('kyusda_following_sellers');
          const map = raw ? JSON.parse(raw) : {};
          if (map && typeof map === 'object') {
            delete map[String(seller.id)];
            window.localStorage.setItem('kyusda_following_sellers', JSON.stringify(map));
          }
        } catch {}
      } else {
        await api.followSeller(seller.id);
        setFollowing(true);
        setSeller((prev) => prev ? ({ ...prev, follower_count: Number(prev.follower_count || 0) + 1 }) : prev);

        try {
          const raw = window.localStorage.getItem('kyusda_following_sellers');
          const map = raw ? JSON.parse(raw) : {};
          const next = (map && typeof map === 'object') ? map : {};
          next[String(seller.id)] = true;
          window.localStorage.setItem('kyusda_following_sellers', JSON.stringify(next));
        } catch {}
      }
    } catch {
      alert('Unable to update follow status.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {loading ? (
        <div>
          <div className="pageCard" style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
            <Skeleton height={160} radius={0} />
            <div style={{ padding: '0 32px 32px', marginTop: -40, position: 'relative' }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Skeleton width={100} height={100} radius={28} />
                <div style={{ flex: 1, minWidth: 200, paddingBottom: 10 }}>
                  <Skeleton width={220} height={20} radius={10} style={{ marginBottom: 8 }} />
                  <Skeleton width={140} height={12} radius={10} />
                </div>
                <div style={{ display: 'flex', gap: 12, paddingBottom: 10 }}>
                  <Skeleton width={120} height={44} radius={16} />
                  <Skeleton width={120} height={44} radius={16} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
          <div className="sectionTitle">Network Error</div>
          <div className="sectionHint">{error}</div>
        </div>
      ) : !seller ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
          <div className="sectionTitle">No information</div>
          <div className="sectionHint">There is no seller information to show on this page.</div>
        </div>
      ) : (
        <div>
          {/* Profile Header / Banner */}
          <div className="pageCard" style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
            <div style={{ height: 160, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', position: 'relative' }}></div>
            <div style={{ padding: '0 32px 32px', marginTop: -40, position: 'relative' }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: 28, 
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-2))', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: 48, 
                  color: 'white',
                  border: '6px solid white',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}>
                  👤
                </div>
                <div style={{ flex: 1, minWidth: 200, paddingBottom: 10 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.8px', margin: '0 0 4px' }}>{seller.name}</h1>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>Followers: {followerCount}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, paddingBottom: 10 }}>
                  <button className="btn btnPrimary" style={{ padding: '12px 24px' }} onClick={toggleFollow} disabled={toggling}>
                    {following ? 'Following' : 'Follow Store'}
                  </button>
                  <Link to="/messages" className="btn btnGhost" style={{ padding: '12px 24px', border: '1px solid var(--border)' }}>
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="profileLayout">
            {/* Left: Seller Stats & Info */}
            <div className="stickySidebar">
              <div className="pageCard" style={{ padding: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>About the Store</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.02)', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>{products.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Products</div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.02)', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>{featuredProducts.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Featured</div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.02)', textAlign: 'center', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)' }}>{followerCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Followers</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Seller Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div>
                <div className="sectionHeader" style={{ marginTop: 0 }}>
                  <div>
                    <div className="sectionTitle">Store Listings</div>
                    <div className="sectionHint">Showing {products.length} items available in store</div>
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                  {products.length === 0 ? (
                    <div className="pageCard" style={{ textAlign: 'center', padding: '30px 20px', gridColumn: '1 / -1' }}>
                      <div className="sectionTitle">No information</div>
                      <div className="sectionHint">There are no products to show on this page.</div>
                    </div>
                  ) : (
                    products.map((p) => <ProductCard key={p.id} product={p} />)
                  )}
                </div>
              </div>

              <div className="fullWidthSection">
                <div className="sectionHeader">
                  <div>
                    <div className="sectionTitle">All Featured Items</div>
                    <div className="sectionHint">Curated products from {seller.name}</div>
                  </div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                  {featuredProducts.length === 0 ? (
                    <div className="pageCard" style={{ textAlign: 'center', padding: '30px 20px', gridColumn: '1 / -1' }}>
                      <div className="sectionTitle">No information</div>
                      <div className="sectionHint">There are no featured products to show on this page.</div>
                    </div>
                  ) : (
                    featuredProducts.map((p) => <ProductCard key={p.id} product={p} />)
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
