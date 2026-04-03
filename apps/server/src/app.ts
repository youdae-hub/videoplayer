import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { videoRouter } from './routes/video.js';
import { uploadRouter } from './routes/upload.js';
import { subtitleRouter } from './routes/subtitle.js';
import { gifRouter } from './routes/gif.js';
import { youtubeRouter } from './routes/youtube.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/videos', videoRouter);
app.use('/api/subtitles', subtitleRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/gif', gifRouter);
app.use('/api/youtube', youtubeRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
