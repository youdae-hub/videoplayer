import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YoutubeDataExtractor } from './YoutubeDataExtractor';

describe('YoutubeDataExtractor', () => {
  const defaultProps = {
    downloadYoutubeGif: vi.fn().mockResolvedValue(new Blob(['gif'], { type: 'image/gif' })),
    downloadYoutubeVideo: vi.fn().mockResolvedValue(new Blob(['mp4'], { type: 'video/mp4' })),
    listYoutubeSubtitles: vi.fn().mockResolvedValue([
      { code: 'ko', label: 'Korean' },
      { code: 'en', label: 'English' },
    ]),
    downloadYoutubeSubtitle: vi.fn().mockResolvedValue(new Blob(['WEBVTT'], { type: 'text/vtt' })),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    (window as any).YT = {
      Player: vi.fn().mockImplementation(() => ({
        getCurrentTime: vi.fn().mockReturnValue(5.5),
        destroy: vi.fn(),
      })),
      PlayerState: { PLAYING: 1 },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (window as any).YT;
  });

  it('renders title and close button', () => {
    render(<YoutubeDataExtractor {...defaultProps} />);
    expect(screen.getByText('YouTube 데이터 가져오기')).toBeInTheDocument();
    expect(screen.getByText('닫기')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    render(<YoutubeDataExtractor {...defaultProps} />);
    await userEvent.click(screen.getByText('닫기'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay clicked', async () => {
    render(<YoutubeDataExtractor {...defaultProps} />);
    await userEvent.click(screen.getByTestId('youtube-data-overlay'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders three tabs', () => {
    render(<YoutubeDataExtractor {...defaultProps} />);
    expect(screen.getByText('GIF 추출')).toBeInTheDocument();
    expect(screen.getByText('영상 다운로드')).toBeInTheDocument();
    expect(screen.getByText('자막 다운로드')).toBeInTheDocument();
  });

  it('renders URL input field', () => {
    render(<YoutubeDataExtractor {...defaultProps} />);
    expect(screen.getByLabelText('YouTube URL')).toBeInTheDocument();
  });

  // ──── GIF Tab ────

  it('renders GIF tab content by default', () => {
    render(<YoutubeDataExtractor {...defaultProps} />);
    expect(screen.getByLabelText('시작')).toBeInTheDocument();
    expect(screen.getByLabelText('종료')).toBeInTheDocument();
    expect(screen.getByLabelText('너비')).toBeInTheDocument();
  });

  it('disables GIF download when URL is empty', () => {
    render(<YoutubeDataExtractor {...defaultProps} />);
    const btn = screen.getByText('GIF 다운로드');
    expect(btn).toBeDisabled();
  });

  it('calls downloadYoutubeGif on GIF download click', async () => {
    const user = userEvent.setup();
    render(<YoutubeDataExtractor {...defaultProps} />);

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

  // ──── Video Download Tab ────

  it('shows video download tab content when clicked', async () => {
    const user = userEvent.setup();
    render(<YoutubeDataExtractor {...defaultProps} />);

    await user.click(screen.getByText('영상 다운로드'));

    expect(screen.getByText('YouTube 영상을 MP4 파일로 다운로드합니다.')).toBeInTheDocument();
  });

  it('disables video download when URL is empty', async () => {
    const user = userEvent.setup();
    render(<YoutubeDataExtractor {...defaultProps} />);

    await user.click(screen.getByText('영상 다운로드'));

    const btns = screen.getAllByText('영상 다운로드');
    const actionBtn = btns.find((b) => b.closest('.border-t'));
    expect(actionBtn).toBeDisabled();
  });

  it('calls downloadYoutubeVideo on video download click', async () => {
    const user = userEvent.setup();
    render(<YoutubeDataExtractor {...defaultProps} />);

    await user.type(screen.getByLabelText('YouTube URL'), 'https://www.youtube.com/watch?v=test');
    await user.click(screen.getByText('영상 다운로드'));

    const btns = screen.getAllByText('영상 다운로드');
    const actionBtn = btns.find((b) => b.closest('.border-t'))!;
    await user.click(actionBtn);

    await waitFor(() => {
      expect(defaultProps.downloadYoutubeVideo).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=test',
      );
    });
  });

  it('shows loading state during video download', async () => {
    let resolveDownload: (value: Blob) => void;
    const slowDownload = vi.fn(() => new Promise<Blob>((resolve) => { resolveDownload = resolve; }));
    const user = userEvent.setup();
    render(<YoutubeDataExtractor {...defaultProps} downloadYoutubeVideo={slowDownload} />);

    await user.type(screen.getByLabelText('YouTube URL'), 'https://www.youtube.com/watch?v=test');
    await user.click(screen.getByText('영상 다운로드'));

    const btns = screen.getAllByText('영상 다운로드');
    const actionBtn = btns.find((b) => b.closest('.border-t'))!;
    await user.click(actionBtn);

    await waitFor(() => {
      expect(screen.getByText('다운로드 중...')).toBeInTheDocument();
    });

    resolveDownload!(new Blob(['mp4'], { type: 'video/mp4' }));

    await waitFor(() => {
      expect(screen.queryByText('다운로드 중...')).not.toBeInTheDocument();
    });
  });

  // ──── Subtitle Tab ────

  it('shows subtitle tab content when clicked', async () => {
    const user = userEvent.setup();
    render(<YoutubeDataExtractor {...defaultProps} />);

    await user.click(screen.getByText('자막 다운로드'));

    expect(screen.getByText('자막 목록 불러오기')).toBeInTheDocument();
  });

  it('disables subtitle list button when URL is empty', async () => {
    const user = userEvent.setup();
    render(<YoutubeDataExtractor {...defaultProps} />);

    await user.click(screen.getByText('자막 다운로드'));

    expect(screen.getByText('자막 목록 불러오기')).toBeDisabled();
  });

  it('loads subtitle list when button clicked', async () => {
    const user = userEvent.setup();
    render(<YoutubeDataExtractor {...defaultProps} />);

    await user.type(screen.getByLabelText('YouTube URL'), 'https://www.youtube.com/watch?v=test');
    await user.click(screen.getByText('자막 다운로드'));

    await user.click(screen.getByText('자막 목록 불러오기'));

    await waitFor(() => {
      expect(screen.getByText('Korean')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });
  });

  it('calls downloadYoutubeSubtitle when subtitle download clicked', async () => {
    const user = userEvent.setup();
    render(<YoutubeDataExtractor {...defaultProps} />);

    await user.type(screen.getByLabelText('YouTube URL'), 'https://www.youtube.com/watch?v=test');
    await user.click(screen.getByText('자막 다운로드'));
    await user.click(screen.getByText('자막 목록 불러오기'));

    await waitFor(() => {
      expect(screen.getByText('Korean')).toBeInTheDocument();
    });

    const downloadBtns = screen.getAllByTitle('다운로드');
    await user.click(downloadBtns[0]);

    await waitFor(() => {
      expect(defaultProps.downloadYoutubeSubtitle).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=test',
        'ko',
      );
    });
  });

  it('shows YouTube player container when valid URL entered', async () => {
    const user = userEvent.setup();
    render(<YoutubeDataExtractor {...defaultProps} />);

    await user.type(screen.getByLabelText('YouTube URL'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    expect(screen.getByTestId('youtube-player')).toBeInTheDocument();
  });

  it('shares URL across tabs', async () => {
    const user = userEvent.setup();
    render(<YoutubeDataExtractor {...defaultProps} />);

    await user.type(screen.getByLabelText('YouTube URL'), 'https://www.youtube.com/watch?v=test');

    await user.click(screen.getByText('영상 다운로드'));
    expect(screen.getByLabelText('YouTube URL')).toHaveValue('https://www.youtube.com/watch?v=test');

    await user.click(screen.getByText('자막 다운로드'));
    expect(screen.getByLabelText('YouTube URL')).toHaveValue('https://www.youtube.com/watch?v=test');
  });
});
