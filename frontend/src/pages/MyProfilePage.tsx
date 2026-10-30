import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  GraduationCap,
  Phone,
  Building,
  Shield,
  Calendar,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiClientError } from '../api/client';
import { Role, UserResponse, SUPPORTED_DEPARTMENTS, SupportedDepartment } from '../api/types';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const MyProfilePage: React.FC = () => {
  const { user: authUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserResponse | null>(authUser);
  const [loading, setLoading] = useState<boolean>(!authUser);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form inputs
  const [name, setName] = useState<string>(authUser?.name || '');
  const [phone, setPhone] = useState<string>(authUser?.phone || '');
  const [department, setDepartment] = useState<string>(authUser?.department || '');

  // Fetch latest profile from backend on mount
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.users.getMe();
        if (isMounted) {
          setProfile(data);
          setName(data.name || '');
          setPhone(data.phone || '');
          setDepartment(data.department || '');
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof ApiClientError) {
            if (err.status === 401) {
              navigate('/login');
              return;
            }
            setError(err.message || 'Failed to load profile details.');
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('An unexpected error occurred while loading profile.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleStartEdit = () => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      const matched = SUPPORTED_DEPARTMENTS.find(
        (d) => d.toLowerCase() === (profile.department || '').trim().toLowerCase()
      );
      setDepartment(matched || '');
    }
    setFormError(null);
    setValidationErrors({});
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      const matched = SUPPORTED_DEPARTMENTS.find(
        (d) => d.toLowerCase() === (profile.department || '').trim().toLowerCase()
      );
      setDepartment(matched || '');
    }
    setFormError(null);
    setValidationErrors({});
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setValidationErrors({});
    setSuccessMessage(null);

    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length > 100) {
      errors.name = 'Full name must not exceed 100 characters.';
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      errors.phone = 'Contact phone number is required.';
    } else if (trimmedPhone.length > 20) {
      errors.phone = 'Phone number must not exceed 20 characters.';
    }

    const trimmedDept = department.trim();
    if (!trimmedDept) {
      errors.department = 'Department is required.';
    } else if (!SUPPORTED_DEPARTMENTS.includes(trimmedDept as SupportedDepartment)) {
      errors.department = 'Please select a valid engineering department.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsSaving(true);
      const updated = await api.users.updateProfile({
        name: trimmedName,
        phone: trimmedPhone,
        department: trimmedDept,
      });

      setProfile(updated);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully.');

      // Refresh global authentication context to immediately update Navbar
      await refreshProfile();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          navigate('/login');
          return;
        }
        if (err.errorData?.validationErrors) {
          setValidationErrors(err.errorData.validationErrors);
        }
        setFormError(err.message || 'Failed to update profile. Please verify your inputs.');
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to update profile due to an unexpected error.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your student profile details..." />;
  }

  if (error || !profile) {
    return (
      <ErrorState
        title="Profile Unavailable"
        message={error || 'Unable to retrieve your profile information.'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const getRoleBadgeLabel = (role: Role) => {
    if (role === Role.SUPER_ADMIN) return 'SUPER ADMIN';
    if (role === Role.ADMIN) return 'ADMIN';
    return 'STUDENT';
  };

  const formattedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not available';

  const userInitial = profile.name ? profile.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <div className="profile-page-wrapper">
      {/* Hero Identity Banner */}
      <div className="profile-hero-card">
        <div className="profile-hero-identity">
          <div className="profile-hero-avatar" aria-hidden="true">
            {userInitial}
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-hero-name" data-testid="profile-display-name">
              {profile.name}
            </h1>
            <span className="profile-hero-email">{profile.email}</span>
            <div className="profile-hero-badges">
              <span className={`role-badge role-badge-${profile.role.toLowerCase()}`}>
                {profile.role === Role.SUPER_ADMIN && <Shield size={12} aria-hidden="true" />}
                {getRoleBadgeLabel(profile.role)}
              </span>
              <span className="brand-badge">{profile.studentId}</span>
            </div>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartEdit}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Edit3 size={16} aria-hidden="true" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Feedback Messages */}
      {successMessage && (
        <div
          className="alert-banner alert-banner-success"
          role="status"
          style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
        >
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {formError && (
        <div
          className="alert-banner alert-banner-error"
          role="alert"
          style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
        >
          <AlertCircle size={18} aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Profile Form / Details View */}
      <form onSubmit={handleSaveProfile} noValidate>
        <div className="profile-grid">
          {/* Personal Details Section */}
          <div className="profile-section-card">
            <h2 className="profile-section-title">
              <UserIcon size={18} aria-hidden="true" />
              <span>Personal Information</span>
            </h2>

            {/* Full Name */}
            <div className="profile-field-group">
              <label htmlFor="profile-name" className="profile-field-label">
                <span>Full Name</span>
                {isEditing && <span style={{ color: 'var(--color-danger)' }}>*</span>}
              </label>
              {isEditing ? (
                <div>
                  <input
                    id="profile-name"
                    name="name"
                    type="text"
                    className={`profile-form-input ${validationErrors.name ? 'error' : ''}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSaving}
                    required
                    maxLength={100}
                    placeholder="Enter your full name"
                  />
                  {validationErrors.name && (
                    <div className="form-error-text">{validationErrors.name}</div>
                  )}
                </div>
              ) : (
                <div className="profile-field-value">{profile.name}</div>
              )}
            </div>

            {/* Contact Phone */}
            <div className="profile-field-group">
              <label htmlFor="profile-phone" className="profile-field-label">
                <span>Contact Phone</span>
                {isEditing && <span style={{ color: 'var(--color-danger)' }}>*</span>}
              </label>
              {isEditing ? (
                <div>
                  <input
                    id="profile-phone"
                    name="phone"
                    type="tel"
                    className={`profile-form-input ${validationErrors.phone ? 'error' : ''}`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSaving}
                    required
                    maxLength={20}
                    placeholder="+94 7X XXX XXXX"
                  />
                  {validationErrors.phone && (
                    <div className="form-error-text">{validationErrors.phone}</div>
                  )}
                  <div className="form-helper-text">
                    Shared with peers when a component reservation is completed.
                  </div>
                </div>
              ) : (
                <div className={`profile-field-value ${!profile.phone ? 'empty' : ''}`}>
                  <Phone size={14} style={{ marginRight: '6px', color: 'var(--color-text-muted)' }} />
                  <span>{profile.phone || 'Not provided'}</span>
                </div>
              )}
            </div>

            {/* Department */}
            <div className="profile-field-group">
              <label htmlFor="profile-department" className="profile-field-label">
                <span>Department</span>
                {isEditing && <span style={{ color: 'var(--color-danger)' }}>*</span>}
              </label>
              {isEditing ? (
                <div>
                  <select
                    id="profile-department"
                    name="department"
                    className={`profile-form-input profile-form-select ${validationErrors.department ? 'error' : ''}`}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={isSaving}
                    required
                  >
                    <option value="">-- Select Department --</option>
                    {SUPPORTED_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  {validationErrors.department && (
                    <div className="form-error-text">{validationErrors.department}</div>
                  )}
                </div>
              ) : (
                <div className={`profile-field-value ${!profile.department ? 'empty' : ''}`}>
                  <Building size={14} style={{ marginRight: '6px', color: 'var(--color-text-muted)' }} />
                  <span>{profile.department || 'Not specified'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Academic & Security Credentials */}
          <div className="profile-section-card">
            <h2 className="profile-section-title">
              <GraduationCap size={18} aria-hidden="true" />
              <span>Academic & Account Credentials</span>
            </h2>

            {/* University Email */}
            <div className="profile-field-group">
              <div className="profile-field-label">
                <span>University Email</span>
              </div>
              <div className="profile-field-value">
                <Mail size={14} style={{ marginRight: '6px', color: 'var(--color-text-muted)' }} />
                <span>{profile.email}</span>
              </div>
              <div className="form-helper-text">Official university email cannot be modified.</div>
            </div>

            {/* Student ID */}
            <div className="profile-field-group">
              <div className="profile-field-label">
                <span>Student Registration Number</span>
              </div>
              <div className="profile-field-value">
                <GraduationCap size={14} style={{ marginRight: '6px', color: 'var(--color-text-muted)' }} />
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{profile.studentId}</span>
              </div>
              <div className="form-helper-text">Issued by university administration.</div>
            </div>

            {/* Role & Privileges */}
            <div className="profile-field-group">
              <div className="profile-field-label">
                <span>Platform Role</span>
              </div>
              <div className="profile-field-value">
                <Shield size={14} style={{ marginRight: '6px', color: 'var(--color-text-muted)' }} />
                <span className={`role-badge role-badge-${profile.role.toLowerCase()}`}>
                  {profile.role === Role.SUPER_ADMIN && <Shield size={11} aria-hidden="true" />}
                  {getRoleBadgeLabel(profile.role)}
                </span>
              </div>
            </div>

            {/* Member Since */}
            <div className="profile-field-group">
              <div className="profile-field-label">
                <span>Member Since</span>
              </div>
              <div className="profile-field-value">
                <Calendar size={14} style={{ marginRight: '6px', color: 'var(--color-text-muted)' }} />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls when in Edit Mode */}
        {isEditing && (
          <div className="profile-actions-bar">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCancelEdit}
              disabled={isSaving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <X size={15} aria-hidden="true" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Save size={15} aria-hidden="true" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
