import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { api } from '../lib/api.js';

export default function Market({ query, showFilters, setShowFilters }) {
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
    const q = (query || '').trim().toLowerCase();
    const qTokens = tokenize(q);

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
    }

    if (sortBy === 'price-low') results.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') results.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') results.sort((a, b) => b.rating - a.rating);

    return results;
  }, [query, location, minPrice, maxPrice, sortBy, products]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', position: 'relative' }}>
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
      {/* Filters Popover */}
      {showFilters && (
        <div className="marketFiltersPopover">
          <div className="pageCard" style={{ padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.12)', border: '1px solid var(--primary-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="sidebarTitle" style={{ fontSize: 18 }}>Filter Marketplace</div>
              <button className="btn btnGhost" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => { setMinPrice(''); setMaxPrice(''); setLocation(''); }}>Reset</button>
            </div>

            <div className="marketFiltersGrid">
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

            <div className="marketFiltersActions" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btnPrimary" style={{ padding: '10px 32px' }} onClick={() => setShowFilters(false)}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Results Area */}
        <div style={{ flex: 1 }}>
          <div className="sectionHeader" style={{ marginTop: 0 }}>
            <div>
              <div className="sectionTitle">Marketplace</div>
              <div className="sectionHint">{loading ? 'Loading...' : `${filtered.length} items found`}</div>
            </div>
          </div>

          {loading ? null : error ? (
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
              <div className="sectionTitle">No information</div>
              <div className="sectionHint">There are no products to show on this page.</div>
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
