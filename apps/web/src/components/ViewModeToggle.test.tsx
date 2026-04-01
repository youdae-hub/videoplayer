import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewModeToggle } from './ViewModeToggle';

describe('ViewModeToggle', () => {
  it('renders both mode options', () => {
    render(<ViewModeToggle mode="page" onChange={vi.fn()} />);
    expect(screen.getByText('페이지 이동')).toBeInTheDocument();
    expect(screen.getByText('레이어 재생')).toBeInTheDocument();
  });

  it('marks page mode as active', () => {
    render(<ViewModeToggle mode="page" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: '페이지 이동' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '레이어 재생' })).toHaveAttribute('aria-checked', 'false');
  });

  it('marks modal mode as active', () => {
    render(<ViewModeToggle mode="modal" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: '레이어 재생' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '페이지 이동' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with "modal" when modal button clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ViewModeToggle mode="page" onChange={onChange} />);

    await user.click(screen.getByText('레이어 재생'));
    expect(onChange).toHaveBeenCalledWith('modal');
  });

  it('calls onChange with "page" when page button clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ViewModeToggle mode="modal" onChange={onChange} />);

    await user.click(screen.getByText('페이지 이동'));
    expect(onChange).toHaveBeenCalledWith('page');
  });
});
