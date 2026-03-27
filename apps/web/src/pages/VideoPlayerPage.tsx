import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { VideoPlayer } from '@videoplayer/core';
import type { Video } from '@videoplayer/core';
import { videoService } from '../services/createVideoService';

export function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    videoService.getVideoById(id).then((v) => {
      setVideo(v);
      setLoading(false);
    });
  }, [id]);

  if (loading || !video) {
    return (
      <div>
        <div className="mb-4">
          <div className="h-5 w-20 animate-pulse rounded bg-neutral-800" />
        </div>
        <div className="aspect-video w-full animate-pulse rounded-lg bg-neutral-800" data-testid="player-skeleton" />
        <div className="mt-4 space-y-2">
          <div className="h-6 w-1/3 animate-pulse rounded bg-neutral-800" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-800" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-white"
        aria-label="Back to list"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Back
      </Link>
      <div className="mx-auto max-w-4xl">
        <VideoPlayer
          src={video.videoUrl}
          poster={video.thumbnailUrl}
          subtitles={video.subtitles}
        />
        <div className="mt-4">
          <h1 className="text-xl font-bold">{video.title}</h1>
          <p className="mt-2 text-sm text-neutral-400">{video.description}</p>
          <time className="mt-2 block text-xs text-neutral-500">
            {new Date(video.createdAt).toLocaleDateString()}
          </time>
        </div>
      </div>
    </div>
  );
}
