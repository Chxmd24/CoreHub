import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { PageLayout } from './components/layout/PageLayout';

// Mock health check and component call on home / marketplace pages
beforeEach(() => {
  vi.restoreAllMocks();
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/health')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'UP', timestamp: '2026-10-26T22:00:00Z' }),
      });
    }
    if (url.includes('/api/components')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          content: [],
          totalElements: 0,
          totalPages: 0,
          page: 0,
          size: 20,
          last: true,
        }),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    });
  });
});

const renderWithRouter = (initialRoute: string) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <PageLayout>
        <AppRoutes />
      </PageLayout>
    </MemoryRouter>
  );
};

describe('CoreHub Application Routing', () => {
  it('renders Home page at "/"', async () => {
    renderWithRouter('/');
    expect(screen.getByRole('heading', { name: /smart component sharing/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/connected and operational/i)).toBeInTheDocument();
    });
  });

  it('renders Marketplace page at "/marketplace"', async () => {
    renderWithRouter('/marketplace');
    expect(screen.getByRole('heading', { name: /hardware marketplace/i, level: 1 })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search components/i)).toBeInTheDocument();
    });
  });

  it('renders Login page at "/login"', () => {
    renderWithRouter('/login');
    expect(screen.getByRole('heading', { name: /student sign in/i })).toBeInTheDocument();
  });

  it('renders Register page at "/register"', () => {
    renderWithRouter('/register');
    expect(screen.getByRole('heading', { name: /join corehub/i })).toBeInTheDocument();
  });

  it('renders Dashboard page at "/dashboard"', () => {
    renderWithRouter('/dashboard');
    expect(screen.getByRole('heading', { name: /student dashboard/i })).toBeInTheDocument();
  });

  it('renders My Listings page at "/my-listings"', () => {
    renderWithRouter('/my-listings');
    expect(screen.getByRole('heading', { name: /my listings/i })).toBeInTheDocument();
  });

  it('renders My Reservations page at "/my-reservations"', () => {
    renderWithRouter('/my-reservations');
    expect(screen.getByRole('heading', { name: /my reservations/i })).toBeInTheDocument();
  });

  it('renders 404 Not Found page on an invalid route', () => {
    renderWithRouter('/invalid-nonexistent-path');
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/component or page not found/i)).toBeInTheDocument();
  });
});
