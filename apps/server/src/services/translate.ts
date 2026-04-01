import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../db.js';
import { getLanguageLabel } from './languages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.join(__dirname, '..', '..', 'scripts');
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

export function startTranslation(
  videoId: string,
  sourceVttFileName: string,
  fromLang: string,
  toLang: string,
): void {
  const inputPath = path.join(UPLOADS_DIR, 'subtitles', sourceVttFileName);
  const outputFileName = `${path.parse(sourceVttFileName).name}_${toLang}.vtt`;
  const outputPath = path.join(UPLOADS_DIR, 'subtitles', outputFileName);
  const scriptPath = path.join(SCRIPTS_DIR, 'translate.py');

  const process = spawn(
    'python3',
    [scriptPath, inputPath, outputPath, '--from', fromLang, '--to', toLang],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

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
      const label = getLanguageLabel(toLang);
      const subtitleSrc = `/uploads/subtitles/${outputFileName}`;

      await prisma.subtitle.create({
        data: {
          label,
          language: toLang,
          src: subtitleSrc,
          videoId,
        },
      });

      await prisma.video.update({
        where: { id: videoId },
        data: { subtitleStatus: 'completed' },
      });

      console.log(`Translation completed for video ${videoId}: ${fromLang} -> ${toLang}`);
    } else {
      await prisma.video.update({
        where: { id: videoId },
        data: { subtitleStatus: 'failed' },
      });

      console.error(`Translation failed for video ${videoId} (${fromLang} -> ${toLang}):`, stderr);
    }
  });

  process.on('error', async (err) => {
    await prisma.video.update({
      where: { id: videoId },
      data: { subtitleStatus: 'failed' },
    });

    console.error(`Failed to start translation for video ${videoId}:`, err.message);
  });
}
