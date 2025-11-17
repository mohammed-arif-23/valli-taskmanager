const { connectDB } = require('@/lib/db');
const { requireAuth, requireRole } = require('@/lib/auth');
const Task = require('@/models/Task');
const TaskSubmission = require('@/models/TaskSubmission');
const { getIstMidnightUtc } = require('@/lib/generation');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const days = Math.max(1, Math.min(90, parseInt(req.query.days || '14', 10)));
    const { template_id = null, department_id = null } = req.query;

    // Build a list of IST dates (midnight UTC instants) for the past N days
    const dates = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      dates.push(getIstMidnightUtc(d));
    }

    // Fetch tasks across the window
    const query = { occurrence_date: { $in: dates } };
    if (template_id) query.source_template_id = template_id;
    if (department_id) query.department_id = department_id;

    const tasks = await Task.find(query)
      .select('_id occurrence_date due_at_utc source_template_id source_template_item_id department_id')
      .populate('source_template_id', 'title');

    const taskIds = tasks.map((t) => t._id);

    const submissions = await TaskSubmission.find({ task_id: { $in: taskIds } })
      .select('task_id status');

    // Map submissions by task for quick lookup
    const completedTaskIds = new Set(
      submissions.filter((s) => s.status === 'completed').map((s) => String(s.task_id))
    );

    // Aggregate per day and per template
    const byDay = new Map(); // key: dateISO -> { templates: Map(templateId -> { title, total, completed }) }

    for (const d of dates) {
      byDay.set(d.toISOString(), { templates: new Map() });
    }

    for (const t of tasks) {
      const dayKey = (t.occurrence_date || new Date(0)).toISOString();
      const bucket = byDay.get(dayKey) || { templates: new Map() };
      byDay.set(dayKey, bucket);

      const tplId = String(t.source_template_id?._id || t.source_template_id || 'misc');
      const tplTitle = t.source_template_id?.title || 'Misc Tasks';
      const tplBucket = bucket.templates.get(tplId) || { title: tplTitle, total: 0, completed: 0 };
      tplBucket.total += 1;
      if (completedTaskIds.has(String(t._id))) tplBucket.completed += 1;
      bucket.templates.set(tplId, tplBucket);
    }

    // Convert to arrays for client, compute completion_rate
    const series = [];
    for (const [dateISO, bucket] of byDay.entries()) {
      const point = { date: dateISO };
      for (const [tplId, tplBucket] of bucket.templates.entries()) {
        const rate = tplBucket.total > 0 ? Math.round((tplBucket.completed / tplBucket.total) * 100) : 0;
        // Use template title as key to simplify chart stacking
        point[tplBucket.title] = rate;
      }
      series.push(point);
    }

    // Sort by date ascending
    series.sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({ days, series });
  } catch (error) {
    console.error('CEO trends analytics error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
}

export default requireAuth(requireRole('ceo', 'administrator', 'manager')(handler));
