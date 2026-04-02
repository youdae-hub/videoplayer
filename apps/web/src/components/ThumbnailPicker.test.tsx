import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThumbnailPicker } from './ThumbnailPicker';

describe('ThumbnailPicker', () => {
  const defaultProps = {
    isOpen: true,
    videoSrc: 'blob:http://localhost/video-123',
    onCapture: vi.fn(),
    onClose: vi.fn(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders video element and capture button when open', () => {
    render(<ThumbnailPicker {...defaultProps} />);
    expect(screen.getByText('현재 프레임 캡처')).toBeInTheDocument();
    expect(screen.getByText('취소')).toBeInTheDocument();
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('hides overlay when closed', () => {
    render(<ThumbnailPicker {...defaultProps} isOpen={false} />);
    const overlay = screen.getByTestId('thumbnail-picker-overlay');
    expect(overlay.style.display).toBe('none');
  });

  it('keeps video element in DOM when closed', () => {
    render(<ThumbnailPicker {...defaultProps} isOpen={false} />);
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

  it('resets preview when reopened', () => {
    const { rerender } = render(<ThumbnailPicker {...defaultProps} />);
    rerender(<ThumbnailPicker {...defaultProps} isOpen={false} />);
    rerender(<ThumbnailPicker {...defaultProps} isOpen={true} />);
    expect(screen.queryByText('캡처된 썸네일 미리보기')).not.toBeInTheDocument();
  });
});
