import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ScanRow } from '../lib/types';

const router = Router();

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function removeEmptyDirs(dir: string, stopAt: string): void {
  if (dir === stopAt || !dir.startsWith(stopAt)) return;
  try {
    const entries = fs.readdirSync(dir);
    if (entries.length === 0) {
      fs.rmdirSync(dir);
      removeEmptyDirs(path.dirname(dir), stopAt);
    }
  } catch {
    // If we can't read/remove it, just skip
  }
}

interface ProceedRequest {
  rows: ScanRow[];
  nonVideos?: string[];
  cleanUp?: boolean;
}

interface ProceedResult {
  moved: number;
  deleted: number;
  errors: string[];
}

router.post('/', (req: Request, res: Response) => {
  const { rows, nonVideos = [], cleanUp = false }: ProceedRequest = req.body;

  const result: ProceedResult = { moved: 0, deleted: 0, errors: [] };

  for (const row of rows) {
    try {
      ensureDir(path.dirname(row.targetPath));
      fs.renameSync(row.file, row.targetPath);
      result.moved++;

      // Clean up the source directory chain
      removeEmptyDirs(path.dirname(row.file), process.env.SOURCE_DIR ?? '/media/source');
    } catch (err: unknown) {
      result.errors.push(
        `Move failed: ${row.file} → ${row.targetPath}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  if (cleanUp) {
    for (const nonVideo of nonVideos) {
      try {
        fs.unlinkSync(nonVideo);
        result.deleted++;
        removeEmptyDirs(path.dirname(nonVideo), '/media/source');
      } catch (err: unknown) {
        result.errors.push(
          `Delete failed: ${nonVideo}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  res.json(result);
});

export default router;
