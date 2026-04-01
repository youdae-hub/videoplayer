import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoPlayerModal } from './VideoPlayerModal';
import type { Video } from '@videoplayer/core';

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
});

const mockVideo: Video = {
  id: '1',
  title: 'Test Video',
  description: 'Test description',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  videoUrl: 'https://example.com/video.mp4',
  duration: 120,
  subtitles: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('VideoPlayerModal', () => {
  it('renders video title and description', () => {
    render(<VideoPlayerModal video={mockVideo} onClose={vi.fn()} />);
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders video player', () => {
    render(<VideoPlayerModal video={mockVideo} onClose={vi.fn()} />);
    expect(screen.getByTestId('video-element')).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<VideoPlayerModal video={mockVideo} onClose={onClose} />);

    await user.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close when content area is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<VideoPlayerModal video={mockVideo} onClose={onClose} />);

    await user.click(screen.getByText('Test Video'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<VideoPlayerModal video={mockVideo} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<VideoPlayerModal video={mockVideo} onClose={onClose} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('locks body scroll when mounted', () => {
    render(<VideoPlayerModal video={mockVideo} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
  });
});
