import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VideoCard } from './VideoCard';
import type { Video } from '@videoplayer/core';

const mockVideo: Video = {
  id: '1',
  title: 'Test Video',
  description: 'A test video description that might be long enough to need truncation.',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  videoUrl: 'https://example.com/video.mp4',
  duration: 634,
  subtitles: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('VideoCard', () => {
  it('renders video title', () => {
    renderWithRouter(<VideoCard video={mockVideo} />);
    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });

  it('renders video description', () => {
    renderWithRouter(<VideoCard video={mockVideo} />);
    expect(screen.getByText(/A test video description/)).toBeInTheDocument();
  });

  it('renders duration badge', () => {
    renderWithRouter(<VideoCard video={mockVideo} />);
    expect(screen.getByText('10:34')).toBeInTheDocument();
  });

  it('renders thumbnail image', () => {
    renderWithRouter(<VideoCard video={mockVideo} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
    expect(img).toHaveAttribute('alt', 'Test Video');
  });

  it('links to video player page', () => {
    renderWithRouter(<VideoCard video={mockVideo} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/video/1');
  });
});
