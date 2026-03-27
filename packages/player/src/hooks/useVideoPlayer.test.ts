import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVideoPlayer } from './useVideoPlayer';

function createMockVideoElement(): HTMLVideoElement {
  return {
    currentTime: 0,
    duration: 120,
    volume: 1,
    muted: false,
    playbackRate: 1,
    paused: true,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
  } as unknown as HTMLVideoElement;
}

describe('useVideoPlayer', () => {
  let mockVideo: HTMLVideoElement;

  beforeEach(() => {
    mockVideo = createMockVideoElement();
  });

  it('returns initial playback state', () => {
    const { result } = renderHook(() => useVideoPlayer());
    expect(result.current.state.isPlaying).toBe(false);
    expect(result.current.state.currentTime).toBe(0);
    expect(result.current.state.duration).toBe(0);
    expect(result.current.state.volume).toBe(1);
    expect(result.current.state.isMuted).toBe(false);
    expect(result.current.state.playbackSpeed).toBe(1);
  });

  it('provides a videoRef', () => {
    const { result } = renderHook(() => useVideoPlayer());
    expect(result.current.videoRef).toBeDefined();
  });

  it('toggles play/pause', async () => {
    const { result } = renderHook(() => useVideoPlayer());
    (result.current.videoRef as { current: HTMLVideoElement | null }).current = mockVideo;

    await act(async () => { result.current.togglePlay(); });
    expect(mockVideo.play).toHaveBeenCalled();
    expect(result.current.state.isPlaying).toBe(true);

    act(() => { result.current.togglePlay(); });
    expect(mockVideo.pause).toHaveBeenCalled();
    expect(result.current.state.isPlaying).toBe(false);
  });

  it('seeks to a specific time', () => {
    const { result } = renderHook(() => useVideoPlayer());
    (result.current.videoRef as { current: HTMLVideoElement | null }).current = mockVideo;

    act(() => { result.current.handleLoadedMetadata(120); });
    act(() => { result.current.seek(30); });
    expect(mockVideo.currentTime).toBe(30);
    expect(result.current.state.currentTime).toBe(30);
  });

  it('clamps seek within bounds', () => {
    const { result } = renderHook(() => useVideoPlayer());
    (result.current.videoRef as { current: HTMLVideoElement | null }).current = mockVideo;

    act(() => { result.current.handleLoadedMetadata(120); });
    act(() => { result.current.seek(200); });
    expect(result.current.state.currentTime).toBe(120);

    act(() => { result.current.seek(-10); });
    expect(result.current.state.currentTime).toBe(0);
  });

  it('skips forward and backward', () => {
    const { result } = renderHook(() => useVideoPlayer());
    (result.current.videoRef as { current: HTMLVideoElement | null }).current = mockVideo;

    act(() => { result.current.handleLoadedMetadata(120); });
    act(() => { result.current.handleTimeUpdate(50); });
    act(() => { result.current.skip(10); });
    expect(result.current.state.currentTime).toBe(60);

    act(() => { result.current.skip(-10); });
    expect(result.current.state.currentTime).toBe(50);
  });

  it('does not skip beyond boundaries', () => {
    const { result } = renderHook(() => useVideoPlayer());
    (result.current.videoRef as { current: HTMLVideoElement | null }).current = mockVideo;

    act(() => { result.current.handleLoadedMetadata(120); });
    act(() => { result.current.handleTimeUpdate(115); });
    act(() => { result.current.skip(10); });
    expect(result.current.state.currentTime).toBe(120);

    act(() => { result.current.handleTimeUpdate(3); });
    act(() => { result.current.skip(-10); });
    expect(result.current.state.currentTime).toBe(0);
  });

  it('handles time update', () => {
    const { result } = renderHook(() => useVideoPlayer());
    act(() => { result.current.handleTimeUpdate(45.5); });
    expect(result.current.state.currentTime).toBe(45.5);
  });

  it('handles loaded metadata', () => {
    const { result } = renderHook(() => useVideoPlayer());
    act(() => { result.current.handleLoadedMetadata(200); });
    expect(result.current.state.duration).toBe(200);
  });

  it('sets volume', () => {
    const { result } = renderHook(() => useVideoPlayer());
    (result.current.videoRef as { current: HTMLVideoElement | null }).current = mockVideo;

    act(() => { result.current.setVolume(0.5); });
    expect(result.current.state.volume).toBe(0.5);
    expect(mockVideo.volume).toBe(0.5);
  });

  it('clamps volume between 0 and 1', () => {
    const { result } = renderHook(() => useVideoPlayer());
    (result.current.videoRef as { current: HTMLVideoElement | null }).current = mockVideo;

    act(() => { result.current.setVolume(1.5); });
    expect(result.current.state.volume).toBe(1);

    act(() => { result.current.setVolume(-0.5); });
    expect(result.current.state.volume).toBe(0);
  });

  it('toggles mute', () => {
    const { result } = renderHook(() => useVideoPlayer());
    (result.current.videoRef as { current: HTMLVideoElement | null }).current = mockVideo;

    act(() => { result.current.toggleMute(); });
    expect(result.current.state.isMuted).toBe(true);
    expect(mockVideo.muted).toBe(true);

    act(() => { result.current.toggleMute(); });
    expect(result.current.state.isMuted).toBe(false);
    expect(mockVideo.muted).toBe(false);
  });

  it('sets playback speed', () => {
    const { result } = renderHook(() => useVideoPlayer());
    (result.current.videoRef as { current: HTMLVideoElement | null }).current = mockVideo;

    act(() => { result.current.setPlaybackSpeed(1.5); });
    expect(result.current.state.playbackSpeed).toBe(1.5);
    expect(mockVideo.playbackRate).toBe(1.5);
  });
});
