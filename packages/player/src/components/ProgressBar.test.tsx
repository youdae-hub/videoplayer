import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('renders progress bar with correct aria attributes', () => {
    render(
      <ProgressBar
        currentTime={30}
        duration={120}
        buffered={50}
        onSeek={vi.fn()}
      />
    );
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '30');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '120');
  });

  it('renders filled progress at correct percentage', () => {
    const { container } = render(
      <ProgressBar
        currentTime={60}
        duration={120}
        buffered={80}
        onSeek={vi.fn()}
      />
    );
    const filled = container.querySelector('[data-testid="progress-filled"]');
    expect(filled).toHaveStyle({ width: '50%' });
  });

  it('renders buffered progress at correct percentage', () => {
    const { container } = render(
      <ProgressBar
        currentTime={30}
        duration={120}
        buffered={60}
        onSeek={vi.fn()}
      />
    );
    const buffered = container.querySelector('[data-testid="progress-buffered"]');
    expect(buffered).toHaveStyle({ width: '50%' });
  });

  it('handles zero duration without crashing', () => {
    render(
      <ProgressBar
        currentTime={0}
        duration={0}
        buffered={0}
        onSeek={vi.fn()}
      />
    );
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });
});
