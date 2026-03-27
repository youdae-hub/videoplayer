export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  subtitles: Subtitle[];
  createdAt: string;
  updatedAt: string;
}

export interface Subtitle {
  id: string;
  label: string;
  language: string;
  src: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  isFullscreen: boolean;
  subtitlesEnabled: boolean;
  activeSubtitleId: string | null;
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  subtitles?: Subtitle[];
  autoPlay?: boolean;
  className?: string;
}
