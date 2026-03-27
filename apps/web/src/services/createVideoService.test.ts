import { describe, it, expect, vi } from 'vitest';

describe('createVideoService', () => {
  it('returns mock service by default', async () => {
    vi.stubEnv('VITE_API_MODE', 'mock');
    const { createVideoService } = await import('./createVideoService');
    const service = createVideoService();
    const result = await service.getVideos();
    expect(result.data.length).toBeGreaterThan(0);
    vi.unstubAllEnvs();
  });

  it('returns mock service when env is not set', async () => {
    vi.stubEnv('VITE_API_MODE', '');
    const { createVideoService } = await import('./createVideoService');
    const service = createVideoService();
    const result = await service.getVideos();
    expect(result.data.length).toBeGreaterThan(0);
    vi.unstubAllEnvs();
  });
});
