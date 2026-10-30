import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Layers,
  Bookmark,
  FileText,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  X,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import {
  Role,
  ComponentStatus,
  ModerationStatus,
  ReservationStatus,
  AdminOverviewResponse,
  AdminUserResponse,
  AdminListingResponse,
  ReservationResponse,
  AdminAuditLogResponse,
} from '../api/types';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

type AdminTab = 'overview' | 'users' | 'listings' | 'reservations' | 'audit';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Overview State
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [usersTotal, setUsersTotal] = useState<number>(0);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');

  // Listings State
  const [listings, setListings] = useState<AdminListingResponse[]>([]);
  const [listingsTotal, setListingsTotal] = useState<number>(0);
  const [listingsLoading, setListingsLoading] = useState<boolean>(false);
  const [listingSearch, setListingSearch] = useState<string>('');
  const [listingStatusFilter, setListingStatusFilter] = useState<string>('ALL');
  const [listingModFilter, setListingModFilter] = useState<string>('ALL');

  // Reservations State
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [reservationsTotal, setReservationsTotal] = useState<number>(0);
  const [reservationsLoading, setReservationsLoading] = useState<boolean>(false);
  const [resStatusFilter, setResStatusFilter] = useState<string>('ALL');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogResponse[]>([]);
  const [auditLogsTotal, setAuditLogsTotal] = useState<number>(0);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  // Modals State
  const [roleChangeTarget, setRoleChangeTarget] = useState<AdminUserResponse | null>(null);
  const [targetNewRole, setTargetNewRole] = useState<Role | null>(null);
  const [roleModalLoading, setRoleModalLoading] = useState<boolean>(false);
  const [roleModalError, setRoleModalError] = useState<string | null>(null);

  const [moderateTarget, setModerateTarget] = useState<AdminListingResponse | null>(null);
  const [moderateAction, setModerateAction] = useState<'SUSPEND' | 'REINSTATE'>('SUSPEND');
  const [moderateReason, setModerateReason] = useState<string>('');
  const [moderateModalLoading, setModerateModalLoading] = useState<boolean>(false);
  const [moderateModalError, setModerateModalError] = useState<string | null>(null);

  // Fetch Overview
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const data = await api.admin.getOverview();
      setOverview(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setOverviewError(err.message || 'Failed to load administrative overview metrics.');
      } else if (err instanceof Error) {
        setOverviewError(err.message);
      } else {
        setOverviewError('An unexpected error occurred while loading overview.');
      }
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const roleParam = userRoleFilter !== 'ALL' ? (userRoleFilter as Role) : undefined;
      const data = await api.admin.getUsers({
        search: userSearch.trim() || undefined,
        role: roleParam,
        page: 0,
        size: 50,
      });
      setUsers(data.content);
      setUsersTotal(data.totalElements);
    } catch (err: unknown) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch, userRoleFilter]);

  // Fetch Listings
  const fetchListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      const statusParam = listingStatusFilter !== 'ALL' ? (listingStatusFilter as ComponentStatus) : undefined;
      const modParam = listingModFilter !== 'ALL' ? (listingModFilter as ModerationStatus) : undefined;
      const data = await api.admin.getListings({
        search: listingSearch.trim() || undefined,
        status: statusParam,
        moderationStatus: modParam,
        page: 0,
        size: 50,
      });
      setListings(data.content);
      setListingsTotal(data.totalElements);
    } catch (err: unknown) {
      console.error('Failed to load listings:', err);
    } finally {
      setListingsLoading(false);
    }
  }, [listingSearch, listingStatusFilter, listingModFilter]);

  // Fetch Reservations
  const fetchReservations = useCallback(async () => {
    setReservationsLoading(true);
    try {
      const statusParam = resStatusFilter !== 'ALL' ? (resStatusFilter as ReservationStatus) : undefined;
      const data = await api.admin.getReservations({
        status: statusParam,
        page: 0,
        size: 50,
      });
      setReservations(data.content);
      setReservationsTotal(data.totalElements);
    } catch (err: unknown) {
      console.error('Failed to load reservations:', err);
    } finally {
      setReservationsLoading(false);
    }
  }, [resStatusFilter]);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const data = await api.admin.getAuditLogs({ page: 0, size: 50 });
      setAuditLogs(data.content);
      setAuditLogsTotal(data.totalElements);
    } catch (err: unknown) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'listings') fetchListings();
    else if (activeTab === 'reservations') fetchReservations();
    else if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, fetchUsers, fetchListings, fetchReservations, fetchAuditLogs]);

  // Role Change Modal Handlers
  const handleOpenRoleModal = (targetUser: AdminUserResponse, newRole: Role) => {
    setRoleChangeTarget(targetUser);
    setTargetNewRole(newRole);
    setRoleModalError(null);
  };

  const handleCloseRoleModal = () => {
    if (!roleModalLoading) {
      setRoleChangeTarget(null);
      setTargetNewRole(null);
      setRoleModalError(null);
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget || !targetNewRole) return;

    setRoleModalLoading(true);
    setRoleModalError(null);

    try {
      const updated = await api.admin.updateUserRole(roleChangeTarget.id, { role: targetNewRole });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      handleCloseRoleModal();
      fetchOverview();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setRoleModalError(err.message || 'Failed to update administrative role.');
      } else if (err instanceof Error) {
        setRoleModalError(err.message);
      } else {
        setRoleModalError('An unexpected error occurred.');
      }
    } finally {
      setRoleModalLoading(false);
    }
  };

  // Moderation Modal Handlers
  const handleOpenModerateModal = (listing: AdminListingResponse, action: 'SUSPEND' | 'REINSTATE') => {
    setModerateTarget(listing);
    setModerateAction(action);
    setModerateReason('');
    setModerateModalError(null);
  };

  const handleCloseModerateModal = () => {
    if (!moderateModalLoading) {
      setModerateTarget(null);
      setModerateModalError(null);
    }
  };

  const handleConfirmModerate = async () => {
    if (!moderateTarget) return;

    setModerateModalLoading(true);
    setModerateModalError(null);

    try {
      const updated = await api.admin.moderateListing(moderateTarget.id, {
        action: moderateAction,
        reason: moderateReason.trim() || undefined,
      });
      setListings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      handleCloseModerateModal();
      fetchOverview();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setModerateModalError(err.message || 'Failed to execute moderation action.');
      } else if (err instanceof Error) {
        setModerateModalError(err.message);
      } else {
        setModerateModalError('An unexpected error occurred during moderation.');
      }
    } finally {
      setModerateModalLoading(false);
    }
  };

  const getRoleBadge = (role: Role) => {
    if (role === Role.SUPER_ADMIN) {
      return (
        <span
          className="badge"
          style={{
            backgroundColor: '#f3e8ff',
            color: '#6b21a8',
            borderColor: '#c084fc',
            fontWeight: 700,
          }}
        >
          SUPER_ADMIN
        </span>
      );
    }
    if (role === Role.ADMIN) {
      return <span className="badge badge-borrow">ADMIN</span>;
    }
    return <span className="badge badge-neutral">USER</span>;
  };

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      {/* Admin Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Shield size={28} color="var(--color-primary)" />
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: 0, color: 'var(--color-primary-900)' }}>
              CoreHub Administration Console
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Authenticated Administrator: <strong>{user?.name}</strong> ({user?.email})
            </span>
            {user?.role && getRoleBadge(user.role)}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => {
            fetchOverview();
            if (activeTab === 'users') fetchUsers();
            else if (activeTab === 'listings') fetchListings();
            else if (activeTab === 'reservations') fetchReservations();
            else if (activeTab === 'audit') fetchAuditLogs();
          }}
          title="Refresh dashboard data"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <RefreshCw size={15} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Admin Primary Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid var(--color-border)',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          data-testid="admin-tab-overview"
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'overview' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'overview' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '-2px',
          }}
        >
          <ShieldCheck size={17} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          data-testid="admin-tab-users"
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'users' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'users' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '-2px',
          }}
        >
          <Users size={17} />
          <span>Users & Roles</span>
          {overview && (
            <span
              style={{
                backgroundColor: activeTab === 'users' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                color: activeTab === 'users' ? '#ffffff' : 'var(--color-text-muted)',
                fontSize: '0.75rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontWeight: 600,
              }}
            >
              {overview.totalUsers}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          data-testid="admin-tab-listings"
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'listings' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'listings' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '-2px',
          }}
        >
          <Layers size={17} />
          <span>Listings Moderation</span>
          {overview && (
            <span
              style={{
                backgroundColor: activeTab === 'listings' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                color: activeTab === 'listings' ? '#ffffff' : 'var(--color-text-muted)',
                fontSize: '0.75rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontWeight: 600,
              }}
            >
              {overview.totalListings}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reservations')}
          data-testid="admin-tab-reservations"
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'reservations' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'reservations' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '-2px',
          }}
        >
          <Bookmark size={17} />
          <span>Reservations Oversight</span>
          {overview && (
            <span
              style={{
                backgroundColor: activeTab === 'reservations' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                color: activeTab === 'reservations' ? '#ffffff' : 'var(--color-text-muted)',
                fontSize: '0.75rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontWeight: 600,
              }}
            >
              {overview.totalReservations}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          data-testid="admin-tab-audit"
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'audit' ? '3px solid var(--color-primary)' : '3px solid transparent',
            color: activeTab === 'audit' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '-2px',
          }}
        >
          <FileText size={17} />
          <span>Audit Log</span>
          {overview && (
            <span
              style={{
                backgroundColor: activeTab === 'audit' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                color: activeTab === 'audit' ? '#ffffff' : 'var(--color-text-muted)',
                fontSize: '0.75rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontWeight: 600,
              }}
            >
              {overview.totalAuditLogs}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div>
          {overviewLoading ? (
            <LoadingState message="Loading administrative metrics..." />
          ) : overviewError ? (
            <ErrorState title="Overview Unavailable" message={overviewError} onRetry={fetchOverview} />
          ) : overview ? (
            <div>
              {/* Metric Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2rem',
                }}
              >
                {/* Users Card */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      Registered Students
                    </span>
                    <span style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)' }}>
                      <Users size={18} />
                    </span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--color-primary-900)' }}>
                    {overview.totalUsers}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    <strong>{overview.totalAdmins}</strong> ordinary admins • <strong>{overview.totalSuperAdmins}</strong> project owner
                  </div>
                </div>

                {/* Listings Card */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      Total Hardware Listings
                    </span>
                    <span style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                      <Layers size={18} />
                    </span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--color-primary-900)' }}>
                    {overview.totalListings}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{overview.availableListings} available</span> • {overview.reservedListings} reserved • {overview.exchangedListings} exchanged
                  </div>
                </div>

                {/* Reservations Card */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      Peer Reservations
                    </span>
                    <span style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
                      <Bookmark size={18} />
                    </span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--color-primary-900)' }}>
                    {overview.totalReservations}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>{overview.activeReservations} active holds</span> • {overview.completedReservations} completed
                  </div>
                </div>

                {/* Moderated & Audits Card */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      Moderation & Audits
                    </span>
                    <span style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }}>
                      <ShieldAlert size={18} />
                    </span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: overview.moderatedListings > 0 ? 'var(--color-danger)' : 'var(--color-primary-900)' }}>
                    {overview.moderatedListings}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    suspended listings • <strong>{overview.totalAuditLogs}</strong> audit entries recorded
                  </div>
                </div>
              </div>

              {/* Administrative Policy Notice */}
              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 700, color: 'var(--color-primary-900)' }}>
                  <ShieldCheck size={18} color="var(--color-primary)" />
                  <span>Security & Multi-Admin Architecture Policy</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
                  <li>
                    <strong>Single SUPER_ADMIN Authority:</strong> Exactly one SUPER_ADMIN account is permitted in CoreHub, anchored to the verified project owner.
                  </li>
                  <li>
                    <strong>Delegated Administration:</strong> The project owner can appoint ordinary ADMIN users to assist with hardware catalog oversight and reversible moderation.
                  </li>
                  <li>
                    <strong>Strict Privilege Isolation:</strong> Ordinary administrators cannot appoint other administrators, promote themselves, or alter the SUPER_ADMIN account.
                  </li>
                  <li>
                    <strong>Reversible Moderation:</strong> Moderating a listing suspends public marketplace visibility while strictly preserving existing reservation history and referential database integrity.
                  </li>
                  <li>
                    <strong>Immutable Audit Trail:</strong> Every administrative action, role modification, and listing moderation event is permanently persisted to the system audit log.
                  </li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: USERS & ROLE MANAGEMENT */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Showing {users.length} of {usersTotal} registered student accounts
            </span>
          </div>
          {/* Controls bar */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 260px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by student name, email, or student ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="var(--color-text-muted)" />
              <select
                className="form-select"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="ALL">All Roles</option>
                <option value="USER">Student Users</option>
                <option value="ADMIN">Ordinary Admins</option>
                <option value="SUPER_ADMIN">Project Owner (SUPER_ADMIN)</option>
              </select>
            </div>
          </div>

          {/* Role management notice for ordinary admin */}
          {!isSuperAdmin && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                color: 'var(--color-warning)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Read-Only Role View:</strong> Administrative role appointment and revocation are reserved exclusively for the project owner (SUPER_ADMIN).
              </span>
            </div>
          )}

          {/* Users Table */}
          {usersLoading ? (
            <LoadingState message="Loading registered student accounts..." />
          ) : users.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <Users size={32} style={{ color: 'var(--color-text-subtle)', margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>No users found</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                No accounts match the specified search or role filter criteria.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-subtle)' }}>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Student Identity</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Email & Department</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Role</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Listings</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Reservations</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Registered</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => {
                    const isSelf = user?.id === item.id;
                    const isItemSuperAdmin = item.role === Role.SUPER_ADMIN;

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-primary-900)' }}>{item.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: {item.studentId}</div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div>{item.email}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.department || 'CEng'}</div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {getRoleBadge(item.role)}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>{item.listingCount}</td>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>{item.reservationCount}</td>
                        <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                          {isItemSuperAdmin ? (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b21a8' }}>Primary Owner</span>
                          ) : isSelf ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>You</span>
                          ) : isSuperAdmin ? (
                            item.role === Role.USER ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() => handleOpenRoleModal(item, Role.ADMIN)}
                                style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem' }}
                                data-testid={`grant-admin-btn-${item.id}`}
                              >
                                <UserCheck size={14} />
                                <span>Appoint Admin</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() => handleOpenRoleModal(item, Role.USER)}
                                style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                                data-testid={`revoke-admin-btn-${item.id}`}
                              >
                                <UserX size={14} />
                                <span>Revoke Admin</span>
                              </button>
                            )
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LISTINGS MODERATION */}
      {activeTab === 'listings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Showing {listings.length} of {listingsTotal} marketplace hardware listings
            </span>
          </div>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search listing title, category, description..."
                value={listingSearch}
                onChange={(e) => setListingSearch(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Status:</span>
              <select
                className="form-select"
                value={listingStatusFilter}
                onChange={(e) => setListingStatusFilter(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RESERVED">RESERVED</option>
                <option value="EXCHANGED">EXCHANGED</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Moderation:</span>
              <select
                className="form-select"
                value={listingModFilter}
                onChange={(e) => setListingModFilter(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="ALL">All Listings</option>
                <option value="ACTIVE">Active (Public)</option>
                <option value="SUSPENDED">Suspended (Moderated)</option>
              </select>
            </div>
          </div>

          {/* Listings Table */}
          {listingsLoading ? (
            <LoadingState message="Loading catalog listings for oversight..." />
          ) : listings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <Layers size={32} style={{ color: 'var(--color-text-subtle)', margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>No listings found</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                No hardware components match the specified filter criteria.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-subtle)' }}>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Component Listing</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Owner</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Format / Price</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Moderation</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((item) => {
                    const isSuspended = item.moderationStatus === ModerationStatus.SUSPENDED;

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.875rem 1rem', maxWidth: '280px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-primary-900)' }}>
                            <Link to={`/components/${item.id}`} style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>{item.title}</span>
                              <ArrowUpRight size={13} />
                            </Link>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            ID #{item.id} • {item.category}
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div>{item.ownerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.ownerEmail}</div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>{item.listingType}</span>
                          {item.price != null && (
                            <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>
                              LKR {item.price.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span className={`badge ${item.status === ComponentStatus.AVAILABLE ? 'badge-available' : item.status === ComponentStatus.RESERVED ? 'badge-warning' : 'badge-exchanged'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {isSuspended ? (
                            <div>
                              <span className="badge badge-danger">SUSPENDED</span>
                              {item.moderationReason && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.2rem' }}>
                                  {item.moderationReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="badge badge-success">ACTIVE</span>
                          )}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                          {isSuspended ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => handleOpenModerateModal(item, 'REINSTATE')}
                              style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem', color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                              data-testid={`reinstate-btn-${item.id}`}
                            >
                              <CheckCircle size={14} />
                              <span>Reinstate</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => handleOpenModerateModal(item, 'SUSPEND')}
                              style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                              data-testid={`suspend-btn-${item.id}`}
                            >
                              <XCircle size={14} />
                              <span>Suspend</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RESERVATIONS OVERSIGHT */}
      {activeTab === 'reservations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Status Filter:</span>
              <select
                className="form-select"
                value={resStatusFilter}
                onChange={(e) => setResStatusFilter(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="ALL">All Reservations</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Showing {reservations.length} of {reservationsTotal} reservations
            </span>
          </div>

          {reservationsLoading ? (
            <LoadingState message="Loading peer reservations for monitoring..." />
          ) : reservations.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <Bookmark size={32} style={{ color: 'var(--color-text-subtle)', margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>No reservations found</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                No reservation records match the specified status filter.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-subtle)' }}>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Hold Record</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Component</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Borrower</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Owner</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Timing / Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontWeight: 600 }}>#{item.id}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <Link to={`/components/${item.componentId}`} style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                          {item.componentTitle}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {item.componentCategory} • {item.listingType}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div>{item.reservedByName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Student #{item.reservedById}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div>{item.ownerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Owner #{item.ownerId}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span className={`badge ${item.status === ReservationStatus.ACTIVE ? 'badge-warning' : item.status === ReservationStatus.COMPLETED ? 'badge-success' : 'badge-neutral'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <div>Created: {new Date(item.reservedAt).toLocaleString()}</div>
                        {item.expiresAt && <div>Expires: {new Date(item.expiresAt).toLocaleString()}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Showing {auditLogs.length} of {auditLogsTotal} recorded administrative events
            </span>
          </div>
          {auditLoading ? (
            <LoadingState message="Loading administrative audit history..." />
          ) : auditLogs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <FileText size={32} style={{ color: 'var(--color-text-subtle)', margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>No audit records found</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                Administrative actions will appear here once executed.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-subtle)' }}>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Timestamp</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Actor</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Action</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Target</th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Action Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 600 }}>{item.actorEmail}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Role: {item.actorRole}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                          {item.action}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem' }}>
                        {item.targetType} #{item.targetId}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-main)' }}>
                        {item.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ROLE CHANGE CONFIRMATION MODAL */}
      {roleChangeTarget && targetNewRole && (
        <div
          className="modal-backdrop"
          onClick={handleCloseRoleModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--color-primary)" />
                <h2 id="role-modal-title" className="modal-title" style={{ fontSize: '1.2rem' }}>
                  {targetNewRole === Role.ADMIN ? 'Appoint Administrator' : 'Revoke Administrator Privileges'}
                </h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseRoleModal}
                disabled={roleModalLoading}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {roleModalError && (
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
                  <AlertCircle size={16} />
                  <div>{roleModalError}</div>
                </div>
              )}

              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                {targetNewRole === Role.ADMIN
                  ? `Are you sure you want to appoint ${roleChangeTarget.name} (${roleChangeTarget.email}) as an ordinary ADMIN?`
                  : `Are you sure you want to revoke administrator privileges from ${roleChangeTarget.name} (${roleChangeTarget.email}) and return them to standard student USER status?`}
              </p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                This action is permanently logged to the system audit trail and will immediately take effect.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCloseRoleModal}
                disabled={roleModalLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${targetNewRole === Role.ADMIN ? 'btn-primary' : 'btn-danger'}`}
                onClick={handleConfirmRoleChange}
                disabled={roleModalLoading}
                data-testid="confirm-role-change-btn"
              >
                {roleModalLoading ? 'Updating...' : targetNewRole === Role.ADMIN ? 'Confirm Appointment' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODERATION ACTION MODAL */}
      {moderateTarget && (
        <div
          className="modal-backdrop"
          onClick={handleCloseModerateModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="moderate-modal-title"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} color={moderateAction === 'SUSPEND' ? 'var(--color-danger)' : 'var(--color-success)'} />
                <h2 id="moderate-modal-title" className="modal-title" style={{ fontSize: '1.2rem' }}>
                  {moderateAction === 'SUSPEND' ? `Suspend Listing #${moderateTarget.id}` : `Reinstate Listing #${moderateTarget.id}`}
                </h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseModerateModal}
                disabled={moderateModalLoading}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {moderateModalError && (
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
                  <AlertCircle size={16} />
                  <div>{moderateModalError}</div>
                </div>
              )}

              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>
                Listing: <strong>{moderateTarget.title}</strong> (Owner: {moderateTarget.ownerName})
              </p>

              {moderateAction === 'SUSPEND' ? (
                <>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    Suspending this component listing will hide it from the public marketplace and prevent any new reservations. Existing reservations remain preserved in the database.
                  </p>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="mod-reason" className="form-label">
                      Reason for Suspension (required):
                    </label>
                    <textarea
                      id="mod-reason"
                      className="form-textarea"
                      rows={3}
                      placeholder="e.g. Hazardous lithium battery without safety documentation, duplicate listing, policy violation..."
                      value={moderateReason}
                      onChange={(e) => setModerateReason(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Reinstating this listing will restore its active moderation status, allowing students to view and reserve it again in the public marketplace.
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCloseModerateModal}
                disabled={moderateModalLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${moderateAction === 'SUSPEND' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleConfirmModerate}
                disabled={moderateModalLoading || (moderateAction === 'SUSPEND' && !moderateReason.trim())}
                data-testid="confirm-moderate-btn"
              >
                {moderateModalLoading ? 'Saving...' : moderateAction === 'SUSPEND' ? 'Confirm Suspension' : 'Confirm Reinstatement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
