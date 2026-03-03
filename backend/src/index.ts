import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import scanRouter from './routes/scan';
import proceedRouter from './routes/proceed';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/scan', scanRouter);
app.use('/api/proceed', proceedRouter);

app.listen(PORT, () => {
  console.log(`video-sweep-web backend listening on port ${PORT}`);
});
