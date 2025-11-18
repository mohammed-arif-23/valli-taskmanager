const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const { requireAuth, requireRole } = require('@/lib/auth');

export default requireAuth(requireRole('ceo','administrator','manager')(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }
  try {
    await connectDB();
    const { task_ids = [], due_at_utc } = req.body || {};
    if (!Array.isArray(task_ids) || task_ids.length === 0 || !due_at_utc) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'task_ids and due_at_utc required' } });
    }
    const result = await Task.updateMany({ _id: { $in: task_ids } }, { $set: { due_at_utc: new Date(due_at_utc) } });
    return res.status(200).json({ updated: result.modifiedCount || result.nModified || 0 });
  } catch (e) {
    console.error('Bulk change due error:', e);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
}));
