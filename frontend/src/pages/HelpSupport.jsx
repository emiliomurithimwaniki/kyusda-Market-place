import { Link } from 'react-router-dom';

export default function HelpSupport() {
  const supportEmail = 'support@kyusda.example';
  const supportPhone = '+254 700 000 000';

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Help & Support</h1>
        <Link to="/" className="btn btnGhost" style={{ whiteSpace: 'nowrap' }}>
          Back to app
        </Link>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 16, fontWeight: 900 }}>Contact</h2>
        <div style={{ display: 'grid', gap: 8, lineHeight: 1.6 }}>
          <div>
            <strong>Email:</strong> {supportEmail}
          </div>
          <div>
            <strong>Phone:</strong> {supportPhone}
          </div>
        </div>

        <div style={{ margin: '16px 0', height: 1, background: 'var(--border)' }}></div>

        <h2 style={{ fontSize: 16, fontWeight: 900 }}>Frequently asked questions</h2>

        <details style={{ padding: '10px 0' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 800 }}>How do I create an account?</summary>
          <div style={{ marginTop: 8, color: 'var(--muted)', lineHeight: 1.6 }}>
            Open the app, go to the Register page, and complete the form. You may need to verify your email address.
          </div>
        </details>

        <details style={{ padding: '10px 0' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 800 }}>How do I post an item for sale?</summary>
          <div style={{ marginTop: 8, color: 'var(--muted)', lineHeight: 1.6 }}>
            Tap Add Listing, fill in the item details, add photos, and publish.
          </div>
        </details>

        <details style={{ padding: '10px 0' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 800 }}>How do I contact a seller/buyer?</summary>
          <div style={{ marginTop: 8, color: 'var(--muted)', lineHeight: 1.6 }}>
            Open the product or order and start a chat. You can also access conversations from Messages.
          </div>
        </details>

        <details style={{ padding: '10px 0' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 800 }}>Payments and transaction status</summary>
          <div style={{ marginTop: 8, color: 'var(--muted)', lineHeight: 1.6 }}>
            After payment, check Transaction Status in the app. If you see an issue, contact support with any reference
            code shown.
          </div>
        </details>

        <details style={{ padding: '10px 0' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 800 }}>How do I delete my account?</summary>
          <div style={{ marginTop: 8, color: 'var(--muted)', lineHeight: 1.6 }}>
            Contact support and request account deletion. We may ask you to confirm ownership of the account.
          </div>
        </details>

        <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
          Tip: You can also review our <Link to="/privacy">Privacy Policy</Link>.
        </div>
      </div>
    </div>
  );
}
