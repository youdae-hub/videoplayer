import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../app.js';
import { prisma } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsSubtitles = path.join(__dirname, '..', '..', 'uploads', 'subtitles');

const sampleVtt = `WEBVTT

00:00:01.000 --> 00:00:05.000
Hello world.

00:00:06.000 --> 00:00:10.000
Second line.
`;

describe('Subtitle API', () => {
  let testFile: string;

  beforeEach(async () => {
    await prisma.subtitle.deleteMany();
    await prisma.video.deleteMany();
    testFile = path.join(uploadsSubtitles, 'test-edit.vtt');
    await fs.mkdir(uploadsSubtitles, { recursive: true });
    await fs.writeFile(testFile, sampleVtt, 'utf-8');
  });

  afterEach(async () => {
    try { await fs.unlink(testFile); } catch { /* ignore */ }
  });

  describe('GET /api/subtitles/:id/cues', () => {
    it('returns parsed cues for a subtitle', async () => {
      const video = await prisma.video.create({
        data: {
          title: 'Test',
          subtitles: {
            create: { label: 'English', language: 'en', src: '/uploads/subtitles/test-edit.vtt' },
          },
        },
        include: { subtitles: true },
      });

      const res = await request(app).get(`/api/subtitles/${video.subtitles[0].id}/cues`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toEqual({ startTime: 1, endTime: 5, text: 'Hello world.' });
      expect(res.body.data[1]).toEqual({ startTime: 6, endTime: 10, text: 'Second line.' });
    });

    it('returns 404 for non-existent subtitle', async () => {
      const res = await request(app).get('/api/subtitles/non-existent/cues');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/subtitles/:id/cues', () => {
    it('updates subtitle file with new cues', async () => {
      const video = await prisma.video.create({
        data: {
          title: 'Test',
          subtitles: {
            create: { label: 'English', language: 'en', src: '/uploads/subtitles/test-edit.vtt' },
          },
        },
        include: { subtitles: true },
      });

      const newCues = [
        { startTime: 0, endTime: 3, text: 'Updated first.' },
        { startTime: 4, endTime: 8, text: 'Updated second.' },
        { startTime: 9, endTime: 12, text: 'New third.' },
      ];

      const res = await request(app)
        .put(`/api/subtitles/${video.subtitles[0].id}/cues`)
        .send({ cues: newCues });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);

      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toContain('Updated first.');
      expect(content).toContain('New third.');
    });

    it('returns 404 for non-existent subtitle', async () => {
      const res = await request(app)
        .put('/api/subtitles/non-existent/cues')
        .send({ cues: [] });
      expect(res.status).toBe(404);
    });

    it('returns 400 when cues is not an array', async () => {
      const video = await prisma.video.create({
        data: {
          title: 'Test',
          subtitles: {
            create: { label: 'English', language: 'en', src: '/uploads/subtitles/test-edit.vtt' },
          },
        },
        include: { subtitles: true },
      });

      const res = await request(app)
        .put(`/api/subtitles/${video.subtitles[0].id}/cues`)
        .send({ cues: 'not an array' });
      expect(res.status).toBe(400);
    });
  });
});
