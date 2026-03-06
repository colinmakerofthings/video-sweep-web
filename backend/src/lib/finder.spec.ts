import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { findFiles } from './finder';

describe('findFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finder-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('partitions video and non-video files', () => {
    fs.writeFileSync(path.join(tmpDir, 'movie.mkv'), '');
    fs.writeFileSync(path.join(tmpDir, 'readme.txt'), '');

    const result = findFiles(tmpDir);
    expect(result.videos).toHaveLength(1);
    expect(result.nonVideos).toHaveLength(1);
    expect(result.videos[0]).toContain('movie.mkv');
    expect(result.nonVideos[0]).toContain('readme.txt');
  });

  it('recognises all supported video extensions', () => {
    for (const ext of ['.mp4', '.mkv', '.avi', '.m4v']) {
      fs.writeFileSync(path.join(tmpDir, `file${ext}`), '');
    }

    const result = findFiles(tmpDir);
    expect(result.videos).toHaveLength(4);
    expect(result.nonVideos).toHaveLength(0);
  });

  it('recurses into subdirectories', () => {
    const sub = path.join(tmpDir, 'subdir');
    fs.mkdirSync(sub);
    fs.writeFileSync(path.join(sub, 'nested.mp4'), '');

    const result = findFiles(tmpDir);
    expect(result.videos).toHaveLength(1);
    expect(result.videos[0]).toContain('nested.mp4');
  });

  it('skips files starting with ._', () => {
    fs.writeFileSync(path.join(tmpDir, '._hidden.mkv'), '');
    fs.writeFileSync(path.join(tmpDir, 'visible.mkv'), '');

    const result = findFiles(tmpDir);
    expect(result.videos).toHaveLength(1);
    expect(result.videos[0]).toContain('visible.mkv');
  });

  it('returns empty arrays for an empty directory', () => {
    const result = findFiles(tmpDir);
    expect(result.videos).toHaveLength(0);
    expect(result.nonVideos).toHaveLength(0);
  });

  it('treats unknown extensions as non-video', () => {
    fs.writeFileSync(path.join(tmpDir, 'doc.pdf'), '');
    fs.writeFileSync(path.join(tmpDir, 'image.jpg'), '');

    const result = findFiles(tmpDir);
    expect(result.videos).toHaveLength(0);
    expect(result.nonVideos).toHaveLength(2);
  });
});
