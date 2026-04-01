import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCustomVideoService } from './customVideoService';

describe('createCustomVideoService', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const serverListResponse = {
    data: [
      {
        id: 'uuid-1',
        title: 'Test Video',
        description: 'A test video',
        thumbnailUrl: '/uploads/thumbnails/thumb.jpg',
        videoUrl: '/uploads/videos/video.mp4',
        duration: 120,
        subtitleStatus: 'none',
        subtitles: [
          { id: 'sub-1', label: 'Korean', language: 'ko', src: '/uploads/subtitles/ko.vtt' },
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    meta: {
      pagination: { page: 1, pageSize: 12, pageCount: 1, total: 1 },
    },
  };

  describe('getVideos', () => {
    it('fetches and transforms video list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(serverListResponse),
      });

      const service = createCustomVideoService('http://localhost:4000');
      const result = await service.getVideos();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('uuid-1');
      expect(result.data[0].title).toBe('Test Video');
      expect(result.data[0].thumbnailUrl).toBe('http://localhost:4000/uploads/thumbnails/thumb.jpg');
      expect(result.data[0].videoUrl).toBe('http://localhost:4000/uploads/videos/video.mp4');
      expect(result.data[0].subtitles).toHaveLength(1);
      expect(result.data[0].subtitles[0].src).toBe('http://localhost:4000/uploads/subtitles/ko.vtt');
      expect(result.total).toBe(1);
    });

    it('passes pagination params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(serverListResponse),
      });

      const service = createCustomVideoService('http://localhost:4000');
      await service.getVideos(2, 6);

      expect(mockFetch.mock.calls[0][0]).toContain('page=2&pageSize=6');
    });
  });

  describe('getVideoById', () => {
    it('fetches and transforms single video', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: serverListResponse.data[0] }),
      });

      const service = createCustomVideoService('http://localhost:4000');
      const video = await service.getVideoById('uuid-1');

      expect(video.id).toBe('uuid-1');
      expect(video.title).toBe('Test Video');
      expect(video.videoUrl).toBe('http://localhost:4000/uploads/videos/video.mp4');
    });

    it('handles video without subtitles', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { ...serverListResponse.data[0], subtitles: [] },
          }),
      });

      const service = createCustomVideoService('http://localhost:4000');
      const video = await service.getVideoById('uuid-1');

      expect(video.subtitles).toEqual([]);
    });
  });

  describe('createVideo', () => {
    it('uploads files before creating video', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve([{ id: 'file-1', url: '/uploads/videos/video.mp4' }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve([{ id: 'file-2', url: '/uploads/thumbnails/thumb.jpg' }]),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () =>
            Promise.resolve({
              data: {
                id: 'new-1',
                title: 'New Video',
                description: '',
                videoUrl: '/uploads/videos/video.mp4',
                thumbnailUrl: '/uploads/thumbnails/thumb.jpg',
                duration: 60,
                subtitleStatus: 'none',
                subtitles: [],
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
              },
            }),
        });

      const service = createCustomVideoService('http://localhost:4000');
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
      expect(mockFetch).toHaveBeenCalledTimes(3);
      const uploadCall = mockFetch.mock.calls[0];
      expect(uploadCall[0]).toBe('http://localhost:4000/api/upload');
      expect(uploadCall[1].method).toBe('POST');
      expect(uploadCall[1].body).toBeInstanceOf(FormData);
    });

    it('creates video with URL when no files provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            data: {
              id: 'url-1',
              title: 'URL Video',
              description: '',
              videoUrl: 'https://example.com/v.mp4',
              thumbnailUrl: '',
              duration: 30,
              subtitleStatus: 'none',
              subtitles: [],
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          }),
      });

      const service = createCustomVideoService('http://localhost:4000');
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

  describe('deleteVideo', () => {
    it('sends delete request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      });

      const service = createCustomVideoService('http://localhost:4000');
      await service.deleteVideo('uuid-1');

      expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:4000/api/videos/uuid-1');
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
    });
  });
});
