import * as fs from 'fs';
import * as path from 'path';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.m4v']);

export interface FindResult {
  videos: string[];
  nonVideos: string[];
}

export function findFiles(sourceDir: string): FindResult {
  const videos: string[] = [];
  const nonVideos: string[] = [];

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        if (entry.name.startsWith('._')) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (VIDEO_EXTENSIONS.has(ext)) {
          videos.push(fullPath);
        } else {
          nonVideos.push(fullPath);
        }
      }
    }
  }

  walk(sourceDir);
  return { videos, nonVideos };
}
