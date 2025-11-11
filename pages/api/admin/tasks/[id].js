const mongoose = require('mongoose');
const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const TaskSubmission = require('@/models/TaskSubmission');
const { requireAuth, requireRole } = require('@/lib/auth');
const { taskUpdateSchema } = require('@/lib/validation');
const { istToUtc } = require('@/lib/date');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'PATCH') {
    return handleUpdate(req, res);
  }

  return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
}

async function handleGet(req, res) {
  try {
    await connectDB();

    const { id } = req.query;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' },
      });
    }

    // Get all submissions for this task
    const submissions = await TaskSubmission.find({ task_id: id })
      .populate('user_id', 'name email')
      .sort({ created_at: -1 });

    return res.status(200).json({
      task,
      submissions,
    });
  } catch (error) {
    console.error('Get task detail error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

async function handleUpdate(req, res) {
  try {
    await connectDB();

    const { id } = req.query;

    // Validate request body
    const { error, value } = taskUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
      });
    }

    // Get current task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' },
      });
    }

    // Check optimistic locking
    if (task.row_version !== value.row_version) {
      return res.status(409).json({
        error: {
          code: 'OPTIMISTIC_LOCK_FAILED',
          message: 'Task has been modified by another user',
        },
        current: task,
      });
    }

    const before = task.toObject();

    // Update fields
    if (value.title) task.title = value.title;
    if (value.description) task.description = value.description;
    if (value.type) task.type = value.type;
    if (value.priority) task.priority = value.priority;
    if (value.default_points) task.default_points = value.default_points;
    if (value.due_date_ist) task.due_at_utc = istToUtc(value.due_date_ist);
    if (value.department_id) task.department_id = value.department_id;
    if (value.recurrence !== undefined) task.recurrence = value.recurrence;
    if (value.allow_late_submission !== undefined)
      task.allow_late_submission = value.allow_late_submission;

    await task.save();

    // Create audit log
    await createAuditLog('task', task._id, 'update', req.user.userId, {
      before,
      after: task.toObject(),
    });

    return res.status(200).json({ task });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('administrator', 'ceo', 'manager')(handler));
