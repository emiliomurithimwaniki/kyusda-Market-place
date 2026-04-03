import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';

export default function Chat() {
  const { id } = useParams();
  const location = useLocation();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [seller, setSeller] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const preMessageSentRef = useRef(false);

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        // 1. Get or create conversation with this seller
        const convRes = await api.getOrCreateConversation(id);
        if (mounted) setConversation(convRes?.data);

        // 2. Load seller info for header
        const res = await api.getSeller(id);
        if (mounted) setSeller(res?.data);
        const sellerName = res?.data?.name || '';

        // 3. Optional product context
        const params = new URLSearchParams(location.search);
        const productId = params.get('product');
        let prod = null;
        if (productId) {
          const prodRes = await api.getProduct(productId);
          prod = prodRes?.data || null;
          if (mounted) setProduct(prod);
        } else {
          if (mounted) setProduct(null);
        }

        // 4. Load existing messages
        let existingMessages = [];
        if (convRes?.data?.id) {
          const msgsRes = await api.getMessages(convRes.data.id);
          existingMessages = Array.isArray(msgsRes?.data?.results)
            ? msgsRes.data.results
            : (Array.isArray(msgsRes?.data) ? msgsRes.data : []);
          if (mounted) setMessages(existingMessages);
        }

        // 5. Auto-send pre-message ONCE (persisted) when opening chat from a product
        if (
          convRes?.data?.id &&
          productId &&
          prod &&
          !preMessageSentRef.current &&
          existingMessages.length === 0
        ) {
          preMessageSentRef.current = true;
          try {
            const productTitle = String(prod?.title || '').trim();
            const preBody = `Hello im interested in this product ${productTitle || ''}`.trim();
            const sendRes = await api.sendMessage(convRes.data.id, {
              body: preBody,
              product: Number(productId),
            });
            if (mounted) setMessages((m) => [...m, sendRes.data]);
          } catch (err) {
            preMessageSentRef.current = false;
          }
        }
      } catch (err) {
        console.error('Failed to load chat data', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id, location.search]);

  async function send() {
    const body = text.trim();
    if (!body || isSending || !conversation?.id) return;
    setIsSending(true);
    try {
      const payload = { body };
      if (product?.id) payload.product = Number(product.id);
      const res = await api.sendMessage(conversation.id, payload);
      setMessages((m) => [...m, res.data]);
      setText('');
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', height: 'calc(100svh - 140px)', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <div className="pageCard" style={{ padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        {loading ? (
          <>
            <Skeleton width={40} height={40} radius={12} />
            <div style={{ flex: 1 }}>
              <Skeleton width={160} height={12} radius={10} style={{ marginBottom: 8 }} />
              <Skeleton width={90} height={10} radius={10} />
            </div>
          </>
        ) : (
          <>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'white', fontWeight: 900 }}>
              {seller?.name ? seller.name.charAt(0).toUpperCase() : '👤'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{seller?.name || 'Chat'}</div>
              {seller?.role && <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>{seller.role}</div>}
            </div>
          </>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="iconBtn" style={{ width: 36, height: 36 }}>📞</button>
          <button className="iconBtn" style={{ width: 36, height: 36 }}>⋮</button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chatMessages" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        {loading ? (
          <>
            <div className="pageCard" style={{ padding: 16, borderRadius: 20 }}>
              <Skeleton width={120} height={10} radius={10} style={{ marginBottom: 10 }} />
              <Skeleton width="100%" height={12} radius={10} style={{ marginBottom: 8 }} />
              <Skeleton width="85%" height={12} radius={10} />
            </div>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} style={{ alignSelf: idx % 2 === 0 ? 'flex-start' : 'flex-end', width: 'min(80%, 420px)' }}>
                <Skeleton height={42} radius={16} />
              </div>
            ))}
          </>
        ) : null}

        {product && (
          <div className="pageCard" style={{ padding: 16, marginBottom: 12, border: '1px solid var(--primary-light)', background: 'linear-gradient(to bottom, #fff, var(--primary-light-alpha))', borderRadius: 20 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                <img src={product.image_url || product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 800, marginBottom: 2 }}>Interested in</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)' }}>{product.title}</div>
                <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 700 }}>{product.price && `KSh ${Number(product.price).toLocaleString()}`}</div>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((m) => {
          const msgProductImage = m.product_image_url || m.product_image || '';
          const hasProduct = Boolean(m.product_id || m.product) && (m.product_title || m.product_price || msgProductImage);

          return (
            <div 
              key={m.id} 
              style={{ 
                alignSelf: m.is_mine ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: m.is_mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.is_mine ? 'var(--primary)' : 'white',
                color: m.is_mine ? 'white' : 'var(--text)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: m.is_mine ? 'none' : '1px solid var(--border)',
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.5
              }}
            >
              {hasProduct ? (
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 14,
                    background: m.is_mine ? 'rgba(255,255,255,0.14)' : 'rgba(17,24,39,0.04)',
                    border: m.is_mine ? '1px solid rgba(255,255,255,0.22)' : '1px solid var(--border)',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ width: 54, height: 54, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(0,0,0,0.06)' }}>
                    {msgProductImage ? (
                      <img src={msgProductImage} alt={m.product_title || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.product_title || 'Product'}
                    </div>
                    <div style={{ fontWeight: 800, opacity: 0.9, marginTop: 2 }}>
                      {m.product_price ? `KSh ${Number(m.product_price).toLocaleString()}` : ''}
                    </div>
                  </div>
                </div>
              ) : null}

              {m.body}
              <div style={{ fontSize: 9, marginTop: 4, textAlign: 'right', opacity: 0.7 }}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
        
        {messages.length === 0 && !product && !loading ? (
          <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
            <div className="sectionTitle">No information</div>
            <div className="sectionHint">There are no messages to show on this page.</div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="chatInputRow" style={{ padding: '16px 0' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            className="input"
            style={{ width: '100%', height: 50, paddingLeft: 44, paddingRight: 44, borderRadius: 25, border: '1px solid var(--border)', background: 'white' }}
            placeholder="Write your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <div style={{ position: 'absolute', left: 14, top: 14, fontSize: 18, cursor: 'pointer' }}>📎</div>
          <div style={{ position: 'absolute', right: 14, top: 14, fontSize: 18, cursor: 'pointer' }}>😊</div>
        </div>
        <button className="btn btnPrimary" style={{ width: 50, height: 50, borderRadius: '50%', padding: 0 }} onClick={send} disabled={isSending}>
          {isSending ? '⌛' : '🚀'}
        </button>
      </div>
    </div>
  );
}
