const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const { requireAuth, requireRole } = require('@/lib/auth');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
    }

    await connectDB();

    const { action, task_ids = [], payload = {} } = req.body || {};
    if (!action || !Array.isArray(task_ids) || task_ids.length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'action and non-empty task_ids are required' } });
    }

    const validActions = new Set(['archive', 'unarchive', 'assign', 'changePriority']);
    if (!validActions.has(action)) {
      return res.status(400).json({ error: { code: 'INVALID_ACTION', message: 'Unsupported bulk action' } });
    }

    const tasks = await Task.find({ _id: { $in: task_ids } });

    if (!tasks.length) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No matching tasks found' } });
    }

    let update = {};
    if (action === 'archive') {
      update = { is_archived: true, archived_at: new Date() };
    } else if (action === 'unarchive') {
      update = { is_archived: false, archived_at: null };
    } else if (action === 'assign') {
      const { assigned_to } = payload;
      if (!Array.isArray(assigned_to)) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'payload.assigned_to must be an array of user IDs' } });
      }
      update = { assigned_to };
    } else if (action === 'changePriority') {
      const { priority } = payload;
      const allowed = new Set(['low', 'medium', 'high']);
      if (!allowed.has(priority)) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid priority value' } });
      }
      update = { priority };
    }

    // Apply update
    await Task.updateMany({ _id: { $in: task_ids } }, update);

    // Fetch updated for response and audit
    const updated = await Task.find({ _id: { $in: task_ids } });

    // Audit per task (best effort)
    for (const t of updated) {
      const meta = { action, update };
      try {
        await createAuditLog('task', t._id, action === 'archive' ? 'manual_archive' : 'update', req.user.userId, meta);
      } catch (e) {
        // ignore
      }
    }

    return res.status(200).json({ success: true, count: updated.length, items: updated });
  } catch (error) {
    console.error('Bulk tasks error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
}

export default requireAuth(requireRole('ceo', 'administrator', 'manager')(handler));
