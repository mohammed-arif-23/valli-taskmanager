const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const { requireAuth, requireRole } = require('@/lib/auth');
const { taskCreationSchema } = require('@/lib/validation');
const { istToUtc } = require('@/lib/date');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  if (req.method === 'POST') {
    return handleCreate(req, res);
  } else if (req.method === 'GET') {
    return handleList(req, res);
  }

  return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
}

async function handleCreate(req, res) {
  try {
    await connectDB();

    // Validate request body
    const { error, value } = taskCreationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
      });
    }

    // Convert IST to UTC
    const dueAtUtc = istToUtc(value.due_date_ist);

    // Create task
    const task = await Task.create({
      title: value.title,
      description: value.description,
      type: value.type,
      priority: value.priority,
      default_points: value.default_points,
      due_at_utc: dueAtUtc,
      department_id: value.department_id,
      recurrence: value.recurrence || null,
      allow_late_submission: value.allow_late_submission || false,
      created_by: req.user.userId,
    });

    // Create audit log
    await createAuditLog('task', task._id, 'create', req.user.userId, {
      task: task.toObject(),
    });

    return res.status(201).json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

async function handleList(req, res) {
  try {
    await connectDB();

    const { cursor, limit = 50, department_id, is_archived } = req.query;

    // Build query
    const query = {};

    if (department_id) {
      query.department_id = department_id;
    }

    if (is_archived !== undefined) {
      query.is_archived = is_archived === 'true';
    }

    // Cursor-based pagination
    if (cursor) {
      query._id = { $gt: Buffer.from(cursor, 'base64').toString() };
    }

    const limitNum = Math.min(parseInt(limit), 50);

    const tasks = await Task.find(query)
      .sort({ _id: 1 })
      .limit(limitNum + 1);

    const hasMore = tasks.length > limitNum;
    const tasksToReturn = hasMore ? tasks.slice(0, limitNum) : tasks;

    const nextCursor = hasMore
      ? Buffer.from(tasksToReturn[tasksToReturn.length - 1]._id.toString()).toString('base64')
      : null;

    return res.status(200).json({
      tasks: tasksToReturn,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('List tasks error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('administrator', 'ceo', 'manager')(handler));
