import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import statusRouter from './status';

vi.mock('../lib/finder', () => ({
  findFiles: vi.fn(),
}));

import { findFiles } from '../lib/finder';
const mockFindFiles = vi.mocked(findFiles);

function makeApp() {
  const app = express();
  app.use('/api/status', statusRouter);
  return app;
}

describe('GET /api/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the count of video files', async () => {
    mockFindFiles.mockReturnValue({
      videos: ['/src/a.mkv', '/src/b.mp4', '/src/c.avi'],
      nonVideos: ['/src/readme.txt'],
    });

    const res = await request(makeApp()).get('/api/status');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 3 });
  });

  it('returns count 0 when source directory is empty', async () => {
    mockFindFiles.mockReturnValue({ videos: [], nonVideos: [] });

    const res = await request(makeApp()).get('/api/status');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 0 });
  });

  it('excludes non-video files from the count', async () => {
    mockFindFiles.mockReturnValue({
      videos: ['/src/movie.mkv'],
      nonVideos: ['/src/cover.jpg', '/src/nfo.txt'],
    });

    const res = await request(makeApp()).get('/api/status');

    expect(res.body).toEqual({ count: 1 });
  });
});
