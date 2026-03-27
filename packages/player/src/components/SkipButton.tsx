import styles from '../styles/player.module.css';

interface SkipButtonProps {
  seconds: number;
  onClick: () => void;
}

export function SkipButton({ seconds, onClick }: SkipButtonProps) {
  const isForward = seconds > 0;
  const label = isForward ? `Forward ${Math.abs(seconds)} seconds` : `Back ${Math.abs(seconds)} seconds`;

  return (
    <button
      className={styles.controlButton}
      onClick={onClick}
      aria-label={label}
    >
      {isForward ? (
        <svg viewBox="0 0 24 24">
          <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z" />
          <text x="12" y="15.5" textAnchor="middle" fontSize="7" fill="currentColor" fontWeight="bold">10</text>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24">
          <path d="M6 13c0 3.31 2.69 6 6 6s6-2.69 6-6-2.69-6-6-6v4l-5-5 5-5v4c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8h2z" />
          <text x="12" y="15.5" textAnchor="middle" fontSize="7" fill="currentColor" fontWeight="bold">10</text>
        </svg>
      )}
    </button>
  );
}
