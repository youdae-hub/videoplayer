import type { Subtitle } from '../types';
import styles from '../styles/player.module.css';

interface SubtitleSelectorProps {
  subtitles: Subtitle[];
  activeSubtitleId: string | null;
  onSelect: (subtitleId: string | null) => void;
}

export function SubtitleSelector({ subtitles, activeSubtitleId, onSelect }: SubtitleSelectorProps) {
  if (subtitles.length === 0) {
    return (
      <div className={styles.subtitleSection}>
        <div className={styles.settingsLabel}>Subtitle</div>
        <div className={styles.subtitleNone}>No subtitles available</div>
      </div>
    );
  }

  return (
    <div className={styles.subtitleSection}>
      <div className={styles.settingsLabel}>Subtitle</div>
      <button
        className={styles.settingsItem}
        data-active={activeSubtitleId === null ? 'true' : 'false'}
        onClick={() => onSelect(null)}
      >
        Off
      </button>
      {subtitles.map((sub) => (
        <button
          key={sub.id}
          className={styles.settingsItem}
          data-active={activeSubtitleId === sub.language ? 'true' : 'false'}
          onClick={() => onSelect(sub.language)}
        >
          {sub.label}
        </button>
      ))}
    </div>
  );
}
