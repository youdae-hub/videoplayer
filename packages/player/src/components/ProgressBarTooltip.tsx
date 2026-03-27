import { formatTime } from '../utils/formatTime';
import styles from '../styles/player.module.css';

interface ProgressBarTooltipProps {
  time: number;
  position: number;
  visible: boolean;
  duration: number;
}

export function ProgressBarTooltip({ time, position, visible, duration }: ProgressBarTooltipProps) {
  if (!visible || duration <= 0) return null;

  const clampedPosition = Math.max(20, Math.min(position, 100 - 20));

  return (
    <div
      className={styles.progressTooltip}
      style={{ left: `${clampedPosition}%` }}
      data-testid="progress-tooltip"
    >
      {formatTime(time)}
    </div>
  );
}
