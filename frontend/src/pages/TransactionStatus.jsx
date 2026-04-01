import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft, Share2, Home } from 'lucide-react';

export default function TransactionStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const { success, message, type, data } = location.state || { 
    success: false, 
    message: 'No transaction data found',
    type: 'error'
  };

  const timestamp = new Date().toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const transactionId = Math.random().toString(36).toUpperCase().substring(2, 12);

  return (
    <div className="statusPageContainer" style={{
      padding: '20px',
      maxWidth: '500px',
      margin: '0 auto',
      animation: 'fadeIn 0.5s ease',
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div className="statusCard" style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px 24px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Success/Error Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          color: success ? '#22c55e' : '#ef4444'
        }}>
          {success ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: '800',
          marginBottom: '8px',
          color: 'var(--text)'
        }}>
          {success ? 'Listing Published!' : 'Publishing Failed'}
        </h1>
        
        <p style={{
          color: 'var(--muted)',
          fontSize: '15px',
          lineHeight: '1.5',
          marginBottom: '32px'
        }}>
          {message}
        </p>

        {/* Transaction Details Table */}
        <div style={{
          background: 'rgba(0,0,0,0.02)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'left',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Transaction ID</span>
            <span style={{ fontWeight: '700', fontSize: '13px', fontFamily: 'monospace' }}>#{transactionId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Date & Time</span>
            <span style={{ fontWeight: '600', fontSize: '13px' }}>{timestamp}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Type</span>
            <span style={{ fontWeight: '600', fontSize: '13px' }}>{type === 'listing' ? 'Product Listing' : 'System Action'}</span>
          </div>
          {data?.title && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: '12px' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Item</span>
              <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--primary)' }}>{data.title}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {success ? (
            <>
              <button 
                className="btn btnPrimary" 
                onClick={() => navigate('/')}
                style={{ width: '100%', height: '52px', gap: '8px' }}
              >
                <Home size={18} /> Back to Home
              </button>
              <button 
                className="btn btnGhost" 
                style={{ width: '100%', height: '52px', border: '1px solid var(--border)', gap: '8px' }}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: data.title,
                      text: `Check out my new listing on KYUSDA Marketplace: ${data.title}`,
                      url: window.location.origin + '/product/' + data.id
                    });
                  }
                }}
              >
                <Share2 size={18} /> Share Listing
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btnPrimary" 
                onClick={() => navigate('/add')}
                style={{ width: '100%', height: '52px', gap: '8px' }}
              >
                <ArrowLeft size={18} /> Try Again
              </button>
              <button 
                className="btn btnGhost" 
                onClick={() => navigate('/')}
                style={{ width: '100%', height: '52px', border: '1px solid var(--border)' }}
              >
                Go to Home
              </button>
            </>
          )}
        </div>
      </div>

      {/* Decorative Receipt Bottom */}
      <div style={{
        width: '90%',
        height: '10px',
        background: 'white',
        margin: '-5px auto 0',
        borderRadius: '0 0 10px 10px',
        boxShadow: '0 10px 20px rgba(0,0,0,0.03)',
        backgroundImage: 'linear-gradient(135deg, transparent 75%, rgba(0,0,0,0.02) 75%), linear-gradient(225deg, transparent 75%, rgba(0,0,0,0.02) 75%)',
        backgroundSize: '10px 10px'
      }}></div>
    </div>
  );
}
