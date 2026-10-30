import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AdminRoute } from './AdminRoute';
import * as AuthContextModule from '../../context/AuthContext';
import { UserResponse, Role } from '../../api/types';

const mockStudentUser: UserResponse = {
  id: 1,
  name: 'Kavindu Perera',
  studentId: 'E/20/001',
  email: 'e20001@eng.pdn.ac.lk',
  phone: '+94771234567',
  department: 'Computer Engineering',
  role: Role.USER,
  createdAt: '2026-10-27T10:00:00Z',
};

const mockAdminUser: UserResponse = {
  id: 2,
  name: 'Staff Admin',
  studentId: 'E/18/001',
  email: 'admin@eng.pdn.ac.lk',
  phone: '+94771234568',
  department: 'Computer Engineering',
  role: Role.ADMIN,
  createdAt: '2026-10-27T10:00:00Z',
};

const mockSuperAdminUser: UserResponse = {
  id: 3,
  name: 'Project Owner',
  studentId: 'E/17/001',
  email: 'owner@eng.pdn.ac.lk',
  phone: '+94771234569',
  department: 'Computer Engineering',
  role: Role.SUPER_ADMIN,
  createdAt: '2026-10-27T10:00:00Z',
};

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

describe('AdminRoute Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading indicator while credentials verification is in flight', () => {
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
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Restricted Admin Content</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/verifying administrator credentials/i)).toBeInTheDocument();
    expect(screen.queryByText('Restricted Admin Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated visitor to /login with state.from location', () => {
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
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Restricted Admin Content</div>
              </AdminRoute>
            }
          />
          <Route path="/login" element={<LoginPageInspector />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Login Page' })).toBeInTheDocument();
    expect(screen.getByTestId('redirect-from')).toHaveTextContent('/admin');
    expect(screen.queryByText('Restricted Admin Content')).not.toBeInTheDocument();
  });

  it('displays Access Denied card when authenticated student user attempts to access /admin', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockStudentUser,
      token: 'jwt-student',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Restricted Admin Content</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Access Denied' })).toBeInTheDocument();
    expect(screen.getByText(/Administrator privileges required/i)).toBeInTheDocument();
    expect(screen.getByText(/e20001@eng\.pdn\.ac\.lk/i)).toBeInTheDocument();
    expect(screen.queryByText('Restricted Admin Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated user has ADMIN role', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockAdminUser,
      token: 'jwt-admin',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div data-testid="admin-panel">Welcome Admin</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('admin-panel')).toHaveTextContent('Welcome Admin');
    expect(screen.queryByRole('heading', { name: 'Access Denied' })).not.toBeInTheDocument();
  });

  it('renders children when authenticated user has SUPER_ADMIN role', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockSuperAdminUser,
      token: 'jwt-super-admin',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div data-testid="super-admin-panel">Welcome Super Admin</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('super-admin-panel')).toHaveTextContent('Welcome Super Admin');
    expect(screen.queryByRole('heading', { name: 'Access Denied' })).not.toBeInTheDocument();
  });
});
