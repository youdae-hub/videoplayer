import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubtitleSelector } from './SubtitleSelector';

const subtitles = [
  { id: 'sub-ko', label: '한국어', language: 'ko', src: '/subs/ko.vtt' },
  { id: 'sub-en', label: 'English', language: 'en', src: '/subs/en.vtt' },
];

describe('SubtitleSelector', () => {
  it('renders subtitle language options', () => {
    render(<SubtitleSelector subtitles={subtitles} activeSubtitleId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('한국어')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('renders Off option', () => {
    render(<SubtitleSelector subtitles={subtitles} activeSubtitleId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Off')).toBeInTheDocument();
  });

  it('highlights active subtitle', () => {
    render(<SubtitleSelector subtitles={subtitles} activeSubtitleId="ko" onSelect={vi.fn()} />);
    expect(screen.getByText('한국어')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('English')).toHaveAttribute('data-active', 'false');
    expect(screen.getByText('Off')).toHaveAttribute('data-active', 'false');
  });

  it('highlights Off when no subtitle is active', () => {
    render(<SubtitleSelector subtitles={subtitles} activeSubtitleId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Off')).toHaveAttribute('data-active', 'true');
  });

  it('calls onSelect with language when subtitle clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SubtitleSelector subtitles={subtitles} activeSubtitleId={null} onSelect={onSelect} />);

    await user.click(screen.getByText('한국어'));
    expect(onSelect).toHaveBeenCalledWith('ko');
  });

  it('calls onSelect with null when Off clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SubtitleSelector subtitles={subtitles} activeSubtitleId="ko" onSelect={onSelect} />);

    await user.click(screen.getByText('Off'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('shows no subtitles message when empty', () => {
    render(<SubtitleSelector subtitles={[]} activeSubtitleId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('No subtitles available')).toBeInTheDocument();
  });
});
