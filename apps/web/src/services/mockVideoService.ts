import type { VideoService, PaginatedResponse } from './types';
import type { Video } from '@videoplayer/core';
import { mockVideos } from './mockData';

const SIMULATED_DELAY = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockVideoService: VideoService = {
  async getVideos(page = 1, pageSize = 12): Promise<PaginatedResponse<Video>> {
    await delay(SIMULATED_DELAY);
    const start = (page - 1) * pageSize;
    const data = mockVideos.slice(start, start + pageSize);
    return {
      data,
      total: mockVideos.length,
      page,
      pageSize,
      totalPages: Math.ceil(mockVideos.length / pageSize),
    };
  },

  async getVideoById(id: string): Promise<Video> {
    await delay(SIMULATED_DELAY);
    const video = mockVideos.find((v) => v.id === id);
    if (!video) throw new Error(`Video not found: ${id}`);
    return video;
  },
};
