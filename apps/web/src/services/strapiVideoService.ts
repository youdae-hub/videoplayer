import type { VideoService, PaginatedResponse, VideoInput } from './types';
import type { Video, Subtitle } from '@videoplayer/core';
import { createApiClient } from './apiClient';

interface StrapiMedia {
  url: string;
}

interface StrapiSubtitle {
  id: number;
  label: string;
  language: string;
  file: StrapiMedia;
}

interface StrapiVideoAttributes {
  title: string;
  description: string;
  thumbnail: { data: { attributes: StrapiMedia } | null };
  videoFile: { data: { attributes: StrapiMedia } | null };
  duration: number;
  subtitles: StrapiSubtitle[];
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

interface StrapiItem {
  id: number;
  attributes: StrapiVideoAttributes;
}

interface StrapiUploadResult {
  id: number;
  url: string;
}

function transformSubtitle(sub: StrapiSubtitle, baseUrl: string): Subtitle {
  return {
    id: String(sub.id),
    label: sub.label,
    language: sub.language,
    src: `${baseUrl}${sub.file.url}`,
  };
}

function transformVideo(item: StrapiItem, baseUrl: string): Video {
  const { attributes } = item;
  return {
    id: String(item.id),
    title: attributes.title,
    description: attributes.description,
    thumbnailUrl: attributes.thumbnail?.data?.attributes
      ? `${baseUrl}${attributes.thumbnail.data.attributes.url}`
      : '',
    videoUrl: attributes.videoFile?.data?.attributes
      ? `${baseUrl}${attributes.videoFile.data.attributes.url}`
      : '',
    duration: attributes.duration,
    subtitles: (attributes.subtitles || []).map((s) => transformSubtitle(s, baseUrl)),
    createdAt: attributes.createdAt,
    updatedAt: attributes.updatedAt,
  };
}

export function createStrapiVideoService(baseUrl?: string): VideoService {
  const strapiUrl = baseUrl || import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
  const api = createApiClient({ baseUrl: strapiUrl });
  const populate = 'populate=thumbnail,videoFile,subtitles.file';

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
      const res = await api.get<StrapiResponse<StrapiItem[]>>(`/api/videos${params}`);

      return {
        data: res.data.map((item) => transformVideo(item, strapiUrl)),
        total: res.meta.pagination.total,
        page: res.meta.pagination.page,
        pageSize: res.meta.pagination.pageSize,
        totalPages: res.meta.pagination.pageCount,
      };
    },

    async getVideoById(id: string): Promise<Video> {
      const res = await api.get<StrapiResponse<StrapiItem>>(`/api/videos/${id}?${populate}`);
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

      const res = await api.post<StrapiResponse<StrapiItem>>('/api/videos', {
        data: {
          title: input.title,
          description: input.description,
          duration: input.duration,
          ...(videoMediaId && { videoFile: videoMediaId }),
          ...(thumbnailMediaId && { thumbnail: thumbnailMediaId }),
          subtitles: input.subtitles.map((s) => ({
            label: s.label,
            language: s.language,
          })),
        },
      });
      return transformVideo(res.data, strapiUrl);
    },

    async updateVideo(id: string, input: VideoInput): Promise<Video> {
      let videoMediaId: number | undefined;
      let thumbnailMediaId: number | undefined;

      if (input.videoFile) {
        videoMediaId = await uploadFile(input.videoFile);
      }
      if (input.thumbnailBlob) {
        thumbnailMediaId = await uploadFile(input.thumbnailBlob, 'thumbnail.jpg');
      }

      const res = await api.put<StrapiResponse<StrapiItem>>(`/api/videos/${id}`, {
        data: {
          title: input.title,
          description: input.description,
          duration: input.duration,
          ...(videoMediaId && { videoFile: videoMediaId }),
          ...(thumbnailMediaId && { thumbnail: thumbnailMediaId }),
          subtitles: input.subtitles.map((s) => ({
            label: s.label,
            language: s.language,
          })),
        },
      });
      return transformVideo(res.data, strapiUrl);
    },

    async deleteVideo(id: string): Promise<void> {
      await api.delete(`/api/videos/${id}`);
    },
  };
}
