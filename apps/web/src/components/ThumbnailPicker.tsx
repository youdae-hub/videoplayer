import { useState, useRef } from 'react';

interface ThumbnailPickerProps {
  videoSrc: string;
  onCapture: (thumbnailUrl: string, thumbnailBlob: Blob) => void;
  onClose: () => void;
}

const CAPTURE_WIDTH = 320;

function captureFromVideo(video: HTMLVideoElement): Promise<{ thumbnailUrl: string; thumbnailBlob: Blob }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const scale = CAPTURE_WIDTH / video.videoWidth;
    canvas.width = CAPTURE_WIDTH;
    canvas.height = Math.floor(video.videoHeight * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('Canvas error')); return; }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
    canvas.toBlob(
      (blob) => blob ? resolve({ thumbnailUrl, thumbnailBlob: blob }) : reject(new Error('Blob error')),
      'image/jpeg', 0.8,
    );
  });
}

export function ThumbnailPicker({ videoSrc, onCapture, onClose }: ThumbnailPickerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setCapturing(true);
    setError(null);

    try {
      const result = await captureFromVideo(videoRef.current);
      setPreview(result);
    } catch {
      setError('프레임 캡처에 실패했습니다. 다시 시도해주세요.');
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
            ref={videoRef}
            src={videoSrc}
            controls
            muted
            preload="auto"
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
