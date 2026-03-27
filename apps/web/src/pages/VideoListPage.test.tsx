import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { VideoListPage } from './VideoListPage';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
});

vi.mock('../services/createVideoService', () => ({
  videoService: {
    getVideos: vi.fn().mockResolvedValue({
      data: [
        {
          id: '1', title: 'Mock Video', description: 'Mock desc',
          thumbnailUrl: '', videoUrl: 'https://example.com/video.mp4', duration: 120,
          subtitles: [], createdAt: '', updatedAt: '',
        },
      ],
      total: 1, page: 1, pageSize: 12, totalPages: 1,
    }),
  },
}));

describe('VideoListPage', () => {
  it('shows loading skeletons initially', () => {
    render(
      <MemoryRouter>
        <VideoListPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('skeleton-grid')).toBeInTheDocument();
  });

  it('renders video list after loading', async () => {
    render(
      <MemoryRouter>
        <VideoListPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Mock Video')).toBeInTheDocument();
    });
  });

  it('renders page title', async () => {
    render(
      <MemoryRouter>
        <VideoListPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  it('renders view mode toggle', async () => {
    render(
      <MemoryRouter>
        <VideoListPage />
      </MemoryRouter>
    );
    expect(screen.getByText('페이지 이동')).toBeInTheDocument();
    expect(screen.getByText('레이어 재생')).toBeInTheDocument();
  });

  it('defaults to page mode with links', async () => {
    render(
      <MemoryRouter>
        <VideoListPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole('link')).toBeInTheDocument();
    });
  });

  it('switches to modal mode and shows buttons', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <VideoListPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Mock Video')).toBeInTheDocument();
    });

    await user.click(screen.getByText('레이어 재생'));
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mock video/i })).toBeInTheDocument();
  });

  it('opens modal when video is clicked in modal mode', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <VideoListPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Mock Video')).toBeInTheDocument();
    });

    await user.click(screen.getByText('레이어 재생'));
    await user.click(screen.getByText('Mock Video'));
    expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('video-element')).toBeInTheDocument();
  });

  it('persists view mode to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <VideoListPage />
      </MemoryRouter>
    );

    await user.click(screen.getByText('레이어 재생'));
    expect(localStorage.getItem('videoplayer-view-mode')).toBe('modal');
  });
});
