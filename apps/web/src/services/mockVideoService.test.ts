import { describe, it, expect, beforeEach } from 'vitest';
import { mockVideoService, resetMockData } from './mockVideoService';

beforeEach(() => {
  resetMockData();
});

describe('mockVideoService', () => {
  describe('getVideos', () => {
    it('returns paginated video list', async () => {
      const result = await mockVideoService.getVideos();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('supports pagination', async () => {
      const result = await mockVideoService.getVideos(1, 2);
      expect(result.data.length).toBe(2);
      expect(result.pageSize).toBe(2);
    });

    it('returns correct total pages', async () => {
      const result = await mockVideoService.getVideos(1, 2);
      expect(result.totalPages).toBe(Math.ceil(result.total / 2));
    });
  });

  describe('getVideoById', () => {
    it('returns video by id', async () => {
      const video = await mockVideoService.getVideoById('1');
      expect(video.id).toBe('1');
      expect(video.title).toBeDefined();
    });

    it('throws for unknown id', async () => {
      await expect(mockVideoService.getVideoById('999')).rejects.toThrow('Video not found: 999');
    });
  });

  describe('createVideo', () => {
    it('creates a new video and returns it', async () => {
      const input = {
        title: 'New Video',
        description: 'Desc',
        videoUrl: 'https://example.com/v.mp4',
        thumbnailUrl: 'https://example.com/t.jpg',
        duration: 60,
        subtitles: [{ label: '한국어', language: 'ko', src: '/subs/ko.vtt' }],
      };
      const video = await mockVideoService.createVideo(input);
      expect(video.title).toBe('New Video');
      expect(video.id).toBeDefined();
      expect(video.subtitles).toHaveLength(1);
      expect(video.subtitles[0].label).toBe('한국어');

      const list = await mockVideoService.getVideos();
      expect(list.total).toBe(7);
    });
  });

  describe('updateVideo', () => {
    it('updates an existing video', async () => {
      const input = {
        title: 'Updated Title',
        description: 'Updated',
        videoUrl: 'https://example.com/v.mp4',
        thumbnailUrl: 'https://example.com/t.jpg',
        duration: 100,
        subtitles: [],
      };
      const updated = await mockVideoService.updateVideo('1', input);
      expect(updated.title).toBe('Updated Title');
      expect(updated.id).toBe('1');
    });

    it('throws for unknown id', async () => {
      const input = { title: '', description: '', videoUrl: '', thumbnailUrl: '', duration: 0, subtitles: [] };
      await expect(mockVideoService.updateVideo('999', input)).rejects.toThrow('Video not found: 999');
    });
  });

  describe('deleteVideo', () => {
    it('removes the video from the list', async () => {
      await mockVideoService.deleteVideo('1');
      const list = await mockVideoService.getVideos();
      expect(list.total).toBe(5);
      await expect(mockVideoService.getVideoById('1')).rejects.toThrow();
    });

    it('throws for unknown id', async () => {
      await expect(mockVideoService.deleteVideo('999')).rejects.toThrow('Video not found: 999');
    });
  });
});
