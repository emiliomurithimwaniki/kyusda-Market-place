import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

export default function AddListing() {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catsError, setCatsError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: 'Juja',
    locationDetail: '',
    description: '',
    category: 'Phones',
    quantity: '1',
    deliveryType: 'pickup',
    paymentMethod: 'mpesa',
    isBoosted: false,
    imageUrls: []
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
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

    setIsUploading(true);
    const newImageUrls = [...formData.imageUrls];
    
    try {
      for (const file of files) {
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', 'kyusda_marketplace'); // User needs to set this up in Cloudinary

        const res = await fetch(`https://api.cloudinary.com/v1_1/dpxuzyvzv/image/upload`, {
          method: 'POST',
          body: data
        });
        
        const fileData = await res.json();
        if (fileData.secure_url) {
          newImageUrls.push(fileData.secure_url);
        }
      }
      setFormData({ ...formData, imageUrls: newImageUrls });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Please check your connection.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    const newImages = formData.imageUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, imageUrls: newImages });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.imageUrls.length === 0) {
      alert('Please add at least one image of the product.');
      return;
    }
    alert('No information');
  };

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
            {formData.imageUrls.length < 5 && (
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
                <div style={{ fontSize: 24 }}>{isUploading ? '⌛' : '📸'}</div>
                <div style={{ fontSize: 10, marginTop: 4, fontWeight: 700 }}>{isUploading ? 'Uploading...' : 'Add Photo'}</div>
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
            <select 
              className="input"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            >
              <option value="Nairobi">Nairobi</option>
              <option value="Juja">Juja</option>
              <option value="Kiambu">Kiambu</option>
              <option value="Nakuru">Nakuru</option>
              <option value="Main Campus">Main Campus</option>
              <option value="Student Center">Student Center</option>
              <option value="Gate A / B">Gate A / B</option>
            </select>
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

        <button type="submit" className="btn btnPrimary" style={{ height: 52, fontSize: 16, fontWeight: 800, marginTop: 10 }}>
          Publish Listing
        </button>
      </form>
    </div>
  );
}
