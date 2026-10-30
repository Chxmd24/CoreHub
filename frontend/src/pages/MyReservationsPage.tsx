import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Clock,
  User,
  Phone,
  Mail,
  ShieldAlert,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  X,
  PackageCheck,
  Inbox,
} from 'lucide-react';
import { api, ApiError } from '../api/client';
import { ReservationResponse, ReservationStatus } from '../api/types';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

type Perspective = 'borrowed' | 'received';
type StatusFilter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export const MyReservationsPage: React.FC = () => {
  const [perspective, setPerspective] = useState<Perspective>('borrowed');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [borrowedReservations, setBorrowedReservations] = useState<ReservationResponse[]>([]);
  const [receivedReservations, setReceivedReservations] = useState<ReservationResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [cancellingReservation, setCancellingReservation] = useState<ReservationResponse | null>(null);
  const [completingReservation, setCompletingReservation] = useState<ReservationResponse | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mine, received] = await Promise.all([
        api.reservations.getMy(),
        api.reservations.getReceived(),
      ]);
      setBorrowedReservations(mine);
      setReceivedReservations(received);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 0) {
          setError('Unable to connect to CoreHub server. Please verify the backend is running.');
        } else {
          setError(err.message || 'Failed to load reservations.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while loading reservations.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Handle Cancel Action
  const handleOpenCancelModal = (item: ReservationResponse) => {
    setActionError(null);
    setCancellingReservation(item);
  };

  const handleCloseCancelModal = () => {
    if (!actionLoading) {
      setCancellingReservation(null);
      setActionError(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingReservation) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const updated = await api.reservations.cancel(cancellingReservation.id);
      // Update both local states
      setBorrowedReservations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setReceivedReservations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setCancellingReservation(null);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setActionError('This reservation has already expired or changed status. Refreshing data...');
          fetchReservations();
        } else {
          setActionError(err.message || 'Failed to cancel reservation.');
        }
      } else if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('An error occurred while cancelling the reservation.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Complete Action
  const handleOpenCompleteModal = (item: ReservationResponse) => {
    setActionError(null);
    setCompletingReservation(item);
  };

  const handleCloseCompleteModal = () => {
    if (!actionLoading) {
      setCompletingReservation(null);
      setActionError(null);
    }
  };

  const handleConfirmComplete = async () => {
    if (!completingReservation) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const updated = await api.reservations.complete(completingReservation.id);
      // Update both local states
      setBorrowedReservations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setReceivedReservations((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setCompletingReservation(null);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setActionError('This reservation has already expired or changed status. Refreshing data...');
          fetchReservations();
        } else {
          setActionError(err.message || 'Failed to complete handover.');
        }
      } else if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('An error occurred while completing the handover.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your reservation history..." />;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '640px', margin: '2rem auto' }}>
        <ErrorState
          title="Failed to Load Reservations"
          message={error}
          onRetry={fetchReservations}
          showHomeLink={true}
        />
      </div>
    );
  }

  const currentList = perspective === 'borrowed' ? borrowedReservations : receivedReservations;

  const countByStatus = (status: ReservationStatus) =>
    currentList.filter((r) => r.status === status).length;

  const filteredReservations = currentList.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  const getStatusBadgeClass = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.ACTIVE:
        return 'badge-warning';
      case ReservationStatus.COMPLETED:
        return 'badge-success';
      case ReservationStatus.CANCELLED:
        return 'badge-neutral';
      case ReservationStatus.EXPIRED:
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Bookmark size={26} color="var(--color-primary)" />
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: 0, color: 'var(--color-primary-900)' }}>
              My Reservations
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Manage your 24-hour peer holds, exchange handovers, and lab pickup details
          </p>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={fetchReservations}
          title="Refresh reservations"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Primary Perspective Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          borderBottom: '2px solid var(--color-border)',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setPerspective('borrowed');
            setStatusFilter('ALL');
          }}
          data-testid="tab-borrowed-holds"
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            borderBottom: perspective === 'borrowed' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: perspective === 'borrowed' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '-2px',
          }}
        >
          <Bookmark size={18} />
          <span>My Borrowed Holds</span>
          <span
            style={{
              backgroundColor: perspective === 'borrowed' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
              color: perspective === 'borrowed' ? '#ffffff' : 'var(--color-text-muted)',
              fontSize: '0.75rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              fontWeight: 600,
            }}
          >
            {borrowedReservations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPerspective('received');
            setStatusFilter('ALL');
          }}
          data-testid="tab-received-holds"
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            borderBottom: perspective === 'received' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: perspective === 'received' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '-2px',
          }}
        >
          <Inbox size={18} />
          <span>Received on My Listings</span>
          <span
            style={{
              backgroundColor: perspective === 'received' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
              color: perspective === 'received' ? '#ffffff' : 'var(--color-text-muted)',
              fontSize: '0.75rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              fontWeight: 600,
            }}
          >
            {receivedReservations.length}
          </span>
        </button>
      </div>

      {/* Status Sub-Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'] as StatusFilter[]).map((st) => {
          const count = st === 'ALL' ? currentList.length : countByStatus(st as ReservationStatus);
          const isSelected = statusFilter === st;

          return (
            <button
              key={st}
              type="button"
              className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusFilter(st)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>{st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}</span>
              <span style={{ opacity: 0.85, fontSize: '0.75rem' }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            backgroundColor: 'var(--color-bg-card)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              color: 'var(--color-text-subtle)',
            }}
          >
            <Bookmark size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No {statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} reservations found
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            {perspective === 'borrowed'
              ? 'You have not placed any component reservations matching this filter. Explore the marketplace to find components for your lab projects.'
              : 'You have not received any component reservations matching this filter. When peers reserve your listings, they will appear here.'}
          </p>
          {perspective === 'borrowed' ? (
            <Link to="/marketplace" className="btn btn-primary btn-sm">
              Explore Marketplace
            </Link>
          ) : (
            <Link to="/my-listings" className="btn btn-primary btn-sm">
              Manage My Listings
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredReservations.map((item) => {
            const isActive = item.status === ReservationStatus.ACTIVE;

            return (
              <div key={item.id} className="card" style={{ padding: '1.5rem' }}>
                {/* Header row with Status & View Link */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                        {item.listingType}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Reservation #{item.id}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>
                      {item.componentTitle}
                    </h3>
                    <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      Category: <strong>{item.componentCategory}</strong>
                      {item.price != null && (
                        <span style={{ marginLeft: '1rem', color: 'var(--color-primary-900)', fontWeight: 600 }}>
                          Price: LKR {item.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/components/${item.componentId}`}
                    className="btn btn-sm btn-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <span>View Component</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </div>

                {/* Timeline & Timing Info */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Hold Created:</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {new Date(item.reservedAt).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>24h Expiry Deadline:</div>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: isActive ? 'var(--color-warning)' : 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Clock size={14} />
                      {item.expiresAt ? new Date(item.expiresAt).toLocaleString() : 'No expiry set'}
                    </div>
                  </div>
                </div>

                {/* Perspective-Specific Details: Seller Contact vs Borrower Info */}
                {perspective === 'borrowed' ? (
                  /* Borrower Perspective: View Seller Contact */
                  isActive && item.sellerContact ? (
                    <div
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <User size={16} color="var(--color-primary)" />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          Exchange Partner Contact (Unlocked during active hold)
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '0.5rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div>
                          <span style={{ color: 'var(--color-text-muted)' }}>Owner: </span>
                          <strong>{item.sellerContact.name}</strong> ({item.sellerContact.department || 'CEng'})
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-text-muted)' }}>Student ID: </span>
                          <strong>{item.sellerContact.studentId}</strong>
                        </div>
                        {item.sellerContact.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Phone size={14} color="var(--color-text-muted)" />
                            <a href={`tel:${item.sellerContact.phone}`}>{item.sellerContact.phone}</a>
                          </div>
                        )}
                        {item.sellerContact.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Mail size={14} color="var(--color-text-muted)" />
                            <a href={`mailto:${item.sellerContact.email}`}>{item.sellerContact.email}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: 'var(--color-bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem 1rem',
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <ShieldAlert size={15} />
                      <span>
                        Seller contact details are shielded because this reservation is {item.status.toLowerCase()}. CoreHub keeps peer communications private once a hold ends.
                      </span>
                    </div>
                  )
                ) : (
                  /* Owner Perspective: View Reserved By */
                  <div
                    style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.05)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <User size={16} color="var(--color-primary)" />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        Reserved by Peer Student:
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                      <strong>{item.reservedByName}</strong> (Student #{item.reservedById})
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      Coordinate physical inspection and handover in the lab with the borrower.
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {isActive && (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* Owner-only: Complete Handover */}
                    {perspective === 'received' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleOpenCompleteModal(item)}
                        data-testid={`complete-btn-${item.id}`}
                      >
                        <PackageCheck size={15} />
                        <span>Complete Handover</span>
                      </button>
                    )}

                    {/* Both borrower and owner can cancel */}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                      onClick={() => handleOpenCancelModal(item)}
                      data-testid={`cancel-btn-${item.id}`}
                    >
                      <XCircle size={15} />
                      <span>Cancel Reservation</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancellingReservation && (
        <div
          className="modal-backdrop"
          onClick={handleCloseCancelModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <XCircle size={20} color="var(--color-danger)" />
                <h2 id="cancel-dialog-title" className="modal-title" style={{ fontSize: '1.15rem' }}>
                  Cancel Reservation #{cancellingReservation.id}
                </h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseCancelModal}
                disabled={actionLoading}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {actionError && (
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
                  <div>{actionError}</div>
                </div>
              )}

              <p style={{ fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to cancel the reservation for{' '}
                <strong>{cancellingReservation.componentTitle}</strong>?
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                The component will immediately return to <strong>AVAILABLE</strong> status in the marketplace for other students.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCloseCancelModal}
                disabled={actionLoading}
              >
                Keep Reservation
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmCancel}
                disabled={actionLoading}
                data-testid="confirm-cancel-btn"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE HANDOVER CONFIRMATION MODAL */}
      {completingReservation && (
        <div
          className="modal-backdrop"
          onClick={handleCloseCompleteModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-dialog-title"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} color="var(--color-success)" />
                <h2 id="complete-dialog-title" className="modal-title" style={{ fontSize: '1.15rem' }}>
                  Complete Handover #{completingReservation.id}
                </h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseCompleteModal}
                disabled={actionLoading}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {actionError && (
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
                  <div>{actionError}</div>
                </div>
              )}

              <p style={{ fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                Confirm that <strong>{completingReservation.componentTitle}</strong> has been handed over to{' '}
                <strong>{completingReservation.reservedByName}</strong>?
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                This will finalize the transaction and mark the listing as <strong>EXCHANGED</strong>.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCloseCompleteModal}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmComplete}
                disabled={actionLoading}
                data-testid="confirm-complete-btn"
              >
                {actionLoading ? 'Completing...' : 'Confirm Handover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
