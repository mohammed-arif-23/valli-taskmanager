const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const { requireAuth, requireRole } = require('@/lib/auth');
const { istToUtc } = require('@/lib/date');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  try {
    await connectDB();

    const { id } = req.query;

    if (req.method === 'GET') {
      const task = await Task.findById(id)
        .populate('department_id', 'name')
        .populate('created_by', 'name email')
        .populate('assigned_to', 'name email');

      if (!task) {
        return res.status(404).json({ error: { code: 'TASK_NOT_FOUND', message: 'Task not found' } });
      }

      return res.status(200).json({ task });
    }

    if (req.method === 'PATCH') {
      const updates = req.body || {};
      const oldTask = await Task.findById(id);

      if (!oldTask) {
        return res.status(404).json({ error: { code: 'TASK_NOT_FOUND', message: 'Task not found' } });
      }

      // Optimistic concurrency using row_version if provided
      if (updates.row_version !== undefined && updates.row_version !== oldTask.row_version) {
        return res.status(409).json({ error: { code: 'VERSION_CONFLICT', message: 'The task was updated by someone else. Please refresh and try again.' } });
      }

      // Convert IST to UTC if due_date_ist is provided
      if (updates.due_date_ist) {
        updates.due_at_utc = istToUtc(updates.due_date_ist);
        delete updates.due_date_ist;
      }

      // Update task (allow selected fields only for safety)
      const allowed = [
        'title',
        'description',
        'type',
        'priority',
        'default_points',
        'due_at_utc',
        'department_id',
        'assigned_to',
        'allow_late_submission',
        'is_archived',
      ];
      const patch = {};
      for (const k of allowed) {
        if (updates[k] !== undefined) patch[k] = updates[k];
      }

      // Special handling: unarchive sets archived_at null
      if (patch.is_archived === false) {
        patch.archived_at = null;
      }

      const task = await Task.findByIdAndUpdate(id, patch, { new: true });

      // Create audit log
      await createAuditLog('task', task._id, 'update', req.user.userId, {
        before: oldTask.toObject(),
        after: task.toObject(),
      });

      return res.status(200).json({ task });
    }

    if (req.method === 'DELETE') {
      const task = await Task.findById(id);

      if (!task) {
        return res.status(404).json({ error: { code: 'TASK_NOT_FOUND', message: 'Task not found' } });
      }

      // Archive instead of delete
      task.is_archived = true;
      task.archived_at = new Date();
      await task.save();

      // Create audit log
      await createAuditLog('task', task._id, 'manual_archive', req.user.userId, {
        task: task.toObject(),
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  } catch (error) {
    console.error('Task management error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('ceo', 'administrator', 'manager')(handler));
