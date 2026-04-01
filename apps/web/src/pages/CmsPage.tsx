import { useState, useEffect, useCallback, useRef } from 'react';
import type { Video } from '@videoplayer/core';
import { formatTime } from '@videoplayer/core';
import { videoService } from '../services/createVideoService';
import type { VideoInput } from '../services/types';
import { VideoFormModal } from '../components/VideoFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { revokeVideoUrl } from '../utils/videoFileProcessor';

function SubtitleStatusBadge({
  video,
  onTranscribe,
}: {
  video: Video;
  onTranscribe: (id: string) => void;
}) {
  const status = video.subtitleStatus || 'none';

  if (status === 'processing') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-yellow-900/30 px-2 py-0.5 text-xs text-yellow-400">
        <span className="inline-block h-2 w-2 animate-spin rounded-full border border-yellow-400 border-t-transparent" />
        생성 중...
      </span>
    );
  }

  if (status === 'completed' && video.subtitles.length > 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
          {video.subtitles.map((s) => s.label).join(', ')}
        </span>
        {videoService.transcribeVideo && (
          <button
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            title="자막 재생성"
            onClick={() => onTranscribe(video.id)}
          >
            ↻
          </button>
        )}
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded bg-red-900/30 px-2 py-0.5 text-xs text-red-400">실패</span>
        {videoService.transcribeVideo && (
          <button
            className="text-xs text-neutral-400 hover:text-white transition-colors"
            title="자막 재시도"
            onClick={() => onTranscribe(video.id)}
          >
            재시도
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-neutral-600">없음</span>
      {videoService.transcribeVideo && video.videoUrl && (
        <button
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          title="자막 생성"
          onClick={() => onTranscribe(video.id)}
        >
          생성
        </button>
      )}
    </div>
  );
}

export function CmsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVideo, setFormVideo] = useState<Video | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);
  const blobUrlsRef = useRef<string[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(revokeVideoUrl);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const loadVideos = useCallback(() => {
    setLoading(true);
    videoService.getVideos().then((res) => {
      setVideos(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  useEffect(() => {
    const hasProcessing = videos.some((v) => v.subtitleStatus === 'processing');

    if (hasProcessing && !pollingRef.current) {
      pollingRef.current = setInterval(() => {
        videoService.getVideos().then((res) => {
          setVideos(res.data);
          const stillProcessing = res.data.some((v) => v.subtitleStatus === 'processing');
          if (!stillProcessing && pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        });
      }, 5000);
    }

    if (!hasProcessing && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [videos]);

  const handleAdd = useCallback(() => {
    setFormVideo(undefined);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((video: Video) => {
    setFormVideo(video);
    setShowForm(true);
  }, []);

  const handleFormSubmit = useCallback(async (input: VideoInput) => {
    if (input.videoUrl.startsWith('blob:')) {
      blobUrlsRef.current.push(input.videoUrl);
    }
    if (input.thumbnailUrl.startsWith('data:') || input.thumbnailUrl.startsWith('blob:')) {
      blobUrlsRef.current.push(input.thumbnailUrl);
    }
    if (formVideo) {
      await videoService.updateVideo(formVideo.id, input);
    } else {
      await videoService.createVideo(input);
    }
    setShowForm(false);
    setFormVideo(undefined);
    loadVideos();
  }, [formVideo, loadVideos]);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setFormVideo(undefined);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await videoService.deleteVideo(deleteTarget.id);
      setDeleteTarget(null);
      loadVideos();
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, loadVideos]);

  const handleTranscribe = useCallback(async (videoId: string) => {
    if (!videoService.transcribeVideo) return;
    await videoService.transcribeVideo(videoId);
    loadVideos();
  }, [loadVideos]);

  const apiMode = import.meta.env.VITE_API_MODE || 'mock';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Management</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAdd}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            + 동영상 추가
          </button>
          <span className="rounded bg-neutral-800 px-3 py-1 text-xs text-neutral-400">
            {apiMode === 'strapi' ? 'Strapi' : apiMode === 'custom' ? 'Custom' : 'Mock'} Mode
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-800 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Thumbnail</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Subtitles</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-t border-neutral-800">
                  <td className="px-4 py-3">
                    <div className="h-10 w-16 animate-pulse rounded bg-neutral-700" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-32 animate-pulse rounded bg-neutral-700" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-12 animate-pulse rounded bg-neutral-700" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-8 animate-pulse rounded bg-neutral-700" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-neutral-700" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-16 animate-pulse rounded bg-neutral-700" />
                  </td>
                </tr>
              ))
            ) : (
              videos.map((video) => (
                <tr key={video.id} className="border-t border-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-800/50">
                  <td className="px-4 py-3">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="h-10 w-16 rounded object-cover"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{video.title}</td>
                  <td className="px-4 py-3 text-neutral-400">{formatTime(video.duration)}</td>
                  <td className="px-4 py-3 text-neutral-400">
                    <SubtitleStatusBadge video={video} onTranscribe={handleTranscribe} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">
                    {new Date(video.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        className="rounded px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                        title="Edit"
                        onClick={() => handleEdit(video)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-900/30 hover:text-red-300"
                        title="Delete"
                        onClick={() => setDeleteTarget(video)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && videos.length === 0 && (
          <div className="p-8 text-center text-neutral-500">
            No videos found.
          </div>
        )}
      </div>

      {apiMode === 'mock' && (
        <p className="mt-4 text-xs text-neutral-500">
          Currently using mock data. Set <code className="rounded bg-neutral-800 px-1">VITE_API_MODE=custom</code> and <code className="rounded bg-neutral-800 px-1">VITE_SERVER_URL</code> to connect to the CMS server.
        </p>
      )}

      {showForm && (
        <VideoFormModal
          video={formVideo}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="동영상 삭제"
          message={`"${deleteTarget.title}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
