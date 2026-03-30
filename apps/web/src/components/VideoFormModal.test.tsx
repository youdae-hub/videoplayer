import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoFormModal } from './VideoFormModal';
import type { Video } from '@videoplayer/core';

const mockVideo: Video = {
  id: '1',
  title: 'Existing Video',
  description: 'Existing description',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  videoUrl: 'https://example.com/video.mp4',
  duration: 120,
  subtitles: [{ id: 'sub-1', label: '한국어', language: 'ko', src: '/subs/ko.vtt' }],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('VideoFormModal', () => {
  it('renders add form when no video prop', () => {
    render(<VideoFormModal onSubmit={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('동영상 추가')).toBeInTheDocument();
    expect(screen.getByText('추가')).toBeInTheDocument();
  });

  it('renders edit form when video prop is provided', () => {
    render(<VideoFormModal video={mockVideo} onSubmit={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('동영상 수정')).toBeInTheDocument();
    expect(screen.getByText('수정')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Video')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/video.mp4')).toBeInTheDocument();
  });

  it('shows validation error when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<VideoFormModal onSubmit={vi.fn()} onClose={vi.fn()} />);

    await user.click(screen.getByText('추가'));
    expect(screen.getByTestId('form-error')).toHaveTextContent('제목과 동영상 URL은 필수입니다.');
  });

  it('calls onSubmit with form data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<VideoFormModal onSubmit={onSubmit} onClose={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('동영상 제목'), 'New Video');
    await user.type(screen.getByPlaceholderText('https://example.com/video.mp4'), 'https://test.com/v.mp4');
    await user.click(screen.getByText('추가'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Video',
          videoUrl: 'https://test.com/v.mp4',
        }),
      );
    });
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<VideoFormModal onSubmit={vi.fn()} onClose={onClose} />);

    await user.click(screen.getByText('취소'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<VideoFormModal onSubmit={vi.fn()} onClose={onClose} />);

    await user.click(screen.getByTestId('form-overlay'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('adds and removes subtitle rows', async () => {
    const user = userEvent.setup();
    render(<VideoFormModal onSubmit={vi.fn()} onClose={vi.fn()} />);

    await user.click(screen.getByText('+ 자막 추가'));
    expect(screen.getByPlaceholderText('표시 이름')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Remove subtitle 1'));
    expect(screen.queryByPlaceholderText('표시 이름')).not.toBeInTheDocument();
  });

  it('pre-fills subtitle rows when editing', () => {
    render(<VideoFormModal video={mockVideo} onSubmit={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByDisplayValue('한국어')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ko')).toBeInTheDocument();
  });

  it('shows error message on submit failure', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('fail'));
    render(<VideoFormModal onSubmit={onSubmit} onClose={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('동영상 제목'), 'Test');
    await user.type(screen.getByPlaceholderText('https://example.com/video.mp4'), 'https://x.com/v.mp4');
    await user.click(screen.getByText('추가'));

    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toHaveTextContent('저장에 실패했습니다.');
    });
  });
});
