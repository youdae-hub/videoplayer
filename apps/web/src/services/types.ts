import type { Video } from '@videoplayer/core';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface VideoInput {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  subtitles: { label: string; language: string; src: string }[];
}

export interface VideoService {
  getVideos(page?: number, pageSize?: number): Promise<PaginatedResponse<Video>>;
  getVideoById(id: string): Promise<Video>;
  createVideo(input: VideoInput): Promise<Video>;
  updateVideo(id: string, input: VideoInput): Promise<Video>;
  deleteVideo(id: string): Promise<void>;
}
