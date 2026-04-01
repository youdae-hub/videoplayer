import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination(_req, file, cb) {
    if (file.mimetype.startsWith('video/')) {
      cb(null, path.join(uploadsDir, 'videos'));
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, path.join(uploadsDir, 'thumbnails'));
    } else {
      cb(null, path.join(uploadsDir, 'subtitles'));
    }
  },
  filename(_req, file, cb) {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
});

export const uploadRouter = Router();

uploadRouter.post('/', upload.array('files', 10), (req, res) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded' });
    return;
  }

  const result = files.map((file) => {
    const subDir = file.mimetype.startsWith('video/')
      ? 'videos'
      : file.mimetype.startsWith('image/')
        ? 'thumbnails'
        : 'subtitles';

    return {
      id: crypto.randomUUID(),
      url: `/uploads/${subDir}/${file.filename}`,
      name: file.originalname,
      size: file.size,
      mime: file.mimetype,
    };
  });

  res.status(201).json(result);
});
