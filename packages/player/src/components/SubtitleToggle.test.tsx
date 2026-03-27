import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubtitleToggle } from './SubtitleToggle';

describe('SubtitleToggle', () => {
  it('renders toggle with off state', () => {
    render(<SubtitleToggle enabled={false} onToggle={vi.fn()} />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('renders toggle with on state', () => {
    render(<SubtitleToggle enabled={true} onToggle={vi.fn()} />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<SubtitleToggle enabled={false} onToggle={onToggle} />);

    await user.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('displays subtitle label', () => {
    render(<SubtitleToggle enabled={false} onToggle={vi.fn()} />);
    expect(screen.getByText(/subtitle/i)).toBeInTheDocument();
  });
});
