import styles from '../styles/player.module.css';

interface DoubleTapOverlayProps {
  side: 'left' | 'right' | null;
  x: number;
  y: number;
}

export function DoubleTapOverlay({ side, x, y }: DoubleTapOverlayProps) {
  if (!side) return null;

  return (
    <div
      className={`${styles.doubleTapOverlay} ${side === 'left' ? styles.doubleTapLeft : styles.doubleTapRight}`}
      data-testid="double-tap-overlay"
    >
      <div className={styles.ripple} style={{ left: x, top: y }} />
      <span className={styles.doubleTapText}>
        {side === 'left' ? '« 10s' : '10s »'}
      </span>
    </div>
  );
}
