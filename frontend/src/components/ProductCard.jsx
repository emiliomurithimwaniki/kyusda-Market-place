import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { formatKES } from '../lib/format.js';

function msToParts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return { hh, mm, ss };
}

export default function ProductCard({ product, showOffer = false }) {
  const nav = useNavigate();
  const imgSrc = product?.image_url || product?.image || null;
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [isOfferValid, setIsOfferValid] = useState(false);

  useEffect(() => {
    if (!product?.offer_active || !product?.offer_end) {
      setIsOfferValid(false);
      return;
    }

    const endTime = new Date(product.offer_end).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const diff = endTime - now;
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
  }, [product?.offer_end, product?.offer_active]);

  const parts = isOfferValid ? msToParts(timeLeft) : null;

  const handleClick = (e) => {
    // If the click was on a link or button, don't navigate the whole card
    if (e.target.closest('a') || e.target.closest('button')) return;
    nav(`/product/${product?.id}`);
  };

  return (
    <div 
      className="card" 
      onClick={handleClick}
      style={{ 
        border: '1px solid rgba(0,0,0,0.06)', 
        boxShadow: '0 10px 30px rgba(17, 24, 39, 0.08)', 
        borderRadius: 18, 
        overflow: 'hidden', 
        background: 'rgba(255,255,255,0.95)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div className="cardImg" style={{ borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' }}>
        <div className="imgOverlay"></div>
        {product?.featured ? (
          <div
            className="badge"
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 1,
              background: '#16a34a',
              borderColor: '#16a34a',
              color: 'white',
              fontWeight: 900,
            }}
          >
            Featured
          </div>
        ) : null}
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product?.title || 'Product'}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.02)' }}
            loading="lazy"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.8 }}>
            <div style={{ fontSize: 32 }}>📦</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Preview</div>
          </div>
        )}
      </div>
      <div className="cardBody" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div className="cardTitle" style={{ fontSize: 15 }}>{product?.title || 'Untitled'}</div>
        </div>
        
        <div className="cardMeta" style={{ margin: '4px 0 12px' }}>
          {isOfferValid ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--danger)', textDecoration: 'line-through' }}>
                {formatKES(product?.price || 0)}
              </div>
              <div className="price" style={{ fontSize: 16, color: 'var(--primary)' }}>
                {formatKES(product?.offer_price || 0)}
              </div>
              {showOffer && (
                <div className="badge" style={{ padding: '4px 8px', fontSize: 10, borderColor: 'rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.08)' }}>
                  Offer ends in {parts.hh}:{parts.mm}:{parts.ss}
                </div>
              )}
            </div>
          ) : (
            <div className="price" style={{ fontSize: 16, color: 'var(--primary)' }}>{formatKES(product?.price || 0)}</div>
          )}
          {product?.seller ? (
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>by {product.seller}</div>
          ) : null}
        </div>

        <div className="btnRow">
          <Link className="btn btnPrimary" style={{ flex: 1, padding: '8px 0' }} to={`/product/${product?.id}`}>View Details</Link>
          <Link className="btn btnGhost" style={{ padding: '8px 12px' }} to={`/messages?to=${product?.sellerId}`}>
            <span style={{ fontSize: 16 }}>💬</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
