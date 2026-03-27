import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';

describe('useMediaQuery', () => {
  let listeners: Map<string, (e: { matches: boolean }) => void>;

  beforeEach(() => {
    listeners = new Map();
    vi.stubGlobal('matchMedia', vi.fn((query: string) => {
      const mql = {
        matches: false,
        media: query,
        addEventListener: vi.fn((_: string, cb: (e: { matches: boolean }) => void) => {
          listeners.set(query, cb);
        }),
        removeEventListener: vi.fn(),
      };
      return mql;
    }));
  });

  it('returns false when query does not match', () => {
    const { result } = renderHook(() => useMediaQuery('(pointer: coarse)'));
    expect(result.current).toBe(false);
  });

  it('returns true when query matches initially', () => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));

    const { result } = renderHook(() => useMediaQuery('(pointer: coarse)'));
    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    const { result } = renderHook(() => useMediaQuery('(pointer: coarse)'));
    expect(result.current).toBe(false);

    act(() => {
      const listener = listeners.get('(pointer: coarse)');
      listener?.({ matches: true });
    });
    expect(result.current).toBe(true);
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListener = vi.fn();
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener,
    })));

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
