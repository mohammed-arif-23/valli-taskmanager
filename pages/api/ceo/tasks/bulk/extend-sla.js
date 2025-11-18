const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const { requireAuth, requireRole } = require('@/lib/auth');

export default requireAuth(requireRole('ceo','administrator','manager')(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }
  try {
    await connectDB();
    const { task_ids = [], minutes = 0 } = req.body || {};
    if (!Array.isArray(task_ids) || task_ids.length === 0 || !Number.isFinite(minutes)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'task_ids and minutes required' } });
    }
    const tasks = await Task.find({ _id: { $in: task_ids } }).select('_id due_at_utc');
    for (const t of tasks) {
      const base = new Date(t.due_at_utc || new Date());
      base.setMinutes(base.getMinutes() + Number(minutes));
      t.due_at_utc = base;
      await t.save();
    }
    return res.status(200).json({ updated: tasks.length });
  } catch (e) {
    console.error('Bulk extend SLA error:', e);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
}));
