import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MyReservationsPage } from './MyReservationsPage';
import { api, ApiError } from '../api/client';
import { ReservationResponse, ReservationStatus } from '../api/types';

const mockBorrowedReservations: ReservationResponse[] = [
  {
    id: 101,
    componentId: 50,
    componentTitle: 'STM32F401 Black Pill Board',
    componentCategory: 'Microcontrollers',
    listingType: 'BORROW',
    price: null,
    reservedById: 1,
    reservedByName: 'Chamod Perera',
    ownerId: 2,
    ownerName: 'Nuwan Bandara',
    reservedAt: '2026-10-30T08:00:00Z',
    expiresAt: '2026-10-31T08:00:00Z',
    status: ReservationStatus.ACTIVE,
    sellerContact: {
      studentId: 'E/19/042',
      name: 'Nuwan Bandara',
      email: 'nuwan@eng.pdn.ac.lk',
      phone: '+94771234567',
      department: 'Computer Engineering',
    },
  },
  {
    id: 102,
    componentId: 51,
    componentTitle: 'ESP32 NodeMCU Wi-Fi + Bluetooth',
    componentCategory: 'Wireless & IoT',
    listingType: 'SWAP',
    price: null,
    reservedById: 1,
    reservedByName: 'Chamod Perera',
    ownerId: 3,
    ownerName: 'Sahan Wickrama',
    reservedAt: '2026-10-25T14:00:00Z',
    expiresAt: '2026-10-26T14:00:00Z',
    status: ReservationStatus.COMPLETED,
    sellerContact: null,
  },
  {
    id: 103,
    componentId: 52,
    componentTitle: 'Digital Logic Analyzer 8ch 24MHz',
    componentCategory: 'Lab & Prototyping',
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

const mockReceivedReservations: ReservationResponse[] = [
  {
    id: 201,
    componentId: 60,
    componentTitle: 'Arduino Uno R3 Microcontroller',
    componentCategory: 'Microcontrollers',
    listingType: 'SELL',
    price: 3500.0,
    reservedById: 5,
    reservedByName: 'Kasun Dias',
    ownerId: 1,
    ownerName: 'Chamod Perera',
    reservedAt: '2026-10-30T09:30:00Z',
    expiresAt: '2026-10-31T09:30:00Z',
    status: ReservationStatus.ACTIVE,
    sellerContact: null,
  },
];

const renderMyReservations = () => {
  return render(
    <MemoryRouter initialEntries={['/my-reservations']}>
      <Routes>
        <Route path="/my-reservations" element={<MyReservationsPage />} />
        <Route path="/components/:id" element={<div>Component Detail Page</div>} />
        <Route path="/marketplace" element={<div>Marketplace Page</div>} />
        <Route path="/my-listings" element={<div>My Listings Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('MyReservationsPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders borrowed reservations with real data, status badges, and unlocked contact for active holds', async () => {
    vi.spyOn(api.reservations, 'getMy').mockResolvedValue(mockBorrowedReservations);
    vi.spyOn(api.reservations, 'getReceived').mockResolvedValue(mockReceivedReservations);

    renderMyReservations();

    expect(screen.getByText(/loading your reservation history/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'My Reservations' })).toBeInTheDocument();
    });

    // Check primary perspective counts
    expect(screen.getByTestId('tab-borrowed-holds')).toBeInTheDocument();
    expect(screen.getByTestId('tab-received-holds')).toBeInTheDocument();

    // Check items in Borrowed Holds view
    expect(screen.getByText('STM32F401 Black Pill Board')).toBeInTheDocument();
    expect(screen.getByText('ESP32 NodeMCU Wi-Fi + Bluetooth')).toBeInTheDocument();
    expect(screen.getByText('Digital Logic Analyzer 8ch 24MHz')).toBeInTheDocument();

    // Status badges
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('EXPIRED')).toBeInTheDocument();

    // For active hold: seller contact info is unlocked
    expect(screen.getByText(/exchange partner contact \(unlocked during active hold\)/i)).toBeInTheDocument();
    expect(screen.getByText('Nuwan Bandara')).toBeInTheDocument();
    expect(screen.getByText('E/19/042')).toBeInTheDocument();
    expect(screen.getByText('nuwan@eng.pdn.ac.lk')).toBeInTheDocument();
    expect(screen.getByText('+94771234567')).toBeInTheDocument();

    // For completed/expired hold: privacy shield message is shown
    expect(screen.getAllByText(/seller contact details are shielded because this reservation is/i).length).toBe(2);

    // Cancel action is available for active hold
    expect(screen.getByTestId('cancel-btn-101')).toBeInTheDocument();
  });

  it('cancels an active borrowed reservation upon student confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.reservations, 'getMy').mockResolvedValue(mockBorrowedReservations);
    vi.spyOn(api.reservations, 'getReceived').mockResolvedValue(mockReceivedReservations);

    const cancelledResponse: ReservationResponse = {
      ...mockBorrowedReservations[0],
      status: ReservationStatus.CANCELLED,
      sellerContact: null,
    };
    const cancelSpy = vi.spyOn(api.reservations, 'cancel').mockResolvedValue(cancelledResponse);

    renderMyReservations();

    await waitFor(() => {
      expect(screen.getByText('STM32F401 Black Pill Board')).toBeInTheDocument();
    });

    // Click Cancel Reservation
    const cancelBtn = screen.getByTestId('cancel-btn-101');
    await user.click(cancelBtn);

    // Modal appears
    expect(screen.getByRole('heading', { name: /cancel reservation #101/i })).toBeInTheDocument();
    expect(screen.getByText(/the component will immediately return to/i)).toBeInTheDocument();

    // Confirm Cancellation
    const confirmBtn = screen.getByTestId('confirm-cancel-btn');
    await user.click(confirmBtn);

    expect(cancelSpy).toHaveBeenCalledWith(101);

    // After cancellation, badge updates and cancel button is gone for this item
    await waitFor(() => {
      expect(screen.queryByTestId('cancel-btn-101')).not.toBeInTheDocument();
    });
  });

  it('switches to Received on My Listings perspective and allows completing handover', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.reservations, 'getMy').mockResolvedValue(mockBorrowedReservations);
    vi.spyOn(api.reservations, 'getReceived').mockResolvedValue(mockReceivedReservations);

    const completedResponse: ReservationResponse = {
      ...mockReceivedReservations[0],
      status: ReservationStatus.COMPLETED,
    };
    const completeSpy = vi.spyOn(api.reservations, 'complete').mockResolvedValue(completedResponse);

    renderMyReservations();

    await waitFor(() => {
      expect(screen.getByText('STM32F401 Black Pill Board')).toBeInTheDocument();
    });

    // Switch to Received on My Listings
    const receivedTab = screen.getByTestId('tab-received-holds');
    await user.click(receivedTab);

    // View component in received list
    expect(screen.getByText('Arduino Uno R3 Microcontroller')).toBeInTheDocument();
    expect(screen.getByText(/reserved by peer student:/i)).toBeInTheDocument();
    expect(screen.getByText(/kasun dias/i)).toBeInTheDocument();
    expect(screen.getByText('Price: LKR 3500.00')).toBeInTheDocument();

    // Complete Handover button is present for listing owner
    const completeBtn = screen.getByTestId('complete-btn-201');
    expect(completeBtn).toBeInTheDocument();

    await user.click(completeBtn);

    // Modal appears
    expect(screen.getByRole('heading', { name: /complete handover #201/i })).toBeInTheDocument();
    expect(screen.getByText(/mark the listing as/i)).toBeInTheDocument();

    // Confirm Handover
    const confirmCompleteBtn = screen.getByTestId('confirm-complete-btn');
    await user.click(confirmCompleteBtn);

    expect(completeSpy).toHaveBeenCalledWith(201);

    // After completion, complete button is gone
    await waitFor(() => {
      expect(screen.queryByTestId('complete-btn-201')).not.toBeInTheDocument();
    });
  });

  it('filters reservations by status tabs (Active, Completed, Expired)', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.reservations, 'getMy').mockResolvedValue(mockBorrowedReservations);
    vi.spyOn(api.reservations, 'getReceived').mockResolvedValue(mockReceivedReservations);

    renderMyReservations();

    await waitFor(() => {
      expect(screen.getByText('STM32F401 Black Pill Board')).toBeInTheDocument();
    });

    // Click Active filter
    const activeFilterBtn = screen.getByRole('button', { name: /^Active/i });
    await user.click(activeFilterBtn);

    expect(screen.getByText('STM32F401 Black Pill Board')).toBeInTheDocument();
    expect(screen.queryByText('ESP32 NodeMCU Wi-Fi + Bluetooth')).not.toBeInTheDocument();
    expect(screen.queryByText('Digital Logic Analyzer 8ch 24MHz')).not.toBeInTheDocument();

    // Click Completed filter
    const completedFilterBtn = screen.getByRole('button', { name: /^Completed/i });
    await user.click(completedFilterBtn);

    expect(screen.getByText('ESP32 NodeMCU Wi-Fi + Bluetooth')).toBeInTheDocument();
    expect(screen.queryByText('STM32F401 Black Pill Board')).not.toBeInTheDocument();
  });

  it('displays empty state when no reservations match the selected filter', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.reservations, 'getMy').mockResolvedValue([]);
    vi.spyOn(api.reservations, 'getReceived').mockResolvedValue([]);

    renderMyReservations();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /no reservations found/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /explore marketplace/i })).toHaveAttribute('href', '/marketplace');

    // Switch to received tab
    const receivedTab = screen.getByTestId('tab-received-holds');
    await user.click(receivedTab);

    expect(screen.getByRole('link', { name: /manage my listings/i })).toHaveAttribute('href', '/my-listings');
  });

  it('handles backend 409 conflict when cancelling an expired reservation and triggers refresh', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.reservations, 'getMy').mockResolvedValue(mockBorrowedReservations);
    vi.spyOn(api.reservations, 'getReceived').mockResolvedValue(mockReceivedReservations);
    vi.spyOn(api.reservations, 'cancel').mockRejectedValue(
      new ApiError('Reservation has expired and cannot be cancelled', 409)
    );

    renderMyReservations();

    await waitFor(() => {
      expect(screen.getByText('STM32F401 Black Pill Board')).toBeInTheDocument();
    });

    const cancelBtn = screen.getByTestId('cancel-btn-101');
    await user.click(cancelBtn);

    const confirmBtn = screen.getByTestId('confirm-cancel-btn');
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/this reservation has already expired or changed status\. refreshing data\.\.\./i)
      ).toBeInTheDocument();
    });
  });

  it('displays error state on network failure and allows retry', async () => {
    const user = userEvent.setup();
    const getMySpy = vi
      .spyOn(api.reservations, 'getMy')
      .mockRejectedValueOnce(new ApiError('Network connection failed', 0))
      .mockResolvedValueOnce(mockBorrowedReservations);
    vi.spyOn(api.reservations, 'getReceived').mockResolvedValue(mockReceivedReservations);

    renderMyReservations();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /failed to load reservations/i })).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('STM32F401 Black Pill Board')).toBeInTheDocument();
    });

    expect(getMySpy).toHaveBeenCalledTimes(2);
  });
});
