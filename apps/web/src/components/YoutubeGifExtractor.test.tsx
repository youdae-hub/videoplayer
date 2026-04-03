import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YoutubeGifExtractor } from './YoutubeGifExtractor';

describe('YoutubeGifExtractor', () => {
  const defaultProps = {
    downloadYoutubeGif: vi.fn().mockResolvedValue(new Blob(['gif'], { type: 'image/gif' })),
    onClose: vi.fn(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and close button', () => {
    render(<YoutubeGifExtractor {...defaultProps} />);
    expect(screen.getByText('YouTube GIF 추출')).toBeInTheDocument();
    expect(screen.getByText('닫기')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    render(<YoutubeGifExtractor {...defaultProps} />);
    await userEvent.click(screen.getByText('닫기'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay clicked', async () => {
    render(<YoutubeGifExtractor {...defaultProps} />);
    await userEvent.click(screen.getByTestId('youtube-gif-overlay'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders URL input field', () => {
    render(<YoutubeGifExtractor {...defaultProps} />);
    expect(screen.getByLabelText('YouTube URL')).toBeInTheDocument();
  });

  it('renders start and end time inputs', () => {
    render(<YoutubeGifExtractor {...defaultProps} />);
    expect(screen.getByLabelText('시작')).toBeInTheDocument();
    expect(screen.getByLabelText('종료')).toBeInTheDocument();
  });

  it('renders width selector', () => {
    render(<YoutubeGifExtractor {...defaultProps} />);
    expect(screen.getByLabelText('너비')).toBeInTheDocument();
  });

  it('disables download when URL is empty', () => {
    render(<YoutubeGifExtractor {...defaultProps} />);
    const btn = screen.getByText('GIF 다운로드');
    expect(btn).toBeDisabled();
  });

  it('disables download when start >= end', async () => {
    const user = userEvent.setup();
    render(<YoutubeGifExtractor {...defaultProps} />);

    const urlInput = screen.getByLabelText('YouTube URL');
    await user.type(urlInput, 'https://www.youtube.com/watch?v=test');

    const btn = screen.getByText('GIF 다운로드');
    expect(btn).toBeDisabled();
  });

  it('enables download when URL and valid time range provided', async () => {
    const user = userEvent.setup();
    render(<YoutubeGifExtractor {...defaultProps} />);

    await user.type(screen.getByLabelText('YouTube URL'), 'https://www.youtube.com/watch?v=test');

    const endInput = screen.getByLabelText('종료');
    await user.clear(endInput);
    await user.type(endInput, '0:05.000');
    await user.tab();

    const btn = screen.getByText('GIF 다운로드');
    expect(btn).not.toBeDisabled();
  });

  it('shows error when duration exceeds 30 seconds', async () => {
    const user = userEvent.setup();
    render(<YoutubeGifExtractor {...defaultProps} />);

    const endInput = screen.getByLabelText('종료');
    await user.clear(endInput);
    await user.type(endInput, '0:35.000');
    await user.tab();

    expect(screen.getByText('GIF 구간은 최대 30초까지 가능합니다.')).toBeInTheDocument();
  });

  it('calls downloadYoutubeGif on download click', async () => {
    const user = userEvent.setup();
    render(<YoutubeGifExtractor {...defaultProps} />);

    await user.type(screen.getByLabelText('YouTube URL'), 'https://www.youtube.com/watch?v=test');

    const endInput = screen.getByLabelText('종료');
    await user.clear(endInput);
    await user.type(endInput, '0:05.000');
    await user.tab();

    await user.click(screen.getByText('GIF 다운로드'));

    await waitFor(() => {
      expect(defaultProps.downloadYoutubeGif).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=test',
        0,
        5,
        480,
      );
    });
  });

  it('shows loading state during download', async () => {
    let resolveDownload: (value: Blob) => void;
    const slowDownload = vi.fn(() => new Promise<Blob>((resolve) => { resolveDownload = resolve; }));
    const user = userEvent.setup();
    render(<YoutubeGifExtractor {...defaultProps} downloadYoutubeGif={slowDownload} />);

    await user.type(screen.getByLabelText('YouTube URL'), 'https://www.youtube.com/watch?v=test');

    const endInput = screen.getByLabelText('종료');
    await user.clear(endInput);
    await user.type(endInput, '0:05.000');
    await user.tab();

    await user.click(screen.getByText('GIF 다운로드'));

    await waitFor(() => {
      expect(screen.getByText('변환 중...')).toBeInTheDocument();
    });

    resolveDownload!(new Blob(['gif'], { type: 'image/gif' }));

    await waitFor(() => {
      expect(screen.queryByText('변환 중...')).not.toBeInTheDocument();
    });
  });

  it('shows error when download fails', async () => {
    const failDownload = vi.fn().mockRejectedValue(new Error('Download failed'));
    const user = userEvent.setup();
    render(<YoutubeGifExtractor {...defaultProps} downloadYoutubeGif={failDownload} />);

    await user.type(screen.getByLabelText('YouTube URL'), 'https://www.youtube.com/watch?v=test');

    const endInput = screen.getByLabelText('종료');
    await user.clear(endInput);
    await user.type(endInput, '0:05.000');
    await user.tab();

    await user.click(screen.getByText('GIF 다운로드'));

    await waitFor(() => {
      expect(screen.getByText('Download failed')).toBeInTheDocument();
    });
  });

  it('shows YouTube embed preview when valid URL entered', async () => {
    const user = userEvent.setup();
    render(<YoutubeGifExtractor {...defaultProps} />);

    await user.type(screen.getByLabelText('YouTube URL'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await user.tab();

    const iframe = document.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe?.src).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });
});
