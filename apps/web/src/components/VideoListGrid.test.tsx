import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { VideoListGrid } from './VideoListGrid';
import type { Video } from '@videoplayer/core';

const mockVideos: Video[] = [
  {
    id: '1', title: 'Video 1', description: 'Desc 1',
    thumbnailUrl: '', videoUrl: '', duration: 60,
    subtitles: [], createdAt: '', updatedAt: '',
  },
  {
    id: '2', title: 'Video 2', description: 'Desc 2',
    thumbnailUrl: '', videoUrl: '', duration: 120,
    subtitles: [], createdAt: '', updatedAt: '',
  },
];

describe('VideoListGrid', () => {
  it('renders all video cards', () => {
    render(
      <MemoryRouter>
        <VideoListGrid videos={mockVideos} />
      </MemoryRouter>
    );
    expect(screen.getByText('Video 1')).toBeInTheDocument();
    expect(screen.getByText('Video 2')).toBeInTheDocument();
  });

  it('renders correct number of links', () => {
    render(
      <MemoryRouter>
        <VideoListGrid videos={mockVideos} />
      </MemoryRouter>
    );
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('renders empty state when no videos', () => {
    render(
      <MemoryRouter>
        <VideoListGrid videos={[]} />
      </MemoryRouter>
    );
    expect(screen.getByText(/no videos/i)).toBeInTheDocument();
  });

  it('renders buttons instead of links when onVideoSelect is provided', () => {
    render(<VideoListGrid videos={mockVideos} onVideoSelect={vi.fn()} />);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('calls onVideoSelect with correct video when card is clicked', async () => {
    const user = userEvent.setup();
    const onVideoSelect = vi.fn();
    render(<VideoListGrid videos={mockVideos} onVideoSelect={onVideoSelect} />);

    await user.click(screen.getByText('Video 1'));
    expect(onVideoSelect).toHaveBeenCalledWith(mockVideos[0]);
  });
});
