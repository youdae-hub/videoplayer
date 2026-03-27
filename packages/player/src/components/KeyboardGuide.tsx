import styles from '../styles/player.module.css';

interface KeyboardGuideProps {
  visible: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'Space', description: '재생 / 일시정지' },
  { key: '←', description: '10초 뒤로' },
  { key: '→', description: '10초 앞으로' },
  { key: '↑', description: '볼륨 높이기' },
  { key: '↓', description: '볼륨 낮추기' },
  { key: 'F', description: '전체 화면' },
  { key: 'M', description: '음소거' },
  { key: 'C', description: '자막 전환' },
  { key: '?', description: '단축키 안내' },
];

export function KeyboardGuide({ visible, onClose }: KeyboardGuideProps) {
  if (!visible) return null;

  return (
    <div className={styles.guideOverlay} onClick={onClose} data-testid="keyboard-guide">
      <div className={styles.guideCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.guideHeader}>
          <span className={styles.guideTitle}>키보드 단축키</span>
          <button className={styles.guideClose} onClick={onClose} aria-label="Close guide">
            ✕
          </button>
        </div>
        <div className={styles.guideList}>
          {shortcuts.map(({ key, description }) => (
            <div key={key} className={styles.guideRow}>
              <kbd className={styles.guideKey}>{key}</kbd>
              <span className={styles.guideDesc}>{description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
