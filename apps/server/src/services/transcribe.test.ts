import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startTranscription } from './transcribe.js';

vi.mock('../db.js', () => ({
  prisma: {
    subtitle: { create: vi.fn() },
    video: { update: vi.fn() },
  },
}));

const mockSpawn = vi.fn();
vi.mock('child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
}));

describe('startTranscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('spawns python3 with correct arguments', () => {
    const mockProcess = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
    };
    mockSpawn.mockReturnValue(mockProcess);

    startTranscription('video-123', 'test.mp4', 'base');

    expect(mockSpawn).toHaveBeenCalledWith(
      'python3',
      expect.arrayContaining([
        expect.stringContaining('transcribe.py'),
        expect.stringContaining('test.mp4'),
        expect.stringContaining('test.vtt'),
        '--model',
        'base',
      ]),
      expect.objectContaining({ stdio: ['ignore', 'pipe', 'pipe'] }),
    );
  });

  it('spawns with default model when not specified', () => {
    const mockProcess = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
    };
    mockSpawn.mockReturnValue(mockProcess);

    startTranscription('video-123', 'test.mp4');

    expect(mockSpawn).toHaveBeenCalledWith(
      'python3',
      expect.arrayContaining(['--model', 'base']),
      expect.any(Object),
    );
  });
});
