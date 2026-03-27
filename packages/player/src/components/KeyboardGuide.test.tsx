import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardGuide } from './KeyboardGuide';

describe('KeyboardGuide', () => {
  it('renders nothing when not visible', () => {
    render(<KeyboardGuide visible={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('keyboard-guide')).not.toBeInTheDocument();
  });

  it('renders shortcut list when visible', () => {
    render(<KeyboardGuide visible={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('keyboard-guide')).toBeInTheDocument();
    expect(screen.getByText('키보드 단축키')).toBeInTheDocument();
    expect(screen.getByText('Space')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<KeyboardGuide visible={true} onClose={onClose} />);

    await user.click(screen.getByTestId('keyboard-guide'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close when card content is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<KeyboardGuide visible={true} onClose={onClose} />);

    await user.click(screen.getByText('키보드 단축키'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<KeyboardGuide visible={true} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /close guide/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
