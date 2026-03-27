import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { VideoPlayerPage } from './VideoPlayerPage';

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
});

vi.mock('../services/createVideoService', () => ({
  videoService: {
    getVideoById: vi.fn().mockResolvedValue({
      id: '1', title: 'Test Video', description: 'Test description',
      thumbnailUrl: '', videoUrl: 'https://example.com/video.mp4',
      duration: 120, subtitles: [],
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    }),
  },
}));

function renderWithRoute() {
  return render(
    <MemoryRouter initialEntries={['/video/1']}>
      <Routes>
        <Route path="/video/:id" element={<VideoPlayerPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('VideoPlayerPage', () => {
  it('shows loading state initially', () => {
    renderWithRoute();
    expect(screen.getByTestId('player-skeleton')).toBeInTheDocument();
  });

  it('renders video title after loading', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Test Video')).toBeInTheDocument();
    });
  });

  it('renders video description after loading', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });
  });

  it('renders back link', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument();
    });
  });

  it('renders the video player after loading', async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByTestId('video-element')).toBeInTheDocument();
    });
  });
});
