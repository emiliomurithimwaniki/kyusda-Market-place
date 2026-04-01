import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function EditProduct() {
  const { id } = useParams();
  const nav = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);

  const [form, setForm] = useState({
    title: '',
    price: '',
    description: '',
    category: '',
    location: '',
    stock: 1,
    imageUrls: [],
    isBoosted: false,
    offerPrice: '',
    offerActive: false,
    offerEndsAt: null,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getProduct(id);
        const p = res?.data;
        if (!p) throw new Error('No product');

        const main = p.image_url || p.image || null;
        const photos = Array.isArray(p.photos) ? p.photos : [];
        const merged = [main, ...photos].filter(Boolean);

        if (alive) {
          setForm({
            title: p.title || '',
            price: p.price ?? '',
            description: p.description || '',
            category: p.category_name || p.category || '',
            location: p.location || '',
            stock: Number.isFinite(Number(p.stock)) ? Number(p.stock) : 1,
            imageUrls: merged,
            isBoosted: !!p.featured,
            offerPrice: p.offer_price ?? '',
            offerActive: !!p.offer_active,
            offerEndsAt: p.offer_end || null,
          });
        }
      } catch {
        if (alive) setError('Unable to load product. Please check your internet connection and try again.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    e.target.value = '';

    const maxPhotos = 8;
    const remainingSlots = Math.max(0, maxPhotos - form.imageUrls.length);
    const acceptedFiles = files.slice(0, remainingSlots);
    if (acceptedFiles.length === 0) return;

    const placeholders = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setUploadQueue((prev) => [...prev, ...placeholders]);
    setUploading(true);

    const newUrls = [...form.imageUrls];
    try {
      for (const p of placeholders) {
        const data = new FormData();
        data.append('file', p.file);
        data.append('upload_preset', 'edutrack_unsigned');

        const res = await fetch('https://api.cloudinary.com/v1_1/dfjntwelp/image/upload', {
          method: 'POST',
          body: data,
        });

        const fileData = await res.json();
        if (fileData.secure_url) newUrls.push(fileData.secure_url);

        setUploadQueue((prev) => prev.filter((x) => x.id !== p.id));
        try { URL.revokeObjectURL(p.previewUrl); } catch {}
      }

      setForm((prev) => ({ ...prev, imageUrls: newUrls }));
    } catch {
      alert('Image upload failed. Please check your connection.');
      setUploadQueue((prev) => {
        prev.forEach((p) => {
          try { URL.revokeObjectURL(p.previewUrl); } catch {}
        });
        return [];
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
  };

  const startOffer = async () => {
    if (uploading || uploadQueue.length > 0) {
      alert('Please wait for images to finish uploading.');
      return;
    }
    setSaving(true);
    try {
      await api.updateProduct(id, {
        offer_action: 'start',
        offer_price: form.offerPrice,
      });
      const res = await api.getProduct(id);
      const p = res?.data;
      setForm((prev) => ({
        ...prev,
        offerActive: !!p?.offer_active,
        offerEndsAt: p?.offer_end || null,
      }));
      alert('Offer started. It will appear under Flash Sale.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to start offer');
    } finally {
      setSaving(false);
    }
  };

  const cancelOffer = async () => {
    setSaving(true);
    try {
      await api.updateProduct(id, { offer_action: 'cancel' });
      setForm((prev) => ({ ...prev, offerActive: false, offerEndsAt: null }));
      alert('Offer cancelled.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel offer');
    } finally {
      setSaving(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (uploading || uploadQueue.length > 0) {
      alert('Please wait for images to finish uploading.');
      return;
    }

    setSaving(true);
    try {
      const [main, ...rest] = form.imageUrls;
      const payload = {
        title: form.title,
        price: form.price,
        description: form.description,
        category: form.category,
        location: form.location,
        stock: Number(form.stock) || 0,
        image_url: main || null,
        photos: rest,
        isBoosted: form.isBoosted,
      };

      await api.updateProduct(id, payload);
      nav(`/product/${id}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pageCard" style={{ animation: 'fadeIn 0.5s ease' }}>
        <div className="sectionTitle">Edit Listing</div>
        <div className="sectionHint">Loading product...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px', animation: 'fadeIn 0.5s ease' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
        <div className="sectionTitle">Network Error</div>
        <div className="sectionHint">{error}</div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: 600, width: '100%', margin: '0 auto', padding: '0 16px 40px', boxSizing: 'border-box' }}>
      <div className="sectionHeader" style={{ marginTop: 20, marginBottom: 24 }}>
        <div>
          <div className="sectionTitle" style={{ fontSize: 24, fontWeight: 900 }}>Edit Listing</div>
          <div className="sectionHint" style={{ fontSize: 14 }}>Update details, stock, and photos</div>
        </div>
      </div>

      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Photo Upload Section */}
        <div className="pageCard" style={{ padding: 20, borderRadius: 24, border: '1px solid var(--border)' }}>
          <div className="label" style={{ marginBottom: 12, fontSize: 15, fontWeight: 800 }}>Photos</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
            {form.imageUrls.map((url, index) => (
              <div key={`${url}-${index}`} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={url} alt={`Photo ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                >
                  ✕
                </button>
                {index === 0 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(var(--primary-rgb), 0.85)', color: 'white', fontSize: 9, fontWeight: 900, textAlign: 'center', padding: '4px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>Main</div>
                )}
              </div>
            ))}
            {uploadQueue.map((p) => (
              <div key={p.id} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={p.previewUrl} alt="Uploading" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(2px)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <div style={{ fontSize: 16 }}>⌛</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'white' }}>Uploading</div>
                </div>
              </div>
            ))}
            {form.imageUrls.length + uploadQueue.length < 8 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  aspectRatio: '1/1',
                  borderRadius: 16,
                  border: '2px dashed var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  background: 'rgba(0,0,0,0.02)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 24 }}>📸</div>
                <div style={{ fontSize: 10, marginTop: 4, fontWeight: 700 }}>Add Photo</div>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, opacity: 0.8 }}>Up to 8 photos. Drag to reorder coming soon.</div>
        </div>

        {/* Basic Info Section */}
        <div className="pageCard" style={{ padding: 24, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 20, border: '1px solid var(--border)' }}>
          <div className="field">
            <div className="label" style={{ fontSize: 14, fontWeight: 800 }}>Title</div>
            <input className="input" style={{ borderRadius: 14, height: 50, width: '100%', minWidth: 0, boxSizing: 'border-box' }} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required placeholder="What are you selling?" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, minWidth: 0 }}>
              <div className="field" style={{ margin: 0, minWidth: 0 }}>
                <div className="label" style={{ fontSize: 13, fontWeight: 800 }}>Price (KSh)</div>
                <input className="input" style={{ borderRadius: 14, height: 50, width: '100%', minWidth: 0, boxSizing: 'border-box' }} type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required />
              </div>
              <div className="field" style={{ margin: 0, minWidth: 0 }}>
                <div className="label" style={{ fontSize: 13, fontWeight: 800 }}>Stock</div>
                <input className="input" style={{ borderRadius: 14, height: 50, width: '100%', minWidth: 0, boxSizing: 'border-box' }} type="number" min="0" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} required />
              </div>
            </div>

          <div className="field">
            <div className="label" style={{ fontSize: 14, fontWeight: 800 }}>Location</div>
            <input className="input" style={{ borderRadius: 14, height: 50, width: '100%', minWidth: 0, boxSizing: 'border-box' }} value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="e.g. Juja, Nairobi" />
          </div>

          <div className="field">
            <div className="label" style={{ fontSize: 14, fontWeight: 800 }}>Category</div>
            <input className="input" style={{ borderRadius: 14, height: 50, width: '100%', minWidth: 0, boxSizing: 'border-box' }} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Electronics" />
          </div>

          <div className="field">
            <div className="label" style={{ fontSize: 14, fontWeight: 800 }}>Description</div>
            <textarea className="input" style={{ minHeight: 120, paddingTop: 14, borderRadius: 14, resize: 'none', width: '100%', minWidth: 0, boxSizing: 'border-box' }} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required placeholder="Describe your product in detail..." />
          </div>
        </div>

        {/* Flash Sale Section */}
        <div className="pageCard" style={{ padding: 20, borderRadius: 24, border: '1px dashed var(--primary)', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.03), rgba(124, 58, 237, 0.03))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚡</span> Flash Sale Offer
            </div>
            {form.offerActive && (
              <div className="badge" style={{ background: 'var(--primary)', color: 'white', border: 'none', fontSize: 10, fontWeight: 900 }}>ACTIVE</div>
            )}
          </div>
          
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 16 }}>
            Boost your sales! Run a 2-hour discount session between 8:00 AM and midnight.
          </p>

          <div className="field" style={{ margin: 0 }}>
            <div className="label" style={{ fontSize: 13, fontWeight: 800 }}>Offer Price (KSh)</div>
            <input
              className="input"
              style={{ borderRadius: 14, height: 48, background: 'white', width: '100%', boxSizing: 'border-box' }}
              type="number"
              value={form.offerPrice}
              onChange={(e) => setForm((p) => ({ ...p, offerPrice: e.target.value }))}
              placeholder="Discounted price"
              disabled={form.offerActive}
            />
          </div>
            
            {form.offerActive && form.offerEndsAt && (
              <div style={{ padding: '12px 16px', borderRadius: 14, background: 'white', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Offer ends at:</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
                  {new Date(form.offerEndsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            {!form.offerActive ? (
              <button type="button" className="btn btnPrimary" style={{ width: '100%', height: 48, borderRadius: 14, fontWeight: 800 }} onClick={startOffer} disabled={saving}>
                Start Flash Sale
              </button>
            ) : (
              <button type="button" className="btn btnDangerGhost" style={{ width: '100%', height: 48, borderRadius: 14, border: '1px solid var(--danger)', fontWeight: 800 }} onClick={cancelOffer} disabled={saving}>
                End Offer Early
              </button>
            )}
          </div>
        </div>

        <button type="submit" className="btn btnPrimary" style={{ height: 56, fontSize: 16, fontWeight: 900, borderRadius: 16, boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)', marginTop: 8 }} disabled={saving || uploading}>
          {saving ? '⌛ Saving Changes...' : 'Save All Changes'}
        </button>
      </form>
    </div>
  );
}
