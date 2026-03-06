import { Router, Request, Response } from 'express';
import { findFiles } from '../lib/finder';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const sourceDir = process.env.SOURCE_DIR ?? '/media/source';
  const { videos } = findFiles(sourceDir);
  res.json({ count: videos.length });
});

export default router;
