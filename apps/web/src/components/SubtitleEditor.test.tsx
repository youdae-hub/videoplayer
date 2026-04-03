import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubtitleEditor } from './SubtitleEditor';
import type { SubtitleCue } from '../services/types';

const mockCues: SubtitleCue[] = [
  { startTime: 1, endTime: 5, text: 'First cue' },
  { startTime: 6, endTime: 10, text: 'Second cue' },
];

describe('SubtitleEditor', () => {
  const defaultProps = {
    videoSrc: 'blob:http://localhost/video-123',
    subtitle: { id: 'sub-1', label: 'English', language: 'en', src: '/subs/en.vtt' },
    onLoad: vi.fn().mockResolvedValue(mockCues),
    onSave: vi.fn().mockResolvedValue(mockCues),
    onClose: vi.fn(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders title with subtitle label', async () => {
    render(<SubtitleEditor {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('자막 편집 — English')).toBeInTheDocument();
    });
  });

  it('loads and displays cues', async () => {
    render(<SubtitleEditor {...defaultProps} />);
    await waitFor(() => {
      expect(defaultProps.onLoad).toHaveBeenCalledWith('sub-1');
    });
    expect(screen.getByDisplayValue('First cue')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Second cue')).toBeInTheDocument();
  });

  it('shows error when load fails', async () => {
    const failProps = {
      ...defaultProps,
      onLoad: vi.fn().mockRejectedValue(new Error('fail')),
    };
    render(<SubtitleEditor {...failProps} />);
    await waitFor(() => {
      expect(screen.getByText('자막을 불러올 수 없습니다.')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button clicked', async () => {
    render(<SubtitleEditor {...defaultProps} />);
    await waitFor(() => screen.getByDisplayValue('First cue'));
    await userEvent.click(screen.getByText('닫기'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay clicked', async () => {
    render(<SubtitleEditor {...defaultProps} />);
    await waitFor(() => screen.getByDisplayValue('First cue'));
    await userEvent.click(screen.getByTestId('subtitle-editor-overlay'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('enables save button after editing', async () => {
    const user = userEvent.setup();
    render(<SubtitleEditor {...defaultProps} />);
    await waitFor(() => screen.getByDisplayValue('First cue'));

    const saveBtn = screen.getByText('저장');
    expect(saveBtn).toBeDisabled();

    const input = screen.getByDisplayValue('First cue');
    await user.clear(input);
    await user.type(input, 'Updated cue');

    expect(saveBtn).not.toBeDisabled();
  });

  it('calls onSave with updated cues', async () => {
    const user = userEvent.setup();
    render(<SubtitleEditor {...defaultProps} />);
    await waitFor(() => screen.getByDisplayValue('First cue'));

    const input = screen.getByDisplayValue('First cue');
    await user.clear(input);
    await user.type(input, 'Updated');

    await user.click(screen.getByText('저장'));
    expect(defaultProps.onSave).toHaveBeenCalledWith('sub-1', expect.arrayContaining([
      expect.objectContaining({ text: 'Updated' }),
    ]));
  });

  it('adds a new cue at end when bottom add button clicked', async () => {
    const user = userEvent.setup();
    render(<SubtitleEditor {...defaultProps} />);
    await waitFor(() => screen.getByDisplayValue('First cue'));

    const rows = screen.getAllByRole('row');
    const initialCount = rows.length - 1;

    await user.click(screen.getByText('+ 자막 추가'));

    const newRows = screen.getAllByRole('row');
    expect(newRows.length - 1).toBe(initialCount + 1);
  });

  it('inserts a cue after a specific row when inline add button clicked', async () => {
    const user = userEvent.setup();
    render(<SubtitleEditor {...defaultProps} />);
    await waitFor(() => screen.getByDisplayValue('First cue'));

    const addButtons = screen.getAllByTitle('아래에 추가');
    await user.click(addButtons[0]);

    const rows = screen.getAllByRole('row');
    expect(rows.length - 1).toBe(3);
  });

  it('removes a cue when delete button clicked', async () => {
    const user = userEvent.setup();
    render(<SubtitleEditor {...defaultProps} />);
    await waitFor(() => screen.getByDisplayValue('First cue'));

    const deleteButtons = screen.getAllByTitle('삭제');
    await user.click(deleteButtons[0]);

    expect(screen.queryByDisplayValue('First cue')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Second cue')).toBeInTheDocument();
  });
});
