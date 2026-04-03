import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import Skeleton from '../components/Skeleton.jsx';
import ProductCardSkeleton from '../components/skeletons/ProductCardSkeleton.jsx';
import { api } from '../lib/api.js';

export default function Home({ query, category, setCategory }) {
  const nav = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [prefetchCache, setPrefetchCache] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [productViews, setProductViews] = useState({});
  const [categoryViews, setCategoryViews] = useState({});

  const [featuredProduct, setFeaturedProduct] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [catsRes, productsRes] = await Promise.all([
          api.getCategories(),
          api.getProducts({ featured: true, page: 1, page_size: 12 }),
        ]);
        if (!mounted) return;
        setCategories(catsRes?.data || []);

        const payload = productsRes?.data;
        const results = Array.isArray(payload?.results) ? payload.results : (payload || []);
        setProducts(results);
        
        // Find the latest featured item for the hero section
        if (results.length > 0) {
          setFeaturedProduct(results[0]);
        } else {
          // Fallback to any latest product if no featured products exist
          const latestRes = await api.getProducts({ page: 1, page_size: 1 });
          const latestPayload = latestRes?.data;
          const latestResults = Array.isArray(latestPayload?.results) ? latestPayload.results : (latestPayload || []);
          if (latestResults.length > 0) {
            setFeaturedProduct(latestResults[0]);
          }
        }

        setPage(1);
        setHasMore(Boolean(payload?.next));

        if (payload?.next) {
          try {
            const nextRes = await api.getProducts({ featured: true, page: 2, page_size: 12 });
            if (!mounted) return;
            const nextPayload = nextRes?.data;
            const nextResults = Array.isArray(nextPayload?.results) ? nextPayload.results : null;
            if (nextResults) setPrefetchCache({ page: 2, results: nextResults, hasMore: Boolean(nextPayload?.next) });
          } catch {
            if (mounted) setPrefetchCache(null);
          }
        } else {
          setPrefetchCache(null);
        }
      } catch {
        if (mounted) {
          setError('Unable to load data. Please check your internet connection and try again.');
          setCategories([]);
          setProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    try {
      const key = 'kyusda_recently_viewed';
      const raw = window.localStorage.getItem(key);
      const list = JSON.parse(raw || '[]');
      setRecentlyViewed(Array.isArray(list) ? list : []);
    } catch {
      setRecentlyViewed([]);
    }

    try {
      const raw = window.localStorage.getItem('kyusda_search_history');
      const parsed = raw ? JSON.parse(raw) : [];
      setSearchHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSearchHistory([]);
    }

    try {
      const raw = window.localStorage.getItem('kyusda_product_views');
      const parsed = raw ? JSON.parse(raw) : {};
      setProductViews(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setProductViews({});
    }

    try {
      const raw = window.localStorage.getItem('kyusda_category_views');
      const parsed = raw ? JSON.parse(raw) : {};
      setCategoryViews(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setCategoryViews({});
    }
  }, []);

  const tokenize = (text) => {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  };

  const scoreForTokens = (p, tokens) => {
    if (!tokens || tokens.length === 0) return 0;
    const title = String(p?.title || '').toLowerCase();
    const desc = String(p?.description || '').toLowerCase();
    const cat = String(p?.category || p?.category_name || '').toLowerCase();

    let score = 0;
    for (const t of tokens) {
      if (!t) continue;
      if (title.includes(t)) score += 6;
      if (cat.includes(t)) score += 4;
      if (desc.includes(t)) score += 2;
    }
    if (p?.featured) score += 0.5;
    return score;
  };

  const buildPrefTokens = () => {
    const viewed = Array.isArray(recentlyViewed) ? recentlyViewed : [];
    const seedText = [
      (searchHistory || []).slice(0, 8).join(' '),
      viewed
        .slice(0, 6)
        .map((p) => `${p?.title || ''} ${p?.category || p?.category_name || ''} ${p?.description || ''}`)
        .join(' '),
    ].join(' ');

    const tokens = tokenize(seedText);
    const stop = new Set(['the', 'and', 'or', 'for', 'with', 'from', 'this', 'that', 'these', 'those', 'you', 'your', 'a', 'an', 'to', 'in', 'of']);
    const cleaned = tokens.filter((t) => t.length >= 3 && !stop.has(t));
    const counts = new Map();
    for (const t of cleaned) counts.set(t, (counts.get(t) || 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
      .map(([t]) => t);
  };

  useEffect(() => {
    const viewed = Array.isArray(recentlyViewed) ? recentlyViewed : [];
    const viewedIds = new Set(viewed.map((x) => String(x?.id)).filter(Boolean));

    const tokens = buildPrefTokens();
    if (tokens.length === 0) {
      setRecommendations([]);
      return;
    }

    const pool = Array.isArray(products) ? products : [];

    const ranked = pool
      .filter((p) => p?.id && !viewedIds.has(String(p.id)))
      .map((p) => {
        const base = scoreForTokens(p, tokens);
        const pid = String(p?.id || '');
        const pv = Number(productViews?.[pid] || 0);
        const cn = String(p?.category || p?.category_name || '').toLowerCase();
        const cv = cn ? Number(categoryViews?.[cn] || 0) : 0;
        const score = base + pv * 1.6 + cv * 0.9;
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((x) => x.p);

    if (ranked.length < 8) {
      const fallback = pool
        .filter((p) => p?.id && !viewedIds.has(String(p.id)) && !ranked.some((x) => String(x?.id) === String(p.id)))
        .slice(0, 12 - ranked.length);
      setRecommendations([...ranked, ...fallback]);
      return;
    }

    setRecommendations(ranked);
  }, [recentlyViewed, products, searchHistory, productViews, categoryViews]);

  async function loadMore() {
    if (loadingMore || loading || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    setError(null);
    try {
      if (prefetchCache?.page === nextPage && Array.isArray(prefetchCache?.results)) {
        setProducts((prev) => [...prev, ...prefetchCache.results]);
        setPage(nextPage);
        setHasMore(Boolean(prefetchCache.hasMore));
        setPrefetchCache(null);
        return;
      }

      const res = await api.getProducts({ featured: true, page: nextPage, page_size: 12 });
      const payload = res?.data;
      const results = Array.isArray(payload?.results) ? payload.results : (payload || []);
      setProducts((prev) => [...prev, ...results]);
      setPage(nextPage);
      setHasMore(Boolean(payload?.next));
    } catch {
      setError('Unable to load more items. Please check your internet connection and try again.');
    } finally {
      setLoadingMore(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const q = (query || '').toLowerCase();
    return (products || []).filter((p) => {
      if (category && category !== 'All' && p.category !== category) return false;
      if (q && !(p?.title || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, category]);

  return (
    <div style={{ animation: 'fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
      {/* Hero Section */}
      <div className="heroRow" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24, animation: 'sheetUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both' }}>
        <div 
          className="heroCard" 
          style={{ 
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
            borderRadius: 24, 
            padding: '28px 24px', 
            position: 'relative', 
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(79, 70, 229, 0.15)',
            cursor: featuredProduct ? 'pointer' : 'default'
          }}
          onClick={() => featuredProduct && nav(`/product/${featuredProduct.id}`)}
        >
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '65%' }}>
            <div className="badge" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', marginBottom: 12, fontSize: 10, fontWeight: 800 }}>
              {featuredProduct?.featured ? 'FEATURED ITEM' : 'LATEST ARRIVAL'}
            </div>
            <div className="heroTitle" style={{ color: 'white', fontSize: 28, fontWeight: 900, lineHeight: 1.1, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {featuredProduct ? featuredProduct.title : 'Big Sale!'}
            </div>
            <div className="heroText" style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 1.4, marginBottom: 20, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {featuredProduct ? (featuredProduct.description || 'Check out this amazing item available now.') : 'Get up to 40% OFF on campus electronics.'}
            </div>
            <button 
              className="btn" 
              style={{ background: 'white', color: '#4f46e5', fontWeight: 800, padding: '10px 24px', borderRadius: 12, border: 'none', fontSize: 13 }}
              onClick={(e) => {
                e.stopPropagation();
                if (featuredProduct) nav(`/product/${featuredProduct.id}`);
              }}
            >
              Shop Now
            </button>
          </div>
          {featuredProduct?.image_url || featuredProduct?.image ? (
            <div style={{ 
              position: 'absolute', 
              right: -10, 
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40%', 
              height: '80%',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={featuredProduct.image_url || featuredProduct.image} 
                alt="" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  borderRadius: 20,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  transform: 'rotate(5deg)'
                }} 
              />
            </div>
          ) : (
            <>
              <div style={{ 
                position: 'absolute', 
                right: -20, 
                bottom: -20, 
                width: 180, 
                height: 180, 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '50%', 
                zIndex: 1 
              }} />
              <div style={{ 
                position: 'absolute', 
                right: 20, 
                top: -10, 
                width: 100, 
                height: 100, 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '50%', 
                zIndex: 1 
              }} />
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div 
            className="promoCard" 
            onClick={() => nav('/flash')} 
            style={{ 
              cursor: 'pointer', 
              background: '#fff', 
              borderRadius: 20, 
              padding: 16, 
              border: '1px solid rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 100
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <div className="badge" style={{ background: '#fef2f2', color: '#ef4444', borderColor: '#fee2e2', fontSize: 9 }}>HOT</div>
            </div>
            <div>
              <div className="promoTitle" style={{ fontSize: 14, fontWeight: 800 }}>Flash Deals</div>
              <div className="promoHint" style={{ fontSize: 11, color: 'var(--muted)' }}>Ends in 02:45</div>
            </div>
          </div>

          <div 
            className="promoCard" 
            onClick={() => nav('/new-arrivals')}
            style={{ 
              background: '#fff', 
              borderRadius: 20, 
              padding: 16, 
              border: '1px solid rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 100,
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: 20 }}>✨</div>
            <div>
              <div className="promoTitle" style={{ fontSize: 14, fontWeight: 800 }}>New Arrivals</div>
              <div className="promoHint" style={{ fontSize: 11, color: 'var(--muted)' }}>Just listed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="sectionHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, animation: 'fadeIn 0.8s ease both', animationDelay: '0.1s' }}>
        <div>
          <div className="sectionTitle" style={{ fontSize: 18, fontWeight: 900 }}>Categories</div>
          <div className="sectionHint" style={{ fontSize: 12 }}>Explore collections</div>
        </div>
        <button className="btn btnGhost" style={{ fontSize: 12, padding: '4px 8px' }}>See all</button>
      </div>
      <div className="categoryGrid" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, margin: '0 -4px', animation: 'fadeIn 0.8s ease both', animationDelay: '0.2s' }}>
        {loading
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="catTile" style={{ pointerEvents: 'none', flex: '0 0 80px' }}>
                <div className="catIcon" style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--bg)', marginBottom: 8 }}>
                  <Skeleton width={26} height={26} radius={10} />
                </div>
                <Skeleton width="70%" height={10} radius={8} style={{ margin: '6px auto 0' }} />
              </div>
            ))
          : categories.map((cat) => (
              <button
                key={cat.id}
                className="catTile"
                onClick={() => setCategory(cat.name)}
                style={{ 
                  flex: '0 0 80px', 
                  background: 'none', 
                  border: 'none', 
                  padding: 0, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center' 
                }}
              >
                <div 
                  className={`catIcon ${category === cat.name ? 'active' : ''}`} 
                  style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: 20, 
                    background: category === cat.name ? 'var(--primary)' : '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: 8,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
                    border: category === cat.name ? 'none' : '1px solid rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover' }}
                    />
                  ) : <span style={{ fontSize: 24 }}>📦</span>}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: category === cat.name ? 'var(--primary)' : 'var(--text)', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.name}
                </div>
              </button>
            ))}
      </div>

      {/* Products Grid */}
      <div className="sectionHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 32, marginBottom: 16, animation: 'fadeIn 0.8s ease both', animationDelay: '0.3s' }}>
        <div>
          <div className="sectionTitle" style={{ fontSize: 18, fontWeight: 900 }}>Featured</div>
          <div className="sectionHint" style={{ fontSize: 12 }}>Handpicked for you</div>
        </div>
        <button className="btn btnGhost" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => nav('/market')}>View all</button>
      </div>
      <div className="grid">
        {loading ? (
          Array.from({ length: 8 }).map((_, idx) => <ProductCardSkeleton key={idx} />)
        ) : error ? (
          <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
            <div className="sectionTitle">Network Error</div>
            <div className="sectionHint">{error}</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
            <div className="sectionTitle">No information</div>
            <div className="sectionHint">There are no products to show on this page.</div>
          </div>
        ) : (
          filteredProducts.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>

      {!loading && !error && hasMore ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <button className="btn btnPrimary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      ) : null}

      <div className="sectionHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 32, marginBottom: 16, animation: 'fadeIn 0.8s ease both', animationDelay: '0.5s' }}>
        <div>
          <div className="sectionTitle" style={{ fontSize: 18, fontWeight: 900 }}>Recently Viewed</div>
          <div className="sectionHint" style={{ fontSize: 12 }}>Pick up where you left off</div>
        </div>
        {recentlyViewed.length > 0 && <button className="btn btnGhost" style={{ fontSize: 12, padding: '4px 8px' }}>Clear</button>}
      </div>
      <div className="grid" style={{ animation: 'fadeIn 0.8s ease both', animationDelay: '0.6s' }}>
        {recentlyViewed.length === 0 ? (
          <div className="pageCard" style={{ textAlign: 'center', padding: '30px 20px', gridColumn: '1 / -1' }}>
            <div className="sectionTitle">No history yet</div>
            <div className="sectionHint">Open a product to see it here.</div>
          </div>
        ) : (
          recentlyViewed.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>

      <div className="sectionHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 32, marginBottom: 16, animation: 'fadeIn 0.8s ease both', animationDelay: '0.7s' }}>
        <div>
          <div className="sectionTitle" style={{ fontSize: 18, fontWeight: 900 }}>You may like</div>
          <div className="sectionHint" style={{ fontSize: 12 }}>Personalized for you</div>
        </div>
      </div>
      <div className="grid" style={{ animation: 'fadeIn 0.8s ease both', animationDelay: '0.8s' }}>
        {recommendations.length === 0 ? (
          <div className="pageCard" style={{ textAlign: 'center', padding: '30px 20px', gridColumn: '1 / -1' }}>
            <div className="sectionTitle">No recommendations yet</div>
            <div className="sectionHint">View a few products to get personalized suggestions.</div>
          </div>
        ) : (
          recommendations.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>
    </div>
  );
}
