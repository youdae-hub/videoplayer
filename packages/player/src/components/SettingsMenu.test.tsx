import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsMenu } from './SettingsMenu';

const subtitles = [
  { id: 'sub-ko', label: '한국어', language: 'ko', src: '/subs/ko.vtt' },
  { id: 'sub-en', label: 'English', language: 'en', src: '/subs/en.vtt' },
];

describe('SettingsMenu', () => {
  const defaultProps = {
    playbackSpeed: 1,
    subtitles,
    activeSubtitleId: null as string | null,
    onSpeedChange: vi.fn(),
    onSubtitleSelect: vi.fn(),
  };

  it('renders settings button', () => {
    render(<SettingsMenu {...defaultProps} />);
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('menu is hidden by default', () => {
    render(<SettingsMenu {...defaultProps} />);
    expect(screen.queryByText('0.5x')).not.toBeInTheDocument();
  });

  it('opens menu on button click', async () => {
    const user = userEvent.setup();
    render(<SettingsMenu {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByText('0.5x')).toBeInTheDocument();
    expect(screen.getByText('한국어')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('closes menu on second click', async () => {
    const user = userEvent.setup();
    render(<SettingsMenu {...defaultProps} />);

    const button = screen.getByRole('button', { name: /settings/i });
    await user.click(button);
    expect(screen.getByText('0.5x')).toBeInTheDocument();

    await user.click(button);
    expect(screen.queryByText('0.5x')).not.toBeInTheDocument();
  });

  it('calls onSpeedChange when speed selected', async () => {
    const user = userEvent.setup();
    const onSpeedChange = vi.fn();
    render(<SettingsMenu {...defaultProps} onSpeedChange={onSpeedChange} />);

    await user.click(screen.getByRole('button', { name: /settings/i }));
    await user.click(screen.getByText('1.5x'));
    expect(onSpeedChange).toHaveBeenCalledWith(1.5);
  });

  it('calls onSubtitleSelect when subtitle language clicked', async () => {
    const user = userEvent.setup();
    const onSubtitleSelect = vi.fn();
    render(<SettingsMenu {...defaultProps} onSubtitleSelect={onSubtitleSelect} />);

    await user.click(screen.getByRole('button', { name: /settings/i }));
    await user.click(screen.getByText('한국어'));
    expect(onSubtitleSelect).toHaveBeenCalledWith('ko');
  });
});
