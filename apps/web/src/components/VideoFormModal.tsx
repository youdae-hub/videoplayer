import { useState, useCallback, useRef } from 'react';
import type { Video } from '@videoplayer/core';
import { formatTime } from '@videoplayer/core';
import type { VideoInput } from '../services/types';
import { processVideoFile } from '../utils/videoFileProcessor';
import { ThumbnailPicker } from './ThumbnailPicker';

type InputMode = 'file' | 'url';

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
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>(video ? 'url' : 'file');
  const [fileName, setFileName] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [showThumbnailPicker, setShowThumbnailPicker] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!video;

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setError(null);
    setFileName(file.name);

    try {
      const result = await processVideoFile(file);
      setVideoUrl(result.videoUrl);
      setThumbnailUrl(result.thumbnailUrl);
      setDuration(result.duration);
      setVideoFile(file);
      setThumbnailBlob(result.thumbnailBlob);
      if (!title) {
        setTitle(file.name.replace(/\.[^.]+$/, ''));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일 처리에 실패했습니다.');
      setFileName(null);
    } finally {
      setProcessing(false);
    }
  }, [title]);

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
      await onSubmit({
        title, description, videoUrl, thumbnailUrl, duration, subtitles,
        ...(videoFile && { videoFile }),
        ...(thumbnailBlob && { thumbnailBlob }),
      });
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none';

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
          {!isEdit && (
            <div className="flex gap-1 rounded-lg bg-neutral-800 p-1">
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  inputMode === 'file' ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
                onClick={() => setInputMode('file')}
              >
                파일 업로드
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  inputMode === 'url' ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
                onClick={() => setInputMode('url')}
              >
                URL 직접 입력
              </button>
            </div>
          )}

          {inputMode === 'file' && !isEdit && (
            <div>
              <label className="block text-sm font-medium text-neutral-400">동영상 파일 *</label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                  className="w-full rounded-md border border-dashed border-neutral-600 bg-neutral-800 px-4 py-6 text-sm text-neutral-400 hover:border-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50"
                >
                  {processing ? (
                    <span data-testid="processing-status">썸네일 생성 중...</span>
                  ) : fileName ? (
                    <span className="text-green-400">{fileName}</span>
                  ) : (
                    '클릭하여 동영상 파일을 선택하세요'
                  )}
                </button>
              </div>

              {thumbnailUrl && !processing && (
                <div className="mt-3" data-testid="thumbnail-preview">
                  <label className="block text-xs font-medium text-neutral-500 mb-1">썸네일 미리보기</label>
                  <div className="flex items-start gap-3">
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail preview"
                      className="h-20 w-32 rounded object-cover border border-neutral-700"
                    />
                    <div className="text-xs text-neutral-400 space-y-1">
                      <div>재생 시간: <span className="text-white">{formatTime(duration)}</span></div>
                      {fileName && <div>파일: <span className="text-white">{fileName}</span></div>}
                      {videoUrl && (
                        <button
                          type="button"
                          onClick={() => { setPickerKey((k) => k + 1); setShowThumbnailPicker(true); }}
                          className="mt-1 rounded bg-neutral-700 px-2 py-1 text-xs text-blue-400 hover:bg-neutral-600 transition-colors"
                        >
                          썸네일 변경
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-400">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="동영상 제목"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="동영상 설명"
            />
          </div>

          {(inputMode === 'url' || isEdit) && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-400">동영상 URL *</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className={inputClass}
                  placeholder="https://example.com/video.mp4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400">썸네일</label>
                {thumbnailUrl ? (
                  <div className="mt-1 flex items-start gap-3">
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail preview"
                      className="h-16 w-28 rounded object-cover border border-neutral-700"
                    />
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="text"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        className="rounded-md bg-neutral-800 border border-neutral-700 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                        placeholder="https://example.com/thumb.jpg"
                      />
                      {videoUrl && (
                        <button
                          type="button"
                          onClick={() => { setPickerKey((k) => k + 1); setShowThumbnailPicker(true); }}
                          className="self-start rounded bg-neutral-700 px-2 py-1 text-xs text-blue-400 hover:bg-neutral-600 transition-colors"
                        >
                          썸네일 변경
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      className={inputClass}
                      placeholder="https://example.com/thumb.jpg"
                    />
                    {videoUrl && (
                      <button
                        type="button"
                        onClick={() => { setPickerKey((k) => k + 1); setShowThumbnailPicker(true); }}
                        className="shrink-0 rounded bg-neutral-700 px-2 py-2 text-xs text-blue-400 hover:bg-neutral-600 transition-colors"
                      >
                        썸네일 변경
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400">재생 시간 (초)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={0}
                  className={inputClass}
                />
              </div>
            </>
          )}

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
              disabled={loading || processing}
            >
              {loading ? '저장 중...' : isEdit ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>

      {showThumbnailPicker && videoUrl && (
        <ThumbnailPicker
          key={pickerKey}
          videoSrc={videoUrl}
          onCapture={(url, blob) => {
            setThumbnailUrl(url);
            setThumbnailBlob(blob);
            setShowThumbnailPicker(false);
          }}
          onClose={() => setShowThumbnailPicker(false)}
        />
      )}
    </div>
  );
}
