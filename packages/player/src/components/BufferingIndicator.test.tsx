import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BufferingIndicator } from './BufferingIndicator';

describe('BufferingIndicator', () => {
  it('renders when visible', () => {
    render(<BufferingIndicator visible={true} />);
    expect(screen.getByTestId('buffering-indicator')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<BufferingIndicator visible={false} />);
    expect(screen.queryByTestId('buffering-indicator')).not.toBeInTheDocument();
  });

  it('contains a spinner element', () => {
    const { container } = render(<BufferingIndicator visible={true} />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });
});
