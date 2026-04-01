import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CmsPage } from './CmsPage';

const mockGetVideos = vi.fn().mockResolvedValue({
  data: [
    {
      id: '1', title: 'CMS Video', description: 'Test',
      thumbnailUrl: 'http://example.com/thumb.jpg', videoUrl: 'http://example.com/v.mp4',
      duration: 120, subtitles: [], subtitleStatus: 'none',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    },
  ],
  total: 1, page: 1, pageSize: 12, totalPages: 1,
});

const mockCreateVideo = vi.fn().mockResolvedValue({
  id: '2', title: 'New Video', description: '', thumbnailUrl: '', videoUrl: 'http://x.com/v.mp4',
  duration: 0, subtitles: [], createdAt: '', updatedAt: '',
});

const mockUpdateVideo = vi.fn().mockResolvedValue({
  id: '1', title: 'Updated', description: '', thumbnailUrl: '', videoUrl: '',
  duration: 0, subtitles: [], createdAt: '', updatedAt: '',
});

const mockDeleteVideo = vi.fn().mockResolvedValue(undefined);

const mockTranscribeVideo = vi.fn().mockResolvedValue(undefined);
const mockTranslateVideo = vi.fn().mockResolvedValue(undefined);
const mockGetLanguages = vi.fn().mockResolvedValue([
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
]);

vi.mock('../services/createVideoService', () => ({
  videoService: {
    getVideos: (...args: unknown[]) => mockGetVideos(...args),
    createVideo: (...args: unknown[]) => mockCreateVideo(...args),
    updateVideo: (...args: unknown[]) => mockUpdateVideo(...args),
    deleteVideo: (...args: unknown[]) => mockDeleteVideo(...args),
    transcribeVideo: (...args: unknown[]) => mockTranscribeVideo(...args),
    translateVideo: (...args: unknown[]) => mockTranslateVideo(...args),
    getLanguages: (...args: unknown[]) => mockGetLanguages(...args),
  },
}));

describe('CmsPage', () => {
  it('renders page title', () => {
    render(<CmsPage />);
    expect(screen.getByText('Content Management')).toBeInTheDocument();
  });

  it('shows loading skeletons initially', () => {
    render(<CmsPage />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders video rows after loading', async () => {
    render(<CmsPage />);
    await waitFor(() => {
      expect(screen.getByText('CMS Video')).toBeInTheDocument();
    });
  });

  it('renders edit and delete buttons', async () => {
    render(<CmsPage />);
    await waitFor(() => {
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });
  });

  it('renders table headers', () => {
    render(<CmsPage />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders add video button', () => {
    render(<CmsPage />);
    expect(screen.getByText('+ 동영상 추가')).toBeInTheDocument();
  });

  it('opens add form when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<CmsPage />);

    await user.click(screen.getByText('+ 동영상 추가'));
    expect(screen.getByText('동영상 추가')).toBeInTheDocument();
  });

  it('opens edit form when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<CmsPage />);

    await waitFor(() => {
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Edit'));
    expect(screen.getByText('동영상 수정')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CMS Video')).toBeInTheDocument();
  });

  it('opens delete confirm dialog when delete is clicked', async () => {
    const user = userEvent.setup();
    render(<CmsPage />);

    await waitFor(() => {
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Delete'));
    expect(screen.getByText('동영상 삭제')).toBeInTheDocument();
    expect(screen.getByText(/삭제하시겠습니까/)).toBeInTheDocument();
  });

  it('calls deleteVideo when delete is confirmed', async () => {
    const user = userEvent.setup();
    render(<CmsPage />);

    await waitFor(() => {
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Delete'));
    await user.click(screen.getByText('삭제'));

    await waitFor(() => {
      expect(mockDeleteVideo).toHaveBeenCalledWith('1');
    });
  });

  it('shows subtitle status badge for none', async () => {
    render(<CmsPage />);
    await waitFor(() => {
      expect(screen.getByText('없음')).toBeInTheDocument();
    });
  });

  it('shows processing badge when subtitleStatus is processing', async () => {
    mockGetVideos.mockResolvedValueOnce({
      data: [
        {
          id: '1', title: 'Processing Video', description: '',
          thumbnailUrl: '', videoUrl: '/uploads/videos/v.mp4',
          duration: 60, subtitles: [], subtitleStatus: 'processing',
          createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1, page: 1, pageSize: 12, totalPages: 1,
    });
    render(<CmsPage />);
    await waitFor(() => {
      expect(screen.getByText('처리 중...')).toBeInTheDocument();
    });
  });

  it('shows completed badge with language label', async () => {
    mockGetVideos.mockResolvedValueOnce({
      data: [
        {
          id: '1', title: 'Completed Video', description: '',
          thumbnailUrl: '', videoUrl: '/uploads/videos/v.mp4',
          duration: 60,
          subtitles: [{ id: 's1', label: 'English', language: 'en', src: '/s.vtt' }],
          subtitleStatus: 'completed',
          createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1, page: 1, pageSize: 12, totalPages: 1,
    });
    render(<CmsPage />);
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
    });
  });

  it('shows download link for each subtitle', async () => {
    mockGetVideos.mockResolvedValueOnce({
      data: [
        {
          id: '1', title: 'Video with subs', description: '',
          thumbnailUrl: '', videoUrl: '/uploads/videos/v.mp4',
          duration: 60,
          subtitles: [{ id: 's1', label: 'English', language: 'en', src: '/uploads/subtitles/test.vtt' }],
          subtitleStatus: 'completed',
          createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1, page: 1, pageSize: 12, totalPages: 1,
    });
    render(<CmsPage />);
    await waitFor(() => {
      const downloadLink = screen.getByTitle('English 자막 다운로드');
      expect(downloadLink).toBeInTheDocument();
      expect(downloadLink).toHaveAttribute('href', '/uploads/subtitles/test.vtt');
      expect(downloadLink).toHaveAttribute('download');
    });
  });

  it('shows translate button when languages are available', async () => {
    mockGetVideos.mockResolvedValueOnce({
      data: [
        {
          id: '1', title: 'Video for translate', description: '',
          thumbnailUrl: '', videoUrl: '/uploads/videos/v.mp4',
          duration: 60,
          subtitles: [{ id: 's1', label: 'English', language: 'en', src: '/s.vtt' }],
          subtitleStatus: 'completed',
          createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1, page: 1, pageSize: 12, totalPages: 1,
    });
    render(<CmsPage />);
    await waitFor(() => {
      expect(screen.getByText('+ 번역')).toBeInTheDocument();
    });
  });

  it('calls translateVideo when a language is selected', async () => {
    const user = userEvent.setup();
    mockGetVideos.mockResolvedValueOnce({
      data: [
        {
          id: '1', title: 'Video for translate', description: '',
          thumbnailUrl: '', videoUrl: '/uploads/videos/v.mp4',
          duration: 60,
          subtitles: [{ id: 's1', label: 'English', language: 'en', src: '/s.vtt' }],
          subtitleStatus: 'completed',
          createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1, page: 1, pageSize: 12, totalPages: 1,
    });
    render(<CmsPage />);

    await waitFor(() => {
      expect(screen.getByText('+ 번역')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ 번역'));
    await user.click(screen.getByText('한국어 (Korean)'));

    await waitFor(() => {
      expect(mockTranslateVideo).toHaveBeenCalledWith('1', 'ko');
    });
  });

  it('shows failed badge with retry button', async () => {
    mockGetVideos.mockResolvedValueOnce({
      data: [
        {
          id: '1', title: 'Failed Video', description: '',
          thumbnailUrl: '', videoUrl: '/uploads/videos/v.mp4',
          duration: 60, subtitles: [], subtitleStatus: 'failed',
          createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1, page: 1, pageSize: 12, totalPages: 1,
    });
    render(<CmsPage />);
    await waitFor(() => {
      expect(screen.getByText('실패')).toBeInTheDocument();
      expect(screen.getByText('재시도')).toBeInTheDocument();
    });
  });

  it('calls createVideo when add form is submitted', async () => {
    const user = userEvent.setup();
    render(<CmsPage />);

    await user.click(screen.getByText('+ 동영상 추가'));
    await user.click(screen.getByText('URL 직접 입력'));
    await user.type(screen.getByPlaceholderText('동영상 제목'), 'New Video');
    await user.type(screen.getByPlaceholderText('https://example.com/video.mp4'), 'http://x.com/v.mp4');
    await user.click(screen.getByText('추가'));

    await waitFor(() => {
      expect(mockCreateVideo).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Video', videoUrl: 'http://x.com/v.mp4' }),
      );
    });
  });
});
