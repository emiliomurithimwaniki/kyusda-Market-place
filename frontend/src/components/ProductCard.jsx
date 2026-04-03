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
        border: '1px solid rgba(0,0,0,0.04)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        borderRadius: 24,
        overflow: 'hidden',
        background: '#fff',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="cardImg" style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
        {product?.featured && (
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 2,
            background: 'rgba(22, 163, 74, 0.9)', backdropFilter: 'blur(4px)',
            color: 'white', fontSize: 10, fontWeight: 900, padding: '4px 10px',
            borderRadius: 8, letterSpacing: 0.5, textTransform: 'uppercase'
          }}>Featured</div>
        )}
        <div style={{ width: '100%', height: '100%', background: 'var(--bg)' }}>
          {imgSrc ? (
            <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>
          )}
        </div>
      </div>
      <div className="cardBody" style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="cardTitle" style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
          {product?.title || 'Untitled'}
        </div>
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)' }}>
              {formatKES(isOfferValid ? product?.offer_price : product?.price)}
            </span>
            {isOfferValid && (
              <span style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'line-through' }}>
                {formatKES(product?.price)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>by {product?.seller || 'Unknown'}</div>
            <button className="btn btnGhost" style={{ padding: '6px 10px', borderRadius: 10, height: 32 }}>
              <span>💬</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
