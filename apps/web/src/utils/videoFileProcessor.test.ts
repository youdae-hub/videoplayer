import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processVideoFile, revokeVideoUrl } from './videoFileProcessor';

describe('processVideoFile', () => {
  let mockVideo: Record<string, unknown>;
  const listeners: Record<string, (() => void)[]> = {};

  beforeEach(() => {
    listeners.loadedmetadata = [];
    listeners.seeked = [];
    listeners.error = [];

    mockVideo = {
      preload: '',
      muted: false,
      playsInline: false,
      src: '',
      currentTime: 0,
      duration: 120,
      videoWidth: 1920,
      videoHeight: 1080,
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
      }),
      removeAttribute: vi.fn(),
      load: vi.fn(),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'video') return mockVideo as unknown as HTMLVideoElement;
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({
            drawImage: vi.fn(),
          })),
          toDataURL: vi.fn(() => 'data:image/jpeg;base64,thumbnail'),
        } as unknown as HTMLCanvasElement;
      }
      return document.createElement(tag);
    });

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/video-123');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves with processed file data', async () => {
    const file = new File(['video-data'], 'test.mp4', { type: 'video/mp4' });

    const promise = processVideoFile(file);

    // Simulate video loading
    listeners.loadedmetadata.forEach((fn) => fn());
    listeners.seeked.forEach((fn) => fn());

    const result = await promise;
    expect(result.file).toBe(file);
    expect(result.videoUrl).toBe('blob:http://localhost/video-123');
    expect(result.thumbnailUrl).toBe('data:image/jpeg;base64,thumbnail');
    expect(result.duration).toBe(120);
  });

  it('sets currentTime for thumbnail capture', async () => {
    const file = new File(['video-data'], 'test.mp4', { type: 'video/mp4' });

    const promise = processVideoFile(file);
    listeners.loadedmetadata.forEach((fn) => fn());
    listeners.seeked.forEach((fn) => fn());

    await promise;
    expect(mockVideo.currentTime).toBe(2);
  });

  it('rejects on video error', async () => {
    const file = new File(['bad-data'], 'bad.mp4', { type: 'video/mp4' });

    const promise = processVideoFile(file);
    listeners.error.forEach((fn) => fn());

    await expect(promise).rejects.toThrow('동영상 파일을 읽을 수 없습니다.');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/video-123');
  });

  it('uses shorter seek time for very short videos', async () => {
    mockVideo.duration = 5;
    const file = new File(['video-data'], 'short.mp4', { type: 'video/mp4' });

    const promise = processVideoFile(file);
    listeners.loadedmetadata.forEach((fn) => fn());
    listeners.seeked.forEach((fn) => fn());

    await promise;
    expect(mockVideo.currentTime).toBe(0.5);
  });
});

describe('revokeVideoUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('revokes blob URLs', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    revokeVideoUrl('blob:http://localhost/video-123');
    expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/video-123');
  });

  it('ignores non-blob URLs', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    revokeVideoUrl('https://example.com/video.mp4');
    expect(revokeSpy).not.toHaveBeenCalled();
  });
});
