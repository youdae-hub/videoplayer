import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { prisma } from '../db.js';

vi.mock('../services/transcribe.js', () => ({
  startTranscription: vi.fn(),
}));

vi.mock('../services/translate.js', () => ({
  startTranslation: vi.fn(),
}));

import { startTranscription } from '../services/transcribe.js';
import { startTranslation } from '../services/translate.js';

describe('Video API', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await prisma.subtitle.deleteMany();
    await prisma.video.deleteMany();
  });

  describe('GET /api/videos', () => {
    it('returns empty list when no videos', async () => {
      const res = await request(app).get('/api/videos');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.pagination.total).toBe(0);
    });

    it('returns videos with pagination', async () => {
      await prisma.video.createMany({
        data: [
          { title: 'Video 1', videoUrl: '/v1.mp4' },
          { title: 'Video 2', videoUrl: '/v2.mp4' },
          { title: 'Video 3', videoUrl: '/v3.mp4' },
        ],
      });

      const res = await request(app).get('/api/videos?page=1&pageSize=2');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.pagination.total).toBe(3);
      expect(res.body.meta.pagination.pageCount).toBe(2);
    });
  });

  describe('GET /api/videos/:id', () => {
    it('returns a video by id', async () => {
      const video = await prisma.video.create({
        data: { title: 'Test Video', videoUrl: '/test.mp4', duration: 120 },
      });

      const res = await request(app).get(`/api/videos/${video.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Test Video');
      expect(res.body.data.duration).toBe(120);
      expect(res.body.data.subtitles).toEqual([]);
    });

    it('returns 404 for non-existent video', async () => {
      const res = await request(app).get('/api/videos/non-existent-id');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/videos', () => {
    it('creates a new video', async () => {
      const res = await request(app).post('/api/videos').send({
        title: 'New Video',
        description: 'A new video',
        duration: 60,
        videoUrl: '/new.mp4',
        thumbnailUrl: '/thumb.jpg',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('New Video');
      expect(res.body.data.description).toBe('A new video');
      expect(res.body.data.subtitleStatus).toBe('none');
      expect(startTranscription).not.toHaveBeenCalled();
    });

    it('creates video with defaults for optional fields', async () => {
      const res = await request(app).post('/api/videos').send({
        title: 'Minimal Video',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.description).toBe('');
      expect(res.body.data.duration).toBe(0);
      expect(res.body.data.videoUrl).toBe('');
    });

    it('triggers transcription for uploaded video files', async () => {
      const res = await request(app).post('/api/videos').send({
        title: 'Uploaded Video',
        videoUrl: '/uploads/videos/abc123.mp4',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.subtitleStatus).toBe('processing');
      expect(startTranscription).toHaveBeenCalledWith(
        res.body.data.id,
        'abc123.mp4',
      );
    });
  });

  describe('PUT /api/videos/:id', () => {
    it('updates a video', async () => {
      const video = await prisma.video.create({
        data: { title: 'Old Title', videoUrl: '/old.mp4' },
      });

      const res = await request(app).put(`/api/videos/${video.id}`).send({
        title: 'Updated Title',
        description: 'Updated description',
        duration: 90,
        videoUrl: '/updated.mp4',
        thumbnailUrl: '/updated-thumb.jpg',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/videos/:id', () => {
    it('deletes a video and its subtitles', async () => {
      const video = await prisma.video.create({
        data: {
          title: 'To Delete',
          subtitles: {
            create: { label: 'Korean', language: 'ko', src: '/ko.vtt' },
          },
        },
      });

      const res = await request(app).delete(`/api/videos/${video.id}`);

      expect(res.status).toBe(204);

      const deleted = await prisma.video.findUnique({ where: { id: video.id } });
      expect(deleted).toBeNull();

      const subtitles = await prisma.subtitle.findMany({ where: { videoId: video.id } });
      expect(subtitles).toHaveLength(0);
    });
  });

  describe('POST /api/videos/:id/transcribe', () => {
    it('starts transcription for existing video', async () => {
      const video = await prisma.video.create({
        data: { title: 'To Transcribe', videoUrl: '/uploads/videos/test.mp4' },
      });

      const res = await request(app).post(`/api/videos/${video.id}/transcribe`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('processing');
      expect(startTranscription).toHaveBeenCalledWith(video.id, 'test.mp4');

      const updated = await prisma.video.findUnique({ where: { id: video.id } });
      expect(updated?.subtitleStatus).toBe('processing');
    });

    it('returns 404 for non-existent video', async () => {
      const res = await request(app).post('/api/videos/non-existent/transcribe');

      expect(res.status).toBe(404);
    });

    it('returns 400 for video without uploaded file', async () => {
      const video = await prisma.video.create({
        data: { title: 'URL Video', videoUrl: 'https://example.com/v.mp4' },
      });

      const res = await request(app).post(`/api/videos/${video.id}/transcribe`);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/videos/:id/translate', () => {
    it('starts translation for video with subtitles', async () => {
      const video = await prisma.video.create({
        data: {
          title: 'To Translate',
          videoUrl: '/uploads/videos/test.mp4',
          subtitleStatus: 'completed',
          subtitles: {
            create: { label: 'English', language: 'en', src: '/uploads/subtitles/test.vtt' },
          },
        },
      });

      const res = await request(app)
        .post(`/api/videos/${video.id}/translate`)
        .send({ targetLanguage: 'ko' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('translating');
      expect(res.body.data.from).toBe('en');
      expect(res.body.data.to).toBe('ko');
      expect(startTranslation).toHaveBeenCalledWith(video.id, 'test.vtt', 'en', 'ko');

      const updated = await prisma.video.findUnique({ where: { id: video.id } });
      expect(updated?.subtitleStatus).toBe('processing');
    });

    it('returns 400 for unsupported language', async () => {
      const video = await prisma.video.create({
        data: { title: 'Video', videoUrl: '/v.mp4' },
      });

      const res = await request(app)
        .post(`/api/videos/${video.id}/translate`)
        .send({ targetLanguage: 'xx' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for video without subtitles', async () => {
      const video = await prisma.video.create({
        data: { title: 'No Subs', videoUrl: '/v.mp4' },
      });

      const res = await request(app)
        .post(`/api/videos/${video.id}/translate`)
        .send({ targetLanguage: 'ko' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/videos/meta/languages', () => {
    it('returns supported languages list', async () => {
      const res = await request(app).get('/api/videos/meta/languages');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(4);
      expect(res.body.data[0].code).toBe('ko');
      expect(res.body.data[1].code).toBe('en');
    });
  });
});

describe('Health API', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
