import { useState, useEffect, useCallback, useRef } from 'react';
import type { Video } from '@videoplayer/core';
import { formatTime } from '@videoplayer/core';
import { videoService } from '../services/createVideoService';
import type { VideoInput, SupportedLanguage } from '../services/types';
import { VideoFormModal } from '../components/VideoFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { revokeVideoUrl } from '../utils/videoFileProcessor';

async function downloadSubtitle(src: string, label: string) {
  const res = await fetch(src);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${label}.vtt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function SubtitleStatusBadge({
  video,
  languages,
  onTranscribe,
  onTranslate,
}: {
  video: Video;
  languages: SupportedLanguage[];
  onTranscribe: (id: string) => void;
  onTranslate: (id: string, lang: string) => void;
}) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const status = video.subtitleStatus || 'none';

  const existingLangs = video.subtitles.map((s) => s.language);
  const availableLangs = languages.filter((l) => !existingLangs.includes(l.code));
  const isTranslating = status === 'processing' && video.subtitles.length > 0;

  if (status === 'processing' && video.subtitles.length === 0) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-900/30 px-2.5 py-1 text-xs text-yellow-400">
          <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
          자막 생성 중...
        </span>
      </div>
    );
  }

  if ((status === 'completed' || isTranslating) && video.subtitles.length > 0) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-1">
          {video.subtitles.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 rounded-full bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-400"
            >
              {s.label}
              <button
                className="text-green-600 hover:text-green-300 transition-colors"
                title={`${s.label} 자막 다운로드`}
                onClick={(e) => {
                  e.stopPropagation();
                  downloadSubtitle(s.src, s.label);
                }}
              >
                ↓
              </button>
            </span>
          ))}
          {isTranslating && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-900/30 px-2.5 py-0.5 text-xs text-yellow-400">
              <span className="inline-block h-2 w-2 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
              번역 중...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {videoService.translateVideo && availableLangs.length > 0 && !isTranslating && (
            <div className="relative">
              <button
                className="rounded-full bg-blue-900/30 px-2.5 py-0.5 text-xs text-blue-400 hover:bg-blue-900/50 transition-colors"
                onClick={() => setShowLangMenu(!showLangMenu)}
              >
                + 번역
              </button>
              {showLangMenu && (
                <div className="absolute left-0 top-7 z-10 min-w-[120px] rounded-lg border border-neutral-700 bg-neutral-800 py-1 shadow-xl">
                  {availableLangs.map((lang) => (
                    <button
                      key={lang.code}
                      className="block w-full px-4 py-2 text-left text-xs text-neutral-300 hover:bg-neutral-700 transition-colors"
                      onClick={() => {
                        onTranslate(video.id, lang.code);
                        setShowLangMenu(false);
                      }}
                    >
                      {lang.nativeLabel} ({lang.label})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {videoService.transcribeVideo && !isTranslating && (
            <button
              className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500 hover:bg-neutral-700 hover:text-neutral-300 transition-colors"
              title="자막 재생성"
              onClick={() => onTranscribe(video.id)}
            >
              ↻
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-red-900/30 px-2.5 py-1 text-xs font-medium text-red-400">실패</span>
        {videoService.transcribeVideo && (
          <button
            className="rounded-full bg-red-900/20 px-2.5 py-1 text-xs text-red-400 hover:bg-red-900/40 transition-colors"
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
      <span className="text-xs text-neutral-600">없음</span>
      {videoService.transcribeVideo && video.videoUrl && (
        <button
          className="rounded-full bg-blue-900/30 px-2.5 py-0.5 text-xs text-blue-400 hover:bg-blue-900/50 transition-colors"
          title="자막 생성"
          onClick={() => onTranscribe(video.id)}
        >
          자막 생성
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
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const blobUrlsRef = useRef<string[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(revokeVideoUrl);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (videoService.getLanguages) {
      videoService.getLanguages().then(setLanguages);
    }
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

  const handleTranslate = useCallback(async (videoId: string, targetLang: string) => {
    if (!videoService.translateVideo) return;
    await videoService.translateVideo(videoId, targetLang);
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

      <div className="overflow-visible rounded-lg border border-neutral-800 bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-800 text-neutral-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold w-20">Thumbnail</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold w-20 text-center">Duration</th>
              <th className="px-4 py-3 font-semibold w-52">Subtitles</th>
              <th className="px-4 py-3 font-semibold w-24 text-center">Updated</th>
              <th className="px-4 py-3 font-semibold w-28 text-center">Actions</th>
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
                      className="h-12 w-20 rounded-md object-cover bg-neutral-800"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-sm line-clamp-2">{video.title}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-neutral-400 tabular-nums">{formatTime(video.duration)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <SubtitleStatusBadge video={video} languages={languages} onTranscribe={handleTranscribe} onTranslate={handleTranslate} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-neutral-500">{new Date(video.updatedAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      <button
                        className="rounded-md px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                        title="Edit"
                        onClick={() => handleEdit(video)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-md px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-900/30 hover:text-red-300"
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
