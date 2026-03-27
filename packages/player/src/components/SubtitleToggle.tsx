import styles from '../styles/player.module.css';

interface SubtitleToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function SubtitleToggle({ enabled, onToggle }: SubtitleToggleProps) {
  return (
    <div className={styles.subtitleRow}>
      <span className={styles.settingsLabel}>Subtitle</span>
      <button
        role="switch"
        aria-checked={enabled}
        className={`${styles.toggleSwitch} ${enabled ? styles.toggleOn : ''}`}
        onClick={onToggle}
      >
        <span className={styles.toggleThumb} />
      </button>
    </div>
  );
}
