import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaybackSpeedSelector } from './PlaybackSpeedSelector';

describe('PlaybackSpeedSelector', () => {
  it('renders all speed options', () => {
    render(<PlaybackSpeedSelector currentSpeed={1} onSpeedChange={vi.fn()} />);
    expect(screen.getByText('0.5x')).toBeInTheDocument();
    expect(screen.getByText('0.75x')).toBeInTheDocument();
    expect(screen.getByText('1x')).toBeInTheDocument();
    expect(screen.getByText('1.25x')).toBeInTheDocument();
    expect(screen.getByText('1.5x')).toBeInTheDocument();
    expect(screen.getByText('1.75x')).toBeInTheDocument();
    expect(screen.getByText('2x')).toBeInTheDocument();
  });

  it('highlights current speed', () => {
    render(<PlaybackSpeedSelector currentSpeed={1.5} onSpeedChange={vi.fn()} />);
    const activeButton = screen.getByText('1.5x').closest('button');
    expect(activeButton).toHaveAttribute('data-active', 'true');
  });

  it('calls onSpeedChange with selected speed', async () => {
    const user = userEvent.setup();
    const onSpeedChange = vi.fn();
    render(<PlaybackSpeedSelector currentSpeed={1} onSpeedChange={onSpeedChange} />);

    await user.click(screen.getByText('2x'));
    expect(onSpeedChange).toHaveBeenCalledWith(2);
  });
});
