import { useState, useCallback, useRef, useEffect } from 'react';

const HIDE_DELAY = 3000;

interface UseControlsVisibilityOptions {
  isPlaying: boolean;
  isTouchDevice: boolean;
}

export function useControlsVisibility({ isPlaying, isTouchDevice }: UseControlsVisibilityOptions) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startHideTimer = useCallback(() => {
    clearTimer();
    if (!isPlaying) return;
    timerRef.current = setTimeout(() => setVisible(false), HIDE_DELAY);
  }, [isPlaying, clearTimer]);

  const onPointerMove = useCallback(() => {
    setVisible(true);
    startHideTimer();
  }, [startHideTimer]);

  const onPointerLeave = useCallback(() => {
    if (!isPlaying) return;
    clearTimer();
    setVisible(false);
  }, [isPlaying, clearTimer]);

  const onContainerClick = useCallback(() => {
    if (!isTouchDevice) return;
    setVisible((prev) => {
      const next = !prev;
      clearTimer();
      if (next && isPlaying) {
        timerRef.current = setTimeout(() => setVisible(false), HIDE_DELAY);
      }
      return next;
    });
  }, [isTouchDevice, isPlaying, clearTimer]);

  useEffect(() => {
    if (!isPlaying) {
      clearTimer();
      setVisible(true);
    }
  }, [isPlaying, clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return { visible, onPointerMove, onPointerLeave, onContainerClick };
}
