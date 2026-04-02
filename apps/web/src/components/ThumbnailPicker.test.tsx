import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThumbnailPicker } from './ThumbnailPicker';

vi.mock('../utils/videoFileProcessor', () => ({
  captureVideoFrame: vi.fn().mockResolvedValue({
    thumbnailUrl: 'data:image/jpeg;base64,captured-frame',
    thumbnailBlob: new Blob(['frame'], { type: 'image/jpeg' }),
  }),
}));

import { captureVideoFrame } from '../utils/videoFileProcessor';

describe('ThumbnailPicker', () => {
  const defaultProps = {
    videoSrc: 'blob:http://localhost/video-123',
    onCapture: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/fetched-video');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders video element and capture button', () => {
    render(<ThumbnailPicker {...defaultProps} />);
    expect(screen.getByText('현재 프레임 캡처')).toBeInTheDocument();
    expect(screen.getByText('취소')).toBeInTheDocument();
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video?.src).toContain('blob:');
  });

  it('shows title', () => {
    render(<ThumbnailPicker {...defaultProps} />);
    expect(screen.getByText('썸네일 선택')).toBeInTheDocument();
  });

  it('calls captureVideoFrame when capture button clicked', async () => {
    const user = userEvent.setup();
    render(<ThumbnailPicker {...defaultProps} />);

    const video = document.querySelector('video')!;
    video.dispatchEvent(new Event('loadeddata'));

    await user.click(screen.getByText('현재 프레임 캡처'));

    expect(captureVideoFrame).toHaveBeenCalled();
  });

  it('shows preview after capture and enables apply button', async () => {
    const user = userEvent.setup();
    render(<ThumbnailPicker {...defaultProps} />);

    const video = document.querySelector('video')!;
    video.dispatchEvent(new Event('loadeddata'));

    await user.click(screen.getByText('현재 프레임 캡처'));

    expect(screen.getByAltText('캡처된 썸네일')).toBeInTheDocument();
    expect(screen.getByText('적용')).toBeInTheDocument();
  });

  it('calls onCapture with captured data when apply clicked', async () => {
    const user = userEvent.setup();
    render(<ThumbnailPicker {...defaultProps} />);

    const video = document.querySelector('video')!;
    video.dispatchEvent(new Event('loadeddata'));

    await user.click(screen.getByText('현재 프레임 캡처'));
    await user.click(screen.getByText('적용'));

    expect(defaultProps.onCapture).toHaveBeenCalledWith(
      'data:image/jpeg;base64,captured-frame',
      expect.any(Blob),
    );
  });

  it('disables capture button until video is ready', () => {
    render(<ThumbnailPicker {...defaultProps} />);
    const captureBtn = screen.getByText('현재 프레임 캡처');
    expect(captureBtn).toBeDisabled();

    const video = document.querySelector('video')!;
    act(() => {
      video.dispatchEvent(new Event('loadeddata'));
    });
    expect(captureBtn).not.toBeDisabled();
  });

  it('fetches video as blob for server URLs', async () => {
    const mockBlob = new Blob(['video'], { type: 'video/mp4' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      blob: () => Promise.resolve(mockBlob),
    } as Response);

    render(<ThumbnailPicker {...defaultProps} videoSrc="http://localhost:4000/uploads/videos/test.mp4" />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:4000/uploads/videos/test.mp4');
    });
    expect(screen.getByText('현재 프레임 캡처')).toBeInTheDocument();
  });

  it('shows error when video fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'));

    render(<ThumbnailPicker {...defaultProps} videoSrc="http://localhost:4000/uploads/videos/bad.mp4" />);

    await waitFor(() => {
      expect(screen.getByText('동영상을 로드할 수 없습니다.')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel clicked', async () => {
    const user = userEvent.setup();
    render(<ThumbnailPicker {...defaultProps} />);

    await user.click(screen.getByText('취소'));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay clicked', async () => {
    const user = userEvent.setup();
    render(<ThumbnailPicker {...defaultProps} />);

    await user.click(screen.getByTestId('thumbnail-picker-overlay'));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
