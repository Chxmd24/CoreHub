/**
 * Centralized API client for CoreHub backend integration.
 * Configured through VITE_API_BASE_URL, defaulting to http://localhost:8080.
 */

import {
  AuthResponse,
  ComponentResponse,
  PagedResponse,
  ReservationResponse,
  UserResponse,
  ApiErrorResponse,
  RegisterRequest,
  LoginRequest,
} from './types';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
).replace(/\/$/, '');

export const TOKEN_KEY = 'corehub_token';

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignored in non-browser/restricted environments
    }
  },
  remove: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignored
    }
  },
};

export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(message: string, status: number = 0, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export class ApiClientError extends ApiError {
  public errorData?: ApiErrorResponse;

  constructor(status: number, message: string, errorData?: ApiErrorResponse) {
    super(message, status, errorData);
    this.name = 'ApiClientError';
    this.errorData = errorData;
  }
}

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (cb: (() => void) | null) => {
  onUnauthorizedCallback = cb;
};

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenStorage.get();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const responseData = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    const errorData = isJson ? (responseData as ApiErrorResponse) : undefined;
    const errorMessage =
      errorData?.message ||
      (typeof responseData === 'string' ? responseData : response.statusText) ||
      'An error occurred';

    throw new ApiClientError(response.status, errorMessage, errorData);
  }

  return responseData as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
  getToken: () => tokenStorage.get(),
  setToken: (token: string) => tokenStorage.set(token),
  clearToken: () => tokenStorage.remove(),
  setOnUnauthorizedCallback: (cb: (() => void) | null) => setOnUnauthorizedCallback(cb),
};

export const api = {
  health: {
    check: () => request<{ status: string; timestamp: string }>('/api/health'),
  },

  auth: {
    register: (data: RegisterRequest) =>
      request<UserResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    login: (data: LoginRequest) =>
      request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  },

  users: {
    getMe: () => request<UserResponse>('/api/users/me'),
  },

  components: {
    getAll: (params?: {
      search?: string;
      keyword?: string;
      category?: string;
      listingType?: string;
      status?: string;
      page?: number;
      size?: number;
      sort?: string;
    }) => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query.set(key, String(value));
          }
        });
      }
      const qs = query.toString();
      return request<PagedResponse<ComponentResponse>>(`/api/components${qs ? `?${qs}` : ''}`);
    },

    getById: (id: number) => request<ComponentResponse>(`/api/components/${id}`),

    getMy: () => request<ComponentResponse[]>('/api/components/mine'),

    create: (data: {
      title: string;
      description: string;
      category: string;
      specifications?: string;
      listingType: string;
      price?: number;
    }) => request<ComponentResponse>('/api/components', { method: 'POST', body: JSON.stringify(data) }),

    update: (
      id: number,
      data: {
        title: string;
        description: string;
        category: string;
        specifications?: string;
        listingType: string;
        price?: number;
      }
    ) => request<ComponentResponse>(`/api/components/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id: number) => request<void>(`/api/components/${id}`, { method: 'DELETE' }),
  },

  reservations: {
    create: (data: { componentId: number }) =>
      request<ReservationResponse>('/api/reservations', { method: 'POST', body: JSON.stringify(data) }),

    getMy: () => request<ReservationResponse[]>('/api/reservations/mine'),

    getReceived: () => request<ReservationResponse[]>('/api/reservations/received'),

    getById: (id: number) => request<ReservationResponse>(`/api/reservations/${id}`),

    cancel: (id: number) => request<ReservationResponse>(`/api/reservations/${id}/cancel`, { method: 'PATCH' }),

    complete: (id: number) => request<ReservationResponse>(`/api/reservations/${id}/complete`, { method: 'PATCH' }),
  },
};
