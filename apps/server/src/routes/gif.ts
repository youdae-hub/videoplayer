import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile, spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const gifRouter = Router();

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

gifRouter.post('/from-url', async (req, res) => {
  const { url, start, end, width: rawWidth } = req.body;

  if (!url || start === undefined || start === null || end === undefined || end === null) {
    res.status(400).json({ error: 'url, start, and end are required' });
    return;
  }

  const startNum = Number(start);
  const endNum = Number(end);

  if (isNaN(startNum) || isNaN(endNum)) {
    res.status(400).json({ error: 'url, start, and end are required' });
    return;
  }

  if (startNum >= endNum) {
    res.status(400).json({ error: 'start must be less than end' });
    return;
  }

  if (endNum - startNum > 30) {
    res.status(400).json({ error: 'GIF duration must not exceed 30 seconds' });
    return;
  }

  if (!isValidUrl(url)) {
    res.status(400).json({ error: 'Invalid URL format' });
    return;
  }

  const gifWidth = Number(rawWidth) || 480;
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `ytgif-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`);

  const cleanup = () => {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  };

  try {
    await new Promise<void>((resolve, reject) => {
      const sectionArg = `*${startNum}-${endNum}`;
      execFile('yt-dlp', [
        '--download-sections', sectionArg,
        '--force-keyframes-at-cuts',
        '-f', 'mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--no-playlist',
        '-o', tmpFile,
        url,
      ], { timeout: 120000, env: { ...process.env, PATH: `${process.env.PATH}:/usr/local/bin` } }, (err, _stdout, stderr) => {
        if (err) {
          reject(new Error(stderr || err.message));
        } else {
          resolve();
        }
      });
    });

    if (!fs.existsSync(tmpFile)) {
      res.status(500).json({ error: 'Failed to download video segment' });
      return;
    }

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Content-Disposition', 'attachment; filename="clip.gif"');

    const ffmpeg = spawn('ffmpeg', [
      '-i', tmpFile,
      '-vf', `fps=15,scale=${gifWidth}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
      '-f', 'gif',
      'pipe:1',
    ], { stdio: ['ignore', 'pipe', 'ignore'] });

    ffmpeg.stdout.pipe(res);

    ffmpeg.on('error', () => {
      cleanup();
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create GIF' });
      }
    });

    ffmpeg.on('close', (code) => {
      cleanup();
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: 'GIF creation failed' });
      }
    });

    res.on('close', () => {
      ffmpeg.kill();
      cleanup();
    });
  } catch (err: any) {
    cleanup();
    if (!res.headersSent) {
      res.status(500).json({ error: `Download failed: ${err.message}` });
    }
  }
});
