import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { prisma } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { startTranscription } from '../services/transcribe.js';
import { startTranslation } from '../services/translate.js';
import { SUPPORTED_LANGUAGES, isSupported } from '../services/languages.js';

export const videoRouter = Router();

videoRouter.get('/', async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 12;
  const skip = (page - 1) * pageSize;

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { subtitles: true },
    }),
    prisma.video.count(),
  ]);

  res.json({
    data: videos,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total,
      },
    },
  });
});

videoRouter.get('/meta/languages', async (_req, res) => {
  res.json({ data: SUPPORTED_LANGUAGES });
});

videoRouter.get('/:id/audio', async (req, res) => {
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });

  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  if (!video.videoUrl || !video.videoUrl.startsWith('/uploads/videos/')) {
    res.status(400).json({ error: 'No uploaded video file to extract audio from' });
    return;
  }

  const videoPath = path.join(__dirname, '..', '..', video.videoUrl);
  if (!fs.existsSync(videoPath)) {
    res.status(404).json({ error: 'Video file not found on disk' });
    return;
  }

  const safeTitle = video.title.replace(/[^a-zA-Z0-9가-힣\s_-]/g, '').trim() || 'audio';
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.mp3"`);

  const ffmpeg = spawn('ffmpeg', [
    '-i', videoPath,
    '-vn',
    '-codec:a', 'libmp3lame',
    '-q:a', '2',
    '-f', 'mp3',
    'pipe:1',
  ], { stdio: ['ignore', 'pipe', 'ignore'] });

  ffmpeg.stdout.pipe(res);

  ffmpeg.on('error', () => {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to extract audio' });
    }
  });

  ffmpeg.on('close', (code) => {
    if (code !== 0 && !res.headersSent) {
      res.status(500).json({ error: 'Audio extraction failed' });
    }
  });

  res.on('close', () => {
    ffmpeg.kill();
  });
});

videoRouter.get('/:id/gif', async (req, res) => {
  const start = parseFloat(req.query.start as string);
  const end = parseFloat(req.query.end as string);

  if (isNaN(start) || isNaN(end)) {
    res.status(400).json({ error: 'start and end query parameters are required' });
    return;
  }

  if (start >= end) {
    res.status(400).json({ error: 'start must be less than end' });
    return;
  }

  if (end - start > 30) {
    res.status(400).json({ error: 'GIF duration must not exceed 30 seconds' });
    return;
  }

  const video = await prisma.video.findUnique({ where: { id: req.params.id } });

  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  if (!video.videoUrl || !video.videoUrl.startsWith('/uploads/videos/')) {
    res.status(400).json({ error: 'No uploaded video file to extract GIF from' });
    return;
  }

  const videoPath = path.join(__dirname, '..', '..', video.videoUrl);
  if (!fs.existsSync(videoPath)) {
    res.status(404).json({ error: 'Video file not found on disk' });
    return;
  }

  const width = Number(req.query.width) || 480;
  const safeTitle = video.title.replace(/[^a-zA-Z0-9가-힣\s_-]/g, '').trim() || 'clip';
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.gif"`);

  const ffmpeg = spawn('ffmpeg', [
    '-ss', String(start),
    '-to', String(end),
    '-i', videoPath,
    '-vf', `fps=15,scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
    '-f', 'gif',
    'pipe:1',
  ], { stdio: ['ignore', 'pipe', 'ignore'] });

  ffmpeg.stdout.pipe(res);

  ffmpeg.on('error', () => {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create GIF' });
    }
  });

  ffmpeg.on('close', (code) => {
    if (code !== 0 && !res.headersSent) {
      res.status(500).json({ error: 'GIF creation failed' });
    }
  });

  res.on('close', () => {
    ffmpeg.kill();
  });
});

videoRouter.get('/:id', async (req, res) => {
  const video = await prisma.video.findUnique({
    where: { id: req.params.id },
    include: { subtitles: true },
  });

  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  res.json({ data: video });
});

videoRouter.post('/', async (req, res) => {
  const { title, description, duration, videoUrl, thumbnailUrl } = req.body;

  const hasUploadedVideo = videoUrl && videoUrl.startsWith('/uploads/videos/');

  const video = await prisma.video.create({
    data: {
      title,
      description: description || '',
      duration: duration || 0,
      videoUrl: videoUrl || '',
      thumbnailUrl: thumbnailUrl || '',
      subtitleStatus: hasUploadedVideo ? 'processing' : 'none',
    },
    include: { subtitles: true },
  });

  if (hasUploadedVideo) {
    const videoFileName = path.basename(videoUrl);
    startTranscription(video.id, videoFileName);
  }

  res.status(201).json({ data: video });
});

videoRouter.put('/:id', async (req, res) => {
  const { title, description, duration, videoUrl, thumbnailUrl } = req.body;

  const video = await prisma.video.update({
    where: { id: req.params.id },
    data: {
      title,
      description,
      duration,
      videoUrl,
      thumbnailUrl,
    },
    include: { subtitles: true },
  });

  res.json({ data: video });
});

videoRouter.delete('/:id', async (req, res) => {
  await prisma.subtitle.deleteMany({ where: { videoId: req.params.id } });
  await prisma.video.delete({ where: { id: req.params.id } });

  res.status(204).send();
});

videoRouter.post('/:id/transcribe', async (req, res) => {
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });

  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  if (!video.videoUrl || !video.videoUrl.startsWith('/uploads/videos/')) {
    res.status(400).json({ error: 'No uploaded video file to transcribe' });
    return;
  }

  await prisma.subtitle.deleteMany({ where: { videoId: video.id } });

  await prisma.video.update({
    where: { id: video.id },
    data: { subtitleStatus: 'processing' },
  });

  const videoFileName = path.basename(video.videoUrl);
  startTranscription(video.id, videoFileName);

  res.json({ data: { status: 'processing' } });
});

videoRouter.post('/:id/translate', async (req, res) => {
  const { targetLanguage } = req.body;

  if (!targetLanguage || !isSupported(targetLanguage)) {
    res.status(400).json({
      error: `Unsupported language. Supported: ${SUPPORTED_LANGUAGES.map((l) => l.code).join(', ')}`,
    });
    return;
  }

  const video = await prisma.video.findUnique({
    where: { id: req.params.id },
    include: { subtitles: true },
  });

  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  if (video.subtitles.length === 0) {
    res.status(400).json({ error: 'No source subtitle to translate from' });
    return;
  }

  const existing = video.subtitles.find((s) => s.language === targetLanguage);
  if (existing) {
    await prisma.subtitle.delete({ where: { id: existing.id } });
  }

  await prisma.video.update({
    where: { id: video.id },
    data: { subtitleStatus: 'processing' },
  });

  const sourceSubtitle = video.subtitles[0];
  const sourceFileName = path.basename(sourceSubtitle.src);

  startTranslation(video.id, sourceFileName, sourceSubtitle.language, targetLanguage);

  res.json({ data: { status: 'translating', from: sourceSubtitle.language, to: targetLanguage } });
});
