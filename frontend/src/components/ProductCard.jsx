import { Link } from 'react-router-dom';
import { formatKES } from '../lib/format.js';

export default function ProductCard({ product }) {
  return (
    <div className="card">
      <div className="cardImg">
        <div className="imgOverlay"></div>
        {product?.featured ? (
          <div className="badge" style={{ position: 'absolute', top: 12, left: 12, zindex: 1 }}>
            Featured
          </div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.8 }}>
          <div style={{ fontSize: 32 }}>📦</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Preview</div>
        </div>
      </div>
      <div className="cardBody">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div className="cardTitle" style={{ fontSize: 15 }}>{product?.title || 'Untitled'}</div>
        </div>
        
        <div className="cardMeta" style={{ margin: '4px 0 12px' }}>
          <div className="price" style={{ fontSize: 16, color: 'var(--primary)' }}>{formatKES(product?.price || 0)}</div>
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
