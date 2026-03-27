import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoubleTapOverlay } from './DoubleTapOverlay';

describe('DoubleTapOverlay', () => {
  it('renders nothing when side is null', () => {
    render(<DoubleTapOverlay side={null} x={0} y={0} />);
    expect(screen.queryByTestId('double-tap-overlay')).not.toBeInTheDocument();
  });

  it('renders left skip text', () => {
    render(<DoubleTapOverlay side="left" x={100} y={100} />);
    expect(screen.getByText('« 10s')).toBeInTheDocument();
  });

  it('renders right skip text', () => {
    render(<DoubleTapOverlay side="right" x={300} y={100} />);
    expect(screen.getByText('10s »')).toBeInTheDocument();
  });

  it('positions ripple at tap coordinates', () => {
    const { container } = render(<DoubleTapOverlay side="left" x={150} y={200} />);
    const ripple = container.querySelector('.ripple') as HTMLElement;
    expect(ripple.style.left).toBe('150px');
    expect(ripple.style.top).toBe('200px');
  });
});
