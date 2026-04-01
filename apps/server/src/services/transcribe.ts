import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../db.js';
import { getLanguageLabel } from './languages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.join(__dirname, '..', '..', 'scripts');
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

export interface TranscribeResult {
  language: string;
  segments: number;
  output: string;
}

export function startTranscription(
  videoId: string,
  videoFileName: string,
  model: string = 'base',
): void {
  const videoPath = path.join(UPLOADS_DIR, 'videos', videoFileName);
  const vttFileName = `${path.parse(videoFileName).name}.vtt`;
  const vttPath = path.join(UPLOADS_DIR, 'subtitles', vttFileName);
  const scriptPath = path.join(SCRIPTS_DIR, 'transcribe.py');

  const process = spawn('python3', [scriptPath, videoPath, vttPath, '--model', model], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';

  process.stdout.on('data', (data: Buffer) => {
    stdout += data.toString();
  });

  process.stderr.on('data', (data: Buffer) => {
    stderr += data.toString();
  });

  process.on('close', async (code) => {
    if (code === 0) {
      const resultLine = stdout.split('\n').find((l) => l.startsWith('RESULT:'));
      let language = 'auto';

      if (resultLine) {
        const match = resultLine.match(/language=(\w+)/);
        if (match) language = match[1];
      }

      const subtitleSrc = `/uploads/subtitles/${vttFileName}`;
      const label = getLanguageLabel(language);

      await prisma.subtitle.create({
        data: {
          label,
          language,
          src: subtitleSrc,
          videoId,
        },
      });

      await prisma.video.update({
        where: { id: videoId },
        data: { subtitleStatus: 'completed' },
      });

      console.log(`Transcription completed for video ${videoId}: ${language}`);
    } else {
      await prisma.video.update({
        where: { id: videoId },
        data: { subtitleStatus: 'failed' },
      });

      console.error(`Transcription failed for video ${videoId}:`, stderr);
    }
  });

  process.on('error', async (err) => {
    await prisma.video.update({
      where: { id: videoId },
      data: { subtitleStatus: 'failed' },
    });

    console.error(`Failed to start transcription for video ${videoId}:`, err.message);
  });
}

