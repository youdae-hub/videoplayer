export interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

function timeToSeconds(time: string): number {
  const parts = time.split(':');
  const [sec, ms] = parts[parts.length - 1].split('.');
  const hours = parts.length === 3 ? Number(parts[0]) : 0;
  const minutes = parts.length >= 2 ? Number(parts[parts.length - 2]) : 0;
  return hours * 3600 + minutes * 60 + Number(sec) + Number(ms || 0) / 1000;
}

function secondsToTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const sec = Math.floor(s);
  const ms = Math.round((s - sec) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function parseVtt(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = content.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const arrowIndex = lines.findIndex((l) => l.includes('-->'));
    if (arrowIndex === -1) continue;

    const timeLine = lines[arrowIndex];
    const [start, end] = timeLine.split('-->').map((t) => t.trim());
    const text = lines.slice(arrowIndex + 1).join('\n');

    if (start && end && text) {
      cues.push({
        startTime: timeToSeconds(start),
        endTime: timeToSeconds(end),
        text,
      });
    }
  }

  return cues;
}

export function generateVtt(cues: SubtitleCue[]): string {
  const lines = ['WEBVTT', ''];
  for (const cue of cues) {
    lines.push(`${secondsToTime(cue.startTime)} --> ${secondsToTime(cue.endTime)}`);
    lines.push(cue.text);
    lines.push('');
  }
  return lines.join('\n');
}
