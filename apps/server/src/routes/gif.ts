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
      const env = { ...process.env, PATH: `${process.env.PATH}:/usr/local/bin` };
      delete env.http_proxy;
      delete env.https_proxy;
      delete env.HTTP_PROXY;
      delete env.HTTPS_PROXY;

      execFile('/usr/local/bin/yt-dlp', [
        '--download-sections', sectionArg,
        '--force-keyframes-at-cuts',
        '-f', 'mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--no-playlist',
        '-o', tmpFile,
        url,
      ], { timeout: 120000, env }, (err, _stdout, stderr) => {
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
      const msg = err.message || '';
      let userError = '동영상 다운로드에 실패했습니다.';
      if (msg.includes('ENOENT')) {
        userError = 'yt-dlp가 설치되어 있지 않습니다. 서버에 yt-dlp를 설치해 주세요.';
      } else if (msg.includes('proxy') || msg.includes('Proxy') || msg.includes('Tunnel')) {
        userError = 'YouTube에 연결할 수 없습니다. 네트워크 또는 프록시 설정을 확인해 주세요.';
      } else if (msg.includes('Video unavailable') || msg.includes('not available')) {
        userError = '해당 영상을 찾을 수 없거나 비공개 영상입니다.';
      }
      res.status(500).json({ error: userError });
    }
  }
});
