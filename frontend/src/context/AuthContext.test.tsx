import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { apiClient, api, ApiError, TOKEN_KEY } from '../api/client';
import { UserResponse, AuthResponse, Role } from '../api/types';

const mockUser: UserResponse = {
  id: 1,
  email: 'e20001@eng.pdn.ac.lk',
  name: 'Kavindu Perera',
  studentId: 'E/20/001',
  phone: '+94771234567',
  department: 'Computer Engineering',
  role: Role.USER,
  createdAt: '2026-10-27T10:00:00Z',
};

const mockAuthResponse: AuthResponse = {
  accessToken: 'mock-jwt-token-xyz',
  tokenType: 'Bearer',
  expiresIn: 86400,
  user: mockUser,
};

// Test consumer component
const AuthConsumer: React.FC = () => {
  const { user, token, isAuthenticated, isLoading, login, logout, register } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading...' : 'Loaded'}</div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Unauthenticated'}</div>
      <div data-testid="user-name">{user ? user.name : 'No User'}</div>
      <div data-testid="token">{token || 'No Token'}</div>

      <button
        onClick={() =>
          login('e20001@eng.pdn.ac.lk', 'pass123').catch((err) => {
            console.error('Login error', err);
          })
        }
      >
        Sign In Button
      </button>

      <button onClick={() => logout()}>Log Out Button</button>

      <button
        onClick={() =>
          register({
            name: 'Kavindu Perera',
            studentId: 'E/20/001',
            email: 'e20001@eng.pdn.ac.lk',
            password: 'password123',
          }).catch((err) => {
            console.error('Register error', err);
          })
        }
      >
        Register Button
      </button>
    </div>
  );
};

describe('AuthContext and AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    apiClient.clearToken();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    apiClient.clearToken();
  });

  it('initializes in unauthenticated state when no token in localStorage', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    expect(screen.getByTestId('token')).toHaveTextContent('No Token');
  });

  it('restores authenticated session when valid token exists in localStorage', async () => {
    localStorage.setItem(TOKEN_KEY, 'saved-valid-jwt');

    vi.spyOn(api.users, 'getMe').mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    expect(api.users.getMe).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Kavindu Perera');
    expect(screen.getByTestId('token')).toHaveTextContent('saved-valid-jwt');
    expect(apiClient.getToken()).toBe('saved-valid-jwt');
  });

  it('purges session when saved token is rejected by backend (401 Unauthorized)', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired-bad-jwt');

    vi.spyOn(api.users, 'getMe').mockRejectedValue(
      new ApiError('Invalid or expired token', 401, { message: 'Unauthorized' })
    );

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    expect(screen.getByTestId('token')).toHaveTextContent('No Token');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(apiClient.getToken()).toBeNull();
  });

  it('handles successful login by saving token and updating state', async () => {
    vi.spyOn(api.auth, 'login').mockResolvedValue(mockAuthResponse);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    await act(async () => {
      screen.getByText('Sign In Button').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    expect(screen.getByTestId('user-name')).toHaveTextContent('Kavindu Perera');
    expect(screen.getByTestId('token')).toHaveTextContent('mock-jwt-token-xyz');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('mock-jwt-token-xyz');
    expect(apiClient.getToken()).toBe('mock-jwt-token-xyz');
  });

  it('handles logout by removing token and resetting state', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-to-be-cleared');
    vi.spyOn(api.users, 'getMe').mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    await act(async () => {
      screen.getByText('Log Out Button').click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    expect(screen.getByTestId('token')).toHaveTextContent('No Token');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(apiClient.getToken()).toBeNull();
  });

  it('handles registration without automatically logging in', async () => {
    vi.spyOn(api.auth, 'register').mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    await act(async () => {
      screen.getByText('Register Button').click();
    });

    expect(api.auth.register).toHaveBeenCalledWith({
      name: 'Kavindu Perera',
      studentId: 'E/20/001',
      email: 'e20001@eng.pdn.ac.lk',
      password: 'password123',
    });

    // Registration returns user profile, not token: user remains unauthenticated until login
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Unauthenticated');
    expect(screen.getByTestId('token')).toHaveTextContent('No Token');
  });

  it('throws error when useAuth is consumed outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<AuthConsumer />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });
});
