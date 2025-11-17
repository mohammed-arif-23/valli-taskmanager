const { connectDB } = require('@/lib/db');
const TaskTemplate = require('@/models/TaskTemplate');
const { requireAuth, requireRole } = require('@/lib/auth');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  try {
    await connectDB();

    const { id } = req.query;

    if (req.method === 'GET') {
      const template = await TaskTemplate.findById(id);
      if (!template) {
        return res.status(404).json({ error: { message: 'Template not found' } });
      }
      return res.status(200).json({ template });
    }

    if (req.method === 'PATCH') {
      const update = req.body || {};

      // Soft validation for daily
      if (update.frequency === 'daily' && !update.due_time_ist) {
        return res.status(400).json({ error: { message: "due_time_ist is required when frequency is 'daily'" } });
      }

      const template = await TaskTemplate.findById(id);
      if (!template) {
        return res.status(404).json({ error: { message: 'Template not found' } });
      }

      const before = template.toObject();

      // Apply updates (only known fields)
      const fields = [
        'name',
        'title',
        'description',
        'type',
        'priority',
        'default_points',
        'allow_late_submission',
        'frequency',
        'due_time_ist',
        'applies_to_roles',
        'department_id',
        'assignment_mode',
        'days_of_week',
        'items',
        'active',
      ];

      // Normalize and assign fields safely
      fields.forEach((f) => {
        if (update[f] === undefined) return;
        let val = update[f];

        if (f === 'department_id') {
          // Allow clearing department_id by sending empty string
          if (val === '') val = null;
        }

        if (f === 'applies_to_roles') {
          val = Array.isArray(val) ? val : [];
        }

        if (f === 'days_of_week') {
          val = Array.isArray(val) ? val.map((n) => Number(n)).filter((n) => !Number.isNaN(n)) : [];
        }

        if (f === 'items') {
          val = Array.isArray(val) ? val : [];
          // Normalize each item
          val = val.map((it) => {
            const out = { ...it };
            // description optional: default to empty string if undefined/null
            if (out.description === undefined || out.description === null) out.description = '';
            // coerce due_time_ist empty string to null
            if (out.due_time_ist === '') out.due_time_ist = null;
            // coerce numeric defaults
            if (out.default_points === undefined || out.default_points === null) out.default_points = 1;
            // ensure active flag
            if (out.active === undefined || out.active === null) out.active = true;
            return out;
          });
        }

        template[f] = val;
      });

      await template.save();

      await createAuditLog('task_template', id, 'update', req.user.userId, {
        before,
        after: template.toObject(),
      });

      return res.status(200).json({ template });
    }

    if (req.method === 'DELETE') {
      const template = await TaskTemplate.findByIdAndDelete(id);
      if (!template) {
        return res.status(404).json({ error: { message: 'Template not found' } });
      }

      await createAuditLog('task_template', id, 'delete', req.user.userId, { name: template.name });

      return res.status(200).json({ message: 'Template deleted successfully' });
    }

    return res.status(405).json({ error: { message: 'Method not allowed' } });
  } catch (error) {
    console.error('Task template error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

export default requireAuth(requireRole('administrator', 'ceo', 'manager')(handler));
