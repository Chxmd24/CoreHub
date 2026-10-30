import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  User,
  Mail,
  Hash,
  Building2,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserResponse, SUPPORTED_DEPARTMENTS, SupportedDepartment } from '../api/types';
import { ApiError } from '../api/client';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    department: '',
    phone: '',
    password: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [registeredUser, setRegisteredUser] = useState<UserResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error as user edits
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Name must not exceed 100 characters';
    }

    const studentIdTrimmed = formData.studentId.trim();
    if (!studentIdTrimmed) {
      errors.studentId = 'Student ID is required';
    } else if (!/^EG\/[0-9]{4}\/[0-9]{4}$/i.test(studentIdTrimmed)) {
      errors.studentId = 'Student ID must be in the format EG/XXXX/XXXX';
    }

    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      errors.email = 'Email is required';
    } else if (!/^eg[0-9]{6}@engug\.ruh\.ac\.lk$/i.test(emailTrimmed)) {
      errors.email = 'Email must be a valid faculty email (e.g. egXXXXXX@engug.ruh.ac.lk)';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    const phoneTrimmed = formData.phone.trim();
    if (!phoneTrimmed) {
      errors.phone = 'Contact phone number is required';
    } else if (phoneTrimmed.length > 20) {
      errors.phone = 'Phone must not exceed 20 characters';
    }

    const deptTrimmed = formData.department.trim();
    if (!deptTrimmed) {
      errors.department = 'Engineering department is required';
    } else if (!SUPPORTED_DEPARTMENTS.includes(deptTrimmed as SupportedDepartment)) {
      errors.department = 'Please select a valid engineering department';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await register({
        name: formData.name.trim(),
        studentId: formData.studentId.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        department: formData.department.trim(),
      });

      setRegisteredUser(user);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const errorData = (err as any).errorData || err.data;
        if (err.status === 409) {
          setErrorMessage('An account with this email or student registration number already exists.');
        } else if (err.status === 400 && errorData?.validationErrors) {
          setFieldErrors(errorData.validationErrors);
          setErrorMessage('Please check the validation errors below.');
        } else {
          setErrorMessage(err.message);
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Unable to complete registration. Please check your network connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success view guiding the student to log in
  if (registeredUser) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '540px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: 'var(--color-success)',
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
            Account Created Successfully!
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
            Welcome to CoreHub, <strong>{registeredUser.name}</strong>. Your student profile is registered.
          </p>

          <div
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              textAlign: 'left',
              fontSize: '0.85rem',
              marginBottom: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Student ID:</span>
              <strong>{registeredUser.studentId}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Registered Email:</span>
              <strong>{registeredUser.email}</strong>
            </div>
            {registeredUser.department && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Department:</span>
                <span>{registeredUser.department}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-block btn-lg"
              onClick={() =>
                navigate('/login', {
                  state: {
                    registeredEmail: registeredUser.email,
                    registrationSuccessMessage: 'Registration successful! Please sign in with your password.',
                  },
                })
              }
            >
              <span>Proceed to Sign In</span>
              <ArrowRight size={18} />
            </button>
            <Link to="/" className="btn btn-outline btn-block">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '0.875rem',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              marginBottom: '1.5rem',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Registration Error:</strong>
              <div style={{ marginTop: '0.2rem' }}>{errorMessage}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">
              Full Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-name"
                name="name"
                type="text"
                className={`form-input ${fieldErrors.name ? 'input-error' : ''}`}
                placeholder="Kasun Perera"
                value={formData.name}
                onChange={handleChange}
                required
                maxLength={100}
                style={{ paddingLeft: '2.5rem' }}
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
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
            {fieldErrors.name && (
              <span id="register-name-error" className="form-hint" style={{ color: 'var(--color-danger)' }}>
                {fieldErrors.name}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="register-studentId">
                Student Registration ID <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-studentId"
                  name="studentId"
                  type="text"
                  className={`form-input ${fieldErrors.studentId ? 'input-error' : ''}`}
                  placeholder="EG/XXXX/XXXX"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  maxLength={50}
                  style={{ paddingLeft: '2.5rem' }}
                  aria-invalid={!!fieldErrors.studentId}
                  aria-describedby={fieldErrors.studentId ? 'register-studentId-error' : undefined}
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
              {fieldErrors.studentId && (
                <span id="register-studentId-error" className="form-hint" style={{ color: 'var(--color-danger)' }}>
                  {fieldErrors.studentId}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-phone">
                Contact Phone <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  className={`form-input ${fieldErrors.phone ? 'input-error' : ''}`}
                  placeholder="+94712345678"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  maxLength={20}
                  style={{ paddingLeft: '2.5rem' }}
                  aria-invalid={!!fieldErrors.phone}
                  aria-describedby={fieldErrors.phone ? 'register-phone-error' : undefined}
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
              {fieldErrors.phone && (
                <span id="register-phone-error" className="form-hint" style={{ color: 'var(--color-danger)' }}>
                  {fieldErrors.phone}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-department">
              Engineering Department <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="register-department"
                name="department"
                className={`form-select ${fieldErrors.department ? 'input-error' : ''}`}
                value={formData.department}
                onChange={handleChange}
                required
                style={{ paddingLeft: '2.5rem' }}
                aria-invalid={!!fieldErrors.department}
                aria-describedby={fieldErrors.department ? 'register-department-error' : undefined}
              >
                <option value="">Select your engineering department</option>
                {SUPPORTED_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
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
            {fieldErrors.department && (
              <span id="register-department-error" className="form-hint" style={{ color: 'var(--color-danger)' }}>
                {fieldErrors.department}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Institutional Email <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-email"
                name="email"
                type="email"
                className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                placeholder="egXXXXXX@engug.ruh.ac.lk"
                value={formData.email}
                onChange={handleChange}
                required
                maxLength={150}
                style={{ paddingLeft: '2.5rem' }}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
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
            {fieldErrors.email ? (
              <span id="register-email-error" className="form-hint" style={{ color: 'var(--color-danger)' }}>
                {fieldErrors.email}
              </span>
            ) : (
              <span className="form-hint">Use your Faculty of Engineering university email.</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-password"
                name="password"
                type="password"
                className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                style={{ paddingLeft: '2.5rem' }}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
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
            {fieldErrors.password && (
              <span id="register-password-error" className="form-hint" style={{ color: 'var(--color-danger)' }}>
                {fieldErrors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSubmitting}
            style={{ marginTop: '1.5rem' }}
          >
            {isSubmitting ? 'Creating Student Account...' : 'Complete Registration'}
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
