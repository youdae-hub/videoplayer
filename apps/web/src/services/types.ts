import type { Video } from '@videoplayer/core';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface VideoService {
  getVideos(page?: number, pageSize?: number): Promise<PaginatedResponse<Video>>;
  getVideoById(id: string): Promise<Video>;
}
