import type { Video } from '@videoplayer/core';
import { VideoCard } from './VideoCard';

interface VideoListGridProps {
  videos: Video[];
}

export function VideoListGrid({ videos }: VideoListGridProps) {
  if (videos.length === 0) {
    return (
      <div className="py-20 text-center text-neutral-500">
        No videos found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
