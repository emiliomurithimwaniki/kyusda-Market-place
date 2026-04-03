import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { IconPlus, IconSearch } from './Icons.jsx';
import { api } from '../lib/api.js';

export default function TopBar({ query, setQuery, showFilters, setShowFilters }) {
  const location = useLocation();
  const nav = useNavigate();
  const isMarketplace = location.pathname === '/market';
  const [unreadCount, setUnreadCount] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('kyusda_search_history');
      const parsed = raw ? JSON.parse(raw) : [];
      setHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadCats = async () => {
      setLoadingCats(true);
      try {
        const res = await api.getCategories();
        if (!mounted) return;
        setCategories(Array.isArray(res?.data) ? res.data : []);
      } catch {
        if (mounted) setCategories([]);
      } finally {
        if (mounted) setLoadingCats(false);
      }
    };
    loadCats();
    return () => { mounted = false; };
  }, []);

  const persistHistory = (items) => {
    setHistory(items);
    try {
      window.localStorage.setItem('kyusda_search_history', JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const pushHistory = (q) => {
    const trimmed = String(q || '').trim();
    if (!trimmed) return;
    const next = [trimmed, ...(history || []).filter((x) => String(x).toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
    persistHistory(next);
  };

  useEffect(() => {
    if (!isMarketplace) return;
    const hasQ = new URLSearchParams(location.search).has('q');
    if (hasQ && !String(query || '').trim()) {
      nav('/market', { replace: true });
    }
  }, [isMarketplace, location.search, query, nav]);

  useEffect(() => {
    let interval;
    const fetchCount = async () => {
      try {
        const res = await api.getNotificationsUnreadCount();
        setUnreadCount(res.data.unread_count || 0);
      } catch (err) {
        // Silently ignore or set 0 if not logged in
        setUnreadCount(0);
      }
    };

    fetchCount();
    interval = setInterval(fetchCount, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [location.pathname]);

  useEffect(() => {
    const q = String(query || '').trim();
    // Always show suggestions (best-effort) when dropdown is open.
    // If query is too short, we simply don't fetch product suggestions.
    if (q.length < 2) {
      setSuggestions([]);
      setLoadingSuggest(false);
      return;
    }

    let canceled = false;
    const handle = setTimeout(async () => {
      setLoadingSuggest(true);
      try {
        const res = await api.getSearchSuggestions(q, 6);
        if (canceled) return;
        const payload = res?.data;
        const results = Array.isArray(payload?.results) ? payload.results : (payload || []);
        setSuggestions(results);
        setShowSuggest(true);
      } catch {
        if (canceled) return;
        setSuggestions([]);
        setShowSuggest(true);
      } finally {
        if (!canceled) setLoadingSuggest(false);
      }
    }, 220);

    return () => {
      canceled = true;
      clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    if (!showSuggest) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowSuggest(false);
    };
    const onMouseDown = (e) => {
      if (e.target.closest('.searchSuggestWrap')) return;
      setShowSuggest(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [showSuggest]);

  const goSearch = (q) => {
    const trimmed = String(q || '').trim();
    if (!trimmed) return;
    setShowSuggest(false);
    pushHistory(trimmed);
    nav(`/market?q=${encodeURIComponent(trimmed)}`);
  };

  const goCategory = (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;
    setShowSuggest(false);
    pushHistory(trimmed);
    nav(`/market?q=${encodeURIComponent(trimmed)}`);
  };

  const categoryMatches = (() => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    return (categories || [])
      .filter((c) => String(c?.name || '').toLowerCase().includes(q))
      .slice(0, 6);
  })();

  const clearHistory = () => {
    persistHistory([]);
  };

  const removeHistoryItem = (q) => {
    const trimmed = String(q || '').trim();
    if (!trimmed) return;
    persistHistory((history || []).filter((x) => String(x).toLowerCase() !== trimmed.toLowerCase()));
  };

  return (
    <header className="topBar">
      <div className="brand" style={{ minWidth: 140 }}>
        <div className="brandTitle" style={{ fontSize: 20, fontWeight: 900, background: 'linear-gradient(135deg, var(--primary), var(--primary-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KYUSDA</div>
        <div className="brandTagline" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Marketplace</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, justifyContent: 'center', position: 'relative' }}>
        <div className="searchSuggestWrap" style={{ flex: 1, maxWidth: 600, position: 'relative' }}>
        <div className="search" role="search" style={{ flex: 1, maxWidth: 600, height: 46 }}>
          <IconSearch style={{ color: 'var(--primary)', width: 20, height: 20 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setShowSuggest(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                goSearch(query);
              }
            }}
            placeholder="Search for products, sellers, or categories..."
            aria-label="Search"
            style={{ fontSize: 15, fontWeight: 500 }}
          />

          {String(query || '').trim() ? (
            <button
              type="button"
              className="searchIconBtn"
              onClick={() => {
                setQuery('');
                setShowSuggest(false);
                if (isMarketplace) nav('/market');
              }}
              aria-label="Clear search"
              title="Clear"
            >
              ✕
            </button>
          ) : null}

          <button
            type="button"
            className="searchIconBtn"
            onClick={() => goSearch(query)}
            aria-label="Search"
            title="Search"
          >
            ➜
          </button>
          
          {isMarketplace && (
            <button 
              className={`btn ${showFilters ? 'btnPrimary' : 'btnGhost'}`} 
              style={{ padding: '6px 12px', fontSize: 12, borderRadius: 10, height: 32, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <span>{showFilters ? '✕' : '⌥'}</span>
              <span>Filters</span>
            </button>
          )}

          <div style={{ padding: '4px 8px', background: 'var(--bg)', borderRadius: 8, fontSize: 10, fontWeight: 800, color: 'var(--muted)', border: '1px solid var(--border)', marginLeft: 8 }} className="desktop-only">
            CMD + K
          </div>
        </div>

        {showSuggest ? (
          <div
            style={{
              position: 'absolute',
              top: 52,
              left: 0,
              right: 0,
              zIndex: 50,
            }}
          >
            <div
              className="searchSuggestCard"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Search
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {history.length > 0 ? (
                    <button type="button" className="btn btnGhost" style={{ padding: '4px 10px', fontSize: 11, borderRadius: 10 }} onClick={clearHistory}>
                      Clear
                    </button>
                  ) : null}
                  <button type="button" className="btn btnGhost" style={{ padding: '4px 10px', fontSize: 11, borderRadius: 10 }} onClick={() => goSearch(query)}>
                    Search
                  </button>
                </div>
              </div>

              {history.length > 0 ? (
                <div style={{ padding: '4px 8px 8px' }}>
                  <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--muted)', padding: '8px 2px 6px' }}>
                    Recent
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {history.slice(0, 6).map((h) => (
                      <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          className="searchSuggestItem"
                          onClick={() => {
                            setQuery(h);
                            goSearch(h);
                          }}
                          style={{ flex: 1 }}
                        >
                          <span className="searchSuggestThumb">
                            <span style={{ fontSize: 14 }}>🕘</span>
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 440 }}>
                              {h}
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="searchIconBtn"
                          onClick={() => removeHistoryItem(h)}
                          aria-label="Remove from history"
                          title="Remove"
                          style={{ width: 30, height: 30, borderRadius: 10 }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {loadingSuggest ? (
                <div style={{ padding: 12, color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: 'rgba(79,70,229,0.45)' }} />
                  <span>Searching...</span>
                </div>
              ) : null}

              {String(query || '').trim() ? (
                <div style={{ padding: '0 8px 10px' }}>
                  <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--muted)', padding: '8px 2px 6px' }}>
                    Categories
                  </div>
                  {loadingCats ? (
                    <div style={{ padding: 10, color: 'var(--muted)', fontSize: 13 }}>Loading categories...</div>
                  ) : categoryMatches.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {categoryMatches.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="searchSuggestItem"
                          onClick={() => goCategory(c?.name)}
                        >
                          <span className="searchSuggestThumb">
                            {c?.image ? (
                              <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: 14 }}>🏷️</span>
                            )}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 440 }}>
                              {c?.name}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 10, color: 'var(--muted)', fontSize: 13 }}>No matching categories.</div>
                  )}
                </div>
              ) : null}

              {suggestions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--muted)', padding: '10px 10px 6px' }}>
                    Products
                  </div>
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setQuery(p?.title || query);
                        goSearch(p?.title || query);
                      }}
                      className="searchSuggestItem"
                    >
                      <span className="searchSuggestThumb">
                        {(p?.image_url || p?.image) ? (
                          <img src={p?.image_url || p?.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 14 }}>🔎</span>
                        )}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 440 }}>
                          {p?.title || 'Untitled'}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
                          {p?.category || p?.category_name || 'Product'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : String(query || '').trim().length >= 2 && !loadingSuggest ? (
                <div style={{ padding: 12, color: 'var(--muted)', fontSize: 13 }}>No product results. Press Enter to search.</div>
              ) : null}
            </div>
          </div>
        ) : null}

        </div>
      </div>

      <div className="topBarActions" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 140, justifyContent: 'flex-end' }}>
        <div 
          className="iconBtn" 
          title="Notifications" 
          onClick={() => nav('/notifications')}
          style={{ cursor: 'pointer', position: 'relative' }}
        >
          <span style={{ fontSize: 18 }}>🔔</span>
          {unreadCount > 0 && (
            <div style={{ 
              position: 'absolute', 
              top: -4, 
              right: -4, 
              minWidth: 18, 
              height: 18, 
              background: 'var(--danger)', 
              borderRadius: 10, 
              border: '2px solid white',
              color: 'white',
              fontSize: 10,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
        <Link to="/profile" style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--border)', overflow: 'hidden', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.2s' }} className="hover-ring avatarWrapper">
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)' }}>👤</div>
        </Link>
      </div>
    </header>
  );
}
