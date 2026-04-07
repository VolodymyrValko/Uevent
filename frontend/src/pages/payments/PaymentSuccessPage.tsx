
import React from 'react';
import { Link } from 'react-router-dom';

const PaymentSuccessPage: React.FC = () => (
  <div style={{ padding: '80px 0', textAlign: 'center' }}>
    <div className="container" style={{ maxWidth: 480 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>
        Payment successful!
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>
        Your ticket has been confirmed and a confirmation email is on its way.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/profile/tickets" className="btn btn--primary">View my tickets</Link>
        <Link to="/events" className="btn btn--secondary">Explore more events</Link>
      </div>
    </div>
  </div>
);

export default PaymentSuccessPage;
