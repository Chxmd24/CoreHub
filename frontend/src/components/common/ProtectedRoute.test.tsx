import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import * as AuthContextModule from '../../context/AuthContext';
import { UserResponse, Role } from '../../api/types';

const mockUser: UserResponse = {
  id: 1,
  name: 'Kavindu Perera',
  studentId: 'E/20/001',
  email: 'e20001@eng.pdn.ac.lk',
  phone: '+94771234567',
  department: 'Computer Engineering',
  role: Role.USER,
  createdAt: '2026-10-27T10:00:00Z',
};

// Helper component to inspect location state on the login page
const LoginPageInspector: React.FC = () => {
  const location = useLocation();
  const state = location.state as { from?: { pathname: string } } | null;

  return (
    <div>
      <h1>Login Page</h1>
      <div data-testid="redirect-from">{state?.from?.pathname || 'none'}</div>
    </div>
  );
};

describe('ProtectedRoute', () => {
  it('renders loading spinner while session verification is in flight', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Secret Student Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/verifying.*session/i)).toBeInTheDocument();
    expect(screen.queryByText('Secret Student Dashboard')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated students to /login preserving intended destination in state.from', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/my-listings']}>
        <Routes>
          <Route
            path="/my-listings"
            element={
              <ProtectedRoute>
                <div>Private Listings</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPageInspector />} />
        </Routes>
      </MemoryRouter>
    );

    // Protected content is not rendered
    expect(screen.queryByText('Private Listings')).not.toBeInTheDocument();

    // Student is on login page
    expect(screen.getByRole('heading', { name: /login page/i })).toBeInTheDocument();
    // Redirect origin is preserved
    expect(screen.getByTestId('redirect-from')).toHaveTextContent('/my-listings');
  });

  it('allows access to protected child component when student is authenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      token: 'valid-jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Dashboard Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPageInspector />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Dashboard Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
