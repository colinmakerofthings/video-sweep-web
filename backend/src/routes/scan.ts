import { Router, Request, Response } from 'express';
import { findFiles } from '../lib/finder';
import { classify } from '../lib/classifier';
import { movieNewFilename, seriesNewFilename } from '../lib/renamer';
import { validateMovie } from '../lib/omdb';
import { ScanResponse, ScanRow } from '../lib/types';

const router = Router();

const SOURCE_DIR = '/media/source';
const MOVIES_DIR = '/media/movies';
const SERIES_DIR = '/media/series';

router.post('/', async (_req: Request, res: Response) => {
  try {
    const { videos, nonVideos } = findFiles(SOURCE_DIR);
    const apiKey = process.env.OMDB_API_KEY ?? '';

    const rows: ScanRow[] = [];

    for (const filePath of videos) {
      const type = classify(filePath);

      if (type === 'movie') {
        const { newFilename, targetPath } = movieNewFilename(filePath, MOVIES_DIR);
        // Extract title + year for OMDb lookup
        const stem = newFilename.replace(/\.[^.]+$/, '');
        const yearMatch = stem.match(/\[(\d{4})\]/);
        const year = yearMatch ? yearMatch[1] : '';
        const title = stem.replace(/\s*\[\d{4}\]/, '').trim();
        const { valid, suggested } = await validateMovie(title, year, apiKey);
        rows.push({ file: filePath, type, newFilename, targetPath, valid, suggested });
      } else {
        const { newFilename, targetPath } = seriesNewFilename(filePath, SERIES_DIR);
        rows.push({ file: filePath, type, newFilename, targetPath, valid: '-', suggested: '' });
      }
    }

    const response: ScanResponse = { rows, nonVideos };
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
