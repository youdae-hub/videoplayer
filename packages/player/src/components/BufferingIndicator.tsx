import styles from '../styles/player.module.css';

interface BufferingIndicatorProps {
  visible: boolean;
}

export function BufferingIndicator({ visible }: BufferingIndicatorProps) {
  if (!visible) return null;

  return (
    <div className={styles.bufferingOverlay} data-testid="buffering-indicator">
      <div className={styles.spinner} />
    </div>
  );
}
