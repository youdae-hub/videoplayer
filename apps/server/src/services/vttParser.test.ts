import { describe, it, expect } from 'vitest';
import { parseVtt, generateVtt } from './vttParser.js';
import type { SubtitleCue } from './vttParser.js';

const sampleVtt = `WEBVTT

00:00:01.000 --> 00:00:05.000
Hello world.

00:00:06.000 --> 00:00:10.500
Second subtitle line.
`;

describe('parseVtt', () => {
  it('parses standard VTT content into cues', () => {
    const cues = parseVtt(sampleVtt);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({ startTime: 1, endTime: 5, text: 'Hello world.' });
    expect(cues[1]).toEqual({ startTime: 6, endTime: 10.5, text: 'Second subtitle line.' });
  });

  it('handles multi-line subtitle text', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:05.000
Line one
Line two
`;
    const cues = parseVtt(vtt);
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe('Line one\nLine two');
  });

  it('ignores cue identifiers (numbered cues)', () => {
    const vtt = `WEBVTT

1
00:00:01.000 --> 00:00:03.000
First cue

2
00:00:04.000 --> 00:00:06.000
Second cue
`;
    const cues = parseVtt(vtt);
    expect(cues).toHaveLength(2);
    expect(cues[0].text).toBe('First cue');
    expect(cues[1].text).toBe('Second cue');
  });

  it('returns empty array for invalid content', () => {
    expect(parseVtt('not a vtt file')).toEqual([]);
    expect(parseVtt('')).toEqual([]);
  });

  it('handles hours in timestamps', () => {
    const vtt = `WEBVTT

01:30:00.000 --> 01:30:05.000
Long video subtitle
`;
    const cues = parseVtt(vtt);
    expect(cues[0].startTime).toBe(5400);
    expect(cues[0].endTime).toBe(5405);
  });
});

describe('generateVtt', () => {
  it('generates valid VTT from cues', () => {
    const cues: SubtitleCue[] = [
      { startTime: 1, endTime: 5, text: 'Hello world.' },
      { startTime: 6, endTime: 10.5, text: 'Second line.' },
    ];
    const result = generateVtt(cues);
    expect(result).toContain('WEBVTT');
    expect(result).toContain('00:00:01.000 --> 00:00:05.000');
    expect(result).toContain('Hello world.');
    expect(result).toContain('00:00:06.000 --> 00:00:10.500');
    expect(result).toContain('Second line.');
  });

  it('roundtrips parse -> generate -> parse', () => {
    const original = parseVtt(sampleVtt);
    const generated = generateVtt(original);
    const reparsed = parseVtt(generated);
    expect(reparsed).toEqual(original);
  });

  it('handles empty cue array', () => {
    const result = generateVtt([]);
    expect(result).toBe('WEBVTT\n');
  });
});
