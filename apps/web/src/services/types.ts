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
  videoFile?: File;
  thumbnailBlob?: Blob;
}

export interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

export interface SupportedLanguage {
  code: string;
  label: string;
  nativeLabel: string;
}

export interface VideoService {
  getVideos(page?: number, pageSize?: number): Promise<PaginatedResponse<Video>>;
  getVideoById(id: string): Promise<Video>;
  createVideo(input: VideoInput): Promise<Video>;
  updateVideo(id: string, input: VideoInput): Promise<Video>;
  deleteVideo(id: string): Promise<void>;
  transcribeVideo?(id: string): Promise<void>;
  translateVideo?(id: string, targetLanguage: string): Promise<void>;
  getLanguages?(): Promise<SupportedLanguage[]>;
  getAudioUrl?(id: string): string;
  getSubtitleCues?(subtitleId: string): Promise<SubtitleCue[]>;
  updateSubtitleCues?(subtitleId: string, cues: SubtitleCue[]): Promise<SubtitleCue[]>;
  getGifUrl?(id: string, start: number, end: number, width?: number): string;
  downloadYoutubeGif?(url: string, start: number, end: number, width?: number): Promise<Blob>;
  downloadYoutubeVideo?(url: string): Promise<Blob>;
  listYoutubeSubtitles?(url: string): Promise<{ code: string; label: string; auto: boolean }[]>;
  downloadYoutubeSubtitle?(url: string, lang: string): Promise<Blob>;
}
