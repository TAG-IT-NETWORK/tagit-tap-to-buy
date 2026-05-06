import express from 'express';
import { x402Paywall } from '../middleware/x402';
import { getBrief } from './getBrief';
import { resolveChip } from './resolveChip';

const app = express();
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/api/resolve', resolveChip);
app.get('/api/getBrief', x402Paywall, getBrief);

const port = Number(process.env.PORT ?? 3002);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`tap-to-buy api listening on :${port}`);
});
