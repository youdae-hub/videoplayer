import { Link } from 'react-router-dom';
import { formatTime } from '@videoplayer/core';
import type { Video } from '@videoplayer/core';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link
      to={`/video/${video.id}`}
      className="group block overflow-hidden rounded-lg bg-neutral-900 transition-transform duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/40"
    >
      <div className="relative aspect-video overflow-hidden bg-neutral-800">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatTime(video.duration)}
        </span>
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-white">
          {video.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-neutral-400">
          {video.description}
        </p>
      </div>
    </Link>
  );
}
