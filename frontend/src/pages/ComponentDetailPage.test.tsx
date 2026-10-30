import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ComponentDetailPage } from './ComponentDetailPage';
import { api, ApiError } from '../api/client';
import {
  ComponentResponse,
  ListingType,
  ComponentStatus,
  UserResponse,
  Role,
  ReservationResponse,
  ReservationStatus,
} from '../api/types';
import * as AuthContextModule from '../context/AuthContext';

const mockComponent: ComponentResponse = {
  id: 42,
  title: 'Raspberry Pi Pico W Microcontroller',
  description: 'RP2040 dual-core ARM Cortex-M0+ with Infineon CYW43439 Wi-Fi module.',
  category: 'Microcontrollers',
  specifications: '133MHz Dual-Core, 264KB SRAM, 2MB onboard Flash, 2.4GHz 802.11n Wi-Fi',
  listingType: ListingType.SELL,
  price: 2800.0,
  status: ComponentStatus.AVAILABLE,
  ownerId: 10,
  ownerName: 'Nuwan Bandara',
  createdAt: '2026-10-25T08:30:00Z',
  updatedAt: '2026-10-25T08:30:00Z',
};

const mockCurrentUser: UserResponse = {
  id: 25,
  studentId: 'E/19/200',
  name: 'Kasun Dias',
  email: 'kasun@eng.pdn.ac.lk',
  department: 'Computer Engineering',
  role: Role.USER,
  createdAt: '2026-10-20T08:00:00Z',
};

const mockReservationResponse: ReservationResponse = {
  id: 301,
  componentId: 42,
  componentTitle: 'Raspberry Pi Pico W Microcontroller',
  componentCategory: 'Microcontrollers',
  listingType: 'SELL',
  price: 2800.0,
  reservedById: 25,
  reservedByName: 'Kasun Dias',
  ownerId: 10,
  ownerName: 'Nuwan Bandara',
  reservedAt: '2026-10-30T10:00:00Z',
  expiresAt: '2026-10-31T10:00:00Z',
  status: ReservationStatus.ACTIVE,
  sellerContact: {
    studentId: 'E/19/100',
    name: 'Nuwan Bandara',
    email: 'nuwan@eng.pdn.ac.lk',
    phone: '+94711234567',
    department: 'Electrical Engineering',
  },
};

const renderComponentDetail = (id = '42', user: UserResponse | null = null) => {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user,
    token: user ? 'mock-jwt-token' : null,
    isAuthenticated: !!user,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={[`/components/${id}`]}>
      <Routes>
        <Route path="/components/:id" element={<ComponentDetailPage />} />
        <Route path="/marketplace" element={<div>Marketplace Destination</div>} />
        <Route path="/my-reservations" element={<div>My Reservations Page</div>} />
        <Route path="/my-listings" element={<div>My Listings Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ComponentDetailPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders component details successfully with technical specifications and seller privacy protection', async () => {
    vi.spyOn(api.components, 'getById').mockResolvedValue(mockComponent);

    renderComponentDetail('42', null);

    // Loading indicator appears first
    expect(screen.getByText(/loading component details/i)).toBeInTheDocument();

    // Verify detailed fields loaded
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Raspberry Pi Pico W Microcontroller' })).toBeInTheDocument();
    });

    expect(screen.getByText('Microcontrollers')).toBeInTheDocument();
    expect(screen.getByText('SELL')).toBeInTheDocument();
    expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
    expect(screen.getByText('LKR 2800.00')).toBeInTheDocument();
    expect(screen.getByText(/RP2040 dual-core ARM Cortex-M0\+/i)).toBeInTheDocument();
    expect(screen.getByText(/133MHz Dual-Core, 264KB SRAM/i)).toBeInTheDocument();
    expect(screen.getByText('Listed by Nuwan Bandara')).toBeInTheDocument();

    // Student privacy guarantee is displayed
    expect(screen.getByText(/student privacy guarantee/i)).toBeInTheDocument();

    // Privacy verification: no private email or phone in the unreserved public component page
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+94/)).not.toBeInTheDocument();

    // Prompt to log in is shown for unauthenticated visitor
    expect(screen.getByText(/student login required/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in to reserve/i })).toHaveAttribute(
      'href',
      '/login?redirect=%2Fcomponents%2F42'
    );
  });

  it('prevents self-reservation when the authenticated student is the listing owner', async () => {
    vi.spyOn(api.components, 'getById').mockResolvedValue(mockComponent);

    // Current user id 10 matches component.ownerId 10
    const ownerUser: UserResponse = {
      ...mockCurrentUser,
      id: 10,
      name: 'Nuwan Bandara',
      email: 'nuwan@eng.pdn.ac.lk',
    };

    renderComponentDetail('42', ownerUser);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Raspberry Pi Pico W Microcontroller' })).toBeInTheDocument();
    });

    // Owner alert is displayed
    expect(screen.getByText(/your component listing/i)).toBeInTheDocument();
    expect(screen.getByText(/students cannot reserve their own components/i)).toBeInTheDocument();

    // Link to My Listings is available
    expect(screen.getByRole('link', { name: /manage in my listings/i })).toHaveAttribute('href', '/my-listings');

    // Reserve button is NOT shown
    expect(screen.queryByTestId('reserve-component-btn')).not.toBeInTheDocument();
  });

  it('allows authenticated peer student to reserve available component and unlocks seller contact', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.components, 'getById').mockResolvedValue(mockComponent);
    const createReservationSpy = vi
      .spyOn(api.reservations, 'create')
      .mockResolvedValue(mockReservationResponse);

    renderComponentDetail('42', mockCurrentUser);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Raspberry Pi Pico W Microcontroller' })).toBeInTheDocument();
    });

    const reserveBtn = screen.getByTestId('reserve-component-btn');
    expect(reserveBtn).toBeInTheDocument();

    // Click Reserve Component button to open modal
    await user.click(reserveBtn);

    // Modal opens
    expect(screen.getByRole('heading', { name: /confirm 24-hour reservation/i })).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to place a 24-hour peer hold/i)).toBeInTheDocument();

    // Confirm reservation in modal
    const confirmBtn = screen.getByTestId('confirm-reserve-btn');
    await user.click(confirmBtn);

    // Verify API called with exact component ID
    expect(createReservationSpy).toHaveBeenCalledWith({ componentId: 42 });

    // Success banner is displayed
    await waitFor(() => {
      expect(screen.getByTestId('reservation-success-card')).toBeInTheDocument();
    });
    expect(screen.getByText(/24-hour hold confirmed!/i)).toBeInTheDocument();
    expect(screen.getByText(/reservation #301 has been created/i)).toBeInTheDocument();

    // Seller contact information is now unlocked
    expect(screen.getByTestId('unlocked-seller-contact')).toBeInTheDocument();
    expect(screen.getByText('Nuwan Bandara')).toBeInTheDocument();
    expect(screen.getByText('E/19/100')).toBeInTheDocument();
    expect(screen.getByText('nuwan@eng.pdn.ac.lk')).toBeInTheDocument();
    expect(screen.getByText('+94711234567')).toBeInTheDocument();
    expect(screen.getByText('Electrical Engineering')).toBeInTheDocument();

    // Link to My Reservations is available
    expect(screen.getByRole('link', { name: /view in my reservations/i })).toHaveAttribute('href', '/my-reservations');
  });

  it('handles reservation conflict (HTTP 409) when component was already reserved by another peer', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.components, 'getById').mockResolvedValue(mockComponent);
    vi.spyOn(api.reservations, 'create').mockRejectedValue(
      new ApiError('Listing already has an active reservation', 409)
    );

    renderComponentDetail('42', mockCurrentUser);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Raspberry Pi Pico W Microcontroller' })).toBeInTheDocument();
    });

    const reserveBtn = screen.getByTestId('reserve-component-btn');
    await user.click(reserveBtn);

    const confirmBtn = screen.getByTestId('confirm-reserve-btn');
    await user.click(confirmBtn);

    // Conflict error message is shown in modal and card
    await waitFor(() => {
      expect(
        screen.getByText(/reservation conflict: this component listing is no longer available or was already reserved/i)
      ).toBeInTheDocument();
    });
  });

  it('displays listing not found error when backend returns HTTP 404', async () => {
    vi.spyOn(api.components, 'getById').mockRejectedValue(
      new ApiError('Component listing not found with ID: 999', 404)
    );

    renderComponentDetail('999', null);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /listing not found/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/component listing not found with ID: 999/i)).toBeInTheDocument();
  });

  it('rejects invalid non-numeric or non-positive IDs without calling API', async () => {
    const getByIdSpy = vi.spyOn(api.components, 'getById');

    renderComponentDetail('invalid-alphanumeric-id', null);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /invalid component id/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/invalid component identifier in url/i)).toBeInTheDocument();
    expect(getByIdSpy).not.toHaveBeenCalled();
  });

  it('handles backend API failure with retry capability', async () => {
    const user = userEvent.setup();
    const getByIdSpy = vi
      .spyOn(api.components, 'getById')
      .mockRejectedValueOnce(new ApiError('Internal Server Error', 500))
      .mockResolvedValueOnce(mockComponent);

    renderComponentDetail('42', null);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /listing not found/i })).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Raspberry Pi Pico W Microcontroller' })).toBeInTheDocument();
    });

    expect(getByIdSpy).toHaveBeenCalledTimes(2);
  });
});
