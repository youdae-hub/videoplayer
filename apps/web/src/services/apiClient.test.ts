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
      status: 200,
      json: () => Promise.resolve({ data: [] }),
    });

    const client = createApiClient({ baseUrl: 'http://localhost:1337' });
    await client.get('/api/videos');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:1337/api/videos', undefined);
  });

  it('returns parsed JSON on success', async () => {
    const mockData = { data: [{ id: 1 }] };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
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
      status: 200,
      json: () => Promise.resolve({}),
    });

    const client = createApiClient({ baseUrl: 'http://custom:3000' });
    await client.get('/api/test');

    expect(mockFetch).toHaveBeenCalledWith('http://custom:3000/api/test', undefined);
  });

  it('makes POST request with JSON body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    const client = createApiClient({ baseUrl: 'http://test.com' });
    await client.post('/api/videos', { data: { title: 'Test' } });

    expect(mockFetch).toHaveBeenCalledWith('http://test.com/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { title: 'Test' } }),
    });
  });

  it('makes PUT request with JSON body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    const client = createApiClient({ baseUrl: 'http://test.com' });
    await client.put('/api/videos/1', { data: { title: 'Updated' } });

    expect(mockFetch).toHaveBeenCalledWith('http://test.com/api/videos/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { title: 'Updated' } }),
    });
  });

  it('makes DELETE request', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    });

    const client = createApiClient({ baseUrl: 'http://test.com' });
    await client.delete('/api/videos/1');

    expect(mockFetch).toHaveBeenCalledWith('http://test.com/api/videos/1', {
      method: 'DELETE',
    });
  });

  it('uploads FormData without Content-Type header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ id: 1, url: '/uploads/file.mp4' }]),
    });

    const client = createApiClient({ baseUrl: 'http://test.com' });
    const formData = new FormData();
    formData.append('files', new Blob(['data']), 'test.mp4');
    await client.upload('/api/upload', formData);

    expect(mockFetch).toHaveBeenCalledWith('http://test.com/api/upload', {
      method: 'POST',
      body: formData,
    });
  });
});
