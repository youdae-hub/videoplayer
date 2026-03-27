import { useCallback } from 'react';
import type { VideoPlayerProps } from '../types';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { ControlBar } from './ControlBar';
import styles from '../styles/player.module.css';

export function VideoPlayer({ src, poster, subtitles, autoPlay, className }: VideoPlayerProps) {
  const {
    videoRef,
    state,
    togglePlay,
    seek,
    skip,
    handleTimeUpdate,
    handleLoadedMetadata,
  } = useVideoPlayer();

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

  return (
    <div className={`${styles.playerContainer}${className ? ` ${className}` : ''}`}>
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onClick={togglePlay}
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
        state={state}
        onTogglePlay={togglePlay}
        onSkip={skip}
        onSeek={seek}
      />
    </div>
  );
}
