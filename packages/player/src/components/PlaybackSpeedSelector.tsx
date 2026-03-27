import styles from '../styles/player.module.css';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

interface PlaybackSpeedSelectorProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export function PlaybackSpeedSelector({ currentSpeed, onSpeedChange }: PlaybackSpeedSelectorProps) {
  return (
    <div className={styles.speedList}>
      <div className={styles.settingsLabel}>Speed</div>
      {SPEEDS.map((speed) => (
        <button
          key={speed}
          className={styles.settingsItem}
          data-active={speed === currentSpeed ? 'true' : 'false'}
          onClick={() => onSpeedChange(speed)}
        >
          {speed}x
        </button>
      ))}
    </div>
  );
}
