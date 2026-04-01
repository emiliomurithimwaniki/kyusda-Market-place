import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function AddListing() {
  const nav = useNavigate();
  const fileInputRef = useRef(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catsError, setCatsError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: 'Juja',
    locationDetail: '',
    description: '',
    category: '',
    quantity: '1',
    deliveryType: 'pickup',
    paymentMethod: 'mpesa',
    isBoosted: false,
    imageUrls: []
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Check if logged in
      try {
        const token = localStorage.getItem('kyusda_access_token');
        if (!token) {
          nav('/login?redirect=/add');
          return;
        }
        await api.me();
      } catch (err) {
        nav('/login?redirect=/add');
        return;
      } finally {
        if (mounted) setCheckingAuth(false);
      }

      setLoadingCats(true);
      setCatsError(null);
      try {
        const res = await api.getCategories();
        if (mounted) setCategories(res?.data || []);
      } catch {
        if (mounted) {
          setCatsError('Unable to load data. Please check your internet connection and try again.');
          setCategories([]);
        }
      } finally {
        if (mounted) setLoadingCats(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    e.target.value = '';

    const maxPhotos = 5;
    const remainingSlots = Math.max(0, maxPhotos - formData.imageUrls.length);
    const acceptedFiles = files.slice(0, remainingSlots);
    if (acceptedFiles.length === 0) return;

    const placeholders = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading'
    }));

    setUploadQueue((prev) => [...prev, ...placeholders]);

    setIsUploading(true);
    const newImageUrls = [...formData.imageUrls];
    
    try {
      for (const p of placeholders) {
        const file = p.file;
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', 'edutrack_unsigned');

        const res = await fetch(`https://api.cloudinary.com/v1_1/dfjntwelp/image/upload`, {
          method: 'POST',
          body: data
        });
        
        const fileData = await res.json();
        if (fileData.secure_url) {
          newImageUrls.push(fileData.secure_url);
        }

        setUploadQueue((prev) => prev.filter((x) => x.id !== p.id));
        try { URL.revokeObjectURL(p.previewUrl); } catch {}
      }
      setFormData({ ...formData, imageUrls: newImageUrls });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Please check your connection.');
      setUploadQueue((prev) => {
        prev.forEach((p) => {
          try { URL.revokeObjectURL(p.previewUrl); } catch {}
        });
        return [];
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = formData.imageUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, imageUrls: newImages });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.imageUrls.length === 0) {
      alert('Please add at least one image of the product.');
      return;
    }
    if (isUploading || uploadQueue.length > 0) {
      alert('Please wait for images to finish uploading.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        price: formData.price,
        description: formData.description,
        category: formData.category,
        location: `${formData.location}${formData.locationDetail ? ', ' + formData.locationDetail : ''}`,
        image_url: formData.imageUrls[0],
        isBoosted: formData.isBoosted
      };

      const { data } = await api.createProduct(payload);
      nav('/status', { 
        state: { 
          success: true, 
          message: 'Your item has been listed successfully and is now visible to the campus community.',
          type: 'listing',
          data: { title: formData.title, id: data.id }
        } 
      });
    } catch (err) {
      nav('/status', { 
        state: { 
          success: false, 
          message: err.response?.data?.detail || 'We encountered an error while publishing your listing. Please check your connection and try again.',
          type: 'listing',
          data: { title: formData.title }
        } 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="pageCard" style={{ textAlign: 'center', padding: '100px 20px', animation: 'fadeIn 0.5s ease' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div className="sectionTitle">Checking access...</div>
        <div className="sectionHint">Please wait while we verify your account.</div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: 600, margin: '0 auto' }}>
      <div className="sectionHeader" style={{ marginTop: 0 }}>
        <div>
          <div className="sectionTitle">Add New Listing</div>
          <div className="sectionHint">Sell fast to the campus community</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="pageCard" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Image Upload Section */}
        <div className="field">
          <div className="label">Product Photos</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12, marginTop: 8 }}>
            {formData.imageUrls.map((url, index) => (
              <div key={index} style={{ position: 'relative', height: 100, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={url} alt={`Upload ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  type="button" 
                  onClick={() => removeImage(index)}
                  style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>
            ))}
            {uploadQueue.map((p) => (
              <div key={p.id} style={{ position: 'relative', height: 100, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={p.previewUrl} alt="Uploading" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(2px)', transform: 'scale(1.03)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <div style={{ fontSize: 18, color: 'white' }}>⌛</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'white', letterSpacing: 0.2 }}>Uploading...</div>
                </div>
              </div>
            ))}
            {formData.imageUrls.length + uploadQueue.length < 5 && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  height: 100, 
                  borderRadius: 12, 
                  border: '2px dashed var(--border)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  background: 'rgba(0,0,0,0.01)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ fontSize: 24 }}>📸</div>
                <div style={{ fontSize: 10, marginTop: 4, fontWeight: 700 }}>Add Photo</div>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            multiple 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>Add up to 5 clear photos of your product. First photo is the main one.</div>
        </div>

        {/* Basic Info */}
        <div className="field">
          <div className="label">Product Title</div>
          <input 
            className="input" 
            placeholder="e.g. iPhone 13 Pro, Brand new" 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
          <div className="field">
            <div className="label">Price (KSh)</div>
            <input 
              className="input" 
              type="number" 
              placeholder="KSh" 
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
          </div>
          <div className="field">
            <div className="label">Quantity</div>
            <input 
              className="input" 
              type="number" 
              min="1"
              style={{ width: '100%' }}
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="field">
          <div className="label">Location Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input 
              className="input" 
              placeholder="Location (e.g. Juja, Nairobi, Main Campus)" 
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
            <input 
              className="input" 
              placeholder="Specific spot (e.g. Near Hostel 3, Room 12)" 
              value={formData.locationDetail || ''}
              onChange={(e) => setFormData({...formData, locationDetail: e.target.value})}
            />
          </div>
        </div>

        <div className="field">
          <div className="label">Category</div>
          <select 
            className="input"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="">No category</option>
            {loadingCats ? null : catsError ? null : categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          {loadingCats ? null : catsError ? (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{catsError}</div>
          ) : categories.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>No information</div>
          ) : null}
        </div>

        {/* Delivery & Payment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field">
            <div className="label">Delivery Type</div>
            <select 
              className="input"
              value={formData.deliveryType}
              onChange={(e) => setFormData({...formData, deliveryType: e.target.value})}
            >
              <option value="pickup">Self Pickup</option>
              <option value="delivery">Campus Delivery</option>
              <option value="meetup">Meetup at Hub</option>
            </select>
          </div>
          <div className="field">
            <div className="label">Payment Accepted</div>
            <select 
              className="input"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
            >
              <option value="mpesa">M-Pesa Only</option>
              <option value="cash">Cash on Delivery</option>
              <option value="both">M-Pesa & Cash</option>
            </select>
          </div>
        </div>

        <div className="field">
          <div className="label">Description</div>
          <textarea 
            className="input" 
            style={{ minHeight: 120, paddingTop: 12, resize: 'vertical' }}
            placeholder="Describe condition, features, delivery details, etc."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
        </div>

        {/* Boost Feature */}
        <div style={{ 
          marginTop: 8, 
          padding: 16, 
          borderRadius: 16, 
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(124, 58, 237, 0.08))',
          border: '1px solid rgba(79, 70, 229, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🚀</span> Boost this listing
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              Appear at the top of search results and sell 3x faster. Only KSh 50/day.
            </div>
          </div>
          <button 
            type="button"
            className={`btn ${formData.isBoosted ? 'btnPrimary' : 'btnGhost'}`}
            style={{ fontSize: 12, padding: '8px 16px', background: formData.isBoosted ? '' : 'white' }}
            onClick={() => setFormData({...formData, isBoosted: !formData.isBoosted})}
          >
            {formData.isBoosted ? 'Boosted!' : 'Boost Now'}
          </button>
        </div>

        <button type="submit" className="btn btnPrimary" style={{ height: 52, fontSize: 16, fontWeight: 800, marginTop: 10 }} disabled={isSubmitting || isUploading}>
          {isSubmitting ? 'Publishing...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
}
