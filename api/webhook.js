import { analyzeAlert } from '../lib/claude.js';
import { sendDiscordAlert } from '../lib/discord.js';
import { validateAlert, enrichAlert } from '../lib/utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const validation = validateAlert(body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  try {
    const enriched = enrichAlert(body);
    const analysis = await analyzeAlert(enriched);
    await sendDiscordAlert(enriched, analysis);
    return res.status(200).json({ ok: true, ticker: enriched.ticker });
  } catch (err) {
    console.error('Pipeline error:', err);
    return res.status(500).json({ error: 'Analysis pipeline failed', detail: err.message });
  }
}
