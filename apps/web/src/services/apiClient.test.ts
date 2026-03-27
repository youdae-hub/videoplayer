import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApiClient } from './apiClient';

describe('createApiClient', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('makes GET request to correct URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const client = createApiClient({ baseUrl: 'http://localhost:1337' });
    await client.get('/api/videos');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:1337/api/videos');
  });

  it('returns parsed JSON on success', async () => {
    const mockData = { data: [{ id: 1 }] };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const result = await client.get('/api/videos');

    expect(result).toEqual(mockData);
  });

  it('throws error on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const client = createApiClient({ baseUrl: 'http://test.com' });

    await expect(client.get('/api/videos/999')).rejects.toEqual({
      status: 404,
      message: 'API error: 404 Not Found',
    });
  });

  it('uses custom base URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const client = createApiClient({ baseUrl: 'http://custom:3000' });
    await client.get('/api/test');

    expect(mockFetch).toHaveBeenCalledWith('http://custom:3000/api/test');
  });
});
