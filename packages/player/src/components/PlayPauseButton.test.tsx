import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayPauseButton } from './PlayPauseButton';

describe('PlayPauseButton', () => {
  it('renders play icon when paused', () => {
    render(<PlayPauseButton isPlaying={false} onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('renders pause icon when playing', () => {
    render(<PlayPauseButton isPlaying={true} onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PlayPauseButton isPlaying={false} onClick={onClick} />);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
