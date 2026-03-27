import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkipButton } from './SkipButton';

describe('SkipButton', () => {
  it('renders forward skip button', () => {
    render(<SkipButton seconds={10} onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /forward 10/i })).toBeInTheDocument();
  });

  it('renders backward skip button', () => {
    render(<SkipButton seconds={-10} onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /back 10/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SkipButton seconds={10} onClick={onClick} />);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
