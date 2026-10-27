import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home, ShoppingBag } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center', maxWidth: '540px' }}>
      <div className="card" style={{ padding: '3rem 2rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
          }}
        >
          <HelpCircle size={32} />
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--color-primary)' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.75rem 0' }}>
          Component or Page Not Found
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 2rem 0' }}>
          The component listing, route, or resource you are looking for has been moved, completed, or does not exist on the CoreHub peer network.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Home size={16} />
            <span>Return Home</span>
          </Link>
          <Link to="/marketplace" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={16} />
            <span>Explore Marketplace</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
