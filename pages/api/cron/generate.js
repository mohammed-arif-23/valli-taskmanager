const { connectDB } = require('@/lib/db');
const { generateRecurringTasks } = require('@/lib/generation');

// Cron-safe endpoint. Protect with a static secret set in env CRON_SECRET.
// Call example (GET or POST):
//   curl -X POST "https://<host>/api/cron/generate?key=<CRON_SECRET>" -H "Content-Type: application/json" -d '{"force":false}'
// Optional body: { date, department_id, template_id, preview, force }

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    const key = req.query.key || req.headers['x-cron-key'];
    if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid cron key' } });
    }

    await connectDB();

    const { date, department_id = null, template_id = null, preview = false, force = false } =
      req.method === 'POST' ? (req.body || {}) : ({});

    const d = date ? new Date(date) : new Date();
    const result = await generateRecurringTasks(d, {
      department_id,
      template_id,
      preview: !!preview,
      force: !!force,
    });

    return res.status(200).json({ message: preview ? 'Preview generation' : 'Generation completed', result });
  } catch (error) {
    console.error('Cron generate error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
}
