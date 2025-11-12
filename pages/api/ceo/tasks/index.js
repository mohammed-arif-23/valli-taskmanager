const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const { requireAuth, requireRole } = require('@/lib/auth');
const { istToUtc } = require('@/lib/date');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const { department_id, is_archived } = req.query;
      const query = {};

      if (department_id) query.department_id = department_id;
      if (is_archived !== undefined) query.is_archived = is_archived === 'true';

      const tasks = await Task.find(query)
        .populate('department_id', 'name')
        .populate('created_by', 'name email')
        .populate('assigned_to', 'name email')
        .sort({ created_at: -1 });

      return res.status(200).json({ tasks });
    }

    if (req.method === 'POST') {
      const { title, description, type, priority, default_points, due_date_ist, department_id, assigned_to, allow_late_submission } = req.body;

      // Validation
      if (!title || !description || !type || !priority || !default_points || !due_date_ist || !department_id) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'All fields are required' },
        });
      }

      // Convert IST to UTC
      const dueAtUtc = istToUtc(due_date_ist);

      // Create task
      const task = await Task.create({
        title,
        description,
        type,
        priority,
        default_points,
        due_at_utc: dueAtUtc,
        department_id,
        assigned_to: assigned_to || [], // Empty array means all users in department
        allow_late_submission: allow_late_submission || false,
        created_by: req.user.userId,
      });

      // Create audit log
      await createAuditLog('task', task._id, 'create', req.user.userId, {
        task: task.toObject(),
      });

      return res.status(201).json({ task });
    }

    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  } catch (error) {
    console.error('Task management error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('ceo')(handler));
