import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Tracks API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  describe('GET /api/tracks', () => {
    it('should return a list of tracks', async () => {
      const res = await request(app).get('/api/tracks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should include track metadata without filename', async () => {
      const res = await request(app).get('/api/tracks');
      const track = res.body[0];
      expect(track).toHaveProperty('id');
      expect(track).toHaveProperty('title');
      expect(track).toHaveProperty('artist');
      expect(track).toHaveProperty('duration');
      expect(track).toHaveProperty('bitrate');
      expect(track).toHaveProperty('sampleRate');
      expect(track).toHaveProperty('channels');
      expect(track).not.toHaveProperty('filename');
    });
  });

  describe('GET /api/tracks/:id', () => {
    it('should return a single track by id', async () => {
      const res = await request(app).get('/api/tracks/1');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('1');
      expect(res.body.title).toBeDefined();
    });

    it('should return 404 for unknown track id', async () => {
      const res = await request(app).get('/api/tracks/999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Track not found');
    });
  });

  describe('GET /api/tracks/:id/stream', () => {
    it('should stream audio for a valid track', async () => {
      const res = await request(app).get('/api/tracks/1/stream');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('audio/mpeg');
      expect(res.headers['accept-ranges']).toBe('bytes');
      expect(parseInt(res.headers['content-length'])).toBeGreaterThan(0);
    });

    it('should support range requests', async () => {
      const res = await request(app)
        .get('/api/tracks/1/stream')
        .set('Range', 'bytes=0-1023');
      expect(res.status).toBe(206);
      expect(res.headers['content-range']).toMatch(/^bytes 0-1023\//);
      expect(res.headers['content-type']).toBe('audio/mpeg');
    });

    it('should return 404 for unknown track stream', async () => {
      const res = await request(app).get('/api/tracks/999/stream');
      expect(res.status).toBe(404);
    });
  });
});
