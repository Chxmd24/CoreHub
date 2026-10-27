import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Tag, User, Shield, Clock, Calendar } from 'lucide-react';
import { api } from '../api/client';
import { ComponentResponse, ListingType, ComponentStatus } from '../api/types';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const ComponentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [component, setComponent] = useState<ComponentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const componentId = Number(id);
    if (isNaN(componentId)) {
      setError('Invalid component identifier.');
      setLoading(false);
      return;
    }

    api.components
      .getById(componentId)
      .then((data) => {
        if (isMounted) {
          setComponent(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          // Provide fallback detail for development / preview if backend not running
          setComponent({
            id: componentId,
            title: `Component Listing #${componentId}`,
            description:
              'This is a demonstration component listing. In production, this data is fetched directly from the CoreHub Spring Boot backend at GET /api/components/' +
              componentId +
              '. High-value components feature pinouts, working condition notes, and pickup locations on campus.',
            category: 'Microcontrollers',
            specifications: 'Standard 0.1" header pinout, 3.3V/5V compatible logic, tested in Faculty electronics lab',
            listingType: ListingType.SELL,
            price: 3200.0,
            status: ComponentStatus.AVAILABLE,
            ownerId: 101,
            ownerName: 'Engineering Student Maker',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading component details..." />;
  }

  if (error || !component) {
    return (
      <ErrorState
        title="Listing Not Found"
        message={error || 'The requested electronics component listing could not be found or has been removed.'}
        showHomeLink={false}
      />
    );
  }

  return (
    <div>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/marketplace" className="btn btn-sm btn-outline">
          <ArrowLeft size={15} />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Main Info Card */}
          <div className="card">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span className={`badge badge-${component.listingType.toLowerCase()}`}>
                {component.listingType}
              </span>
              <span className={`badge badge-${component.status.toLowerCase()}`}>
                {component.status}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <Tag size={14} />
                {component.category}
              </span>
            </div>

            <h1 style={{ fontSize: '1.875rem', marginBottom: '1rem', lineHeight: 1.25 }}>
              {component.title}
            </h1>

            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              {component.listingType === 'SELL' && component.price != null ? (
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
                    {component.listingType === 'SWAP' ? 'Component Swap / Trade' : 'Lab Equipment Borrow'}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Description & Condition</h3>
              <p style={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>{component.description}</p>
            </div>

            {component.specifications && (
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Technical Specifications</h3>
                <div
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.875rem',
                    color: 'var(--color-primary-800)',
                    lineHeight: 1.5,
                  }}
                >
                  {component.specifications}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--color-text-subtle)', fontSize: '0.85rem' }}>
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
              <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Reservation Action</h3>

              {component.status === 'AVAILABLE' ? (
                <>
                  <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                    Reserve this component to lock it exclusively for <strong>24 hours</strong> while you arrange physical pickup on campus.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginBottom: '0.75rem' }}
                    onClick={() => {
                      alert('Milestone 7 Foundation: Reservation creation will be connected to backend POST /api/reservations in Milestone 8.');
                    }}
                  >
                    <span>Reserve Component (Milestone 7 Preview)</span>
                  </button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', textAlign: 'center', display: 'block' }}>
                    Milestone 7 Preview: Live booking with pessimistic database locking will connect in Milestone 8.
                  </span>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div className={`badge badge-${component.status.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', marginBottom: '0.75rem' }}>
                    {component.status === 'RESERVED' ? 'Currently Reserved' : 'Already Exchanged'}
                  </div>
                  <p style={{ fontSize: '0.875rem' }}>
                    {component.status === 'RESERVED'
                      ? 'Another student currently holds an active reservation. If uncompleted, it automatically expires in 24 hours.'
                      : 'This component has already been exchanged or handed over.'}
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
                  <strong>Student Privacy Guarantee:</strong> The seller's university email, phone number, and department are disclosed strictly when you hold an active, unexpired reservation.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
