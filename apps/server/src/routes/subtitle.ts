import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { prisma } from '../db.js';
import { parseVtt, generateVtt } from '../services/vttParser.js';
import type { SubtitleCue } from '../services/vttParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

export const subtitleRouter = Router();

subtitleRouter.get('/:id/cues', async (req, res) => {
  const subtitle = await prisma.subtitle.findUnique({ where: { id: req.params.id } });

  if (!subtitle) {
    res.status(404).json({ error: 'Subtitle not found' });
    return;
  }

  const filePath = path.join(uploadsDir, '..', subtitle.src);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const cues = parseVtt(content);
    res.json({ data: cues });
  } catch {
    res.status(404).json({ error: 'Subtitle file not found' });
  }
});

subtitleRouter.put('/:id/cues', async (req, res) => {
  const subtitle = await prisma.subtitle.findUnique({ where: { id: req.params.id } });

  if (!subtitle) {
    res.status(404).json({ error: 'Subtitle not found' });
    return;
  }

  const cues: SubtitleCue[] = req.body.cues;
  if (!Array.isArray(cues)) {
    res.status(400).json({ error: 'cues must be an array' });
    return;
  }

  const filePath = path.join(uploadsDir, '..', subtitle.src);
  try {
    const vttContent = generateVtt(cues);
    await fs.writeFile(filePath, vttContent, 'utf-8');
    res.json({ data: cues });
  } catch {
    res.status(500).json({ error: 'Failed to write subtitle file' });
  }
});
