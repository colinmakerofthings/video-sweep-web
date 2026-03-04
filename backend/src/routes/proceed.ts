import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ScanRow } from '../lib/types';

const router = Router();

function moveFile(src: string, dest: string): void {
  try {
    fs.renameSync(src, dest);
  } catch (err: unknown) {
    // Cross-device move (e.g. local drive → network share): fall back to copy + delete
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'EXDEV') {
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
    } else {
      throw err;
    }
  }
}

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
}

interface ProceedResult {
  moved: number;
  deleted: number;
  errors: string[];
  failedFiles: string[];
}

router.post('/', (req: Request, res: Response) => {
  const { rows }: ProceedRequest = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const emit = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const total = rows.length;
  const result: ProceedResult = { moved: 0, deleted: 0, errors: [], failedFiles: [] };

  const sourceDir = process.env.SOURCE_DIR ?? '/media/source';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.action === 'move') {
      try {
        ensureDir(path.dirname(row.targetPath));
        moveFile(row.file, row.targetPath);
        result.moved++;
        removeEmptyDirs(path.dirname(row.file), sourceDir);
      } catch (err: unknown) {
        result.failedFiles.push(row.file);
        result.errors.push(
          `Move failed: ${row.file} → ${row.targetPath}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    } else if (row.action === 'delete') {
      try {
        fs.unlinkSync(row.file);
        result.deleted++;
        removeEmptyDirs(path.dirname(row.file), sourceDir);
      } catch (err: unknown) {
        result.failedFiles.push(row.file);
        result.errors.push(
          `Delete failed: ${row.file}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
    emit({ type: 'progress', current: i + 1, total });
  }

  emit({ type: 'done', ...result });
  res.end();
});

export default router;
