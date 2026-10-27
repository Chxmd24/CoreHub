import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import * as AuthContextModule from '../context/AuthContext';
import { ApiError } from '../api/client';
import { UserResponse, Role } from '../api/types';

const mockUser: UserResponse = {
  id: 1,
  name: 'Nuwan Bandara',
  studentId: 'E/20/150',
  email: 'e20150@eng.pdn.ac.lk',
  phone: '+94779876543',
  department: 'Computer Engineering',
  role: Role.USER,
  createdAt: '2026-10-27T10:00:00Z',
};

const renderLoginPage = (initialState?: Record<string, unknown>) => {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: initialState }]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div>Dashboard Destination</div>} />
        <Route path="/my-listings" element={<div>My Listings Destination</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('LoginPage', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });
  });

  it('renders login form elements with accessible labels and no placeholder preview tags', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: /student sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/institutional email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.queryByText(/milestone 7/i)).not.toBeInTheDocument();
  });

  it('displays registration success banner and pre-fills email when redirected from registration', () => {
    renderLoginPage({
      registeredEmail: 'e20150@eng.pdn.ac.lk',
      registrationSuccessMessage: 'Account created for Nuwan Bandara! Please sign in.',
    });

    expect(screen.getByRole('status')).toHaveTextContent('Account created for Nuwan Bandara! Please sign in.');
    const emailInput = screen.getByLabelText(/institutional email/i) as HTMLInputElement;
    expect(emailInput.value).toBe('e20150@eng.pdn.ac.lk');
  });

  it('displays redirection notice when user was directed from a protected route', () => {
    renderLoginPage({
      from: { pathname: '/my-listings' },
    });

    expect(screen.getByText(/please sign in with your student account to access this page/i)).toBeInTheDocument();
  });

  it('successfully logs in and navigates to the default dashboard', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    renderLoginPage();

    await user.type(screen.getByLabelText(/institutional email/i), 'e20150@eng.pdn.ac.lk');
    await user.type(screen.getByLabelText(/^password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('e20150@eng.pdn.ac.lk', 'password123');
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard Destination')).toBeInTheDocument();
    });
  });

  it('successfully logs in and navigates back to the protected origin page', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    renderLoginPage({
      from: { pathname: '/my-listings' },
    });

    await user.type(screen.getByLabelText(/institutional email/i), 'e20150@eng.pdn.ac.lk');
    await user.type(screen.getByLabelText(/^password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText('My Listings Destination')).toBeInTheDocument();
    });
  });

  it('displays error message on invalid credentials (HTTP 401)', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(
      new ApiError('Invalid email or password', 401, { message: 'Invalid email or password' })
    );

    renderLoginPage();

    await user.type(screen.getByLabelText(/institutional email/i), 'e20150@eng.pdn.ac.lk');
    await user.type(screen.getByLabelText(/^password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid institutional email or password.');
    });
  });

  it('displays connection error message when backend is unreachable', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(
      new ApiError('Failed to fetch', 0, null)
    );

    renderLoginPage();

    await user.type(screen.getByLabelText(/institutional email/i), 'e20150@eng.pdn.ac.lk');
    await user.type(screen.getByLabelText(/^password/i), 'anypass');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Unable to connect to CoreHub server. Please verify the backend is running.'
      );
    });
  });

  it('automatically redirects away if student is already authenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      token: 'active-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    renderLoginPage();

    expect(screen.getByText('Dashboard Destination')).toBeInTheDocument();
  });
});
