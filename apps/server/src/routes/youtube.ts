import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile, spawn } from 'child_process';

export const youtubeRouter = Router();

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function ytdlpEnv() {
  const env = { ...process.env, PATH: `${process.env.PATH}:/usr/local/bin:/opt/homebrew/bin` };
  delete env.http_proxy;
  delete env.https_proxy;
  delete env.HTTP_PROXY;
  delete env.HTTPS_PROXY;
  return env;
}

function formatYtdlpError(msg: string): string {
  if (msg.includes('ENOENT')) {
    return 'yt-dlp가 설치되어 있지 않습니다. 서버에 yt-dlp를 설치해 주세요.';
  }
  if (msg.includes('proxy') || msg.includes('Proxy') || msg.includes('Tunnel')) {
    return 'YouTube에 연결할 수 없습니다. 네트워크 또는 프록시 설정을 확인해 주세요.';
  }
  if (msg.includes('Video unavailable') || msg.includes('not available')) {
    return '해당 영상을 찾을 수 없거나 비공개 영상입니다.';
  }
  return '동영상 다운로드에 실패했습니다.';
}

// ──── GIF extraction ────

youtubeRouter.post('/gif', async (req, res) => {
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
      ], { timeout: 120000, env: ytdlpEnv() }, (err, _stdout, stderr) => {
        if (err) reject(new Error(stderr || err.message));
        else resolve();
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
      if (!res.headersSent) res.status(500).json({ error: 'Failed to create GIF' });
    });

    ffmpeg.on('close', (code) => {
      cleanup();
      if (code !== 0 && !res.headersSent) res.status(500).json({ error: 'GIF creation failed' });
    });

    res.on('close', () => { ffmpeg.kill(); cleanup(); });
  } catch (err: any) {
    cleanup();
    if (!res.headersSent) {
      res.status(500).json({ error: formatYtdlpError(err.message || '') });
    }
  }
});

// ──── Video download ────

youtubeRouter.post('/download', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  if (!isValidUrl(url)) {
    res.status(400).json({ error: 'Invalid URL format' });
    return;
  }

  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `ytvid-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`);

  const cleanup = () => {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  };

  try {
    // Get title first
    const title = await new Promise<string>((resolve, reject) => {
      execFile('yt-dlp', [
        '--print', 'title',
        '--no-playlist',
        url,
      ], { timeout: 30000, env: ytdlpEnv() }, (err, stdout, stderr) => {
        if (err) reject(new Error(stderr || err.message));
        else resolve(stdout.trim() || 'video');
      });
    });

    // Download
    await new Promise<void>((resolve, reject) => {
      execFile('yt-dlp', [
        '-f', 'mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--no-playlist',
        '-o', tmpFile,
        url,
      ], { timeout: 300000, env: ytdlpEnv() }, (err, _stdout, stderr) => {
        if (err) reject(new Error(stderr || err.message));
        else resolve();
      });
    });

    if (!fs.existsSync(tmpFile)) {
      res.status(500).json({ error: 'Failed to download video' });
      return;
    }

    const safeTitle = title.replace(/[^a-zA-Z0-9가-힣\s_-]/g, '').trim() || 'video';
    const stat = fs.statSync(tmpFile);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.mp4"`);

    const stream = fs.createReadStream(tmpFile);
    stream.pipe(res);
    stream.on('end', cleanup);
    stream.on('error', () => {
      cleanup();
      if (!res.headersSent) res.status(500).json({ error: 'Failed to send video' });
    });
    res.on('close', cleanup);
  } catch (err: any) {
    cleanup();
    if (!res.headersSent) {
      res.status(500).json({ error: formatYtdlpError(err.message || '') });
    }
  }
});

// ──── Subtitle list ────

youtubeRouter.post('/subtitles', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  if (!isValidUrl(url)) {
    res.status(400).json({ error: 'Invalid URL format' });
    return;
  }

  try {
    const output = await new Promise<string>((resolve, reject) => {
      execFile('yt-dlp', [
        '--list-subs',
        '--no-playlist',
        '--skip-download',
        url,
      ], { timeout: 30000, env: ytdlpEnv() }, (err, stdout, stderr) => {
        if (err) reject(new Error(stderr || err.message));
        else resolve(stdout);
      });
    });

    const subtitles: { code: string; label: string }[] = [];
    let inManualSection = false;

    for (const line of output.split('\n')) {
      if (line.includes('Available subtitles')) {
        inManualSection = true;
        continue;
      }
      if (line.includes('Available automatic captions')) {
        inManualSection = false;
        continue;
      }
      if (!inManualSection) continue;
      if (line.startsWith('Language') || line.startsWith('---') || line.trim() === '') continue;

      const match = line.match(/^(\S+)\s+(.+)/);
      if (match) {
        const code = match[1];
        const label = match[2].split(/\s{2,}/)[0].trim();
        if (!subtitles.find((s) => s.code === code)) {
          subtitles.push({ code, label });
        }
      }
    }

    res.json({ data: subtitles });
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: formatYtdlpError(err.message || '') });
    }
  }
});

// ──── Subtitle download ────

youtubeRouter.post('/subtitles/download', async (req, res) => {
  const { url, lang } = req.body;

  if (!url || !lang) {
    res.status(400).json({ error: 'url and lang are required' });
    return;
  }

  if (!isValidUrl(url)) {
    res.status(400).json({ error: 'Invalid URL format' });
    return;
  }

  const tmpDir = os.tmpdir();
  const tmpBase = path.join(tmpDir, `ytsub-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const cleanup = () => {
    const patterns = ['.vtt', `.${lang}.vtt`, `.${lang}.srt`];
    for (const ext of patterns) {
      try { fs.unlinkSync(tmpBase + ext); } catch { /* ignore */ }
    }
  };

  try {
    await new Promise<void>((resolve, reject) => {
      execFile('yt-dlp', [
        '--write-sub',
        '--sub-lang', lang,
        '--sub-format', 'vtt',
        '--convert-subs', 'vtt',
        '--skip-download',
        '--no-playlist',
        '-o', tmpBase,
        url,
      ], { timeout: 60000, env: ytdlpEnv() }, (err, _stdout, stderr) => {
        if (err) reject(new Error(stderr || err.message));
        else resolve();
      });
    });

    // Find the generated subtitle file
    const dir = path.dirname(tmpBase);
    const base = path.basename(tmpBase);
    const files = fs.readdirSync(dir).filter((f) => f.startsWith(base) && f.endsWith('.vtt'));

    if (files.length === 0) {
      res.status(404).json({ error: '해당 언어의 자막을 찾을 수 없습니다.' });
      return;
    }

    const subFile = path.join(dir, files[0]);
    const stat = fs.statSync(subFile);
    res.setHeader('Content-Type', 'text/vtt');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${lang}.vtt"`);

    const stream = fs.createReadStream(subFile);
    stream.pipe(res);
    stream.on('end', () => {
      try { fs.unlinkSync(subFile); } catch { /* ignore */ }
    });
    stream.on('error', () => {
      try { fs.unlinkSync(subFile); } catch { /* ignore */ }
      if (!res.headersSent) res.status(500).json({ error: 'Failed to send subtitle' });
    });
    res.on('close', () => {
      try { fs.unlinkSync(subFile); } catch { /* ignore */ }
    });
  } catch (err: any) {
    cleanup();
    if (!res.headersSent) {
      res.status(500).json({ error: formatYtdlpError(err.message || '') });
    }
  }
});
