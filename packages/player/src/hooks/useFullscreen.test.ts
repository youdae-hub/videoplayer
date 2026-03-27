import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFullscreen } from './useFullscreen';

describe('useFullscreen', () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    mockElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null,
    });
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
  });

  it('returns isFullscreen as false initially', () => {
    const ref = { current: mockElement };
    const { result } = renderHook(() => useFullscreen(ref));
    expect(result.current.isFullscreen).toBe(false);
  });

  it('calls requestFullscreen when toggling on', async () => {
    const ref = { current: mockElement };
    const { result } = renderHook(() => useFullscreen(ref));

    await act(async () => { result.current.toggleFullscreen(); });
    expect(mockElement.requestFullscreen).toHaveBeenCalled();
  });

  it('calls exitFullscreen when toggling off', async () => {
    Object.defineProperty(document, 'fullscreenElement', { value: mockElement });
    const ref = { current: mockElement };
    const { result } = renderHook(() => useFullscreen(ref));

    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    await act(async () => { result.current.toggleFullscreen(); });
    expect(document.exitFullscreen).toHaveBeenCalled();
  });

  it('updates isFullscreen on fullscreenchange event', () => {
    const ref = { current: mockElement };
    const { result } = renderHook(() => useFullscreen(ref));

    Object.defineProperty(document, 'fullscreenElement', { value: mockElement });
    act(() => { document.dispatchEvent(new Event('fullscreenchange')); });
    expect(result.current.isFullscreen).toBe(true);

    Object.defineProperty(document, 'fullscreenElement', { value: null });
    act(() => { document.dispatchEvent(new Event('fullscreenchange')); });
    expect(result.current.isFullscreen).toBe(false);
  });

  it('does nothing when ref is null', async () => {
    const ref = { current: null };
    const { result } = renderHook(() => useFullscreen(ref));
    await act(async () => { result.current.toggleFullscreen(); });
    expect(document.exitFullscreen).not.toHaveBeenCalled();
  });
});
