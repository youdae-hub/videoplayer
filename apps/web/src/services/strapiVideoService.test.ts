import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStrapiVideoService } from './strapiVideoService';

describe('createStrapiVideoService', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
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
          videoFile: { data: { attributes: { url: '/uploads/video.mp4' } } },
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

  describe('createVideo', () => {
    it('uploads files before creating video', async () => {
      // 1st call: upload video file → returns media id
      // 2nd call: upload thumbnail → returns media id
      // 3rd call: POST /api/videos
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ id: 10, url: '/uploads/video.mp4' }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ id: 11, url: '/uploads/thumb.jpg' }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              data: {
                id: 1,
                attributes: {
                  title: 'New Video',
                  description: '',
                  thumbnail: { data: { attributes: { url: '/uploads/thumb.jpg' } } },
                  videoFile: { data: { attributes: { url: '/uploads/video.mp4' } } },
                  duration: 60,
                  subtitles: [],
                  createdAt: '2026-01-01T00:00:00Z',
                  updatedAt: '2026-01-01T00:00:00Z',
                },
              },
              meta: {},
            }),
        });

      const service = createStrapiVideoService('http://localhost:1337');
      const video = await service.createVideo({
        title: 'New Video',
        description: '',
        videoUrl: '',
        thumbnailUrl: '',
        duration: 60,
        subtitles: [],
        videoFile: new File(['data'], 'video.mp4', { type: 'video/mp4' }),
        thumbnailBlob: new Blob(['thumb'], { type: 'image/jpeg' }),
      });

      expect(video.title).toBe('New Video');
      // First two calls are uploads
      expect(mockFetch).toHaveBeenCalledTimes(3);
      const uploadCall = mockFetch.mock.calls[0];
      expect(uploadCall[0]).toBe('http://localhost:1337/api/upload');
      expect(uploadCall[1].method).toBe('POST');
      expect(uploadCall[1].body).toBeInstanceOf(FormData);
    });

    it('creates video without file upload when no files provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              id: 2,
              attributes: {
                title: 'URL Video',
                description: '',
                thumbnail: { data: null },
                videoFile: { data: null },
                duration: 30,
                subtitles: [],
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
              },
            },
            meta: {},
          }),
      });

      const service = createStrapiVideoService('http://localhost:1337');
      const video = await service.createVideo({
        title: 'URL Video',
        description: '',
        videoUrl: 'https://example.com/v.mp4',
        thumbnailUrl: '',
        duration: 30,
        subtitles: [],
      });

      expect(video.title).toBe('URL Video');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
