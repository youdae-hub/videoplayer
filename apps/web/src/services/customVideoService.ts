import type { VideoService, PaginatedResponse, VideoInput, SupportedLanguage, SubtitleCue } from './types';
import type { Video } from '@videoplayer/core';
import { createApiClient } from './apiClient';

interface ServerSubtitle {
  id: string;
  label: string;
  language: string;
  src: string;
}

interface ServerVideoData {
  id: string;
  title: string;
  description: string;
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  subtitleStatus: string;
  subtitles: ServerSubtitle[];
  createdAt: string;
  updatedAt: string;
}

interface ServerResponse<T> {
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

interface UploadResult {
  id: string;
  url: string;
}

function transformVideo(item: ServerVideoData, baseUrl: string): Video {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    thumbnailUrl: item.thumbnailUrl ? `${baseUrl}${item.thumbnailUrl}` : '',
    videoUrl: item.videoUrl ? `${baseUrl}${item.videoUrl}` : '',
    duration: item.duration,
    subtitles: (item.subtitles || []).map((s) => ({
      id: s.id,
      label: s.label,
      language: s.language,
      src: `${baseUrl}${s.src}`,
    })),
    subtitleStatus: item.subtitleStatus as Video['subtitleStatus'],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function createCustomVideoService(baseUrl?: string): VideoService {
  const serverUrl = baseUrl || import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
  const api = createApiClient({ baseUrl: serverUrl });

  async function uploadFile(file: File | Blob, fileName?: string): Promise<string> {
    const formData = new FormData();
    if (file instanceof File) {
      formData.append('files', file);
    } else {
      formData.append('files', file, fileName || 'thumbnail.jpg');
    }
    const result = await api.upload<UploadResult[]>('/api/upload', formData);
    return result[0].url;
  }

  return {
    async getVideos(page = 1, pageSize = 12): Promise<PaginatedResponse<Video>> {
      const res = await api.get<ServerResponse<ServerVideoData[]>>(
        `/api/videos?page=${page}&pageSize=${pageSize}`,
      );

      return {
        data: res.data.map((item) => transformVideo(item, serverUrl)),
        total: res.meta.pagination.total,
        page: res.meta.pagination.page,
        pageSize: res.meta.pagination.pageSize,
        totalPages: res.meta.pagination.pageCount,
      };
    },

    async getVideoById(id: string): Promise<Video> {
      const res = await api.get<{ data: ServerVideoData }>(`/api/videos/${id}`);
      return transformVideo(res.data, serverUrl);
    },

    async createVideo(input: VideoInput): Promise<Video> {
      let videoUrl = input.videoUrl;
      let thumbnailUrl = input.thumbnailUrl;

      if (input.videoFile) {
        videoUrl = await uploadFile(input.videoFile);
      }
      if (input.thumbnailBlob) {
        thumbnailUrl = await uploadFile(input.thumbnailBlob, 'thumbnail.jpg');
      }

      const res = await api.post<{ data: ServerVideoData }>('/api/videos', {
        title: input.title,
        description: input.description,
        duration: input.duration,
        videoUrl,
        thumbnailUrl,
      });
      return transformVideo(res.data, serverUrl);
    },

    async updateVideo(id: string, input: VideoInput): Promise<Video> {
      // Strip baseUrl prefix so the DB stores relative paths (e.g. /uploads/...)
      const stripBase = (url: string) =>
        url.startsWith(serverUrl) ? url.slice(serverUrl.length) : url;

      let videoUrl = stripBase(input.videoUrl);
      let thumbnailUrl = stripBase(input.thumbnailUrl);

      if (input.videoFile) {
        videoUrl = await uploadFile(input.videoFile);
      }
      if (input.thumbnailBlob) {
        thumbnailUrl = await uploadFile(input.thumbnailBlob, 'thumbnail.jpg');
      }

      const res = await api.put<{ data: ServerVideoData }>(`/api/videos/${id}`, {
        title: input.title,
        description: input.description,
        duration: input.duration,
        videoUrl,
        thumbnailUrl,
      });
      return transformVideo(res.data, serverUrl);
    },

    async deleteVideo(id: string): Promise<void> {
      await api.delete(`/api/videos/${id}`);
    },

    async transcribeVideo(id: string): Promise<void> {
      await api.post(`/api/videos/${id}/transcribe`, {});
    },

    async translateVideo(id: string, targetLanguage: string): Promise<void> {
      await api.post(`/api/videos/${id}/translate`, { targetLanguage });
    },

    async getLanguages(): Promise<SupportedLanguage[]> {
      const res = await api.get<{ data: SupportedLanguage[] }>('/api/videos/meta/languages');
      return res.data;
    },

    getAudioUrl(id: string): string {
      return `${serverUrl}/api/videos/${id}/audio`;
    },

    async getSubtitleCues(subtitleId: string): Promise<SubtitleCue[]> {
      const res = await api.get<{ data: SubtitleCue[] }>(`/api/subtitles/${subtitleId}/cues`);
      return res.data;
    },

    async updateSubtitleCues(subtitleId: string, cues: SubtitleCue[]): Promise<SubtitleCue[]> {
      const res = await api.put<{ data: SubtitleCue[] }>(`/api/subtitles/${subtitleId}/cues`, { cues });
      return res.data;
    },

    getGifUrl(id: string, start: number, end: number, width?: number): string {
      const params = new URLSearchParams({ start: String(start), end: String(end) });
      if (width) params.set('width', String(width));
      return `${serverUrl}/api/videos/${id}/gif?${params}`;
    },

    async downloadYoutubeGif(url: string, start: number, end: number, width?: number): Promise<Blob> {
      const res = await fetch(`${serverUrl}/api/gif/from-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, start, end, width: width || 480 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(body.error || `Failed with status ${res.status}`);
      }
      return res.blob();
    },
  };
}
