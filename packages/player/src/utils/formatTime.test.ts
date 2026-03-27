import { describe, it, expect } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime', () => {
  it('formats 0 seconds as 0:00', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('formats seconds under a minute', () => {
    expect(formatTime(45)).toBe('0:45');
  });

  it('formats exact minutes', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(120)).toBe('2:00');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(605)).toBe('10:05');
  });

  it('formats hours', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3661)).toBe('1:01:01');
    expect(formatTime(7384)).toBe('2:03:04');
  });

  it('pads seconds with leading zero', () => {
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(65)).toBe('1:05');
  });

  it('pads minutes with leading zero when hours present', () => {
    expect(formatTime(3605)).toBe('1:00:05');
  });

  it('handles NaN and negative values', () => {
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(-10)).toBe('0:00');
  });

  it('floors decimal seconds', () => {
    expect(formatTime(90.7)).toBe('1:30');
  });
});
