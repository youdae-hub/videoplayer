import styles from '../styles/player.module.css';

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onClick: () => void;
}

export function PlayPauseButton({ isPlaying, onClick }: PlayPauseButtonProps) {
  return (
    <button
      className={styles.controlButton}
      onClick={onClick}
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      {isPlaying ? (
        <svg viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24">
          <polygon points="6,4 20,12 6,20" />
        </svg>
      )}
    </button>
  );
}
