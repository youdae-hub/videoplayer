import { describe, it, expect } from 'vitest';
import { mockVideoService } from './mockVideoService';

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
});
