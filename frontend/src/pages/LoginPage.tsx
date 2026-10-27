import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, KeyRound, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    // Foundation placeholder interaction
    setTimeout(() => {
      setIsSubmitting(false);
      setStatusMessage('Milestone 7 Foundation: Authentication form layout and validation verified against backend schema. Session login will be connected in Milestone 8.');
    }, 600);
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '480px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              color: 'var(--color-primary)',
            }}
          >
            <LogIn size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Student Sign In</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Access peer components, manage your listings, and borrow hardware
          </p>
        </div>

        {statusMessage && (
          <div
            role="status"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '0.85rem',
              color: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Institutional Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="e.g. e20001@eng.pdn.ac.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
            </div>
            <span className="form-hint">Enter your registered email address</span>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <KeyRound
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
            style={{ marginTop: '1.5rem' }}
          >
            {isSubmitting ? 'Validating...' : 'Sign In (Milestone 7 Preview)'}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--color-border)',
            textAlign: 'center',
            fontSize: '0.875rem',
          }}
        >
          <span style={{ color: 'var(--color-text-muted)' }}>Don't have an account? </span>
          <Link to="/register" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            Register as Student
          </Link>
        </div>

        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.75rem',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.775rem',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}
        >
          <ShieldCheck size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
          <span>
            Protected with Spring Security JWT. Direct peer contact is restricted to authenticated students with active reservations.
          </span>
        </div>
      </div>
    </div>
  );
};
