const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const { requireAuth, requireRole } = require('@/lib/auth');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { id } = req.query;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' },
      });
    }

    if (task.is_archived) {
      return res.status(400).json({
        error: { code: 'TASK_ALREADY_ARCHIVED', message: 'Task is already archived' },
      });
    }

    task.is_archived = true;
    task.archived_at = new Date();
    await task.save();

    // Create audit log
    await createAuditLog('task', task._id, 'manual_archive', req.user.userId, {
      archived_at: task.archived_at,
    });

    return res.status(200).json({ task });
  } catch (error) {
    console.error('Archive task error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('administrator', 'ceo', 'manager')(handler));
