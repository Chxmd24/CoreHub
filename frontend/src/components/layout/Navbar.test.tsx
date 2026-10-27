import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './Navbar';
import * as AuthContextModule from '../../context/AuthContext';
import { UserResponse, Role } from '../../api/types';

const mockUser: UserResponse = {
  id: 1,
  name: 'Chamod Perera',
  studentId: 'E/19/042',
  email: 'chamod@eng.pdn.ac.lk',
  phone: '+94771234567',
  department: 'Computer Engineering',
  role: Role.USER,
  createdAt: '2026-10-27T10:00:00Z',
};

describe('Navbar Component', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const setupUnauthenticated = () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      refreshProfile: vi.fn(),
    });
  };

  const setupAuthenticated = () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      token: 'jwt-token-123',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      refreshProfile: vi.fn(),
    });
  };

  it('renders brand name and community badge', () => {
    setupUnauthenticated();
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('CoreHub')).toBeInTheDocument();
    expect(screen.getByText('P2P CEng')).toBeInTheDocument();
  });

  it('renders primary desktop navigation links', () => {
    setupUnauthenticated();
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const desktopNav = screen.getByRole('navigation', { name: 'Main Navigation' });
    expect(desktopNav).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /marketplace/i })).toHaveAttribute('href', '/marketplace');
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /my listings/i })).toHaveAttribute('href', '/my-listings');
    expect(screen.getByRole('link', { name: /my reservations/i })).toHaveAttribute('href', '/my-reservations');
  });

  it('renders Log in and Register action buttons when student is unauthenticated', () => {
    setupUnauthenticated();
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const loginLink = screen.getByRole('link', { name: /log in/i });
    const registerLink = screen.getByRole('link', { name: /register/i });

    expect(loginLink).toHaveAttribute('href', '/login');
    expect(registerLink).toHaveAttribute('href', '/register');
    expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
  });

  it('renders student identity and Log out button when student is authenticated', async () => {
    const user = userEvent.setup();
    setupAuthenticated();

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Chamod Perera')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();

    const logoutButtons = screen.getAllByRole('button', { name: /log out/i });
    expect(logoutButtons.length).toBeGreaterThan(0);

    // Click desktop logout button
    await user.click(logoutButtons[0]);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('toggles mobile menu dropdown when hamburger button is clicked', async () => {
    const user = userEvent.setup();
    setupUnauthenticated();

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Open mobile menu
    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Mobile Navigation' })).toBeInTheDocument();

    // Close mobile menu
    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Mobile Navigation' })).not.toBeInTheDocument();
  });
});
