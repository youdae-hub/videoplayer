import type { VideoService, PaginatedResponse, VideoInput } from './types';
import type { Video } from '@videoplayer/core';
import { createApiClient } from './apiClient';

interface StrapiMedia {
  id: number;
  documentId: string;
  url: string;
}

interface StrapiVideoData {
  id: number;
  documentId: string;
  title: string;
  description: string;
  thumbnail: StrapiMedia | null;
  videoFile: StrapiMedia | null;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiUploadResult {
  id: number;
  url: string;
}

function transformVideo(item: StrapiVideoData, baseUrl: string): Video {
  return {
    id: item.documentId,
    title: item.title,
    description: item.description,
    thumbnailUrl: item.thumbnail ? `${baseUrl}${item.thumbnail.url}` : '',
    videoUrl: item.videoFile ? `${baseUrl}${item.videoFile.url}` : '',
    duration: item.duration,
    subtitles: [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function createStrapiVideoService(baseUrl?: string): VideoService {
  const strapiUrl = baseUrl || import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
  const api = createApiClient({ baseUrl: strapiUrl });
  const populate = 'populate=*';

  async function uploadFile(file: File | Blob, fileName?: string): Promise<number> {
    const formData = new FormData();
    if (file instanceof File) {
      formData.append('files', file);
    } else {
      formData.append('files', file, fileName || 'thumbnail.jpg');
    }
    const result = await api.upload<StrapiUploadResult[]>('/api/upload', formData);
    return result[0].id;
  }

  return {
    async getVideos(page = 1, pageSize = 12): Promise<PaginatedResponse<Video>> {
      const params = `?pagination[page]=${page}&pagination[pageSize]=${pageSize}&${populate}`;
      const res = await api.get<StrapiResponse<StrapiVideoData[]>>(`/api/videos${params}`);

      return {
        data: res.data.map((item) => transformVideo(item, strapiUrl)),
        total: res.meta.pagination.total,
        page: res.meta.pagination.page,
        pageSize: res.meta.pagination.pageSize,
        totalPages: res.meta.pagination.pageCount,
      };
    },

    async getVideoById(id: string): Promise<Video> {
      const res = await api.get<StrapiResponse<StrapiVideoData>>(`/api/videos/${id}?${populate}`);
      return transformVideo(res.data, strapiUrl);
    },

    async createVideo(input: VideoInput): Promise<Video> {
      let videoMediaId: number | undefined;
      let thumbnailMediaId: number | undefined;

      if (input.videoFile) {
        videoMediaId = await uploadFile(input.videoFile);
      }
      if (input.thumbnailBlob) {
        thumbnailMediaId = await uploadFile(input.thumbnailBlob, 'thumbnail.jpg');
      }

      const res = await api.post<StrapiResponse<StrapiVideoData>>('/api/videos', {
        data: {
          title: input.title,
          description: input.description,
          duration: input.duration,
          ...(videoMediaId && { videoFile: videoMediaId }),
          ...(thumbnailMediaId && { thumbnail: thumbnailMediaId }),
        },
      });
      return transformVideo(res.data, strapiUrl);
    },

    async updateVideo(id: string, input: VideoInput): Promise<Video> {
      // Fetch existing video to preserve media relations that aren't being changed.
      // Strapi PUT treats missing relation fields as null.
      const existing = await api.get<StrapiResponse<StrapiVideoData>>(`/api/videos/${id}?${populate}`);
      const existingData = existing.data;

      let videoMediaId: number | undefined;
      let thumbnailMediaId: number | undefined;

      if (input.videoFile) {
        videoMediaId = await uploadFile(input.videoFile);
      }
      if (input.thumbnailBlob) {
        thumbnailMediaId = await uploadFile(input.thumbnailBlob, 'thumbnail.jpg');
      }

      const res = await api.put<StrapiResponse<StrapiVideoData>>(`/api/videos/${id}`, {
        data: {
          title: input.title,
          description: input.description,
          duration: input.duration,
          videoFile: videoMediaId ?? existingData.videoFile?.id ?? undefined,
          thumbnail: thumbnailMediaId ?? existingData.thumbnail?.id ?? undefined,
        },
      });
      return transformVideo(res.data, strapiUrl);
    },

    async deleteVideo(id: string): Promise<void> {
      await api.delete(`/api/videos/${id}`);
    },
  };
}
