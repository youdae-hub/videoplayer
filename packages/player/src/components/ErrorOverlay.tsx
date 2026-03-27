import styles from '../styles/player.module.css';

interface ErrorOverlayProps {
  message: string;
  onRetry: () => void;
}

export function ErrorOverlay({ message, onRetry }: ErrorOverlayProps) {
  return (
    <div className={styles.errorOverlay} role="alert" data-testid="error-overlay">
      <svg className={styles.errorIcon} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
      <p className={styles.errorMessage}>{message}</p>
      <button className={styles.retryButton} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
