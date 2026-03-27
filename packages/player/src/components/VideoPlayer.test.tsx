import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoPlayer } from './VideoPlayer';

describe('VideoPlayer', () => {
  it('renders a video element with the given src', () => {
    render(<VideoPlayer src="https://example.com/video.mp4" />);
    const video = screen.getByTestId('video-element');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/video.mp4');
  });

  it('renders control bar', () => {
    render(<VideoPlayer src="https://example.com/video.mp4" />);
    expect(screen.getByTestId('control-bar')).toBeInTheDocument();
  });

  it('renders play button initially', () => {
    render(<VideoPlayer src="https://example.com/video.mp4" />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('renders skip buttons', () => {
    render(<VideoPlayer src="https://example.com/video.mp4" />);
    expect(screen.getByRole('button', { name: /back 10/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /forward 10/i })).toBeInTheDocument();
  });

  it('renders progress bar', () => {
    render(<VideoPlayer src="https://example.com/video.mp4" />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('renders time display', () => {
    render(<VideoPlayer src="https://example.com/video.mp4" />);
    expect(screen.getByText('0:00 / 0:00')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <VideoPlayer src="https://example.com/video.mp4" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('sets poster attribute when provided', () => {
    render(<VideoPlayer src="https://example.com/video.mp4" poster="https://example.com/poster.jpg" />);
    expect(screen.getByTestId('video-element')).toHaveAttribute('poster', 'https://example.com/poster.jpg');
  });
});
