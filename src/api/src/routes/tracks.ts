import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { logger } from '../logger.js';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  filename: string;
}

const AUDIO_DIR = path.resolve(
  process.env.AUDIO_DIR || path.join(__dirname, '../../data/audio')
);

const tracks: Track[] = [
  {
    id: '1',
    title: 'SoundHelix Song 1',
    artist: 'T. Schürger',
    duration: 370,
    bitrate: 192,
    sampleRate: 44100,
    channels: 2,
    filename: 'sample1.mp3',
  },
  {
    id: '2',
    title: 'SoundHelix Song 2',
    artist: 'T. Schürger',
    duration: 342,
    bitrate: 192,
    sampleRate: 44100,
    channels: 2,
    filename: 'sample2.mp3',
  },
  {
    id: '3',
    title: 'SoundHelix Song 3',
    artist: 'T. Schürger',
    duration: 275,
    bitrate: 192,
    sampleRate: 44100,
    channels: 2,
    filename: 'sample3.mp3',
  },
];

export function mapTrackEndpoints(app: { use: (path: string, router: Router) => void }): void {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(tracks.map(({ filename, ...t }) => t));
  });

  router.get('/:id', (req, res) => {
    const track = tracks.find((t) => t.id === req.params.id);
    if (!track) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }
    const { filename, ...meta } = track;
    res.json(meta);
  });

  router.get('/:id/stream', (req, res) => {
    const track = tracks.find((t) => t.id === req.params.id);
    if (!track) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }

    const filePath = path.join(AUDIO_DIR, track.filename);

    if (!fs.existsSync(filePath)) {
      logger.error({ filePath }, 'Audio file not found on disk');
      res.status(404).json({ error: 'Audio file not found' });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
        return;
      }

      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });

      res.status(206).set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': 'audio/mpeg',
      });

      stream.pipe(res);
    } else {
      res.set({
        'Content-Length': String(fileSize),
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
      });

      fs.createReadStream(filePath).pipe(res);
    }
  });

  app.use('/api/tracks', router);
}
