const { connectDB } = require('@/lib/db');
const TaskTemplate = require('@/models/TaskTemplate');
const { requireAuth, requireRole } = require('@/lib/auth');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const templates = await TaskTemplate.find()
        .populate('created_by', 'name email')
        .sort({ created_at: -1 });

      return res.status(200).json({ templates });
    }

    if (req.method === 'POST') {
      const {
        name,
        title,
        description,
        type,
        priority,
        default_points,
        allow_late_submission,
        frequency,
        due_time_ist,
        applies_to_roles,
        department_id,
        assignment_mode,
        days_of_week,
        active,
      } = req.body;

      if (!name || !title || !description || !type || !priority || !default_points) {
        return res.status(400).json({ error: { message: 'Missing required fields' } });
      }

      // Soft validation: if daily template, due_time_ist is required
      if (frequency === 'daily' && !due_time_ist) {
        return res.status(400).json({ error: { message: "due_time_ist is required when frequency is 'daily'" } });
      }

      const template = await TaskTemplate.create({
        name,
        title,
        description,
        type,
        priority,
        default_points,
        allow_late_submission: allow_late_submission || false,
        frequency: frequency || 'none',
        due_time_ist: due_time_ist || null,
        applies_to_roles: Array.isArray(applies_to_roles) ? applies_to_roles : [],
        department_id: department_id === '' ? null : (department_id || null),
        assignment_mode: assignment_mode || 'each_staff',
        days_of_week: Array.isArray(days_of_week) ? days_of_week : [],
        active: active !== undefined ? !!active : true,
        created_by: req.user.userId,
      });

      await createAuditLog('task_template', template._id, 'create', req.user.userId, {
        name,
        title,
      });

      return res.status(201).json({ template });
    }

    return res.status(405).json({ error: { message: 'Method not allowed' } });
  } catch (error) {
    console.error('Task template error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

export default requireAuth(requireRole('administrator', 'ceo', 'manager')(handler));
