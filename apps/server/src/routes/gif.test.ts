import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';

vi.mock('child_process', async () => {
  const actual = await vi.importActual<typeof import('child_process')>('child_process');
  return {
    ...actual,
    spawn: vi.fn(),
    execFile: vi.fn(),
  };
});

import { execFile } from 'child_process';

describe('GIF from URL API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/gif/from-url', () => {
    it('returns 400 when url is missing', async () => {
      const res = await request(app)
        .post('/api/gif/from-url')
        .send({ start: 0, end: 3 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('url, start, and end are required');
    });

    it('returns 400 when start or end is missing', async () => {
      const res = await request(app)
        .post('/api/gif/from-url')
        .send({ url: 'https://www.youtube.com/watch?v=test123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('url, start, and end are required');
    });

    it('returns 400 when start >= end', async () => {
      const res = await request(app)
        .post('/api/gif/from-url')
        .send({ url: 'https://www.youtube.com/watch?v=test123', start: 5, end: 3 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('start must be less than end');
    });

    it('returns 400 when duration exceeds 30 seconds', async () => {
      const res = await request(app)
        .post('/api/gif/from-url')
        .send({ url: 'https://www.youtube.com/watch?v=test123', start: 0, end: 35 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('GIF duration must not exceed 30 seconds');
    });

    it('returns 400 for invalid URL format', async () => {
      const res = await request(app)
        .post('/api/gif/from-url')
        .send({ url: 'not-a-url', start: 0, end: 3 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid URL format');
    });

    it('accepts youtube.com URLs', async () => {
      const mockExecFile = vi.mocked(execFile);
      mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb?: any) => {
        const callback = cb || _opts;
        if (typeof callback === 'function') {
          callback(new Error('mock abort'), '', 'mock error');
        }
        return {} as any;
      });

      const res = await request(app)
        .post('/api/gif/from-url')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', start: 0, end: 3 });

      // Should get past validation (may fail at download step, that's ok)
      expect(res.status).not.toBe(400);
    });

    it('accepts youtu.be short URLs', async () => {
      const mockExecFile = vi.mocked(execFile);
      mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb?: any) => {
        const callback = cb || _opts;
        if (typeof callback === 'function') {
          callback(new Error('mock abort'), '', 'mock error');
        }
        return {} as any;
      });

      const res = await request(app)
        .post('/api/gif/from-url')
        .send({ url: 'https://youtu.be/dQw4w9WgXcQ', start: 0, end: 3 });

      expect(res.status).not.toBe(400);
    });
  });
});
