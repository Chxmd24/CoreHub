import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiClient, api } from './client';
import { RegisterRequest, LoginRequest } from './types';

describe('API Client', () => {
  beforeEach(() => {
    apiClient.clearToken();
    apiClient.setOnUnauthorizedCallback(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    apiClient.clearToken();
    apiClient.setOnUnauthorizedCallback(null);
  });

  it('manages JWT token in memory', () => {
    expect(apiClient.getToken()).toBeNull();

    apiClient.setToken('test-jwt-token-12345');
    expect(apiClient.getToken()).toBe('test-jwt-token-12345');

    apiClient.clearToken();
    expect(apiClient.getToken()).toBeNull();
  });

  it('attaches Authorization Bearer header when token is present', async () => {
    apiClient.setToken('secure-jwt-payload');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ status: 'UP' }),
    });

    globalThis.fetch = mockFetch;

    await apiClient.get('/api/health');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [requestUrl, requestOptions] = mockFetch.mock.calls[0];

    expect(requestUrl).toContain('/api/health');
    const headers = requestOptions.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer secure-jwt-payload');
  });

  it('constructs correct query params for component listings', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ content: [], totalElements: 0 }),
    });

    globalThis.fetch = mockFetch;

    await api.components.getAll({
      search: 'esp32',
      category: 'Wireless',
      listingType: 'SELL',
      status: 'AVAILABLE',
      page: 1,
      size: 10,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [requestUrl] = mockFetch.mock.calls[0];

    expect(requestUrl).toContain('search=esp32');
    expect(requestUrl).toContain('category=Wireless');
    expect(requestUrl).toContain('listingType=SELL');
    expect(requestUrl).toContain('status=AVAILABLE');
    expect(requestUrl).toContain('page=1');
    expect(requestUrl).toContain('size=10');
  });

  it('throws normalized ApiError on HTTP error status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        status: 409,
        error: 'Conflict',
        message: 'Active reservation prevents component deletion',
      }),
    });

    globalThis.fetch = mockFetch;

    await expect(api.components.delete(101)).rejects.toThrow(
      'Active reservation prevents component deletion'
    );
  });

  it('triggers onUnauthorized callback when a 401 response is received', async () => {
    const unauthorizedCallback = vi.fn();
    apiClient.setOnUnauthorizedCallback(unauthorizedCallback);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        status: 401,
        error: 'Unauthorized',
        message: 'JWT expired',
      }),
    });

    globalThis.fetch = mockFetch;

    await expect(api.users.getMe()).rejects.toThrow('JWT expired');
    expect(unauthorizedCallback).toHaveBeenCalledTimes(1);
  });

  it('sends POST /api/auth/register with user registration payload', async () => {
    const registerPayload: RegisterRequest = {
      name: 'Nuwan Bandara',
      studentId: 'E/20/150',
      email: 'e20150@eng.pdn.ac.lk',
      password: 'password123',
      phone: '+94779876543',
      department: 'Computer Engineering',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        id: 10,
        name: registerPayload.name,
        studentId: registerPayload.studentId,
        email: registerPayload.email,
        phone: registerPayload.phone,
        department: registerPayload.department,
        createdAt: '2026-10-27T10:00:00Z',
      }),
    });

    globalThis.fetch = mockFetch;

    const result = await api.auth.register(registerPayload);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [requestUrl, requestOptions] = mockFetch.mock.calls[0];
    expect(requestUrl).toContain('/api/auth/register');
    expect(requestOptions.method).toBe('POST');
    expect(JSON.parse(requestOptions.body)).toEqual(registerPayload);
    expect(result.studentId).toBe('E/20/150');
  });

  it('sends POST /api/auth/login with credentials and returns accessToken', async () => {
    const loginPayload: LoginRequest = {
      email: 'e20150@eng.pdn.ac.lk',
      password: 'password123',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        accessToken: 'mocked-bearer-jwt',
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: {
          id: 10,
          name: 'Nuwan Bandara',
          studentId: 'E/20/150',
          email: 'e20150@eng.pdn.ac.lk',
          department: 'Computer Engineering',
        },
      }),
    });

    globalThis.fetch = mockFetch;

    const result = await api.auth.login(loginPayload);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [requestUrl, requestOptions] = mockFetch.mock.calls[0];
    expect(requestUrl).toContain('/api/auth/login');
    expect(requestOptions.method).toBe('POST');
    expect(JSON.parse(requestOptions.body)).toEqual(loginPayload);
    expect(result.accessToken).toBe('mocked-bearer-jwt');
    expect(result.user.studentId).toBe('E/20/150');
  });
});
