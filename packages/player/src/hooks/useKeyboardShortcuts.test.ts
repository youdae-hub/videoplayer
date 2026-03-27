import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function createContainer() {
  const div = document.createElement('div');
  document.body.appendChild(div);
  return div;
}

function fireKey(target: HTMLElement, key: string) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggles play on Space key', () => {
    const container = createContainer();
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey(container, ' ');
    expect(actions.togglePlay).toHaveBeenCalledOnce();
  });

  it('skips backward on ArrowLeft', () => {
    const container = createContainer();
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey(container, 'ArrowLeft');
    expect(actions.skip).toHaveBeenCalledWith(-10);
  });

  it('skips forward on ArrowRight', () => {
    const container = createContainer();
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey(container, 'ArrowRight');
    expect(actions.skip).toHaveBeenCalledWith(10);
  });

  it('increases volume on ArrowUp', () => {
    const container = createContainer();
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey(container, 'ArrowUp');
    expect(actions.setVolume).toHaveBeenCalledWith(0.6);
  });

  it('decreases volume on ArrowDown', () => {
    const container = createContainer();
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey(container, 'ArrowDown');
    expect(actions.setVolume).toHaveBeenCalledWith(0.4);
  });

  it('toggles fullscreen on f key', () => {
    const container = createContainer();
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey(container, 'f');
    expect(actions.toggleFullscreen).toHaveBeenCalledOnce();
  });

  it('toggles mute on m key', () => {
    const container = createContainer();
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey(container, 'm');
    expect(actions.toggleMute).toHaveBeenCalledOnce();
  });

  it('toggles subtitles on c key', () => {
    const container = createContainer();
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    fireKey(container, 'c');
    expect(actions.toggleSubtitles).toHaveBeenCalledOnce();
  });

  it('ignores keys when focus is on input', () => {
    const container = createContainer();
    const input = document.createElement('input');
    container.appendChild(input);
    const ref = { current: container };
    renderHook(() => useKeyboardShortcuts(ref, actions));

    input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(actions.togglePlay).not.toHaveBeenCalled();
  });
});
