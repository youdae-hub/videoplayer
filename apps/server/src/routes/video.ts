import { Router } from 'express';
import { prisma } from '../db.js';

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

  const video = await prisma.video.create({
    data: {
      title,
      description: description || '',
      duration: duration || 0,
      videoUrl: videoUrl || '',
      thumbnailUrl: thumbnailUrl || '',
    },
    include: { subtitles: true },
  });

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
