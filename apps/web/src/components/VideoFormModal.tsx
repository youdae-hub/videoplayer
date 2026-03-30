import { useState, useCallback } from 'react';
import type { Video } from '@videoplayer/core';
import type { VideoInput } from '../services/types';

interface VideoFormModalProps {
  video?: Video;
  onSubmit: (input: VideoInput) => Promise<void>;
  onClose: () => void;
}

interface SubtitleRow {
  label: string;
  language: string;
  src: string;
}

export function VideoFormModal({ video, onSubmit, onClose }: VideoFormModalProps) {
  const [title, setTitle] = useState(video?.title ?? '');
  const [description, setDescription] = useState(video?.description ?? '');
  const [videoUrl, setVideoUrl] = useState(video?.videoUrl ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(video?.thumbnailUrl ?? '');
  const [duration, setDuration] = useState(video?.duration ?? 0);
  const [subtitles, setSubtitles] = useState<SubtitleRow[]>(
    video?.subtitles.map((s) => ({ label: s.label, language: s.language, src: s.src })) ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!video;

  const handleAddSubtitle = useCallback(() => {
    setSubtitles((prev) => [...prev, { label: '', language: '', src: '' }]);
  }, []);

  const handleRemoveSubtitle = useCallback((index: number) => {
    setSubtitles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubtitleChange = useCallback((index: number, field: keyof SubtitleRow, value: string) => {
    setSubtitles((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      setError('제목과 동영상 URL은 필수입니다.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ title, description, videoUrl, thumbnailUrl, duration, subtitles });
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      data-testid="form-overlay"
    >
      <div
        className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-lg bg-neutral-900 border border-neutral-700 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white">
          {isEdit ? '동영상 수정' : '동영상 추가'}
        </h2>

        {error && (
          <div className="mt-3 rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-400" data-testid="form-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              placeholder="동영상 제목"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none resize-none"
              placeholder="동영상 설명"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400">동영상 URL *</label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="mt-1 w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              placeholder="https://example.com/video.mp4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400">썸네일 URL</label>
            <input
              type="text"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="mt-1 w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              placeholder="https://example.com/thumb.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400">재생 시간 (초)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={0}
              className="mt-1 w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-400">자막</label>
              <button
                type="button"
                onClick={handleAddSubtitle}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + 자막 추가
              </button>
            </div>
            {subtitles.map((sub, i) => (
              <div key={i} className="mt-2 flex gap-2 items-start">
                <input
                  type="text"
                  value={sub.label}
                  onChange={(e) => handleSubtitleChange(i, 'label', e.target.value)}
                  placeholder="표시 이름"
                  className="flex-1 rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={sub.language}
                  onChange={(e) => handleSubtitleChange(i, 'language', e.target.value)}
                  placeholder="언어 코드"
                  className="w-20 rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={sub.src}
                  onChange={(e) => handleSubtitleChange(i, 'src', e.target.value)}
                  placeholder="VTT URL"
                  className="flex-1 rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSubtitle(i)}
                  className="text-red-400 hover:text-red-300 px-1 text-xs"
                  aria-label={`Remove subtitle ${i + 1}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '저장 중...' : isEdit ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
