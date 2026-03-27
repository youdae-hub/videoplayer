import { formatTime } from '../utils/formatTime';
import styles from '../styles/player.module.css';

interface TimeDisplayProps {
  currentTime: number;
  duration: number;
}

export function TimeDisplay({ currentTime, duration }: TimeDisplayProps) {
  const useHourFormat = duration >= 3600;
  const format = (t: number) =>
    useHourFormat ? formatTime(t).padStart(7, '0:0') : formatTime(t);

  // For hour format, ensure consistent display using the same formatTime logic
  const current = useHourFormat && currentTime < 3600
    ? `0:${formatTime(currentTime).padStart(5, '0')}`
    : formatTime(currentTime);
  const total = formatTime(duration);

  return (
    <span className={styles.timeDisplay}>
      {current} / {total}
    </span>
  );
}
