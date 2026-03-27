import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CmsPage } from './CmsPage';

vi.mock('../services/createVideoService', () => ({
  videoService: {
    getVideos: vi.fn().mockResolvedValue({
      data: [
        {
          id: '1', title: 'CMS Video', description: 'Test',
          thumbnailUrl: 'http://example.com/thumb.jpg', videoUrl: '',
          duration: 120, subtitles: [],
          createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1, page: 1, pageSize: 12, totalPages: 1,
    }),
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
});
