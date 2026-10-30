import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Clock,
  CheckCircle,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  return (
    <div style={{ padding: '1rem 0' }}>
      {/* Header section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--color-primary)',
              display: 'flex',
            }}
          >
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
              {user ? `Welcome, ${user.name}` : 'Student Dashboard'}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
              {user?.studentId ? `${user.studentId} • ` : ''}
              {user?.department || 'Faculty of Engineering'} • Manage your electronic hardware and reservations
            </p>
          </div>
        </div>
      </div>

      {/* Authenticated Status Notice */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem',
          fontSize: '0.85rem',
          color: 'var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <UserCheck size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>Authenticated Session Active:</strong> Signed in with institutional credentials. Student hardware listing creation, editing, and management are live and connected to the backend.
        </span>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              My Active Listings
            </span>
            <span
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--color-primary)',
              }}
            >
              <Cpu size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem' }}>3</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
            Available for peer reservation
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Active Reservations
            </span>
            <span
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: 'var(--color-warning)',
              }}
            >
              <Clock size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem' }}>1</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>
            Pending 24h pickup hold
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Completed Exchanges
            </span>
            <span
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--color-success)',
              }}
            >
              <CheckCircle size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem' }}>8</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Hardware successfully handed over
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Faculty Trust Score
            </span>
            <span
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                color: '#a855f7',
              }}
            >
              <ShieldCheck size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem' }}>100%</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
            Verified student record
          </span>
        </div>
      </div>

      {/* Main Content Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.75rem' }}>
        {/* Left: Quick Actions & Guidelines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Link
                to="/marketplace"
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Cpu size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Browse Hardware</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Search lab components
                  </div>
                </div>
              </Link>

              <Link
                to="/my-listings"
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--color-success)',
                  }}
                >
                  <PlusCircle size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Manage Listings</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    View & edit my items
                  </div>
                </div>
              </Link>

              <Link
                to="/my-reservations"
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: 'var(--color-warning)',
                  }}
                >
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Active Holds</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Check expiry & contact
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Peer Exchange Policy */}
          <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-subtle)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--color-primary)" />
              Faculty Peer Exchange Rules
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
              <li>Reservations lock components for 24 hours to arrange lab handover.</li>
              <li>Always inspect pins, solder joints, and voltage ratings before testing.</li>
              <li>Borrowed components must be returned to the owner upon project completion.</li>
            </ul>
          </div>
        </div>

        {/* Right: Quick Status Card */}
        <div className="card" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Reservation Notice</h3>
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              <AlertCircle size={16} />
              STM32F401 Development Board
            </div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Reserved by peer. Handover hold expires in 18 hours.
            </p>
            <Link
              to="/my-reservations"
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}
            >
              View Reservation
            </Link>
          </div>

          <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
            <Link
              to="/marketplace"
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-primary)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              Explore all components <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
