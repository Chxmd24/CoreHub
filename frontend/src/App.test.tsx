import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { PageLayout } from './components/layout/PageLayout';
import { AuthProvider } from './context/AuthContext';
import { apiClient, TOKEN_KEY } from './api/client';
import { UserResponse, Role } from './api/types';

const mockAuthenticatedStudent: UserResponse = {
  id: 1,
  name: 'Chamod Perera',
  studentId: 'E/19/042',
  email: 'chamod@eng.pdn.ac.lk',
  phone: '+94771234567',
  department: 'Computer Engineering',
  role: Role.USER,
  createdAt: '2026-10-27T10:00:00Z',
};

beforeEach(() => {
  localStorage.clear();
  apiClient.clearToken();
  vi.restoreAllMocks();

  // Mock global fetch for health checks, components, and profile checks
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/health')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'UP', timestamp: '2026-10-27T22:00:00Z' }),
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
    if (url.includes('/api/users/me')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockAuthenticatedStudent,
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

const renderAppWithRoute = (initialRoute: string) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <PageLayout>
          <AppRoutes />
        </PageLayout>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('CoreHub Application Routing and Route Protection', () => {
  it('renders Home page at "/" publicly', async () => {
    renderAppWithRoute('/');
    expect(screen.getByRole('heading', { name: /smart component sharing/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/connected and operational/i)).toBeInTheDocument();
    });
  });

  it('renders Marketplace page at "/marketplace" publicly', async () => {
    renderAppWithRoute('/marketplace');
    expect(screen.getByRole('heading', { name: /hardware marketplace/i, level: 1 })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search components/i)).toBeInTheDocument();
    });
  });

  it('renders Component Details page at "/components/:id" publicly without requiring authentication', async () => {
    renderAppWithRoute('/components/1');
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back to marketplace/i })).toBeInTheDocument();
    });
  });

  it('renders Login page at "/login" publicly', () => {
    renderAppWithRoute('/login');
    expect(screen.getByRole('heading', { name: /student sign in/i })).toBeInTheDocument();
  });

  it('renders Register page at "/register" publicly', () => {
    renderAppWithRoute('/register');
    expect(screen.getByRole('heading', { name: /join corehub/i })).toBeInTheDocument();
  });

  it('redirects unauthenticated students attempting to access "/dashboard" to "/login"', async () => {
    renderAppWithRoute('/dashboard');

    // Due to ProtectedRoute, student lands on login page with sign-in prompt
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /student sign in/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/please sign in with your student account to access this page/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /student dashboard/i })).not.toBeInTheDocument();
  });

  it('redirects unauthenticated students attempting to access "/my-listings" to "/login"', async () => {
    renderAppWithRoute('/my-listings');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /student sign in/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/please sign in with your student account to access this page/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated students attempting to access "/my-reservations" to "/login"', async () => {
    renderAppWithRoute('/my-reservations');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /student sign in/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/please sign in with your student account to access this page/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated students attempting to access "/profile" to "/login"', async () => {
    renderAppWithRoute('/profile');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /student sign in/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/please sign in with your student account to access this page/i)).toBeInTheDocument();
  });

  it('allows access to protected routes when authenticated token exists', async () => {
    localStorage.setItem(TOKEN_KEY, 'valid-active-session-jwt');

    renderAppWithRoute('/dashboard');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /welcome, chamod perera/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/authenticated session active/i)).toBeInTheDocument();
  });

  it('renders 404 Not Found page on an invalid route', () => {
    renderAppWithRoute('/invalid-nonexistent-path');
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/component or page not found/i)).toBeInTheDocument();
  });
});
