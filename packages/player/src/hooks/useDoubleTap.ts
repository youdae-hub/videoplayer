import { useRef, useCallback, useState } from 'react';

const DOUBLE_TAP_DELAY = 300;

interface DoubleTapState {
  side: 'left' | 'right' | null;
  x: number;
  y: number;
}

interface UseDoubleTapOptions {
  onDoubleTapLeft: () => void;
  onDoubleTapRight: () => void;
  onSingleTap: () => void;
  enabled: boolean;
}

export function useDoubleTap({ onDoubleTapLeft, onDoubleTapRight, onSingleTap, enabled }: UseDoubleTapOptions) {
  const [ripple, setRipple] = useState<DoubleTapState>({ side: null, x: 0, y: 0 });
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRipple = useCallback(() => {
    setRipple({ side: null, x: 0, y: 0 });
  }, []);

  const handleTap = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (!enabled) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const side = x < rect.width / 2 ? 'left' : 'right';

      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      lastTapRef.current = now;

      if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }

        setRipple({ side, x, y });
        setTimeout(clearRipple, 600);

        if (side === 'left') {
          onDoubleTapLeft();
        } else {
          onDoubleTapRight();
        }
      } else {
        singleTapTimerRef.current = setTimeout(() => {
          onSingleTap();
          singleTapTimerRef.current = null;
        }, DOUBLE_TAP_DELAY);
      }
    },
    [enabled, onDoubleTapLeft, onDoubleTapRight, onSingleTap, clearRipple],
  );

  return { ripple, handleTap };
}
