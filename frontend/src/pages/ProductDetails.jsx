import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatKES } from '../lib/format.js';
import ProductCard from '../components/ProductCard.jsx';
import ProductDetailsSkeleton from '../components/skeletons/ProductDetailsSkeleton.jsx';
import { api } from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState('description');
  const [activePhoto, setActivePhoto] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const [product, setProduct] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [me, setMe] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isOfferValid, setIsOfferValid] = useState(false);

  useEffect(() => {
    if (!product?.offer_active || !product?.offer_end) {
      setIsOfferValid(false);
      return;
    }

    const endTime = new Date(product.offer_end).getTime();
    const updateTimer = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setIsOfferValid(false);
      } else {
        setTimeLeft(diff);
        setIsOfferValid(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [product?.offer_active, product?.offer_end]);

  const msToParts = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return { hh, mm, ss };
  };

  const parts = isOfferValid ? msToParts(timeLeft) : null;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setIsDeleting(true);
    try {
      await api.deleteProduct(product.id);
      alert('Product deleted');
      nav('/market');
    } catch (err) {
      alert('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      setProduct(null);
      setSellerProducts([]);
      try {
        try {
          const meRes = await api.me();
          if (mounted) setMe(meRes?.data || null);
        } catch {
          if (mounted) setMe(null);
        }

        const productRes = await api.getProduct(id);
        const p = productRes?.data;
        if (mounted) setProduct(p || null);

        try {
          if (p?.id) {
            const key = 'kyusda_recently_viewed';
            const raw = window.localStorage.getItem(key);
            const list = Array.isArray(JSON.parse(raw || '[]')) ? JSON.parse(raw || '[]') : [];
            const next = [p, ...list.filter((x) => String(x?.id) !== String(p.id))].slice(0, 8);
            window.localStorage.setItem(key, JSON.stringify(next));

            const viewsKey = 'kyusda_product_views';
            const viewsRaw = window.localStorage.getItem(viewsKey);
            const viewsObj = viewsRaw ? JSON.parse(viewsRaw) : {};
            const pid = String(p.id);
            const cur = Number(viewsObj?.[pid] || 0);
            const nextViews = { ...(viewsObj || {}), [pid]: cur + 1 };
            window.localStorage.setItem(viewsKey, JSON.stringify(nextViews));

            const catName = String(p?.category || p?.category_name || '').trim();
            if (catName) {
              const catViewsKey = 'kyusda_category_views';
              const catViewsRaw = window.localStorage.getItem(catViewsKey);
              const catViewsObj = catViewsRaw ? JSON.parse(catViewsRaw) : {};
              const ck = catName.toLowerCase();
              const ccur = Number(catViewsObj?.[ck] || 0);
              const nextCatViews = { ...(catViewsObj || {}), [ck]: ccur + 1 };
              window.localStorage.setItem(catViewsKey, JSON.stringify(nextCatViews));
            }
          }
        } catch {}

        const sellerId = p?.sellerId;
        if (sellerId) {
          const [, sellerProductsRes] = await Promise.all([
            api.getSeller(sellerId),
            api.getProducts({ sellerId }),
          ]);
          const results = Array.isArray(sellerProductsRes?.data?.results) 
            ? sellerProductsRes.data.results 
            : (Array.isArray(sellerProductsRes?.data) ? sellerProductsRes.data : []);
          if (mounted) setSellerProducts(results);
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

  const isOwner = me?.id && product?.sellerId && String(me.id) === String(product.sellerId);

  const handleContactSeller = () => {
    if (!product?.sellerId) return;
    const params = new URLSearchParams();
    params.set('to', String(product.sellerId));
    if (product?.id) params.set('product', String(product.id));
    nav(`/messages?${params.toString()}`);
  };

  const otherItems = useMemo(() => {
    return (sellerProducts || []).filter((p) => String(p?.id) !== String(id));
  }, [sellerProducts, id]);

  const images = useMemo(() => {
    const main = product?.image_url || product?.image || null;
    const photos = Array.isArray(product?.photos) ? product.photos : [];
    return [main, ...photos].filter(Boolean);
  }, [product]);

  useEffect(() => {
    setActivePhoto(0);
  }, [product?.id]);

  useEffect(() => {
    if (!viewerOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setViewerOpen(false);
        return;
      }
      if (images.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        setActivePhoto((p) => (p - 1 + images.length) % images.length);
      }
      if (e.key === 'ArrowRight') {
        setActivePhoto((p) => (p + 1) % images.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewerOpen, images.length]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {loading ? (
        <ProductDetailsSkeleton />
      ) : error ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
          <div className="sectionTitle">Network Error</div>
          <div className="sectionHint">{error}</div>
        </div>
      ) : !product ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
          <div className="sectionTitle">No information</div>
          <div className="sectionHint">There is no product information to show on this page.</div>
        </div>
      ) : (
        <div>
          {viewerOpen && images.length > 0 ? (
            <div
              role="dialog"
              aria-modal="true"
              onClick={() => setViewerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(17,24,39,0.78)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'relative',
                  width: 'min(980px, 100%)',
                  height: 'min(80vh, 720px)',
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.18)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <img
                  src={images[activePhoto]}
                  alt={`${product.title} ${activePhoto + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />

                <button
                  type="button"
                  className="iconBtn"
                  onClick={() => setViewerOpen(false)}
                  style={{ position: 'absolute', top: 12, right: 12, width: 38, height: 38, borderRadius: 14, background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.55)' }}
                  aria-label="Close viewer"
                >
                  ✕
                </button>

                {images.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="iconBtn"
                      onClick={() => setActivePhoto((p) => (p - 1 + images.length) % images.length)}
                      style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: 16, background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.55)' }}
                      aria-label="Previous photo"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="iconBtn"
                      onClick={() => setActivePhoto((p) => (p + 1) % images.length)}
                      style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: 16, background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.55)' }}
                      aria-label="Next photo"
                    >
                      ›
                    </button>

                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 12, display: 'flex', justifyContent: 'center', gap: 6 }}>
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePhoto(idx)}
                          style={{
                            width: idx === activePhoto ? 18 : 8,
                            height: 8,
                            borderRadius: 999,
                            border: 'none',
                            cursor: 'pointer',
                            background: idx === activePhoto ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                            transition: 'all 160ms ease',
                          }}
                          aria-label={`Go to photo ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="sectionHeader" style={{ marginTop: 0 }}>
            <div>
              <div className="sectionTitle">{product.title}</div>
              <div className="sectionHint">{product.category}</div>
            </div>
          </div>

          {images.length > 0 ? (
            <div className="pageCard" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 280,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    height: '100%',
                    width: `${images.length * 100}%`,
                    transform: `translateX(-${activePhoto * (100 / images.length)}%)`,
                    transition: 'transform 220ms ease',
                  }}
                >
                  {images.map((src, idx) => (
                    <div key={`${src}-${idx}`} style={{ width: `${100 / images.length}%`, height: '100%', flex: `0 0 ${100 / images.length}%` }}>
                      <img
                        src={src}
                        alt={`${product.title} ${idx + 1}`}
                        onClick={() => {
                          setActivePhoto(idx);
                          setViewerOpen(true);
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>

                {images.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="iconBtn"
                      onClick={() => setActivePhoto((p) => (p - 1 + images.length) % images.length)}
                      style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 14, background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.55)' }}
                      aria-label="Previous photo"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="iconBtn"
                      onClick={() => setActivePhoto((p) => (p + 1) % images.length)}
                      style={{ position: 'absolute', top: '50%', right: 10, transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 14, background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.55)' }}
                      aria-label="Next photo"
                    >
                      ›
                    </button>
                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 10, display: 'flex', justifyContent: 'center', gap: 6 }}>
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePhoto(idx)}
                          style={{
                            width: idx === activePhoto ? 18 : 8,
                            height: 8,
                            borderRadius: 999,
                            border: 'none',
                            cursor: 'pointer',
                            background: idx === activePhoto ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                            transition: 'all 160ms ease',
                          }}
                          aria-label={`Go to photo ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="pageCard" style={{ padding: 24 }}>
            {Number(product?.stock) <= 0 ? (
              <div className="badge" style={{ marginBottom: 12, padding: '6px 12px', fontSize: 12, background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)', color: 'var(--danger)', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span>Out of stock</span>
              </div>
            ) : null}
            {isOfferValid ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <div className="productPrice" style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)' }}>
                    {formatKES(product.offer_price)}
                  </div>
                  <div style={{ fontSize: 18, color: 'var(--danger)', textDecoration: 'line-through', opacity: 0.8, fontWeight: 700 }}>
                    {formatKES(product.price)}
                  </div>
                </div>
                <div className="badge" style={{ marginTop: 8, padding: '6px 12px', fontSize: 12, background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)', color: 'var(--danger)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>⚡ FLASH SALE</span>
                  <span style={{ opacity: 0.5 }}>|</span>
                  <span>Ends in {parts.hh}:{parts.mm}:{parts.ss}</span>
                </div>
              </div>
            ) : (
              <div className="productPrice" style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>{formatKES(product.price)}</div>
            )}
            <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 13 }}>{product.location || ''}</div>

            <div style={{ marginTop: 20 }}>
              <div className="pillRow" style={{ borderBottom: '1px solid var(--border)', borderRadius: 0, padding: 0, gap: 24 }}>
                <button
                  className={`tabBtn ${activeTab === 'description' ? 'active' : ''}`}
                  onClick={() => setActiveTab('description')}
                  style={{ background: 'none', border: 'none', padding: '12px 0', fontWeight: 700, color: activeTab === 'description' ? 'var(--primary)' : 'var(--muted)', borderBottom: activeTab === 'description' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer' }}
                >
                  Description
                </button>
                <button
                  className={`tabBtn ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                  style={{ background: 'none', border: 'none', padding: '12px 0', fontWeight: 700, color: activeTab === 'reviews' ? 'var(--primary)' : 'var(--muted)', borderBottom: activeTab === 'reviews' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer' }}
                >
                  Reviews
                </button>
              </div>

              <div style={{ marginTop: 20 }}>
                {activeTab === 'description' ? (
                  <>
                    <p style={{ lineHeight: 1.6, color: 'var(--text)', opacity: 0.85 }}>{product.description}</p>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
                      <button 
                        className="btn btnPrimary" 
                        style={{ flex: 1, height: 54, borderRadius: 16, fontSize: 16, fontWeight: 900 }}
                        onClick={() => {
                          addToCart(product);
                        }}
                        disabled={Number(product?.stock) <= 0}
                      >
                        Buy Now
                      </button>
                      <button 
                        className="btn btnGhost" 
                        style={{ flex: 1, height: 54, borderRadius: 16, border: '2px solid var(--primary)', color: 'var(--primary)', fontSize: 16, fontWeight: 900 }}
                        onClick={() => {
                          addToCart(product);
                        }}
                        disabled={Number(product?.stock) <= 0}
                      >
                        Add to Cart
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn btnPrimary" style={{ flex: 1, height: 48 }} onClick={handleContactSeller}>
                        Contact Seller
                      </button>
                      {isOwner ? (
                        <button 
                          className="btn btnDangerGhost" 
                          style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--danger)', border: '1px solid var(--danger)' }}
                          onClick={handleDelete}
                          disabled={isDeleting}
                          title="Delete listing"
                        >
                          {isDeleting ? '⌛' : '🗑️'}
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="pageCard" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⭐</div>
                    <div className="sectionTitle" style={{ fontSize: 16 }}>No reviews yet</div>
                    <div className="sectionHint">Be the first to review this product</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pageCard" style={{ padding: 20, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 900 }}>{product.seller}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Seller</div>
              </div>
              <Link to={`/profile/${product.sellerId}`} className="btn btnPrimary" style={{ fontSize: 12, padding: '8px 16px' }}>Visit Store</Link>
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <div className="sectionHeader">
              <div>
                <div className="sectionTitle">More from {product.seller}</div>
                <div className="sectionHint">Other listings</div>
              </div>
            </div>

            <div className="grid">
              {otherItems.length === 0 ? (
                <div className="pageCard" style={{ textAlign: 'center', padding: '30px 20px', gridColumn: '1 / -1' }}>
                  <div className="sectionTitle">No information</div>
                  <div className="sectionHint">There are no other products to show on this page.</div>
                </div>
              ) : (
                otherItems.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
