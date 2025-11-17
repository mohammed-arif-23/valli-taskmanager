const { connectDB } = require('@/lib/db');
const { requireAuth, requireRole } = require('@/lib/auth');
const { generateRecurringTasks } = require('@/lib/generation');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { date, department_id, template_id = null, preview = false, force = false } = req.body || {};
    const targetDate = date ? new Date(date) : new Date();

    const result = await generateRecurringTasks(targetDate, {
      department_id: department_id || null,
      preview: !!preview,
      force: !!force,
      template_id: template_id || null,
    });

    return res.status(200).json({ message: preview ? 'Preview generation' : 'Generation completed', result });
  } catch (error) {
    console.error('Generate daily tasks error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
}

export default requireAuth(requireRole('administrator', 'ceo', 'manager')(handler));
