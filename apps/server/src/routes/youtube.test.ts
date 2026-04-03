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

describe('YouTube API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/youtube/gif', () => {
    it('returns 400 when url is missing', async () => {
      const res = await request(app)
        .post('/api/youtube/gif')
        .send({ start: 0, end: 3 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('url, start, and end are required');
    });

    it('returns 400 when start or end is missing', async () => {
      const res = await request(app)
        .post('/api/youtube/gif')
        .send({ url: 'https://www.youtube.com/watch?v=test123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('url, start, and end are required');
    });

    it('returns 400 when start >= end', async () => {
      const res = await request(app)
        .post('/api/youtube/gif')
        .send({ url: 'https://www.youtube.com/watch?v=test123', start: 5, end: 3 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('start must be less than end');
    });

    it('returns 400 when duration exceeds 30 seconds', async () => {
      const res = await request(app)
        .post('/api/youtube/gif')
        .send({ url: 'https://www.youtube.com/watch?v=test123', start: 0, end: 35 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('GIF duration must not exceed 30 seconds');
    });

    it('returns 400 for invalid URL format', async () => {
      const res = await request(app)
        .post('/api/youtube/gif')
        .send({ url: 'not-a-url', start: 0, end: 3 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid URL format');
    });

    it('accepts valid youtube.com URLs', async () => {
      const mockExecFile = vi.mocked(execFile);
      mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb?: any) => {
        const callback = cb || _opts;
        if (typeof callback === 'function') {
          callback(new Error('mock abort'), '', 'mock error');
        }
        return {} as any;
      });

      const res = await request(app)
        .post('/api/youtube/gif')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', start: 0, end: 3 });

      expect(res.status).not.toBe(400);
    });
  });

  describe('POST /api/youtube/download', () => {
    it('returns 400 when url is missing', async () => {
      const res = await request(app)
        .post('/api/youtube/download')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('url is required');
    });

    it('returns 400 for invalid URL format', async () => {
      const res = await request(app)
        .post('/api/youtube/download')
        .send({ url: 'not-a-url' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid URL format');
    });

    it('accepts valid URLs and attempts download', async () => {
      const mockExecFile = vi.mocked(execFile);
      mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb?: any) => {
        const callback = cb || _opts;
        if (typeof callback === 'function') {
          callback(new Error('mock abort'), '', 'mock error');
        }
        return {} as any;
      });

      const res = await request(app)
        .post('/api/youtube/download')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });

      expect(res.status).not.toBe(400);
    });
  });

  describe('POST /api/youtube/subtitles', () => {
    it('returns 400 when url is missing', async () => {
      const res = await request(app)
        .post('/api/youtube/subtitles')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('url is required');
    });

    it('returns 400 for invalid URL format', async () => {
      const res = await request(app)
        .post('/api/youtube/subtitles')
        .send({ url: 'not-a-url' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid URL format');
    });

    it('returns only manual subtitles (excludes auto captions)', async () => {
      const mockExecFile = vi.mocked(execFile);
      mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb?: any) => {
        const callback = cb || _opts;
        if (typeof callback === 'function') {
          const output = [
            'Available subtitles for dQw4w9WgXcQ:',
            'Language  Name',
            '---',
            'ko       Korean',
            'en       English',
            '',
            'Available automatic captions for dQw4w9WgXcQ:',
            'Language  Name',
            '---',
            'ja       Japanese',
            'fr       French',
          ].join('\n');
          callback(null, output, '');
        }
        return {} as any;
      });

      const res = await request(app)
        .post('/api/youtube/subtitles')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([
        { code: 'ko', label: 'Korean' },
        { code: 'en', label: 'English' },
      ]);
    });
  });

  describe('POST /api/youtube/subtitles/download', () => {
    it('returns 400 when url is missing', async () => {
      const res = await request(app)
        .post('/api/youtube/subtitles/download')
        .send({ lang: 'ko' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('url and lang are required');
    });

    it('returns 400 when lang is missing', async () => {
      const res = await request(app)
        .post('/api/youtube/subtitles/download')
        .send({ url: 'https://www.youtube.com/watch?v=test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('url and lang are required');
    });

    it('returns 400 for invalid URL format', async () => {
      const res = await request(app)
        .post('/api/youtube/subtitles/download')
        .send({ url: 'not-a-url', lang: 'ko' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid URL format');
    });

    it('accepts valid params and attempts download', async () => {
      const mockExecFile = vi.mocked(execFile);
      mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb?: any) => {
        const callback = cb || _opts;
        if (typeof callback === 'function') {
          callback(new Error('mock abort'), '', 'mock error');
        }
        return {} as any;
      });

      const res = await request(app)
        .post('/api/youtube/subtitles/download')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', lang: 'ko' });

      expect(res.status).not.toBe(400);
    });
  });
});
