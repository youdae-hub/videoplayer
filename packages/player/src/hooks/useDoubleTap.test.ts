import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDoubleTap } from './useDoubleTap';

describe('useDoubleTap', () => {
  const options = {
    onDoubleTapLeft: vi.fn(),
    onDoubleTapRight: vi.fn(),
    onSingleTap: vi.fn(),
    enabled: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  function createTouchEvent(clientX: number) {
    return {
      changedTouches: [{ clientX, clientY: 100 }],
      currentTarget: {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }),
      },
    } as unknown as React.TouchEvent<HTMLDivElement>;
  }

  it('initializes with no ripple', () => {
    const { result } = renderHook(() => useDoubleTap(options));
    expect(result.current.ripple.side).toBeNull();
  });

  it('triggers single tap after delay', () => {
    const { result } = renderHook(() => useDoubleTap(options));

    act(() => {
      result.current.handleTap(createTouchEvent(100));
    });

    expect(options.onSingleTap).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(options.onSingleTap).toHaveBeenCalledOnce();
  });

  it('triggers double tap left on quick successive taps on left side', () => {
    const { result } = renderHook(() => useDoubleTap(options));

    act(() => {
      result.current.handleTap(createTouchEvent(100));
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.handleTap(createTouchEvent(100));
    });

    expect(options.onDoubleTapLeft).toHaveBeenCalledOnce();
    expect(options.onSingleTap).not.toHaveBeenCalled();
  });

  it('triggers double tap right on quick successive taps on right side', () => {
    const { result } = renderHook(() => useDoubleTap(options));

    act(() => {
      result.current.handleTap(createTouchEvent(300));
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.handleTap(createTouchEvent(300));
    });

    expect(options.onDoubleTapRight).toHaveBeenCalledOnce();
  });

  it('does nothing when disabled', () => {
    const { result } = renderHook(() => useDoubleTap({ ...options, enabled: false }));

    act(() => {
      result.current.handleTap(createTouchEvent(100));
    });

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(options.onSingleTap).not.toHaveBeenCalled();
  });

  it('sets ripple state on double tap', () => {
    const { result } = renderHook(() => useDoubleTap(options));

    act(() => {
      result.current.handleTap(createTouchEvent(100));
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.handleTap(createTouchEvent(100));
    });

    expect(result.current.ripple.side).toBe('left');
  });
});
