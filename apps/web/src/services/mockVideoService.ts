import type { VideoService, PaginatedResponse, VideoInput } from './types';
import type { Video } from '@videoplayer/core';
import { mockVideos as initialMockVideos } from './mockData';

const SIMULATED_DELAY = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let videos = [...initialMockVideos];
let nextId = videos.length + 1;

export function resetMockData() {
  videos = [...initialMockVideos];
  nextId = videos.length + 1;
}

export const mockVideoService: VideoService = {
  async getVideos(page = 1, pageSize = 12): Promise<PaginatedResponse<Video>> {
    await delay(SIMULATED_DELAY);
    const start = (page - 1) * pageSize;
    const data = videos.slice(start, start + pageSize);
    return {
      data,
      total: videos.length,
      page,
      pageSize,
      totalPages: Math.ceil(videos.length / pageSize),
    };
  },

  async getVideoById(id: string): Promise<Video> {
    await delay(SIMULATED_DELAY);
    const video = videos.find((v) => v.id === id);
    if (!video) throw new Error(`Video not found: ${id}`);
    return video;
  },

  async createVideo(input: VideoInput): Promise<Video> {
    await delay(SIMULATED_DELAY);
    const now = new Date().toISOString();
    const video: Video = {
      id: String(nextId++),
      title: input.title,
      description: input.description,
      videoUrl: input.videoUrl,
      thumbnailUrl: input.thumbnailUrl,
      duration: input.duration,
      subtitles: input.subtitles.map((s, i) => ({
        id: `sub-${Date.now()}-${i}`,
        label: s.label,
        language: s.language,
        src: s.src,
      })),
      createdAt: now,
      updatedAt: now,
    };
    videos.push(video);
    return video;
  },

  async updateVideo(id: string, input: VideoInput): Promise<Video> {
    await delay(SIMULATED_DELAY);
    const index = videos.findIndex((v) => v.id === id);
    if (index === -1) throw new Error(`Video not found: ${id}`);
    const updated: Video = {
      ...videos[index],
      title: input.title,
      description: input.description,
      videoUrl: input.videoUrl,
      thumbnailUrl: input.thumbnailUrl,
      duration: input.duration,
      subtitles: input.subtitles.map((s, i) => ({
        id: `sub-${Date.now()}-${i}`,
        label: s.label,
        language: s.language,
        src: s.src,
      })),
      updatedAt: new Date().toISOString(),
    };
    videos[index] = updated;
    return updated;
  },

  async deleteVideo(id: string): Promise<void> {
    await delay(SIMULATED_DELAY);
    const index = videos.findIndex((v) => v.id === id);
    if (index === -1) throw new Error(`Video not found: ${id}`);
    videos.splice(index, 1);
  },
};
