import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThumbnailPicker } from './ThumbnailPicker';

describe('ThumbnailPicker', () => {
  const defaultProps = {
    videoSrc: 'blob:http://localhost/video-123',
    onCapture: vi.fn(),
    onClose: vi.fn(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders video element and capture button', () => {
    render(<ThumbnailPicker {...defaultProps} />);
    expect(screen.getByText('현재 프레임 캡처')).toBeInTheDocument();
    expect(screen.getByText('취소')).toBeInTheDocument();
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('does not set crossOrigin on video element', () => {
    render(<ThumbnailPicker {...defaultProps} />);
    const video = document.querySelector('video')!;
    expect(video.getAttribute('crossOrigin')).toBeNull();
  });

  it('shows title', () => {
    render(<ThumbnailPicker {...defaultProps} />);
    expect(screen.getByText('썸네일 선택')).toBeInTheDocument();
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

  it('renders download button', () => {
    render(<ThumbnailPicker {...defaultProps} />);
    expect(screen.getByText('현재 프레임 다운로드')).toBeInTheDocument();
  });

  it('disables download button until video is ready', () => {
    render(<ThumbnailPicker {...defaultProps} />);
    const downloadBtn = screen.getByText('현재 프레임 다운로드');
    expect(downloadBtn).toBeDisabled();

    const video = document.querySelector('video')!;
    act(() => {
      video.dispatchEvent(new Event('loadeddata'));
    });
    expect(downloadBtn).not.toBeDisabled();
  });

  it('removes video element from DOM on unmount', () => {
    const { unmount } = render(<ThumbnailPicker {...defaultProps} />);
    expect(document.querySelector('video')).toBeInTheDocument();

    unmount();
    expect(document.querySelector('video')).not.toBeInTheDocument();
  });
});
