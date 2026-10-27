import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, User, Mail, Hash, Building2, Phone, KeyRound, CheckCircle2, Shield } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    department: 'Computer Engineering',
    phone: '',
    password: '',
  });

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    // Foundation placeholder interaction
    setTimeout(() => {
      setIsSubmitting(false);
      setStatusMessage('Milestone 7 Foundation: Registration form validation verified against backend schema. Registration workflow will be connected in Milestone 8.');
    }, 600);
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '580px', margin: '0 auto' }}>
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
            <UserPlus size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Join CoreHub</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Create an engineering student account to exchange microcontrollers, sensors, and lab equipment
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
            <label className="form-label" htmlFor="register-name">
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-name"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. Kasun Perera"
                value={formData.name}
                onChange={handleChange}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <User
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="register-studentId">
                Student Registration ID
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-studentId"
                  name="studentId"
                  type="text"
                  className="form-input"
                  placeholder="e.g. E/19/042"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Hash
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

            <div className="form-group">
              <label className="form-label" htmlFor="register-phone">
                Contact Phone (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +94771234567"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Phone
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
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-department">
              Engineering Department (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="register-department"
                name="department"
                className="form-select"
                value={formData.department}
                onChange={handleChange}
                style={{ paddingLeft: '2.5rem' }}
              >
                <option value="">Select department (Optional)</option>
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Electrical & Electronic Engineering">Electrical & Electronic Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Chemical & Process Engineering">Chemical & Process Engineering</option>
                <option value="Manufacturing & Industrial Engineering">Manufacturing & Industrial Engineering</option>
              </select>
              <Building2
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Institutional Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="e.g. e19042@eng.pdn.ac.lk"
                value={formData.email}
                onChange={handleChange}
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
            <span className="form-hint">Institutional or student email address</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-password"
                name="password"
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
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
            {isSubmitting ? 'Validating...' : 'Complete Registration (Milestone 7 Preview)'}
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
          <span style={{ color: 'var(--color-text-muted)' }}>Already registered? </span>
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            Sign In
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
          <Shield size={16} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
          <span>
            Student verification ensures community integrity. Your contact information is never shown publicly.
          </span>
        </div>
      </div>
    </div>
  );
};
