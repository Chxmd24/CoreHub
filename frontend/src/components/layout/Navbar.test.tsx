import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

const mockAdminUser: UserResponse = {
  id: 2,
  name: 'Admin Kasun',
  studentId: 'E/18/100',
  email: 'kasun@eng.pdn.ac.lk',
  phone: '+94772223344',
  department: 'Computer Engineering',
  role: Role.ADMIN,
  createdAt: '2026-10-25T10:00:00Z',
};

const mockSuperAdminUser: UserResponse = {
  id: 3,
  name: 'Super Admin Chamod',
  studentId: 'EG/2020/0001',
  email: 'superadmin@engug.ruh.ac.lk',
  phone: '+94779998877',
  department: 'Computer Engineering',
  role: Role.SUPER_ADMIN,
  createdAt: '2026-10-20T10:00:00Z',
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

  const setupAuthenticated = (user: UserResponse = mockUser) => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user,
      token: 'jwt-token-123',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      refreshProfile: vi.fn(),
    });
  };

  it('renders brand name and confirms community badge is removed', () => {
    setupUnauthenticated();
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('CoreHub')).toBeInTheDocument();
    expect(screen.queryByText('P2P CEng')).not.toBeInTheDocument();
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

    const loginLinks = screen.getAllByRole('link', { name: /log in/i });
    const registerLinks = screen.getAllByRole('link', { name: /register/i });

    expect(loginLinks.length).toBeGreaterThan(0);
    expect(registerLinks.length).toBeGreaterThan(0);
    expect(loginLinks[0]).toHaveAttribute('href', '/login');
    expect(registerLinks[0]).toHaveAttribute('href', '/register');
    expect(screen.queryByRole('button', { name: /account menu/i })).not.toBeInTheDocument();
  });

  it('renders student identity in compact profile button and allows logging out via dropdown', async () => {
    const user = userEvent.setup();
    setupAuthenticated();

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Profile button displays the authenticated user's name
    expect(screen.getByText('Chamod Perera')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument();

    const accountBtn = screen.getByRole('button', { name: /account menu/i });
    expect(accountBtn).toBeInTheDocument();
    expect(accountBtn).toHaveAttribute('aria-expanded', 'false');

    // Click profile button to open dropdown
    await user.click(accountBtn);
    expect(accountBtn).toHaveAttribute('aria-expanded', 'true');

    // Dropdown reveals details, student badge, and actions
    const menu = screen.getByRole('menu', { name: /user account options/i });
    expect(menu).toBeInTheDocument();
    expect(screen.getByText('chamod@eng.pdn.ac.lk')).toBeInTheDocument();
    expect(screen.getByText('STUDENT')).toBeInTheDocument();
    expect(screen.getByText('ID: E/19/042')).toBeInTheDocument();

    // My Profile link is present in dropdown
    const profileItem = screen.getByRole('menuitem', { name: /my profile/i });
    expect(profileItem).toBeInTheDocument();
    expect(profileItem).toHaveAttribute('href', '/profile');

    // Click log out menuitem
    const logoutMenuItem = screen.getByRole('menuitem', { name: /log out/i });
    await user.click(logoutMenuItem);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('closes account dropdown on Escape key and refocuses trigger button', async () => {
    const user = userEvent.setup();
    setupAuthenticated();

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const accountBtn = screen.getByRole('button', { name: /account menu/i });
    await user.click(accountBtn);
    expect(screen.getByRole('menu', { name: /user account options/i })).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('menu', { name: /user account options/i })).not.toBeInTheDocument();
  });

  it('closes account dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    setupAuthenticated();

    render(
      <BrowserRouter>
        <div>
          <div data-testid="outside-area">Outside</div>
          <Navbar />
        </div>
      </BrowserRouter>
    );

    const accountBtn = screen.getByRole('button', { name: /account menu/i });
    await user.click(accountBtn);
    expect(screen.getByRole('menu', { name: /user account options/i })).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside-area'));
    expect(screen.queryByRole('menu', { name: /user account options/i })).not.toBeInTheDocument();
  });

  it('shows Admin link and Admin pill for ADMIN role', () => {
    setupAuthenticated(mockAdminUser);

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Desktop nav shows Admin link
    const desktopNav = screen.getByRole('navigation', { name: 'Main Navigation' });
    expect(desktopNav).toBeInTheDocument();
    const adminLink = screen.getByRole('link', { name: /admin/i });
    expect(adminLink).toHaveAttribute('href', '/admin');

    // Trigger button displays Admin role pill
    const accountBtn = screen.getByRole('button', { name: /account menu/i });
    expect(accountBtn).toHaveTextContent('Admin');
    expect(accountBtn.querySelector('.role-pill-admin')).toBeInTheDocument();
  });

  it('shows Admin link and Super Admin pill with gold styling for SUPER_ADMIN role', async () => {
    const user = userEvent.setup();
    setupAuthenticated(mockSuperAdminUser);

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Desktop nav shows Admin link
    const adminLink = screen.getByRole('link', { name: /admin/i });
    expect(adminLink).toHaveAttribute('href', '/admin');

    // Trigger shows Super Admin pill
    expect(screen.getByText('Super Admin')).toBeInTheDocument();

    // Open dropdown to check SUPER ADMIN role badge and Admin Portal link
    await user.click(screen.getByRole('button', { name: /account menu/i }));
    const superAdminBadge = screen.getByText('SUPER ADMIN');
    expect(superAdminBadge).toBeInTheDocument();
    expect(superAdminBadge).toHaveClass('role-badge-super_admin');
    expect(screen.getByRole('menuitem', { name: /admin portal/i })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('menuitem', { name: /my profile/i })).toHaveAttribute('href', '/profile');
  });

  it('hides Admin navigation link for standard USER role', () => {
    setupAuthenticated(mockUser);

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
  });

  it('toggles mobile menu drawer when hamburger button is clicked', async () => {
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

  it('allows authenticated student to log out from mobile drawer', async () => {
    const user = userEvent.setup();
    setupAuthenticated();

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    // Open mobile menu
    await user.click(screen.getByRole('button', { name: /toggle navigation menu/i }));
    const mobileNav = screen.getByRole('navigation', { name: 'Mobile Navigation' });
    expect(mobileNav).toBeInTheDocument();

    // Mobile drawer displays My Profile link
    expect(screen.getByRole('link', { name: /my profile/i })).toHaveAttribute('href', '/profile');

    // Mobile drawer displays user identity
    const mobileLogoutBtn = screen.getByRole('button', { name: /log out/i });
    await user.click(mobileLogoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
