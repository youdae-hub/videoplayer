import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processVideoFile, captureVideoFrame } from './videoFileProcessor';

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
          toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
            cb(new Blob(['thumb'], { type: 'image/jpeg' }));
          }),
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

  it('resolves with processed file data without videoUrl', async () => {
    const file = new File(['video-data'], 'test.mp4', { type: 'video/mp4' });

    const promise = processVideoFile(file);

    listeners.loadedmetadata.forEach((fn) => fn());
    listeners.seeked.forEach((fn) => fn());

    const result = await promise;
    expect(result.file).toBe(file);
    expect(result).not.toHaveProperty('videoUrl');
    expect(result.thumbnailUrl).toBe('data:image/jpeg;base64,thumbnail');
    expect(result.thumbnailBlob).toBeInstanceOf(Blob);
    expect(result.duration).toBe(120);
  });

  it('revokes temp blob URL after processing', async () => {
    const file = new File(['video-data'], 'test.mp4', { type: 'video/mp4' });

    const promise = processVideoFile(file);
    listeners.loadedmetadata.forEach((fn) => fn());
    listeners.seeked.forEach((fn) => fn());

    await promise;
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/video-123');
  });

  it('sets currentTime for thumbnail capture', async () => {
    const file = new File(['video-data'], 'test.mp4', { type: 'video/mp4' });

    const promise = processVideoFile(file);
    listeners.loadedmetadata.forEach((fn) => fn());
    listeners.seeked.forEach((fn) => fn());

    await promise;
    expect(mockVideo.currentTime).toBe(2);
  });

  it('rejects on video error and revokes temp URL', async () => {
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

describe('captureVideoFrame', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('captures current frame from video element', async () => {
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        drawImage: vi.fn(),
      })),
      toDataURL: vi.fn(() => 'data:image/jpeg;base64,captured'),
      toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
        cb(new Blob(['frame'], { type: 'image/jpeg' }));
      }),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return document.createElement(tag);
    });

    const mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
    } as HTMLVideoElement;

    const result = await captureVideoFrame(mockVideo);
    expect(result.thumbnailUrl).toBe('data:image/jpeg;base64,captured');
    expect(result.thumbnailBlob).toBeInstanceOf(Blob);
    expect(mockCanvas.width).toBe(320);
    expect(mockCanvas.height).toBe(180);
  });

  it('rejects when canvas context is unavailable', async () => {
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => null),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return document.createElement(tag);
    });

    const mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
    } as HTMLVideoElement;

    await expect(captureVideoFrame(mockVideo)).rejects.toThrow('Canvas 컨텍스트를 생성할 수 없습니다.');
  });

  it('rejects when toBlob returns null', async () => {
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        drawImage: vi.fn(),
      })),
      toDataURL: vi.fn(() => 'data:image/jpeg;base64,captured'),
      toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
        cb(null);
      }),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return document.createElement(tag);
    });

    const mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
    } as HTMLVideoElement;

    await expect(captureVideoFrame(mockVideo)).rejects.toThrow('썸네일 Blob 생성에 실패했습니다.');
  });
});
