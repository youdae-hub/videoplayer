import { useState, useEffect, useCallback } from 'react';
import type { Video } from '@videoplayer/core';
import { videoService } from '../services/createVideoService';
import { VideoListGrid } from '../components/VideoListGrid';
import { SkeletonGrid } from '../components/SkeletonGrid';
import { ViewModeToggle, type ViewMode } from '../components/ViewModeToggle';
import { VideoPlayerModal } from '../components/VideoPlayerModal';

const STORAGE_KEY = 'videoplayer-view-mode';

function getInitialMode(): ViewMode {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'modal' ? 'modal' : 'page';
}

export function VideoListPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialMode);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    videoService.getVideos().then((res) => {
      setVideos(res.data);
      setLoading(false);
    });
  }, []);

  const handleModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const handleVideoSelect = useCallback((video: Video) => {
    setSelectedVideo(video);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedVideo(null);
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Videos</h1>
        <ViewModeToggle mode={viewMode} onChange={handleModeChange} />
      </div>
      {loading ? (
        <SkeletonGrid />
      ) : (
        <VideoListGrid
          videos={videos}
          onVideoSelect={viewMode === 'modal' ? handleVideoSelect : undefined}
        />
      )}
      {selectedVideo && (
        <VideoPlayerModal video={selectedVideo} onClose={handleCloseModal} />
      )}
    </div>
  );
}
