import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FullscreenButton } from './FullscreenButton';

describe('FullscreenButton', () => {
  it('renders enter fullscreen button when not fullscreen', () => {
    render(<FullscreenButton isFullscreen={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /enter fullscreen/i })).toBeInTheDocument();
  });

  it('renders exit fullscreen button when fullscreen', () => {
    render(<FullscreenButton isFullscreen={true} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /exit fullscreen/i })).toBeInTheDocument();
  });

  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<FullscreenButton isFullscreen={false} onToggle={onToggle} />);

    await user.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
