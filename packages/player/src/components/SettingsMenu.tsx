import { useState, useCallback, useRef, useEffect } from 'react';
import { PlaybackSpeedSelector } from './PlaybackSpeedSelector';
import { SubtitleToggle } from './SubtitleToggle';
import styles from '../styles/player.module.css';

interface SettingsMenuProps {
  playbackSpeed: number;
  subtitlesEnabled: boolean;
  onSpeedChange: (speed: number) => void;
  onSubtitleToggle: () => void;
}

export function SettingsMenu({
  playbackSpeed,
  subtitlesEnabled,
  onSpeedChange,
  onSubtitleToggle,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={styles.settingsWrapper} ref={menuRef}>
      <button
        className={styles.controlButton}
        onClick={toggle}
        aria-label="Settings"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg viewBox="0 0 24 24">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
      </button>
      {open && (
        <div className={styles.settingsDropdown} role="menu">
          <PlaybackSpeedSelector currentSpeed={playbackSpeed} onSpeedChange={onSpeedChange} />
          <div className={styles.settingsDivider} />
          <SubtitleToggle enabled={subtitlesEnabled} onToggle={onSubtitleToggle} />
        </div>
      )}
    </div>
  );
}
