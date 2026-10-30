import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Tag, User, Shield, Clock, Calendar, CheckCircle, Info } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { ComponentResponse, ListingType, ComponentStatus } from '../api/types';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const ComponentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [component, setComponent] = useState<ComponentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInvalidId, setIsInvalidId] = useState(false);

  const fetchComponent = useCallback(async () => {
    if (!id || isNaN(Number(id)) || Number(id) <= 0 || !Number.isInteger(Number(id))) {
      setIsInvalidId(true);
      setError('Invalid component identifier in URL. Listing IDs must be positive integers.');
      setLoading(false);
      return;
    }

    setIsInvalidId(false);
    setLoading(true);
    setError(null);

    try {
      const data = await api.components.getById(Number(id));
      setComponent(data);
    } catch (err: unknown) {
      setComponent(null);
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError(`Component listing not found with ID: ${id}`);
        } else if (err.status === 0) {
          setError('Unable to connect to CoreHub server. Please verify the backend is running.');
        } else {
          setError(err.message || 'Failed to retrieve component details.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while loading this component.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComponent();
  }, [fetchComponent]);

  if (loading) {
    return <LoadingState message="Loading component details from database..." />;
  }

  if (error || !component) {
    return (
      <div style={{ maxWidth: '640px', margin: '2rem auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/marketplace" className="btn btn-sm btn-outline">
            <ArrowLeft size={15} />
            <span>Back to Marketplace</span>
          </Link>
        </div>
        <ErrorState
          title={isInvalidId ? 'Invalid Component ID' : 'Listing Not Found'}
          message={error || 'The requested electronics component listing could not be found or has been removed.'}
          onRetry={!isInvalidId ? fetchComponent : undefined}
          showHomeLink={false}
        />
      </div>
    );
  }

  const getListingBadgeClass = (type: ListingType) => {
    switch (type) {
      case ListingType.SELL:
        return 'badge-sell';
      case ListingType.SWAP:
        return 'badge-swap';
      case ListingType.BORROW:
        return 'badge-borrow';
      default:
        return '';
    }
  };

  const getStatusBadgeClass = (status: ComponentStatus) => {
    switch (status) {
      case ComponentStatus.AVAILABLE:
        return 'badge-available';
      case ComponentStatus.RESERVED:
        return 'badge-warning';
      case ComponentStatus.EXCHANGED:
        return 'badge-exchanged';
      default:
        return '';
    }
  };

  return (
    <div>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/marketplace" className="btn btn-sm btn-outline">
          <ArrowLeft size={15} />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', width: '100%', minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '2rem', width: '100%', minWidth: 0 }}>
          {/* Main Info Card */}
          <div className="card" style={{ minWidth: 0, width: '100%' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span className={`badge ${getListingBadgeClass(component.listingType)}`}>
                {component.listingType}
              </span>
              <span className={`badge ${getStatusBadgeClass(component.status)}`}>
                {component.status}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <Tag size={14} />
                {component.category}
              </span>
            </div>

            <h1 style={{ fontSize: '1.875rem', marginBottom: '1rem', lineHeight: 1.25, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              {component.title}
            </h1>

            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              {component.listingType === ListingType.SELL && component.price != null ? (
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)', display: 'block' }}>Student Asking Price</span>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-900)' }}>
                    LKR {component.price.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-subtle)', display: 'block' }}>Exchange Format</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent-600)' }}>
                    {component.listingType === ListingType.SWAP ? 'Component Swap / Trade' : 'Lab Equipment Borrow'}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.75rem', minWidth: 0 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Description & Overview</h3>
              <p style={{ lineHeight: 1.6, whiteSpace: 'pre-line', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{component.description}</p>
            </div>

            {component.specifications && (
              <div style={{ marginBottom: '1.75rem', minWidth: 0, width: '100%' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Technical Specifications & Pinout</h3>
                <div
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.875rem',
                    color: 'var(--color-primary-800)',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    minWidth: 0,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {component.specifications}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--color-text-subtle)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={15} />
                <span>Listed {new Date(component.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={15} />
                <span>Updated {new Date(component.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action & Trust Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Reservation Card */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Reservation Hold Policy</h3>

              {component.status === ComponentStatus.AVAILABLE ? (
                <>
                  <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    When reserved by an authenticated student, CoreHub holds components exclusively for <strong>24 hours</strong> with transactional concurrency locking, allowing direct coordination of physical lab handover.
                  </p>

                  <div
                    style={{
                      padding: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      fontSize: '0.85rem',
                      color: 'var(--color-primary-light)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>
                      Interactive reservation booking in the frontend will be enabled in upcoming milestones. Direct booking requires verified student login.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-success)' }}>
                    <CheckCircle size={16} />
                    <span>Currently Available for Peer Hold</span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div
                    className={`badge ${getStatusBadgeClass(component.status)}`}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', marginBottom: '0.75rem' }}
                  >
                    {component.status === ComponentStatus.RESERVED ? 'Currently Reserved' : 'Already Exchanged'}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    {component.status === ComponentStatus.RESERVED
                      ? 'Another student currently holds an active 24-hour reservation. If uncompleted, it automatically expires and returns to available status.'
                      : 'This component has already been exchanged or handed over to another student.'}
                  </p>
                </div>
              )}
            </div>

            {/* Seller Info Card */}
            <div className="card">
              <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} />
                <span>Listed by {component.ownerName}</span>
              </h4>

              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  backgroundColor: 'var(--color-accent-50)',
                  border: '1px solid var(--color-accent-100)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem',
                  fontSize: '0.85rem',
                  color: 'var(--color-accent-700)',
                  lineHeight: 1.5,
                }}
              >
                <Shield size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Student Privacy Guarantee:</strong> The seller's university email, phone number, and department are disclosed strictly to peers who hold an active, unexpired reservation.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
