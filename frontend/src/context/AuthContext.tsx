/**
 * CoreHub Authentication Context & Provider
 *
 * Security & Token Storage Strategy Documentation (Milestone 8):
 * ---------------------------------------------------------------
 * 1. Storage Choice: The access token is stored in `localStorage` through `tokenStorage`
 *    and synchronized with React memory state (`token` and `user`).
 * 2. Why localStorage:
 *    - CoreHub is a client-side Single Page Application (SPA) consuming a stateless
 *      Spring Boot REST API with Bearer token headers (`Authorization: Bearer <jwt>`).
 *    - It preserves the authenticated student session across page reloads and browser tabs
 *      without requiring backend session stickiness.
 * 3. Trade-offs & XSS Mitigations:
 *    - Trade-off: Web storage (`localStorage`) can be accessible to JavaScript running in the same origin.
 *    - Mitigations:
 *      a. React automatically escapes all expressions in JSX before rendering, preventing HTML/script injection.
 *      b. No usage of `dangerouslySetInnerHTML`, `eval()`, or unvetted external scripts.
 *      c. Sensitive credentials (passwords, JWT payloads) are NEVER logged to console or persisted to telemetry.
 *      d. Tokens are strictly passed in HTTP Authorization headers, NEVER in query parameters or URLs.
 *      e. Immediate invalidation: Expired or rejected tokens (HTTP 401) immediately purge local storage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, tokenStorage, setOnUnauthorizedCallback } from '../api/client';
import { UserResponse, AuthResponse, RegisterRequest, LoginRequest } from '../api/types';

export interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrCredentials: string | LoginRequest, password?: string) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<UserResponse>;
  logout: () => void;
  refreshProfile: () => Promise<UserResponse | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    tokenStorage.remove();
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserResponse | null> => {
    const currentToken = tokenStorage.get();
    if (!currentToken) {
      setUser(null);
      setToken(null);
      return null;
    }

    try {
      const profile = await api.users.getMe();
      setUser(profile);
      setToken(currentToken);
      return profile;
    } catch {
      // If fetching the profile fails (e.g. 401 Unauthorized or expired token), clear state
      logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    let isMounted = true;

    // Attach listener for automatic logout when protected endpoints respond with 401
    setOnUnauthorizedCallback(() => {
      if (isMounted) {
        logout();
      }
    });

    const initAuth = async () => {
      const savedToken = tokenStorage.get();
      if (savedToken) {
        try {
          const profile = await api.users.getMe();
          if (isMounted) {
            setUser(profile);
            setToken(savedToken);
          }
        } catch {
          if (isMounted) {
            tokenStorage.remove();
            setToken(null);
            setUser(null);
          }
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      setOnUnauthorizedCallback(null);
    };
  }, [logout]);

  const login = async (
    emailOrCredentials: string | LoginRequest,
    password?: string
  ): Promise<AuthResponse> => {
    const credentials: LoginRequest =
      typeof emailOrCredentials === 'string'
        ? { email: emailOrCredentials, password: password || '' }
        : emailOrCredentials;

    const authResponse = await api.auth.login(credentials);
    tokenStorage.set(authResponse.accessToken);
    setToken(authResponse.accessToken);
    setUser(authResponse.user);
    return authResponse;
  };

  const register = async (data: RegisterRequest): Promise<UserResponse> => {
    // Backend registration returns UserResponse (HTTP 201) without JWT
    return await api.auth.register(data);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
