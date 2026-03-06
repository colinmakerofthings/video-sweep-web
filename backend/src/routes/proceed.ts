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

// Recursively remove ALL empty directories inside root (post-order traversal)
function removeAllEmptyDirs(dir: string): void {
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const full = path.join(dir, entry);
      try {
        if (fs.statSync(full).isDirectory()) {
          removeAllEmptyDirs(full);
        }
      } catch { /* skip unreadable entries */ }
    }
    // Re-check after recursion — children may now be gone
    if (fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
    }
  } catch { /* skip if dir disappeared or is unreadable */ }
}

interface ProceedRequest {
  rows: ScanRow[];
  deleteEmptyFolders?: boolean;
}

interface ProceedResult {
  moved: number;
  deleted: number;
  errors: string[];
  failedFiles: string[];
}

router.post('/', (req: Request, res: Response) => {
  const { rows, deleteEmptyFolders = true }: ProceedRequest = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const emit = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const total = rows.length;
  const result: ProceedResult = { moved: 0, deleted: 0, errors: [], failedFiles: [] };

  const sourceDir = process.env.SOURCE_DIR ?? '/media/source';

  // Process one row at a time, yielding the event loop between each so SSE
  // events are actually flushed to the client before the next file is touched.
  const processNext = (i: number): void => {
    if (i >= rows.length) {
      if (deleteEmptyFolders) {
        removeAllEmptyDirs(sourceDir);
      }
      emit({ type: 'done', ...result });
      res.end();
      return;
    }

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
    // Yield to the event loop so the SSE chunk is flushed before next iteration
    setImmediate(() => processNext(i + 1));
  };

  processNext(0);
});

export default router;
