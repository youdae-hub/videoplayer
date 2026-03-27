import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBarTooltip } from './ProgressBarTooltip';

describe('ProgressBarTooltip', () => {
  it('renders formatted time when visible', () => {
    render(<ProgressBarTooltip time={65} position={50} visible={true} duration={120} />);
    expect(screen.getByTestId('progress-tooltip')).toHaveTextContent('1:05');
  });

  it('does not render when not visible', () => {
    render(<ProgressBarTooltip time={30} position={25} visible={false} duration={120} />);
    expect(screen.queryByTestId('progress-tooltip')).not.toBeInTheDocument();
  });

  it('does not render when duration is 0', () => {
    render(<ProgressBarTooltip time={0} position={0} visible={true} duration={0} />);
    expect(screen.queryByTestId('progress-tooltip')).not.toBeInTheDocument();
  });

  it('clamps position to avoid overflow', () => {
    const { container } = render(
      <ProgressBarTooltip time={10} position={5} visible={true} duration={120} />
    );
    const tooltip = container.querySelector('[data-testid="progress-tooltip"]') as HTMLElement;
    expect(tooltip.style.left).toBe('20%');
  });
});
