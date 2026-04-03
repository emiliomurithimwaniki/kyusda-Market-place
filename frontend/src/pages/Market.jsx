import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import ProductCardSkeleton from '../components/skeletons/ProductCardSkeleton.jsx';
import { api } from '../lib/api.js';

export default function Market({ query, showFilters, setShowFilters }) {
  const locationRoute = useLocation();
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [products, setProducts] = useState([]);
  const [activeSection, setActiveSection] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [prefetchCache, setPrefetchCache] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [productViews, setProductViews] = useState({});
  const [categoryViews, setCategoryViews] = useState({});
  const [visitSeed, setVisitSeed] = useState(0);

  const tokenize = (text) => {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  };

  const scoreProductForQuery = (p, qTokens) => {
    if (!qTokens || qTokens.length === 0) return 0;
    const title = String(p?.title || '').toLowerCase();
    const desc = String(p?.description || '').toLowerCase();
    const cat = String(p?.category || p?.category_name || '').toLowerCase();
    const loc = String(p?.location || '').toLowerCase();

    let score = 0;
    for (const t of qTokens) {
      if (!t) continue;
      if (title.includes(t)) score += 6;
      if (cat.includes(t)) score += 4;
      if (desc.includes(t)) score += 2;
      if (loc.includes(t)) score += 1;
    }

    // Small boost for featured when relevance ties
    if (p?.featured) score += 0.5;
    return score;
  };

  useEffect(() => {
    setVisitSeed(Date.now());

    try {
      const raw = window.localStorage.getItem('kyusda_search_history');
      const parsed = raw ? JSON.parse(raw) : [];
      setSearchHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSearchHistory([]);
    }

    try {
      const raw = window.localStorage.getItem('kyusda_recently_viewed');
      const parsed = raw ? JSON.parse(raw) : [];
      setRecentlyViewed(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRecentlyViewed([]);
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
  }, [locationRoute.pathname]);

  const rand01 = (x) => {
    const t = Math.sin(x) * 10000;
    return t - Math.floor(t);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = activeSection === 'flash' ? { flash_sale: true, page: 1, page_size: 20 } : { page: 1, page_size: 20 };
        const res = await api.getProducts(params);
        if (!mounted) return;
        const payload = res?.data;
        const results = Array.isArray(payload?.results) ? payload.results : (payload || []);
        setProducts(results);
        setPage(1);
        setHasMore(Boolean(payload?.next));

        if (payload?.next) {
          try {
            const nextParams = activeSection === 'flash' ? { flash_sale: true, page: 2, page_size: 20 } : { page: 2, page_size: 20 };
            const nextRes = await api.getProducts(nextParams);
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
          setProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [activeSection]);

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

        if (prefetchCache.hasMore) {
          try {
            const afterRes = await api.getProducts({ page: nextPage + 1, page_size: 20 });
            const afterPayload = afterRes?.data;
            const afterResults = Array.isArray(afterPayload?.results) ? afterPayload.results : null;
            if (afterResults) setPrefetchCache({ page: nextPage + 1, results: afterResults, hasMore: Boolean(afterPayload?.next) });
          } catch {
            setPrefetchCache(null);
          }
        }
        return;
      }

      const params = activeSection === 'flash' ? { flash_sale: true, page: nextPage, page_size: 20 } : { page: nextPage, page_size: 20 };
      const res = await api.getProducts(params);
      const payload = res?.data;
      const results = Array.isArray(payload?.results) ? payload.results : (payload || []);
      setProducts((prev) => [...prev, ...results]);
      setPage(nextPage);
      setHasMore(Boolean(payload?.next));

      if (payload?.next) {
        try {
          const nextRes = await api.getProducts({ page: nextPage + 1, page_size: 20 });
          const nextPayload = nextRes?.data;
          const nextResults = Array.isArray(nextPayload?.results) ? nextPayload.results : null;
          if (nextResults) setPrefetchCache({ page: nextPage + 1, results: nextResults, hasMore: Boolean(nextPayload?.next) });
        } catch {
          setPrefetchCache(null);
        }
      } else {
        setPrefetchCache(null);
      }
    } catch {
      setError('Unable to load more items. Please check your internet connection and try again.');
    } finally {
      setLoadingMore(false);
    }
  }

  const filtered = useMemo(() => {
    const urlQ = new URLSearchParams(locationRoute.search).get('q') || '';
    const q = (urlQ || query || '').trim().toLowerCase();
    const qTokens = tokenize(q);
    const isDefault = qTokens.length === 0;

    const prefTokens = (() => {
      if (qTokens.length > 0) return [];
      const hist = (searchHistory || []).slice(0, 8).join(' ');
      const recent = (recentlyViewed || []).slice(0, 8).map((p) => `${p?.title || ''} ${p?.category || p?.category_name || ''}`).join(' ');
      const combined = `${hist} ${recent}`.trim();
      const tokens = tokenize(combined);
      const stop = new Set(['the', 'and', 'or', 'for', 'with', 'from', 'this', 'that', 'these', 'those', 'you', 'your', 'a', 'an', 'to', 'in', 'of']);
      const cleaned = tokens.filter((t) => t.length >= 3 && !stop.has(t));

      const counts = new Map();
      for (const t of cleaned) counts.set(t, (counts.get(t) || 0) + 1);
      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([t]) => t);
    })();

    let results = (products || []).filter((p) => {
      if (qTokens.length > 0) {
        const score = scoreProductForQuery(p, qTokens);
        if (score <= 0) return false;
      }
      if (location && !String(p?.location || '').toLowerCase().includes(location.toLowerCase())) return false;
      if (minPrice && Number(p.price) < Number(minPrice)) return false;
      if (maxPrice && Number(p.price) > Number(maxPrice)) return false;
      return true;
    });

    if (qTokens.length > 0) {
      results = results
        .map((p) => ({ p, score: scoreProductForQuery(p, qTokens) }))
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          const ea = a.p?.offer_end ? new Date(a.p.offer_end).getTime() : Number.MAX_SAFE_INTEGER;
          const eb = b.p?.offer_end ? new Date(b.p.offer_end).getTime() : Number.MAX_SAFE_INTEGER;
          return ea - eb;
        })
        .map((x) => x.p);
    } else if (prefTokens.length > 0) {
      results = results
        .map((p) => ({ p, score: scoreProductForQuery(p, prefTokens) }))
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return 0;
        })
        .map((x) => x.p);
    }

    if (isDefault) {
      const scored = results.map((p) => {
        const pid = String(p?.id || '');
        const pv = Number(productViews?.[pid] || 0);
        const cn = String(p?.category || p?.category_name || '').toLowerCase();
        const cv = cn ? Number(categoryViews?.[cn] || 0) : 0;
        const jitter = rand01(visitSeed + Number(p?.id || 0)) * 0.35;
        const score = pv * 3 + cv * 1.2 + jitter;
        return { p, score };
      });
      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return 0;
      });
      results = scored.map((x) => x.p);
    }

    if (sortBy === 'price-low') results.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') results.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') results.sort((a, b) => b.rating - a.rating);

    return results;
  }, [query, locationRoute.search, location, minPrice, maxPrice, sortBy, products, searchHistory, recentlyViewed, productViews, categoryViews, visitSeed]);

  useEffect(() => {
    if (!showFilters) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowFilters(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showFilters, setShowFilters]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', position: 'relative' }}>
      {(() => {
        const urlQ = new URLSearchParams(locationRoute.search).get('q') || '';
        const activeQ = (urlQ || '').trim();
        const hasPersonal = !activeQ && (searchHistory.length > 0 || recentlyViewed.length > 0);
        const hasViews = !activeQ && (Object.keys(productViews || {}).length > 0 || Object.keys(categoryViews || {}).length > 0);
        return (
          <div className="pageCard" style={{ padding: 18, marginBottom: 14, background: 'radial-gradient(900px 420px at 20% 0%, rgba(79, 70, 229, 0.18), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72))', border: '1px solid rgba(79,70,229,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div className="sectionTitle" style={{ margin: 0 }}>
                  {activeQ ? `Products related to "${activeQ}"` : hasPersonal ? 'Recommended for you' : 'Marketplace'}
                </div>
                <div className="sectionHint" style={{ marginTop: 4 }}>
                  {loading ? 'Loading...' : hasViews ? 'Prioritized by what you view most (changes every visit).' : `${filtered.length} items found`}
                </div>
              </div>
              {activeQ ? (
                <button className="btn btnGhost" style={{ padding: '6px 10px', fontSize: 12, borderRadius: 12 }} onClick={() => window.location.assign('/market')}>
                  Clear search
                </button>
              ) : null}
            </div>
          </div>
        );
      })()}

      <div className="pageCard" style={{ padding: 8, marginBottom: 16 }}>
        <div className="pillRow" style={{ gap: 8, padding: 0 }}>
          <button
            className={`tabBtn ${activeSection === 'all' ? 'active' : ''}`}
            onClick={() => setActiveSection('all')}
            style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: activeSection === 'all' ? 'var(--primary)' : 'transparent', color: activeSection === 'all' ? 'white' : 'var(--muted)', fontWeight: 700, cursor: 'pointer' }}
          >
            All Items
          </button>
          <button
            className={`tabBtn ${activeSection === 'flash' ? 'active' : ''}`}
            onClick={() => setActiveSection('flash')}
            style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: activeSection === 'flash' ? 'var(--primary)' : 'transparent', color: activeSection === 'flash' ? 'white' : 'var(--muted)', fontWeight: 700, cursor: 'pointer' }}
          >
            Flash Sale
          </button>
        </div>
      </div>

      {showFilters ? (
        <>
          <div className="filtersSheetBackdrop" onClick={() => setShowFilters(false)} />
          <div className="filtersSheet" role="dialog" aria-modal="true">
            <div className="filtersSheetCard pageCard" style={{ padding: 0 }}>
              <div className="filtersSheetGrab" />
              <div className="filtersSheetHeader">
                <div>
                  <div className="sidebarTitle" style={{ fontSize: 18 }}>Filter Marketplace</div>
                  <div className="sectionHint" style={{ marginTop: 2 }}>Refine results with price, location, and sorting.</div>
                </div>
                <button className="btn btnGhost" style={{ padding: '6px 10px', fontSize: 12, borderRadius: 12 }} onClick={() => setShowFilters(false)}>
                  Close
                </button>
              </div>

              <div className="filtersSheetBody">
                <div className="marketFiltersGrid" style={{ gridTemplateColumns: '1fr', gap: 12 }}>
                  <div className="field">
                    <div className="label">Price Range</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input className="input" style={{ flex: 1 }} placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                      <input className="input" style={{ flex: 1 }} placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                    </div>
                  </div>

                  <div className="field">
                    <div className="label">Location</div>
                    <select className="input" value={location} onChange={(e) => setLocation(e.target.value)}>
                      <option value="">All Locations</option>
                      <option value="Nairobi">Nairobi</option>
                      <option value="Juja">Juja</option>
                      <option value="Kiambu">Kiambu</option>
                      <option value="Nakuru">Nakuru</option>
                    </select>
                  </div>

                  <div className="field">
                    <div className="label">Sort By</div>
                    <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Top Rated</option>
                    </select>
                  </div>
                </div>

                <div className="marketFiltersActions" style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btnGhost" onClick={() => { setMinPrice(''); setMaxPrice(''); setLocation(''); }}>
                    Reset
                  </button>
                  <button className="btn btnPrimary" onClick={() => setShowFilters(false)}>
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Results Area */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div className="grid">
              {Array.from({ length: 12 }).map((_, idx) => <ProductCardSkeleton key={idx} />)}
            </div>
          ) : error ? (
            <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
              <div className="sectionTitle">Network Error</div>
              <div className="sectionHint">{error}</div>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} showOffer={activeSection === 'flash'} />
              ))}
            </div>
          ) : (
            <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
              <div className="sectionTitle">No products found</div>
              <div className="sectionHint">Try a different keyword, or clear search to browse everything.</div>
            </div>
          )}

          {!loading && !error && hasMore ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <button className="btn btnPrimary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
