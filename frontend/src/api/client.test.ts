import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiClient, api } from './client';

describe('API Client', () => {
  beforeEach(() => {
    apiClient.clearToken();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    apiClient.clearToken();
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

  it('throws normalized ApiClientError on HTTP error status', async () => {
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
});
