import { useEffect } from 'react';
import { VideoPlayer } from '@videoplayer/core';
import type { Video } from '@videoplayer/core';

interface VideoPlayerModalProps {
  video: Video;
  onClose: () => void;
}

export function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      data-testid="modal-overlay"
    >
      <div
        className="relative w-full max-w-5xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute -top-10 right-0 text-neutral-400 hover:text-white text-sm transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          ✕ 닫기
        </button>
        <VideoPlayer
          src={video.videoUrl}
          poster={video.thumbnailUrl}
          subtitles={video.subtitles}
        />
        <div className="mt-4">
          <h2 className="text-lg font-bold text-white">{video.title}</h2>
          <p className="mt-1 text-sm text-neutral-400">{video.description}</p>
        </div>
      </div>
    </div>
  );
}
