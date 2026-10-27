import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock, User, Phone, Mail, ShieldAlert, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react';
import { ReservationResponse, ReservationStatus } from '../api/types';

const MOCK_RESERVATIONS: ReservationResponse[] = [
  {
    id: 501,
    componentId: 102,
    componentTitle: 'STM32F401 Black Pill Board',
    componentCategory: 'MICROCONTROLLERS',
    listingType: 'BORROW',
    price: null,
    reservedById: 2,
    reservedByName: 'Nuwan Bandara',
    ownerId: 1,
    ownerName: 'Chamod Perera',
    reservedAt: '2026-10-26T08:00:00Z',
    expiresAt: '2026-10-27T08:00:00Z',
    status: ReservationStatus.ACTIVE,
    sellerContact: {
      studentId: 'E/19/042',
      name: 'Chamod Perera',
      email: 'chamod@eng.pdn.ac.lk',
      phone: '+94771234567',
      department: 'Computer Engineering',
    },
  },
  {
    id: 502,
    componentId: 104,
    componentTitle: 'ESP32 NodeMCU Wi-Fi + Bluetooth',
    componentCategory: 'WIRELESS_IOT',
    listingType: 'SWAP',
    price: null,
    reservedById: 1,
    reservedByName: 'Chamod Perera',
    ownerId: 3,
    ownerName: 'Sahan Wickrama',
    reservedAt: '2026-10-22T14:00:00Z',
    expiresAt: '2026-10-23T14:00:00Z',
    status: ReservationStatus.COMPLETED,
    sellerContact: null,
  },
  {
    id: 503,
    componentId: 105,
    componentTitle: 'Digital Logic Analyzer 8ch 24MHz',
    componentCategory: 'LAB_EQUIPMENT',
    listingType: 'BORROW',
    price: null,
    reservedById: 1,
    reservedByName: 'Chamod Perera',
    ownerId: 4,
    ownerName: 'Thilina Silva',
    reservedAt: '2026-10-20T10:00:00Z',
    expiresAt: '2026-10-21T10:00:00Z',
    status: ReservationStatus.EXPIRED,
    sellerContact: null,
  },
];

export const MyReservationsPage: React.FC = () => {
  const [reservations] = useState<ReservationResponse[]>(MOCK_RESERVATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'active'>('all');

  const filteredReservations = reservations.filter((r) => {
    if (activeTab === 'active') return r.status === ReservationStatus.ACTIVE;
    return true;
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
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Bookmark size={24} color="var(--color-primary)" />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>My Reservations</h1>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Manage your 24-hour peer holds, exchange handovers, and lab pickup details
        </p>
      </div>

      {/* Preview Notice */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          color: 'var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Bookmark size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>Reservations Preview:</strong> Demonstrating reservation lifecycle views, 24-hour expiry indicators, and contact privacy protection. Interactive reservation actions will be connected in upcoming marketplace milestones.
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('all')}
        >
          All Reservations ({reservations.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'active' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('active')}
        >
          Active Holds ({reservations.filter((r) => r.status === ReservationStatus.ACTIVE).length})
        </button>
      </div>

      {/* Reservation Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredReservations.map((item) => {
          const isActive = item.status === ReservationStatus.ACTIVE;

          return (
            <div key={item.id} className="card" style={{ padding: '1.5rem' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Reservation ID #{item.id}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                    {item.componentTitle}
                  </h3>
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

              {/* Peer Contact Information (Privacy Guarded) */}
              {isActive && item.sellerContact ? (
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Owner: </span>
                      <strong>{item.sellerContact.name}</strong> ({item.sellerContact.department || 'CEng'})
                    </div>
                    {item.sellerContact.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={14} color="var(--color-text-muted)" />
                        <span>{item.sellerContact.phone}</span>
                      </div>
                    )}
                    {item.sellerContact.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Mail size={14} color="var(--color-text-muted)" />
                        <span>{item.sellerContact.email}</span>
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
                    Contact details are shielded because this reservation is {item.status.toLowerCase()}. CoreHub keeps peer communications private once a hold ends.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              {isActive && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                    onClick={() => alert('Reservation cancellation will be connected in upcoming marketplace milestones.')}
                  >
                    <XCircle size={15} />
                    <span>Cancel Reservation</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => alert('Handover completion will be connected in upcoming marketplace milestones.')}
                  >
                    <CheckCircle size={15} />
                    <span>Complete Handover</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
