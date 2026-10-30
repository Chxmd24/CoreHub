import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Tag,
  User,
  Shield,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Phone,
  Mail,
  GraduationCap,
  Building,
  Bookmark,
  X,
  ExternalLink,
} from 'lucide-react';
import { api, ApiError } from '../api/client';
import { ComponentResponse, ListingType, ComponentStatus, ReservationResponse } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const ComponentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();

  const [component, setComponent] = useState<ComponentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInvalidId, setIsInvalidId] = useState(false);

  // Reservation action states
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [reservationSuccess, setReservationSuccess] = useState<ReservationResponse | null>(null);

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

  const handleOpenReserveModal = () => {
    setReserveError(null);
    setIsReserveModalOpen(true);
  };

  const handleCloseReserveModal = () => {
    if (!reserving) {
      setIsReserveModalOpen(false);
      setReserveError(null);
    }
  };

  const handleConfirmReservation = async () => {
    if (!component) return;

    setReserving(true);
    setReserveError(null);

    try {
      const response = await api.reservations.create({ componentId: component.id });
      setReservationSuccess(response);
      setComponent((prev) => (prev ? { ...prev, status: ComponentStatus.RESERVED } : prev));
      setIsReserveModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setReserveError('Reservation conflict: This component listing is no longer available or was already reserved.');
          setComponent((prev) => (prev ? { ...prev, status: ComponentStatus.RESERVED } : prev));
        } else if (err.status === 400) {
          setReserveError(err.message || 'You cannot reserve your own component listing.');
        } else if (err.status === 401) {
          setReserveError('Your session has expired. Please log in again to reserve.');
        } else if (err.status === 403) {
          setReserveError('You are not authorized to reserve this component.');
        } else {
          setReserveError(err.message || 'Failed to create reservation. Please try again.');
        }
      } else if (err instanceof Error) {
        setReserveError(err.message);
      } else {
        setReserveError('An unexpected error occurred while creating the reservation.');
      }
    } finally {
      setReserving(false);
    }
  };

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

  const isOwner = Boolean(isAuthenticated && user && component.ownerId === user.id);

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
            {/* Reservation Booking / Status Card */}
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bookmark size={18} color="var(--color-primary)" />
                <span>Peer Hold & Reservation</span>
              </h3>

              {/* SUCCESS STATE BANNER */}
              {reservationSuccess && (
                <div
                  data-testid="reservation-success-card"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', marginBottom: '0.5rem' }}>
                    <CheckCircle size={20} />
                    <strong style={{ fontSize: '1rem' }}>24-Hour Hold Confirmed!</strong>
                  </div>
                  <p style={{ fontSize: '0.875rem', margin: '0 0 0.75rem 0', color: 'var(--color-text-main)' }}>
                    Reservation #{reservationSuccess.id} has been created. The component is held exclusively for you.
                  </p>
                  {reservationSuccess.expiresAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-warning)', fontWeight: 600, marginBottom: '0.75rem' }}>
                      <Clock size={14} />
                      <span>Expires: {new Date(reservationSuccess.expiresAt).toLocaleString()}</span>
                    </div>
                  )}

                  <Link
                    to="/my-reservations"
                    className="btn btn-sm btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <span>View in My Reservations</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              )}

              {/* ERROR ALERT (e.g. 409 conflict, 400 error) - displayed in card only when modal is closed */}
              {!isReserveModalOpen && reserveError && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--color-danger)',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{reserveError}</div>
                </div>
              )}

              {/* AVAILABLE LISTING WORKFLOW */}
              {component.status === ComponentStatus.AVAILABLE && !reservationSuccess && (
                <>
                  <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5, color: 'var(--color-text-muted)' }}>
                    CoreHub reserves components exclusively for <strong>24 hours</strong> with transactional concurrency locking, allowing direct peer coordination for physical lab handover.
                  </p>

                  {!isAuthenticated ? (
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-primary-light)', fontWeight: 600, fontSize: '0.9rem' }}>
                        <Info size={16} />
                        <span>Student Login Required</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.875rem' }}>
                        Sign in with your verified university credentials to place a 24-hour peer hold and unlock seller contact details.
                      </p>
                      <Link
                        to={`/login?redirect=${encodeURIComponent(`/components/${component.id}`)}`}
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        Log In to Reserve
                      </Link>
                    </div>
                  ) : isOwner ? (
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(234, 179, 8, 0.08)',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: 'var(--color-warning)', fontWeight: 600, fontSize: '0.9rem' }}>
                        <AlertTriangle size={16} />
                        <span>Your Component Listing</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                        You are the owner of this listing. Students cannot reserve their own components.
                      </p>
                      <Link
                        to="/my-listings"
                        className="btn btn-sm btn-outline"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        Manage in My Listings
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleOpenReserveModal}
                        style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
                        data-testid="reserve-component-btn"
                      >
                        <Bookmark size={16} />
                        <span>Reserve Component (24-Hour Hold)</span>
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-success)' }}>
                        <CheckCircle size={15} />
                        <span>Currently Available for Peer Hold</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* RESERVED OR EXCHANGED STATUS (When not just reserved) */}
              {component.status !== ComponentStatus.AVAILABLE && !reservationSuccess && (
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

            {/* Seller Contact Card */}
            <div className="card">
              <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} />
                <span>Listed by {component.ownerName}</span>
              </h4>

              {/* If user just placed active reservation, reveal the unlocked contact info */}
              {reservationSuccess && reservationSuccess.sellerContact ? (
                <div
                  data-testid="unlocked-seller-contact"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.05)',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-success)', fontWeight: 600, fontSize: '0.9rem' }}>
                    <CheckCircle size={16} />
                    <span>Seller Contact Information (Unlocked)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={14} color="var(--color-text-muted)" />
                      <span><strong>Name:</strong> {reservationSuccess.sellerContact.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GraduationCap size={14} color="var(--color-text-muted)" />
                      <span><strong>Student ID:</strong> {reservationSuccess.sellerContact.studentId}</span>
                    </div>
                    {reservationSuccess.sellerContact.department && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building size={14} color="var(--color-text-muted)" />
                        <span><strong>Department:</strong> {reservationSuccess.sellerContact.department}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={14} color="var(--color-text-muted)" />
                      <span><strong>Email:</strong> <a href={`mailto:${reservationSuccess.sellerContact.email}`}>{reservationSuccess.sellerContact.email}</a></span>
                    </div>
                    {reservationSuccess.sellerContact.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={14} color="var(--color-text-muted)" />
                        <span><strong>Phone:</strong> <a href={`tel:${reservationSuccess.sellerContact.phone}`}>{reservationSuccess.sellerContact.phone}</a></span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RESERVATION CONFIRMATION MODAL */}
      {isReserveModalOpen && (
        <div
          className="modal-backdrop"
          onClick={handleCloseReserveModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reserve-dialog-title"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bookmark size={20} color="var(--color-primary)" />
                <h2 id="reserve-dialog-title" className="modal-title" style={{ fontSize: '1.2rem' }}>
                  Confirm 24-Hour Reservation
                </h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseReserveModal}
                disabled={reserving}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {reserveError && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    color: 'var(--color-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <div>{reserveError}</div>
                </div>
              )}

              <p style={{ fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                Are you sure you want to place a 24-hour peer hold on <strong>{component.title}</strong>?
              </p>

              <div
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  marginBottom: '1rem',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-primary-800)', marginBottom: '0.25rem' }}>
                  Peer Exchange Terms:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--color-text-muted)' }}>
                  <li>This listing will be held exclusively for your account for 24 hours.</li>
                  <li>The seller ({component.ownerName}) will be notified and their direct contact details will be revealed to you.</li>
                  <li>Coordinate the physical lab inspection and handover within the 24-hour window.</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCloseReserveModal}
                disabled={reserving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmReservation}
                disabled={reserving}
                data-testid="confirm-reserve-btn"
              >
                {reserving ? 'Reserving...' : 'Confirm Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
