const { connectDB } = require('@/lib/db');
const { requireAuth, requireRole } = require('@/lib/auth');
const Task = require('@/models/Task');
const TaskSubmission = require('@/models/TaskSubmission');
const { IST_TIMEZONE } = require('@/lib/date');
const { utcToZonedTime } = require('date-fns-tz');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { department_id, start, end } = req.query;
    const startDate = start ? new Date(start) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();

    // Load candidate tasks in date window by due_at
    const taskQuery = { due_at_utc: { $gte: startDate, $lte: endDate } };
    if (department_id) taskQuery.department_id = department_id;
    const tasks = await Task.find(taskQuery).select('_id due_at_utc department_id');
    const taskIds = tasks.map((t) => t._id);

    // Load submissions for these tasks
    const subs = await TaskSubmission.find({ task_id: { $in: taskIds } }).select('task_id status created_at');
    const completedIds = new Set(subs.filter((s) => s.status === 'completed').map((s) => String(s.task_id)));

    // Build 7 x 24 buckets: dow 0..6 (Sun..Sat), hour 0..23 (IST)
    const buckets = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        buckets.push({ dow: d, hour: h, completed: 0, missed: 0 });
      }
    }

    for (const t of tasks) {
      const istDate = utcToZonedTime(t.due_at_utc, IST_TIMEZONE);
      const dow = istDate.getDay();
      const hour = istDate.getHours();
      const idx = dow * 24 + hour;
      const isCompleted = completedIds.has(String(t._id));
      if (isCompleted) buckets[idx].completed += 1; else buckets[idx].missed += 1;
    }

    return res.status(200).json({ start: startDate, end: endDate, buckets });
  } catch (error) {
    console.error('CEO heatmap analytics error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
}

export default requireAuth(requireRole('ceo', 'administrator', 'manager')(handler));
