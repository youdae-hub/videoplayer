import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VideoListPage } from './VideoListPage';

vi.mock('../services/videoService', () => ({
  videoService: {
    getVideos: vi.fn().mockResolvedValue({
      data: [
        {
          id: '1', title: 'Mock Video', description: 'Mock desc',
          thumbnailUrl: '', videoUrl: '', duration: 120,
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
});
