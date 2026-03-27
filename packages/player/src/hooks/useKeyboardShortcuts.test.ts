import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function createContainer() {
  const div = document.createElement('div');
  document.body.appendChild(div);
  return div;
}

function fireKey(key: string, target?: HTMLElement) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  (target || document).dispatchEvent(event);
}

describe('useKeyboardShortcuts', () => {
  const actions = {
    togglePlay: vi.fn(),
    skip: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    toggleFullscreen: vi.fn(),
    toggleSubtitles: vi.fn(),
    volume: 0.5,
  };

  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    container = createContainer();
  });

  afterEach(() => {
    container.remove();
  });

  it('toggles play on Space key', () => {
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey(' ', container);
    expect(actions.togglePlay).toHaveBeenCalledOnce();
  });

  it('skips backward on ArrowLeft', () => {
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey('ArrowLeft', container);
    expect(actions.skip).toHaveBeenCalledWith(-10);
  });

  it('skips forward on ArrowRight', () => {
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey('ArrowRight', container);
    expect(actions.skip).toHaveBeenCalledWith(10);
  });

  it('increases volume on ArrowUp', () => {
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey('ArrowUp', container);
    expect(actions.setVolume).toHaveBeenCalledWith(0.6);
  });

  it('decreases volume on ArrowDown', () => {
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey('ArrowDown', container);
    expect(actions.setVolume).toHaveBeenCalledWith(0.4);
  });

  it('toggles fullscreen on f key', () => {
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey('f', container);
    expect(actions.toggleFullscreen).toHaveBeenCalledOnce();
  });

  it('toggles mute on m key', () => {
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey('m', container);
    expect(actions.toggleMute).toHaveBeenCalledOnce();
  });

  it('toggles subtitles on c key', () => {
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey('c', container);
    expect(actions.toggleSubtitles).toHaveBeenCalledOnce();
  });

  it('ignores keys when focus is on input', () => {
    const input = document.createElement('input');
    container.appendChild(input);
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey(' ', input);
    expect(actions.togglePlay).not.toHaveBeenCalled();
  });
});
