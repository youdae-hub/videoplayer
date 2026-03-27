import { useCallback, useRef, type MouseEvent } from 'react';
import styles from '../styles/player.module.css';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (time: number) => void;
}

export function ProgressBar({ currentTime, duration, buffered, onSeek }: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  const handleClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || duration <= 0) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  }, [duration, onSeek]);

  return (
    <div className={styles.progressWrapper} onClick={handleClick}>
      <div
        ref={trackRef}
        className={styles.progressTrack}
        role="slider"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-label="Video progress"
        tabIndex={0}
      >
        <div
          className={styles.progressBuffered}
          data-testid="progress-buffered"
          style={{ width: `${bufferedPercent}%` }}
        />
        <div
          className={styles.progressFilled}
          data-testid="progress-filled"
          style={{ width: `${percent}%` }}
        />
        <div
          className={styles.progressThumb}
          style={{ left: `${percent}%` }}
        />
      </div>
    </div>
  );
}
