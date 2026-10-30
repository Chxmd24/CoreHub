import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MarketplacePage } from './MarketplacePage';
import { api, ApiError } from '../api/client';
import { ComponentResponse, ListingType, ComponentStatus, PagedResponse } from '../api/types';

const mockComponents: ComponentResponse[] = [
  {
    id: 1,
    title: 'STM32F401RE Nucleo-64 Board',
    description: 'ARM Cortex-M4 microcontroller board with ST-LINK debugger.',
    category: 'Microcontrollers',
    specifications: '84MHz, 512KB Flash, 96KB SRAM',
    listingType: ListingType.SELL,
    price: 4500.0,
    status: ComponentStatus.AVAILABLE,
    ownerId: 101,
    ownerName: 'Danula Bandara',
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
  },
  {
    id: 2,
    title: 'ESP32-WROOM-32 DevKit V1',
    description: 'Dual-core Wi-Fi & Bluetooth microcontroller module.',
    category: 'Wireless & IoT',
    specifications: '240MHz Dual Core, 4MB Flash',
    listingType: ListingType.SWAP,
    price: null,
    status: ComponentStatus.AVAILABLE,
    ownerId: 102,
    ownerName: 'Nipuni Perera',
    createdAt: '2026-10-26T12:00:00Z',
    updatedAt: '2026-10-26T12:00:00Z',
  },
];

const mockPagedResponse: PagedResponse<ComponentResponse> = {
  content: mockComponents,
  page: 0,
  size: 9,
  totalElements: 2,
  totalPages: 1,
  last: true,
};

const renderMarketplace = (initialRoute = '/marketplace') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/components/:id" element={<div>Component Details Route</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('MarketplacePage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders marketplace components successfully with actual response fields and no private seller info', async () => {
    vi.spyOn(api.components, 'getAll').mockResolvedValue(mockPagedResponse);

    renderMarketplace();

    // Verify loading state
    expect(screen.getByText(/fetching marketplace components/i)).toBeInTheDocument();

    // Wait for components to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'STM32F401RE Nucleo-64 Board' })).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'ESP32-WROOM-32 DevKit V1' })).toBeInTheDocument();
    expect(screen.getAllByText('Microcontrollers').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Wireless & IoT').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('LKR 4500.00')).toBeInTheDocument();
    expect(screen.getByText('Exchange / Swap')).toBeInTheDocument();
    expect(screen.getByText('Danula Bandara')).toBeInTheDocument();
    expect(screen.getByText('Nipuni Perera')).toBeInTheDocument();
    expect(screen.getByTestId('results-count')).toHaveTextContent(/showing 2 of 2 component listings/i);

    // Privacy verification: no email, phone, or password in the public cards
    expect(screen.queryByText(/@eng\.pdn\.ac\.lk/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+94/i)).not.toBeInTheDocument();
  });

  it('filters by search keyword and updates backend query parameters', async () => {
    const user = userEvent.setup();
    const getAllSpy = vi.spyOn(api.components, 'getAll').mockResolvedValue(mockPagedResponse);

    renderMarketplace();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'STM32F401RE Nucleo-64 Board' })).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/search components/i);
    await user.type(searchInput, 'Nucleo');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Nucleo',
          page: 0,
        })
      );
    });
  });

  it('filters by category and listing type using dropdowns', async () => {
    const user = userEvent.setup();
    const getAllSpy = vi.spyOn(api.components, 'getAll').mockResolvedValue(mockPagedResponse);

    renderMarketplace();

    await waitFor(() => {
      expect(screen.getByLabelText(/filter by category/i)).toBeInTheDocument();
    });

    // Select Microcontrollers category
    await user.selectOptions(screen.getByLabelText(/filter by category/i), 'Microcontrollers');

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Microcontrollers',
          page: 0,
        })
      );
    });

    // Select SELL listing type
    await user.selectOptions(screen.getByLabelText(/filter by listing type/i), 'SELL');

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          listingType: 'SELL',
          page: 0,
        })
      );
    });
  });

  it('resets all filters when clicking the Reset Filters button', async () => {
    const user = userEvent.setup();
    const getAllSpy = vi.spyOn(api.components, 'getAll').mockResolvedValue(mockPagedResponse);

    renderMarketplace('/marketplace?category=Microcontrollers&search=STM32');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /reset filters/i }));

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: undefined,
          category: undefined,
          listingType: undefined,
          page: 0,
        })
      );
    });
  });

  it('handles multi-page pagination with server-side page navigation', async () => {
    const user = userEvent.setup();
    const multiPageResponse: PagedResponse<ComponentResponse> = {
      content: mockComponents,
      page: 0,
      size: 2,
      totalElements: 5,
      totalPages: 3,
      last: false,
    };

    const getAllSpy = vi.spyOn(api.components, 'getAll').mockResolvedValue(multiPageResponse);

    renderMarketplace();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
    });

    // Previous button should be disabled on first page
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();

    // Click Next
    await user.click(screen.getByRole('button', { name: /next page/i }));

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        })
      );
    });

    // Click Page 3 button
    await user.click(screen.getByRole('button', { name: 'Page 3' }));

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  it('renders empty state when no matching components exist', async () => {
    const emptyResponse: PagedResponse<ComponentResponse> = {
      content: [],
      page: 0,
      size: 9,
      totalElements: 0,
      totalPages: 0,
      last: true,
    };

    vi.spyOn(api.components, 'getAll').mockResolvedValue(emptyResponse);

    renderMarketplace();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /no matching components found/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
  });

  it('displays error state on API failure and provides functional retry', async () => {
    const user = userEvent.setup();
    const getAllSpy = vi
      .spyOn(api.components, 'getAll')
      .mockRejectedValueOnce(new ApiError('Connection failed', 0))
      .mockResolvedValueOnce(mockPagedResponse);

    renderMarketplace();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /could not load components/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/unable to connect to corehub server/i)).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'STM32F401RE Nucleo-64 Board' })).toBeInTheDocument();
    });

    expect(getAllSpy).toHaveBeenCalledTimes(2);
  });

  it('renders long component titles, specifications, and seller names with safe responsive classes', async () => {
    const longContentItem: ComponentResponse = {
      id: 99,
      title: '[M9_TEST]_ESP32_WROOM_32_DEVELOPMENT_BOARD_WITH_ULTRA_LONG_IDENTIFIER_THAT_CANNOT_BREAK_NATURALLY',
      description: 'Ultra long continuous description string testing word breaking capabilities for responsive layouts.',
      category: 'Microcontrollers',
      specifications: 'Pinout:PA0,PA1,PA2,PA3,PA4,PA5,PA6,PA7,PB0,PB1,PB2,PB3,PB4,PB5,PB6,PB7;Clock:168MHz;Flash:1024KB;SRAM:192KB',
      listingType: ListingType.SELL,
      price: 2500.0,
      status: ComponentStatus.AVAILABLE,
      ownerId: 201,
      ownerName: 'Chandrasekara Mudiyanselage Chamod Bandara Wickramasinghe',
      createdAt: '2026-10-28T10:00:00Z',
      updatedAt: '2026-10-28T10:00:00Z',
    };

    const longPagedResponse: PagedResponse<ComponentResponse> = {
      content: [longContentItem],
      page: 0,
      size: 9,
      totalElements: 1,
      totalPages: 1,
      last: true,
    };

    vi.spyOn(api.components, 'getAll').mockResolvedValue(longPagedResponse);

    renderMarketplace();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: '[M9_TEST]_ESP32_WROOM_32_DEVELOPMENT_BOARD_WITH_ULTRA_LONG_IDENTIFIER_THAT_CANNOT_BREAK_NATURALLY',
        })
      ).toBeInTheDocument();
    });

    // Verify title markup and class for overflow protection
    const titleHeading = screen.getByRole('heading', {
      name: '[M9_TEST]_ESP32_WROOM_32_DEVELOPMENT_BOARD_WITH_ULTRA_LONG_IDENTIFIER_THAT_CANNOT_BREAK_NATURALLY',
    });
    expect(titleHeading).toHaveClass('component-card-title');

    // Verify specifications block markup, class, and title attribute for full preview
    const specsElement = screen.getByTitle(
      'Pinout:PA0,PA1,PA2,PA3,PA4,PA5,PA6,PA7,PB0,PB1,PB2,PB3,PB4,PB5,PB6,PB7;Clock:168MHz;Flash:1024KB;SRAM:192KB'
    );
    expect(specsElement).toHaveClass('component-card-specs');

    // Verify seller name element has truncation class and full name in title attribute
    const sellerElement = screen.getByTitle('Chandrasekara Mudiyanselage Chamod Bandara Wickramasinghe');
    expect(sellerElement).toHaveClass('component-card-seller-name');
    expect(sellerElement).toHaveTextContent('Chandrasekara Mudiyanselage Chamod Bandara Wickramasinghe');

    // Verify component card and grid classes
    const cardElement = titleHeading.closest('.card');
    expect(cardElement).toHaveClass('component-card');
    expect(cardElement?.parentElement).toHaveClass('grid-cards');
  });
});
