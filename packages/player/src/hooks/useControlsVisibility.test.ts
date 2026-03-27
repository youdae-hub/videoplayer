import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useControlsVisibility } from './useControlsVisibility';

describe('useControlsVisibility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is visible initially', () => {
    const { result } = renderHook(() =>
      useControlsVisibility({ isPlaying: false, isTouchDevice: false })
    );
    expect(result.current.visible).toBe(true);
  });

  it('stays visible when paused (desktop)', () => {
    const { result } = renderHook(() =>
      useControlsVisibility({ isPlaying: false, isTouchDevice: false })
    );
    act(() => { result.current.onPointerMove(); });
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.visible).toBe(true);
  });

  it('hides after 3 seconds of inactivity when playing (desktop)', () => {
    const { result } = renderHook(() =>
      useControlsVisibility({ isPlaying: true, isTouchDevice: false })
    );
    act(() => { result.current.onPointerMove(); });
    expect(result.current.visible).toBe(true);

    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.visible).toBe(false);
  });

  it('resets timer on pointer move (desktop)', () => {
    const { result } = renderHook(() =>
      useControlsVisibility({ isPlaying: true, isTouchDevice: false })
    );
    act(() => { result.current.onPointerMove(); });
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.visible).toBe(true);

    act(() => { result.current.onPointerMove(); });
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.visible).toBe(true);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.visible).toBe(false);
  });

  it('hides on pointer leave (desktop)', () => {
    const { result } = renderHook(() =>
      useControlsVisibility({ isPlaying: true, isTouchDevice: false })
    );
    act(() => { result.current.onPointerMove(); });
    expect(result.current.visible).toBe(true);

    act(() => { result.current.onPointerLeave(); });
    expect(result.current.visible).toBe(false);
  });

  it('does not hide on pointer leave when paused (desktop)', () => {
    const { result } = renderHook(() =>
      useControlsVisibility({ isPlaying: false, isTouchDevice: false })
    );
    act(() => { result.current.onPointerMove(); });
    act(() => { result.current.onPointerLeave(); });
    expect(result.current.visible).toBe(true);
  });

  it('toggles on tap (touch device)', () => {
    const { result } = renderHook(() =>
      useControlsVisibility({ isPlaying: true, isTouchDevice: true })
    );
    expect(result.current.visible).toBe(true);

    // first tap hides (was visible)
    act(() => { result.current.onContainerClick(); });
    expect(result.current.visible).toBe(false);

    // second tap shows
    act(() => { result.current.onContainerClick(); });
    expect(result.current.visible).toBe(true);
  });

  it('auto-hides after 3 seconds on tap (touch device)', () => {
    const { result } = renderHook(() =>
      useControlsVisibility({ isPlaying: true, isTouchDevice: true })
    );

    // hide first, then tap to show
    act(() => { result.current.onContainerClick(); });
    act(() => { result.current.onContainerClick(); });
    expect(result.current.visible).toBe(true);

    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.visible).toBe(false);
  });

  it('stays visible when paused (touch device)', () => {
    const { result } = renderHook(() =>
      useControlsVisibility({ isPlaying: false, isTouchDevice: true })
    );
    // tap toggles off then on, but paused keeps visible
    act(() => { result.current.onContainerClick(); });
    act(() => { result.current.onContainerClick(); });
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.visible).toBe(true);
  });

  it('becomes visible when playback is paused', () => {
    const { result, rerender } = renderHook(
      ({ isPlaying }) => useControlsVisibility({ isPlaying, isTouchDevice: false }),
      { initialProps: { isPlaying: true } }
    );

    act(() => { result.current.onPointerMove(); });
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.visible).toBe(false);

    rerender({ isPlaying: false });
    expect(result.current.visible).toBe(true);
  });
});
