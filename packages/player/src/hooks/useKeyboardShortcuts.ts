import { useEffect, useCallback, type RefObject } from 'react';

interface KeyboardShortcutActions {
  togglePlay: () => void;
  skip: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  toggleSubtitles?: () => void;
  toggleGuide?: () => void;
  volume: number;
}

export function useKeyboardShortcuts(
  containerRef: RefObject<HTMLDivElement | null>,
  actions: KeyboardShortcutActions,
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (!containerRef.current?.contains(e.target as Node)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          actions.togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          actions.skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          actions.skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          actions.setVolume(Math.min(1, actions.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          actions.setVolume(Math.max(0, actions.volume - 0.1));
          break;
        case '?':
          e.preventDefault();
          actions.toggleGuide?.();
          break;
      }

      // Use e.code for letter keys to work regardless of IME state
      switch (e.code) {
        case 'KeyF':
          e.preventDefault();
          actions.toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          actions.toggleMute();
          break;
        case 'KeyC':
          e.preventDefault();
          actions.toggleSubtitles?.();
          break;
      }
    },
    [actions, containerRef],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
