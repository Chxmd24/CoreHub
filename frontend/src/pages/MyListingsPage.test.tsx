import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MyListingsPage } from './MyListingsPage';
import { api, ApiClientError } from '../api/client';
import {
  ComponentResponse,
  ListingType,
  ComponentStatus,
  Role,
  UserResponse,
} from '../api/types';
import * as AuthContextModule from '../context/AuthContext';

const mockCurrentUser: UserResponse = {
  id: 101,
  studentId: 'E/19/042',
  name: 'Chamod Bandara',
  email: 'chamod@eng.pdn.ac.lk',
  department: 'Computer Engineering',
  role: Role.USER,
  createdAt: '2026-10-01T00:00:00Z',
};

const mockListings: ComponentResponse[] = [
  {
    id: 1,
    title: 'ESP32-WROOM-32 Development Board',
    description: 'Dual-core Wi-Fi & BLE board used for semester embedded project.',
    category: 'Microcontrollers',
    specifications: '240MHz, 4MB Flash, Micro-USB',
    listingType: ListingType.SELL,
    price: 1850.0,
    status: ComponentStatus.AVAILABLE,
    ownerId: 101,
    ownerName: 'Chamod Bandara',
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
  },
  {
    id: 2,
    title: 'STM32F401RE Nucleo-64 Board',
    description: 'Lent out for embedded lab practicals.',
    category: 'Microcontrollers',
    specifications: '84MHz Cortex-M4, ST-LINK v2.1',
    listingType: ListingType.BORROW,
    price: null,
    status: ComponentStatus.RESERVED,
    ownerId: 101,
    ownerName: 'Chamod Bandara',
    createdAt: '2026-10-24T12:00:00Z',
    updatedAt: '2026-10-24T12:00:00Z',
  },
  {
    id: 3,
    title: 'MPU-6050 6-Axis Accelerometer',
    description: 'Exchanged with a peer for an ultrasonic sensor.',
    category: 'Sensors & Transducers',
    specifications: 'I2C interface, 3.3V-5V',
    listingType: ListingType.SWAP,
    price: null,
    status: ComponentStatus.EXCHANGED,
    ownerId: 101,
    ownerName: 'Chamod Bandara',
    createdAt: '2026-10-20T09:00:00Z',
    updatedAt: '2026-10-22T15:00:00Z',
  },
];

const renderMyListings = (user: UserResponse | null = mockCurrentUser) => {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user,
    token: 'mock-token',
    isAuthenticated: !!user,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn(),
  });

  return render(
    <MemoryRouter>
      <MyListingsPage />
    </MemoryRouter>
  );
};

describe('MyListingsPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders student listings with actual status and pricing badges', async () => {
    vi.spyOn(api.components, 'getMy').mockResolvedValue(mockListings);

    renderMyListings();

    expect(screen.getByText(/fetching your hardware listings/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ESP32-WROOM-32 Development Board')).toBeInTheDocument();
    });

    expect(screen.getByText('STM32F401RE Nucleo-64 Board')).toBeInTheDocument();
    expect(screen.getByText('MPU-6050 6-Axis Accelerometer')).toBeInTheDocument();

    // Verify prices and exchange types
    expect(screen.getByText('LKR 1850.00')).toBeInTheDocument();
    expect(screen.getByText('Free Lab Borrow')).toBeInTheDocument();
    expect(screen.getByText('Exchange / Swap')).toBeInTheDocument();

    // Verify filter counts
    expect(screen.getByRole('button', { name: /all \(3\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /available \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reserved \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exchanged \(1\)/i })).toBeInTheDocument();
  });

  it('filters listings by status tabs', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.components, 'getMy').mockResolvedValue(mockListings);

    renderMyListings();

    await waitFor(() => {
      expect(screen.getByText('ESP32-WROOM-32 Development Board')).toBeInTheDocument();
    });

    // Click 'Reserved (1)' tab
    await user.click(screen.getByRole('button', { name: /reserved \(1\)/i }));

    expect(screen.queryByText('ESP32-WROOM-32 Development Board')).not.toBeInTheDocument();
    expect(screen.getByText('STM32F401RE Nucleo-64 Board')).toBeInTheDocument();
    expect(screen.queryByText('MPU-6050 6-Axis Accelerometer')).not.toBeInTheDocument();

    // Click 'All (3)' tab
    await user.click(screen.getByRole('button', { name: /all \(3\)/i }));
    expect(screen.getByText('ESP32-WROOM-32 Development Board')).toBeInTheDocument();
  });

  it('renders empty state when student has no listings', async () => {
    vi.spyOn(api.components, 'getMy').mockResolvedValue([]);

    renderMyListings();

    await waitFor(() => {
      expect(screen.getByText(/no component listings yet/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /create your first listing/i })).toBeInTheDocument();
  });

  it('opens create modal, validates inputs, and creates a new component listing', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.components, 'getMy').mockResolvedValue(mockListings);

    const newComponent: ComponentResponse = {
      id: 4,
      title: 'Raspberry Pi Pico RP2040',
      description: 'Dual-core ARM Cortex-M0+ board brand new in anti-static bag.',
      category: 'Microcontrollers',
      specifications: '133MHz, 2MB Flash, 26 GPIO',
      listingType: ListingType.SELL,
      price: 1500.0,
      status: ComponentStatus.AVAILABLE,
      ownerId: 101,
      ownerName: 'Chamod Bandara',
      createdAt: '2026-10-28T10:00:00Z',
      updatedAt: '2026-10-28T10:00:00Z',
    };

    const createSpy = vi.spyOn(api.components, 'create').mockResolvedValue(newComponent);

    renderMyListings();

    await waitFor(() => {
      expect(screen.getByTestId('create-listing-btn')).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByTestId('create-listing-btn'));
    expect(screen.getByRole('heading', { name: /create new component listing/i })).toBeInTheDocument();

    // Client-side validation: empty submit
    await user.click(screen.getByTestId('submit-listing-btn'));
    expect(screen.getByText('Title is required')).toBeInTheDocument();

    // Fill form fields
    const titleInput = screen.getByLabelText(/component title/i);
    await user.type(titleInput, 'Raspberry Pi Pico RP2040');

    const descInput = screen.getByLabelText(/description & condition/i);
    await user.type(descInput, 'Dual-core ARM Cortex-M0+ board brand new in anti-static bag.');

    const priceInput = screen.getByLabelText(/price \(lkr\)/i);
    await user.type(priceInput, '1500.00');

    const specsInput = screen.getByLabelText(/technical specifications & pinout/i);
    await user.type(specsInput, '133MHz, 2MB Flash, 26 GPIO');

    // Submit valid form
    await user.click(screen.getByTestId('submit-listing-btn'));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        title: 'Raspberry Pi Pico RP2040',
        description: 'Dual-core ARM Cortex-M0+ board brand new in anti-static bag.',
        category: 'Microcontrollers',
        specifications: '133MHz, 2MB Flash, 26 GPIO',
        listingType: ListingType.SELL,
        price: 1500.0,
      });
    });

    // Verify success banner and new card in list
    expect(await screen.findByText(/listing "raspberry pi pico rp2040" created successfully!/i)).toBeInTheDocument();
    expect(screen.getByText('Raspberry Pi Pico RP2040')).toBeInTheDocument();
  });

  it('handles SWAP and BORROW pricing rules by enforcing null price', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.components, 'getMy').mockResolvedValue([]);

    const swapComponent: ComponentResponse = {
      id: 5,
      title: 'DHT22 Digital Temperature Sensor',
      description: 'Pre-soldered with pullup resistor. Open for swap.',
      category: 'Sensors & Transducers',
      specifications: 'AM2302',
      listingType: ListingType.SWAP,
      price: null,
      status: ComponentStatus.AVAILABLE,
      ownerId: 101,
      ownerName: 'Chamod Bandara',
      createdAt: '2026-10-28T11:00:00Z',
      updatedAt: '2026-10-28T11:00:00Z',
    };

    const createSpy = vi.spyOn(api.components, 'create').mockResolvedValue(swapComponent);

    renderMyListings();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create your first listing/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /create your first listing/i }));

    await user.type(screen.getByLabelText(/component title/i), 'DHT22 Digital Temperature Sensor');
    await user.type(screen.getByLabelText(/description & condition/i), 'Pre-soldered with pullup resistor. Open for swap.');

    // Switch to SWAP
    await user.selectOptions(screen.getByLabelText(/listing type/i), ListingType.SWAP);

    // Price input should now be disabled
    const priceInput = screen.getByLabelText(/price \(lkr\)/i);
    expect(priceInput).toBeDisabled();

    // Submit
    await user.click(screen.getByTestId('submit-listing-btn'));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          listingType: ListingType.SWAP,
          price: null,
        })
      );
    });
  });

  it('edits an existing component listing and updates the state', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.components, 'getMy').mockResolvedValue(mockListings);

    const updatedComponent: ComponentResponse = {
      ...mockListings[0],
      title: 'ESP32-WROOM-32 Dev Board (Updated)',
      price: 1950.0,
    };

    const updateSpy = vi.spyOn(api.components, 'update').mockResolvedValue(updatedComponent);

    renderMyListings();

    await waitFor(() => {
      expect(screen.getByTestId('edit-btn-1')).toBeInTheDocument();
    });

    // Click edit on item 1
    await user.click(screen.getByTestId('edit-btn-1'));

    expect(screen.getByRole('heading', { name: /edit component listing/i })).toBeInTheDocument();
    const titleInput = screen.getByLabelText(/component title/i);
    expect(titleInput).toHaveValue('ESP32-WROOM-32 Development Board');

    // Update title and price
    await user.clear(titleInput);
    await user.type(titleInput, 'ESP32-WROOM-32 Dev Board (Updated)');

    const priceInput = screen.getByLabelText(/price \(lkr\)/i);
    await user.clear(priceInput);
    await user.type(priceInput, '1950.00');

    // Submit
    await user.click(screen.getByTestId('submit-listing-btn'));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: 'ESP32-WROOM-32 Dev Board (Updated)',
          price: 1950.0,
        })
      );
    });

    expect(await screen.findByText(/listing "esp32-wroom-32 dev board \(updated\)" updated successfully!/i)).toBeInTheDocument();
    expect(screen.getByText('ESP32-WROOM-32 Dev Board (Updated)')).toBeInTheDocument();
  });

  it('confirms and deletes an unreserved listing', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.components, 'getMy').mockResolvedValue(mockListings);
    const deleteSpy = vi.spyOn(api.components, 'delete').mockResolvedValue();

    renderMyListings();

    await waitFor(() => {
      expect(screen.getByTestId('delete-btn-1')).toBeInTheDocument();
    });

    // Click delete on item 1
    await user.click(screen.getByTestId('delete-btn-1'));

    expect(screen.getByRole('heading', { name: /delete component listing/i })).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to permanently delete/i)).toBeInTheDocument();

    // Confirm delete
    await user.click(screen.getByTestId('confirm-delete-btn'));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(1);
    });

    expect(await screen.findByText(/listing "esp32-wroom-32 development board" has been successfully deleted/i)).toBeInTheDocument();
    expect(screen.queryByText('ESP32-WROOM-32 Development Board')).not.toBeInTheDocument();
  });

  it('handles HTTP 409 Conflict when deleting a component with reservation history', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.components, 'getMy').mockResolvedValue(mockListings);

    // Mock 409 Conflict
    vi.spyOn(api.components, 'delete').mockRejectedValue(
      new ApiClientError(409, 'Cannot delete listing: historical reservations exist for this component')
    );

    renderMyListings();

    await waitFor(() => {
      expect(screen.getByTestId('delete-btn-2')).toBeInTheDocument();
    });

    // Click delete on reserved/exchanged item
    await user.click(screen.getByTestId('delete-btn-2'));

    await user.click(screen.getByTestId('confirm-delete-btn'));

    // Should display audit preservation notice
    await waitFor(() => {
      expect(screen.getByText(/cannot delete listing: this component has an active or historical reservation/i)).toBeInTheDocument();
    });

    // Listing must remain in the DOM
    expect(screen.getByText('STM32F401RE Nucleo-64 Board')).toBeInTheDocument();
  });

  it('prevents editing or deleting when not the listing owner', async () => {
    const user = userEvent.setup();

    // User is ID 999, but listing is owned by ID 101
    const differentUser: UserResponse = {
      ...mockCurrentUser,
      id: 999,
      email: 'other@eng.pdn.ac.lk',
    };

    vi.spyOn(api.components, 'getMy').mockResolvedValue(mockListings);

    renderMyListings(differentUser);

    await waitFor(() => {
      expect(screen.getByTestId('edit-btn-1')).toBeInTheDocument();
    });

    // Click edit on someone else's item
    await user.click(screen.getByTestId('edit-btn-1'));

    expect(screen.getByText(/you are not authorized to edit this listing because you are not the owner/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /edit component listing/i })).not.toBeInTheDocument();
  });

  it('displays backend 400 validation errors in the modal form', async () => {
    const user = userEvent.setup();
    vi.spyOn(api.components, 'getMy').mockResolvedValue(mockListings);

    // Mock 400 with field validation errors
    vi.spyOn(api.components, 'create').mockRejectedValue(
      new ApiClientError(400, 'Validation failed for one or more fields', {
        status: 400,
        error: 'Bad Request',
        message: 'Validation failed for one or more fields',
        validationErrors: {
          title: 'Title cannot exceed 150 characters',
          price: 'Price cannot be negative',
        },
      })
    );

    renderMyListings();

    await waitFor(() => {
      expect(screen.getByTestId('create-listing-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('create-listing-btn'));

    await user.type(screen.getByLabelText(/component title/i), 'Valid Title');
    await user.type(screen.getByLabelText(/description & condition/i), 'Valid Description');
    await user.type(screen.getByLabelText(/price \(lkr\)/i), '100');

    await user.click(screen.getByTestId('submit-listing-btn'));

    await waitFor(() => {
      expect(screen.getByText('Title cannot exceed 150 characters')).toBeInTheDocument();
      expect(screen.getByText('Price cannot be negative')).toBeInTheDocument();
    });
  });
});
