import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VolumeControl } from './VolumeControl';

describe('VolumeControl', () => {
  const defaultProps = {
    volume: 0.7,
    isMuted: false,
    onVolumeChange: vi.fn(),
    onToggleMute: vi.fn(),
  };

  it('renders mute button', () => {
    render(<VolumeControl {...defaultProps} />);
    expect(screen.getByRole('button', { name: /volume/i })).toBeInTheDocument();
  });

  it('shows muted icon when muted', () => {
    render(<VolumeControl {...defaultProps} isMuted={true} />);
    expect(screen.getByRole('button', { name: /unmute/i })).toBeInTheDocument();
  });

  it('shows low volume icon when volume < 0.5', () => {
    render(<VolumeControl {...defaultProps} volume={0.3} />);
    expect(screen.getByRole('button', { name: /volume low/i })).toBeInTheDocument();
  });

  it('shows high volume icon when volume >= 0.5', () => {
    render(<VolumeControl {...defaultProps} volume={0.7} />);
    expect(screen.getByRole('button', { name: /volume high/i })).toBeInTheDocument();
  });

  it('calls onToggleMute when icon clicked', async () => {
    const user = userEvent.setup();
    const onToggleMute = vi.fn();
    render(<VolumeControl {...defaultProps} onToggleMute={onToggleMute} />);

    await user.click(screen.getByRole('button'));
    expect(onToggleMute).toHaveBeenCalledOnce();
  });

  it('renders volume slider', () => {
    render(<VolumeControl {...defaultProps} />);
    expect(screen.getByRole('slider', { name: /volume/i })).toBeInTheDocument();
  });

  it('slider reflects current volume', () => {
    render(<VolumeControl {...defaultProps} volume={0.5} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('50');
  });
});
