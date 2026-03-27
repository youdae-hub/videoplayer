import { useCallback, useRef, useState } from 'react';
import type { VideoPlayerProps } from '../types';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useFullscreen } from '../hooks/useFullscreen';
import { useControlsVisibility } from '../hooks/useControlsVisibility';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDoubleTap } from '../hooks/useDoubleTap';
import { ControlBar } from './ControlBar';
import { BufferingIndicator } from './BufferingIndicator';
import { ErrorOverlay } from './ErrorOverlay';
import { DoubleTapOverlay } from './DoubleTapOverlay';
import { ErrorBoundary } from './ErrorBoundary';
import { KeyboardGuide } from './KeyboardGuide';
import styles from '../styles/player.module.css';

function VideoPlayerInner({ src, poster, subtitles, autoPlay, className }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isTouchDevice = useMediaQuery('(pointer: coarse)');
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guideVisible, setGuideVisible] = useState(false);

  const {
    videoRef,
    state,
    togglePlay,
    seek,
    skip,
    handleTimeUpdate,
    handleLoadedMetadata,
    setVolume,
    toggleMute,
    setPlaybackSpeed,
    setActiveSubtitle,
  } = useVideoPlayer();

  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
  const { visible, onPointerMove, onPointerLeave, onContainerClick } = useControlsVisibility({
    isPlaying: state.isPlaying,
    isTouchDevice,
  });

  const toggleSubtitlesCycle = useCallback(() => {
    if (!subtitles || subtitles.length === 0) return;
    if (state.activeSubtitleId === null) {
      setActiveSubtitle(subtitles[0].language);
    } else {
      const currentIndex = subtitles.findIndex((s) => s.language === state.activeSubtitleId);
      if (currentIndex < subtitles.length - 1) {
        setActiveSubtitle(subtitles[currentIndex + 1].language);
      } else {
        setActiveSubtitle(null);
      }
    }
  }, [subtitles, state.activeSubtitleId, setActiveSubtitle]);

  const toggleGuide = useCallback(() => setGuideVisible((prev) => !prev), []);

  useKeyboardShortcuts(containerRef, {
    togglePlay,
    skip,
    setVolume,
    toggleMute,
    toggleFullscreen,
    toggleSubtitles: toggleSubtitlesCycle,
    toggleGuide,
    volume: state.volume,
  });

  const { ripple, handleTap } = useDoubleTap({
    onDoubleTapLeft: () => skip(-10),
    onDoubleTapRight: () => skip(10),
    onSingleTap: onContainerClick,
    enabled: isTouchDevice,
  });

  const fullState = { ...state, isFullscreen };

  const onTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      handleTimeUpdate(videoRef.current.currentTime);
    }
  }, [videoRef, handleTimeUpdate]);

  const onLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      handleLoadedMetadata(videoRef.current.duration);
      setError(null);
      for (let i = 0; i < videoRef.current.textTracks.length; i++) {
        videoRef.current.textTracks[i].mode = 'hidden';
      }
    }
  }, [videoRef, handleLoadedMetadata]);

  const handleVideoClick = useCallback(() => {
    containerRef.current?.focus();
    if (!isTouchDevice) {
      togglePlay();
    }
  }, [isTouchDevice, togglePlay]);

  const handleWaiting = useCallback(() => setBuffering(true), []);
  const handleCanPlay = useCallback(() => setBuffering(false), []);

  const handleError = useCallback(() => {
    setBuffering(false);
    setError('Failed to load video. Please check the source and try again.');
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    const video = videoRef.current;
    if (video) {
      video.load();
    }
  }, [videoRef]);

  return (
    <div
      ref={containerRef}
      className={`${styles.playerContainer}${className ? ` ${className}` : ''}`}
      onMouseMove={onPointerMove}
      onMouseLeave={onPointerLeave}
      tabIndex={0}
      role="region"
      aria-label="Video Player"
    >
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onClick={handleVideoClick}
        onTouchEnd={isTouchDevice ? handleTap : undefined}
        data-testid="video-element"
      >
        {subtitles?.map((sub) => (
          <track
            key={sub.id}
            kind="subtitles"
            label={sub.label}
            srcLang={sub.language}
            src={sub.src}
          />
        ))}
      </video>

      <BufferingIndicator visible={buffering && !error} />
      <DoubleTapOverlay side={ripple.side} x={ripple.x} y={ripple.y} />

      <KeyboardGuide visible={guideVisible} onClose={toggleGuide} />

      {error ? (
        <ErrorOverlay message={error} onRetry={handleRetry} />
      ) : (
        <ControlBar
          state={fullState}
          visible={visible}
          subtitles={subtitles || []}
          onTogglePlay={togglePlay}
          onSkip={skip}
          onSeek={seek}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
          onSpeedChange={setPlaybackSpeed}
          onSubtitleSelect={setActiveSubtitle}
          onToggleFullscreen={toggleFullscreen}
          onToggleGuide={toggleGuide}
        />
      )}
    </div>
  );
}

export function VideoPlayer(props: VideoPlayerProps) {
  return (
    <ErrorBoundary>
      <VideoPlayerInner {...props} />
    </ErrorBoundary>
  );
}
