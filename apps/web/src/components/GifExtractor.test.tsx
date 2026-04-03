import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GifExtractor } from './GifExtractor';

describe('GifExtractor', () => {
  const defaultProps = {
    videoSrc: 'blob:http://localhost/video-123',
    videoId: 'vid-1',
    videoTitle: 'Test Video',
    getGifUrl: vi.fn((id: string, start: number, end: number, width?: number) =>
      `http://localhost:4000/api/videos/${id}/gif?start=${start}&end=${end}${width ? `&width=${width}` : ''}`
    ),
    onClose: vi.fn(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and close button', () => {
    render(<GifExtractor {...defaultProps} />);
    expect(screen.getByText('GIF 추출 — Test Video')).toBeInTheDocument();
    expect(screen.getByText('닫기')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    render(<GifExtractor {...defaultProps} />);
    await userEvent.click(screen.getByText('닫기'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay clicked', async () => {
    render(<GifExtractor {...defaultProps} />);
    await userEvent.click(screen.getByTestId('gif-extractor-overlay'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders video element with correct src', () => {
    render(<GifExtractor {...defaultProps} />);
    const video = document.querySelector('video');
    expect(video).toBeTruthy();
    expect(video?.src).toBe('blob:http://localhost/video-123');
  });

  it('renders start and end time inputs', () => {
    render(<GifExtractor {...defaultProps} />);
    expect(screen.getByLabelText('시작')).toBeInTheDocument();
    expect(screen.getByLabelText('종료')).toBeInTheDocument();
  });

  it('renders width selector', () => {
    render(<GifExtractor {...defaultProps} />);
    expect(screen.getByLabelText('너비')).toBeInTheDocument();
  });

  it('disables download when start >= end', () => {
    render(<GifExtractor {...defaultProps} />);
    const downloadBtn = screen.getByText('GIF 다운로드');
    expect(downloadBtn.closest('a')).toHaveAttribute('aria-disabled', 'true');
  });

  it('enables download when end > start', async () => {
    const user = userEvent.setup();
    render(<GifExtractor {...defaultProps} />);

    const endInput = screen.getByLabelText('종료');
    await user.clear(endInput);
    await user.type(endInput, '0:03.000');
    await user.tab();

    const downloadLink = screen.getByText('GIF 다운로드').closest('a');
    expect(downloadLink).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('generates correct download URL', async () => {
    const user = userEvent.setup();
    render(<GifExtractor {...defaultProps} />);

    const endInput = screen.getByLabelText('종료');
    await user.clear(endInput);
    await user.type(endInput, '0:05.000');
    await user.tab();

    const downloadLink = screen.getByText('GIF 다운로드').closest('a');
    expect(defaultProps.getGifUrl).toHaveBeenCalledWith('vid-1', 0, 5, 480);
    expect(downloadLink).toHaveAttribute('href', expect.stringContaining('/gif?'));
  });

  it('shows duration exceeded error when > 30s', async () => {
    const user = userEvent.setup();
    render(<GifExtractor {...defaultProps} />);

    const endInput = screen.getByLabelText('종료');
    await user.clear(endInput);
    await user.type(endInput, '0:35.000');
    await user.tab();

    expect(screen.getByText('GIF 구간은 최대 30초까지 가능합니다.')).toBeInTheDocument();
  });

  it('sets start time from current video position', async () => {
    const user = userEvent.setup();
    render(<GifExtractor {...defaultProps} />);

    const video = document.querySelector('video')!;
    Object.defineProperty(video, 'currentTime', { value: 2.5, writable: true });

    await user.click(screen.getByTitle('현재 위치를 시작점으로'));

    const startInput = screen.getByLabelText('시작');
    expect(startInput).toHaveValue('0:02.500');
  });

  it('sets end time from current video position', async () => {
    const user = userEvent.setup();
    render(<GifExtractor {...defaultProps} />);

    const video = document.querySelector('video')!;
    Object.defineProperty(video, 'currentTime', { value: 7.0, writable: true });

    await user.click(screen.getByTitle('현재 위치를 종료점으로'));

    const endInput = screen.getByLabelText('종료');
    expect(endInput).toHaveValue('0:07.000');
  });
});
