import { useState, useEffect } from 'react';
import type { Video } from '@videoplayer/core';
import { videoService } from '../services/createVideoService';
import { VideoListGrid } from '../components/VideoListGrid';
import { SkeletonGrid } from '../components/SkeletonGrid';

export function VideoListPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    videoService.getVideos().then((res) => {
      setVideos(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Videos</h1>
      {loading ? <SkeletonGrid /> : <VideoListGrid videos={videos} />}
    </div>
  );
}
