import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimeDisplay } from './TimeDisplay';

describe('TimeDisplay', () => {
  it('renders current time and duration', () => {
    render(<TimeDisplay currentTime={65} duration={300} />);
    expect(screen.getByText('1:05 / 5:00')).toBeInTheDocument();
  });

  it('renders 0:00 for zero values', () => {
    render(<TimeDisplay currentTime={0} duration={0} />);
    expect(screen.getByText('0:00 / 0:00')).toBeInTheDocument();
  });

  it('renders hour format when duration exceeds 1 hour', () => {
    render(<TimeDisplay currentTime={90} duration={7200} />);
    expect(screen.getByText('0:01:30 / 2:00:00')).toBeInTheDocument();
  });
});
