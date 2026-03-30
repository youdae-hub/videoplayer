import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStrapiVideoService } from './strapiVideoService';

describe('createStrapiVideoService', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const strapiListResponse = {
    data: [
      {
        id: 1,
        attributes: {
          title: 'Test Video',
          description: 'A test video',
          thumbnail: { data: { attributes: { url: '/uploads/thumb.jpg' } } },
          video: { data: { attributes: { url: '/uploads/video.mp4' } } },
          duration: 120,
          subtitles: [
            { id: 1, label: 'English', language: 'en', file: { url: '/uploads/en.vtt' } },
          ],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      },
    ],
    meta: {
      pagination: { page: 1, pageSize: 12, pageCount: 1, total: 1 },
    },
  };

  describe('getVideos', () => {
    it('fetches and transforms video list from Strapi', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(strapiListResponse),
      });

      const service = createStrapiVideoService('http://localhost:1337');
      const result = await service.getVideos();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('1');
      expect(result.data[0].title).toBe('Test Video');
      expect(result.data[0].thumbnailUrl).toBe('http://localhost:1337/uploads/thumb.jpg');
      expect(result.data[0].videoUrl).toBe('http://localhost:1337/uploads/video.mp4');
      expect(result.data[0].subtitles).toHaveLength(1);
      expect(result.data[0].subtitles[0].src).toBe('http://localhost:1337/uploads/en.vtt');
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('passes pagination params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(strapiListResponse),
      });

      const service = createStrapiVideoService('http://localhost:1337');
      await service.getVideos(2, 6);

      const calledUrl = mockFetch.mock.calls.find(
        (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('pagination[page]=2'),
      );
      expect(calledUrl).toBeDefined();
      expect(calledUrl![0]).toContain('pagination[page]=2&pagination[pageSize]=6');
    });
  });

  describe('getVideoById', () => {
    it('fetches and transforms single video', async () => {
      const singleResponse = {
        data: strapiListResponse.data[0],
        meta: {},
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(singleResponse),
      });

      const service = createStrapiVideoService('http://localhost:1337');
      const video = await service.getVideoById('1');

      expect(video.id).toBe('1');
      expect(video.title).toBe('Test Video');
      expect(video.videoUrl).toBe('http://localhost:1337/uploads/video.mp4');
    });

    it('handles video without subtitles', async () => {
      const noSubsResponse = {
        data: {
          id: 2,
          attributes: {
            ...strapiListResponse.data[0].attributes,
            subtitles: [],
          },
        },
        meta: {},
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(noSubsResponse),
      });

      const service = createStrapiVideoService('http://localhost:1337');
      const video = await service.getVideoById('2');

      expect(video.subtitles).toEqual([]);
    });
  });
});
