import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './Navbar';

describe('Navbar Component', () => {
  it('renders brand name and community badge', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('CoreHub')).toBeInTheDocument();
    expect(screen.getByText('P2P CEng')).toBeInTheDocument();
  });

  it('renders primary desktop navigation links', () => {
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

  it('renders Log in and Register action buttons', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const loginLink = screen.getByRole('link', { name: /log in/i });
    const registerLink = screen.getByRole('link', { name: /register/i });

    expect(loginLink).toHaveAttribute('href', '/login');
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('toggles mobile menu dropdown when hamburger button is clicked', async () => {
    const user = userEvent.setup();

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
