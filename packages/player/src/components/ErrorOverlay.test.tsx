import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorOverlay } from './ErrorOverlay';

describe('ErrorOverlay', () => {
  it('renders error message', () => {
    render(<ErrorOverlay message="Video failed" onRetry={vi.fn()} />);
    expect(screen.getByText('Video failed')).toBeInTheDocument();
  });

  it('renders retry button', () => {
    render(<ErrorOverlay message="Error" onRetry={vi.fn()} />);
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls onRetry when button clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorOverlay message="Error" onRetry={onRetry} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('has alert role for accessibility', () => {
    render(<ErrorOverlay message="Error" onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
