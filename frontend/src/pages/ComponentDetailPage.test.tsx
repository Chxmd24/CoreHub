import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ComponentDetailPage } from './ComponentDetailPage';
import { api, ApiError } from '../api/client';
import { ComponentResponse, ListingType, ComponentStatus } from '../api/types';

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

const renderComponentDetail = (id = '42') => {
  return render(
    <MemoryRouter initialEntries={[`/components/${id}`]}>
      <Routes>
        <Route path="/components/:id" element={<ComponentDetailPage />} />
        <Route path="/marketplace" element={<div>Marketplace Destination</div>} />
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

    renderComponentDetail('42');

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

    // Privacy verification: no email or phone in the public component page
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+94/)).not.toBeInTheDocument();

    // Back to marketplace link is rendered
    expect(screen.getByRole('link', { name: /back to marketplace/i })).toHaveAttribute('href', '/marketplace');
  });

  it('displays listing not found error when backend returns HTTP 404', async () => {
    vi.spyOn(api.components, 'getById').mockRejectedValue(
      new ApiError('Component listing not found with ID: 999', 404)
    );

    renderComponentDetail('999');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /listing not found/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/component listing not found with ID: 999/i)).toBeInTheDocument();
  });

  it('rejects invalid non-numeric or non-positive IDs without calling API', async () => {
    const getByIdSpy = vi.spyOn(api.components, 'getById');

    renderComponentDetail('invalid-alphanumeric-id');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /invalid component id/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/invalid component identifier in url/i)).toBeInTheDocument();
    expect(getByIdSpy).not.toHaveBeenCalled();
  });

  it('rejects negative or zero IDs without calling API', async () => {
    const getByIdSpy = vi.spyOn(api.components, 'getById');

    renderComponentDetail('-5');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /invalid component id/i })).toBeInTheDocument();
    });

    expect(getByIdSpy).not.toHaveBeenCalled();
  });

  it('handles backend API failure with retry capability', async () => {
    const user = userEvent.setup();
    const getByIdSpy = vi
      .spyOn(api.components, 'getById')
      .mockRejectedValueOnce(new ApiError('Internal Server Error', 500))
      .mockResolvedValueOnce(mockComponent);

    renderComponentDetail('42');

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

  it('displays reservation hold policy and indicates interactive booking will connect in future milestones', async () => {
    vi.spyOn(api.components, 'getById').mockResolvedValue(mockComponent);

    renderComponentDetail('42');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /reservation hold policy/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/exclusively for/i)).toBeInTheDocument();
    expect(screen.getByText(/interactive reservation booking/i)).toBeInTheDocument();
    expect(screen.queryByText(/milestone 7/i)).not.toBeInTheDocument();
  });
});
