import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the repo root BEFORE importing routes so that module-level
// constants in scan.ts / proceed.ts (e.g. SOURCE_DIR) read the correct values
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Routes must be imported after dotenv.config()
import scanRouter from './routes/scan';
import proceedRouter from './routes/proceed';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/config', (_req, res) => {
  res.json({
    sourceDir: process.env.SOURCE_DIR ?? '/media/source',
    moviesDir: process.env.MOVIES_DIR ?? '/media/movies',
    seriesDir: process.env.SERIES_DIR ?? '/media/series',
  });
});

app.use('/api/scan', scanRouter);
app.use('/api/proceed', proceedRouter);

app.listen(PORT, () => {
  console.log(`video-sweep-web backend listening on port ${PORT}`);
});
