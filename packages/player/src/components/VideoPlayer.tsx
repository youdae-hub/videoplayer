import { useCallback, useRef } from 'react';
import type { VideoPlayerProps } from '../types';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useFullscreen } from '../hooks/useFullscreen';
import { useControlsVisibility } from '../hooks/useControlsVisibility';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { ControlBar } from './ControlBar';
import styles from '../styles/player.module.css';

export function VideoPlayer({ src, poster, subtitles, autoPlay, className }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isTouchDevice = useMediaQuery('(pointer: coarse)');
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
  } = useVideoPlayer();

  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
  const { visible, onPointerMove, onPointerLeave, onContainerClick } = useControlsVisibility({
    isPlaying: state.isPlaying,
    isTouchDevice,
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
    }
  }, [videoRef, handleLoadedMetadata]);

  const handleVideoClick = useCallback(() => {
    if (isTouchDevice) {
      onContainerClick();
    } else {
      togglePlay();
    }
  }, [isTouchDevice, onContainerClick, togglePlay]);

  const handleSubtitleToggle = useCallback(() => {
    // Subtitle toggle placeholder for Phase 2
    // Full subtitle overlay will use textTracks API
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${styles.playerContainer}${className ? ` ${className}` : ''}`}
      onMouseMove={onPointerMove}
      onMouseLeave={onPointerLeave}
    >
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onClick={handleVideoClick}
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
      <ControlBar
        state={fullState}
        visible={visible}
        onTogglePlay={togglePlay}
        onSkip={skip}
        onSeek={seek}
        onVolumeChange={setVolume}
        onToggleMute={toggleMute}
        onSpeedChange={setPlaybackSpeed}
        onSubtitleToggle={handleSubtitleToggle}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}
