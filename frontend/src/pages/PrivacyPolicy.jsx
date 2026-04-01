import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  const effectiveDate = '2026-04-02';
  const contactEmail = 'support@kyusda.example';

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Privacy Policy</h1>
        <Link to="/" className="btn btnGhost" style={{ whiteSpace: 'nowrap' }}>
          Back to app
        </Link>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
          Effective date: <strong>{effectiveDate}</strong>
        </div>

        <h2 style={{ marginTop: 0, fontSize: 16, fontWeight: 900 }}>1. Overview</h2>
        <p style={{ marginTop: 6, lineHeight: 1.6 }}>
          This Privacy Policy explains how KYUSDA MarketPlace ("the App") collects, uses, and protects your information
          when you use our services.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 900 }}>2. Information we collect</h2>
        <ul style={{ marginTop: 6, lineHeight: 1.8 }}>
          <li>Account information (e.g. name, email address, phone number).</li>
          <li>Content you provide (e.g. product listings, messages/chats, profile details).</li>
          <li>Transaction-related information (e.g. order details and payment status identifiers).</li>
          <li>Device and usage information (e.g. app interactions, basic device identifiers, IP address).</li>
        </ul>

        <h2 style={{ fontSize: 16, fontWeight: 900 }}>3. How we use your information</h2>
        <ul style={{ marginTop: 6, lineHeight: 1.8 }}>
          <li>To create and manage accounts and authenticate users.</li>
          <li>To enable marketplace features like listings, browsing, orders, chat, and notifications.</li>
          <li>To prevent fraud, abuse, and improve security.</li>
          <li>To improve and maintain the App.</li>
        </ul>

        <h2 style={{ fontSize: 16, fontWeight: 900 }}>4. Sharing of information</h2>
        <p style={{ marginTop: 6, lineHeight: 1.6 }}>
          We do not sell your personal information. We may share information with service providers only as needed to
          operate the App (for example, payment processing or hosting), or when required by law.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 900 }}>5. Data retention</h2>
        <p style={{ marginTop: 6, lineHeight: 1.6 }}>
          We retain information for as long as necessary to provide the App and comply with legal obligations. You may
          request deletion of your account and associated data.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 900 }}>6. Your choices</h2>
        <ul style={{ marginTop: 6, lineHeight: 1.8 }}>
          <li>You can update profile information in the App.</li>
          <li>You can request account deletion by contacting us.</li>
        </ul>

        <h2 style={{ fontSize: 16, fontWeight: 900 }}>7. Security</h2>
        <p style={{ marginTop: 6, lineHeight: 1.6 }}>
          We use reasonable safeguards designed to protect your information. No method of transmission or storage is
          100% secure.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 900 }}>8. Contact</h2>
        <p style={{ marginTop: 6, marginBottom: 0, lineHeight: 1.6 }}>
          For questions or requests, contact us at: <strong>{contactEmail}</strong>
        </p>
      </div>
    </div>
  );
}
