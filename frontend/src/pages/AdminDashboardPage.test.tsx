import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from './AdminDashboardPage';
import { api } from '../api/client';
import * as AuthContextModule from '../context/AuthContext';
import {
  Role,
  ComponentStatus,
  ModerationStatus,
  ReservationStatus,
  ListingType,
  AdminOverviewResponse,
  AdminUserResponse,
  AdminListingResponse,
  ReservationResponse,
  AdminAuditLogResponse,
} from '../api/types';

const mockSuperAdminUser = {
  id: 1,
  name: 'Project Owner',
  studentId: 'E/17/001',
  email: 'owner@eng.pdn.ac.lk',
  department: 'Computer Engineering',
  role: Role.SUPER_ADMIN,
  createdAt: '2026-10-01T00:00:00Z',
};

const mockOrdinaryAdminUser = {
  id: 2,
  name: 'Staff Admin',
  studentId: 'E/18/002',
  email: 'staff@eng.pdn.ac.lk',
  department: 'Computer Engineering',
  role: Role.ADMIN,
  createdAt: '2026-10-02T00:00:00Z',
};

const mockOverview: AdminOverviewResponse = {
  totalUsers: 15,
  totalAdmins: 2,
  totalSuperAdmins: 1,
  totalListings: 25,
  availableListings: 18,
  reservedListings: 4,
  exchangedListings: 3,
  moderatedListings: 2,
  totalReservations: 12,
  activeReservations: 3,
  completedReservations: 7,
  cancelledReservations: 1,
  expiredReservations: 1,
  totalAuditLogs: 2,
};

const mockUsersList: AdminUserResponse[] = [
  {
    id: 1,
    studentId: 'E/17/001',
    name: 'Project Owner',
    email: 'owner@eng.pdn.ac.lk',
    department: 'Computer Engineering',
    role: Role.SUPER_ADMIN,
    createdAt: '2026-10-01T00:00:00Z',
    listingCount: 5,
    reservationCount: 2,
  },
  {
    id: 2,
    studentId: 'E/18/002',
    name: 'Staff Admin',
    email: 'staff@eng.pdn.ac.lk',
    department: 'Computer Engineering',
    role: Role.ADMIN,
    createdAt: '2026-10-02T00:00:00Z',
    listingCount: 3,
    reservationCount: 1,
  },
  {
    id: 3,
    studentId: 'E/19/042',
    name: 'Kasun Dias',
    email: 'kasun@eng.pdn.ac.lk',
    department: 'Computer Engineering',
    role: Role.USER,
    createdAt: '2026-10-05T00:00:00Z',
    listingCount: 2,
    reservationCount: 4,
  },
];

const mockListingsList: AdminListingResponse[] = [
  {
    id: 10,
    title: 'ESP32 Wi-Fi NodeMCU Development Board',
    category: 'Wireless & IoT',
    listingType: ListingType.SELL,
    price: 2200.0,
    status: ComponentStatus.AVAILABLE,
    moderationStatus: ModerationStatus.ACTIVE,
    moderationReason: null,
    moderatedAt: null,
    moderatedBy: null,
    ownerId: 3,
    ownerName: 'Kasun Dias',
    ownerEmail: 'kasun@eng.pdn.ac.lk',
    createdAt: '2026-10-10T10:00:00Z',
  },
  {
    id: 11,
    title: 'Counterfeit FTDI USB Serial Cable',
    category: 'Lab Tools & Equipment',
    listingType: ListingType.SELL,
    price: 500.0,
    status: ComponentStatus.AVAILABLE,
    moderationStatus: ModerationStatus.SUSPENDED,
    moderationReason: 'Policy violation: Unverified or hazardous lab hardware.',
    moderatedAt: '2026-10-15T12:00:00Z',
    moderatedBy: 'staff@eng.pdn.ac.lk',
    ownerId: 3,
    ownerName: 'Kasun Dias',
    ownerEmail: 'kasun@eng.pdn.ac.lk',
    createdAt: '2026-10-12T10:00:00Z',
  },
];

const mockReservationsList: ReservationResponse[] = [
  {
    id: 101,
    componentId: 10,
    componentTitle: 'ESP32 Wi-Fi NodeMCU Development Board',
    componentCategory: 'Wireless & IoT',
    listingType: 'SELL',
    price: 2200.0,
    reservedById: 2,
    reservedByName: 'Staff Admin',
    ownerId: 3,
    ownerName: 'Kasun Dias',
    reservedAt: '2026-10-28T09:00:00Z',
    expiresAt: '2026-10-29T09:00:00Z',
    status: ReservationStatus.ACTIVE,
    sellerContact: null,
  },
];

const mockAuditLogsList: AdminAuditLogResponse[] = [
  {
    id: 501,
    actorEmail: 'owner@eng.pdn.ac.lk',
    actorRole: 'SUPER_ADMIN',
    action: 'ROLE_PROMOTION',
    targetType: 'USER',
    targetId: 2,
    details: 'Appointed staff@eng.pdn.ac.lk as ADMIN',
    timestamp: '2026-10-02T10:00:00Z',
  },
  {
    id: 502,
    actorEmail: 'staff@eng.pdn.ac.lk',
    actorRole: 'ADMIN',
    action: 'LISTING_SUSPENDED',
    targetType: 'COMPONENT',
    targetId: 11,
    details: 'Reason: Policy violation: Unverified or hazardous lab hardware.',
    timestamp: '2026-10-15T12:00:00Z',
  },
];

const renderAdminDashboard = () => {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminDashboardPage />
    </MemoryRouter>
  );
};

describe('AdminDashboardPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders overview metrics successfully for SUPER_ADMIN', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockSuperAdminUser,
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.spyOn(api.admin, 'getOverview').mockResolvedValue(mockOverview);

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'CoreHub Administration Console' })).toBeInTheDocument();
    });

    expect(screen.getByText('SUPER_ADMIN')).toBeInTheDocument();
    expect(screen.getByText('Registered Students')).toBeInTheDocument();
    expect(screen.getByText('Total Hardware Listings')).toBeInTheDocument();
    expect(screen.getByText('Peer Reservations')).toBeInTheDocument();
    expect(screen.getByText(/ordinary admins/i)).toBeInTheDocument();
    expect(screen.getByText(/18 available/i)).toBeInTheDocument();
    expect(screen.getByText(/3 active holds/i)).toBeInTheDocument();
  });

  it('allows SUPER_ADMIN to view users tab and appoint a user as ADMIN', async () => {
    const user = userEvent.setup();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockSuperAdminUser,
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.spyOn(api.admin, 'getOverview').mockResolvedValue(mockOverview);
    vi.spyOn(api.admin, 'getUsers').mockResolvedValue({
      content: mockUsersList,
      totalElements: 3,
      totalPages: 1,
      size: 50,
      page: 0,
      last: true,
    });

    const updateRoleSpy = vi.spyOn(api.admin, 'updateUserRole').mockResolvedValue({
      ...mockUsersList[2],
      role: Role.ADMIN,
    });

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-users')).toBeInTheDocument();
    });

    // Click Users tab
    await user.click(screen.getByTestId('admin-tab-users'));

    await waitFor(() => {
      expect(screen.getByText('kasun@eng.pdn.ac.lk')).toBeInTheDocument();
    });

    expect(screen.getByText(/E\/19\/042/)).toBeInTheDocument();

    // SUPER_ADMIN sees "Appoint Admin" for USER Kasun Dias
    const grantAdminBtn = screen.getByTestId('grant-admin-btn-3');
    expect(grantAdminBtn).toBeInTheDocument();

    await user.click(grantAdminBtn);

    // Modal opens
    expect(screen.getByRole('heading', { name: 'Appoint Administrator' })).toBeInTheDocument();

    // Confirm appointment
    const confirmBtn = screen.getByTestId('confirm-role-change-btn');
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(updateRoleSpy).toHaveBeenCalledWith(3, { role: Role.ADMIN });
    });
  });

  it('displays read-only role view notice and hides role change buttons for ordinary ADMIN', async () => {
    const user = userEvent.setup();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockOrdinaryAdminUser,
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.spyOn(api.admin, 'getOverview').mockResolvedValue(mockOverview);
    vi.spyOn(api.admin, 'getUsers').mockResolvedValue({
      content: mockUsersList,
      totalElements: 3,
      totalPages: 1,
      size: 50,
      page: 0,
      last: true,
    });

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-users')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('admin-tab-users'));

    await waitFor(() => {
      expect(screen.getByText('kasun@eng.pdn.ac.lk')).toBeInTheDocument();
    });

    // Read-only notice is displayed for ordinary admin
    expect(screen.getByText(/Read-Only Role View:/i)).toBeInTheDocument();
    // No role update button is rendered
    expect(screen.queryByRole('button', { name: /grant admin/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /revoke admin/i })).not.toBeInTheDocument();
  });

  it('allows moderating listings with a suspension reason', async () => {
    const user = userEvent.setup();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockOrdinaryAdminUser,
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.spyOn(api.admin, 'getOverview').mockResolvedValue(mockOverview);
    vi.spyOn(api.admin, 'getListings').mockResolvedValue({
      content: mockListingsList,
      totalElements: 2,
      totalPages: 1,
      size: 50,
      page: 0,
      last: true,
    });

    const moderateSpy = vi.spyOn(api.admin, 'moderateListing').mockResolvedValue({
      ...mockListingsList[0],
      moderationStatus: ModerationStatus.SUSPENDED,
      moderationReason: 'Contains unauthorized components',
    });

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-listings')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('admin-tab-listings'));

    await waitFor(() => {
      expect(screen.getByText('ESP32 Wi-Fi NodeMCU Development Board')).toBeInTheDocument();
    });

    // Find suspend button for the active listing
    const suspendBtn = screen.getByTestId('suspend-btn-10');
    await user.click(suspendBtn);

    // Modal opens
    expect(screen.getByRole('heading', { name: 'Suspend Listing #10' })).toBeInTheDocument();

    // Reason input is required
    const reasonInput = screen.getByLabelText(/reason for suspension/i);
    await user.type(reasonInput, 'Contains unauthorized components');

    const confirmBtn = screen.getByTestId('confirm-moderate-btn');
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(moderateSpy).toHaveBeenCalledWith(10, {
        action: 'SUSPEND',
        reason: 'Contains unauthorized components',
      });
    });
  });

  it('allows monitoring reservations and displays reservation hold records', async () => {
    const user = userEvent.setup();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockOrdinaryAdminUser,
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.spyOn(api.admin, 'getOverview').mockResolvedValue(mockOverview);
    vi.spyOn(api.admin, 'getReservations').mockResolvedValue({
      content: mockReservationsList,
      totalElements: 1,
      totalPages: 1,
      size: 50,
      page: 0,
      last: true,
    });

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-reservations')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('admin-tab-reservations'));

    await waitFor(() => {
      expect(screen.getByText('#101')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Staff Admin').length).toBe(2);
    expect(screen.getByText('Owner #3')).toBeInTheDocument();
  });

  it('renders immutable audit logs tab with event history', async () => {
    const user = userEvent.setup();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockSuperAdminUser,
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.spyOn(api.admin, 'getOverview').mockResolvedValue(mockOverview);
    vi.spyOn(api.admin, 'getAuditLogs').mockResolvedValue({
      content: mockAuditLogsList,
      totalElements: 2,
      totalPages: 1,
      size: 50,
      page: 0,
      last: true,
    });

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-audit')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('admin-tab-audit'));

    await waitFor(() => {
      expect(screen.getByText('ROLE_PROMOTION')).toBeInTheDocument();
    });

    expect(screen.getByText('LISTING_SUSPENDED')).toBeInTheDocument();
    expect(screen.getByText('Appointed staff@eng.pdn.ac.lk as ADMIN')).toBeInTheDocument();
  });
});
