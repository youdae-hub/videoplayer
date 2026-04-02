import { useState, useRef, useCallback } from 'react';
import { captureVideoFrame } from '../utils/videoFileProcessor';

interface ThumbnailPickerProps {
  videoSrc: string;
  onCapture: (thumbnailUrl: string, thumbnailBlob: Blob) => void;
  onClose: () => void;
}

export function ThumbnailPicker({ videoSrc, onCapture, onClose }: ThumbnailPickerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) {
      el.load();
    }
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setCapturing(true);
    setError(null);
    try {
      const { thumbnailUrl, thumbnailBlob } = await captureVideoFrame(videoRef.current);
      setPreview({ url: thumbnailUrl, blob: thumbnailBlob });
    } catch {
      setError('프레임 캡처에 실패했습니다. 동영상을 재생한 후 다시 시도해주세요.');
    } finally {
      setCapturing(false);
    }
  };

  const handleApply = () => {
    if (!preview) return;
    onCapture(preview.url, preview.blob);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      data-testid="thumbnail-picker-overlay"
    >
      <div
        className="w-full max-w-2xl mx-4 rounded-lg bg-neutral-900 border border-neutral-700 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-4">썸네일 선택</h2>

        <div className="rounded-lg overflow-hidden bg-black">
          <video
            ref={initVideo}
            src={videoSrc}
            controls
            muted
            preload="auto"
            crossOrigin="anonymous"
            onLoadedData={() => setVideoReady(true)}
            className="w-full max-h-[400px]"
          />
        </div>

        <p className="mt-2 text-xs text-neutral-500">
          동영상을 재생하거나 시크바를 이동하여 원하는 장면을 선택한 후 캡처 버튼을 누르세요.
        </p>

        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCapture}
            disabled={capturing || !videoReady}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {capturing ? '캡처 중...' : '현재 프레임 캡처'}
          </button>
        </div>

        {preview && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-neutral-500 mb-2">캡처된 썸네일 미리보기</label>
            <img
              src={preview.url}
              alt="캡처된 썸네일"
              className="h-24 w-40 rounded-md object-cover border border-neutral-700"
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            취소
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleApply}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors"
            >
              적용
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
