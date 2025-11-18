const { connectDB } = require('@/lib/db');
const { requireAuth, requireRole } = require('@/lib/auth');
const Task = require('@/models/Task');
const TaskSubmission = require('@/models/TaskSubmission');
const User = require('@/models/User');
const { getIstMidnightUtc } = require('@/lib/generation');

export default requireAuth(requireRole('ceo','administrator','manager')(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }
  try {
    await connectDB();
    const { department_id, kind = 'per_template' } = req.query;

    const todayUtc = getIstMidnightUtc(new Date());
    const taskQuery = { occurrence_date: todayUtc };
    if (department_id) taskQuery.department_id = department_id;

    const tasks = await Task.find(taskQuery)
      .select('_id title department_id assigned_to due_at_utc source_template_id source_template_item_id')
      .populate('source_template_id', 'title')
      .populate('department_id', 'name');

    const taskIds = tasks.map((t) => t._id);
    const submissions = await TaskSubmission.find({ task_id: { $in: taskIds } })
      .select('task_id user_id status created_at');

    if (kind === 'per_staff') {
      const usersQuery = { is_active: true };
      if (department_id) usersQuery.department_id = department_id;
      const staff = await User.find(usersQuery).select('_id name email role department_id');

      const now = new Date();
      const lines = [['name','email','compliance_percent','completed','overdue','total_relevant']];

      for (const u of staff) {
        const relevant = tasks.filter((t) => (t.assigned_to?.length || 0) === 0 || (t.assigned_to || []).some((id) => String(id) === String(u._id)));
        const relevantIds = new Set(relevant.map((t) => String(t._id)));
        const userSubs = submissions.filter((s) => String(s.user_id) === String(u._id));
        const completedIds = new Set(userSubs.filter((s) => s.status === 'completed').map((s) => String(s.task_id)));

        const totalRelevant = relevant.length;
        const completed = Array.from(relevantIds).filter((id) => completedIds.has(id)).length;
        const overdue = relevant.filter((t) => new Date(t.due_at_utc) < now && !completedIds.has(String(t._id))).length;
        const compliance_percent = totalRelevant > 0 ? Math.round((completed / totalRelevant) * 100) : 0;

        lines.push([
          JSON.stringify(u.name || ''),
          JSON.stringify(u.email || ''),
          compliance_percent,
          completed,
          overdue,
          totalRelevant,
        ]);
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="daily_per_staff.csv"');
      return res.status(200).send(lines.map(r => r.join(',')).join('\n'));
    }

    // per_template
    const now = new Date();
    const byTemplate = new Map();
    for (const t of tasks) {
      const tplId = String(t.source_template_id?._id || t.source_template_id || t._id);
      const tplTitle = t.source_template_id?.title || t.title || 'Misc Tasks';
      if (!byTemplate.has(tplId)) {
        byTemplate.set(tplId, { title: tplTitle, tasks: [] });
      }
      byTemplate.get(tplId).tasks.push(t);
    }

    const lines = [['title','total','completed','completion_rate','overdue','not_started']];
    for (const [tplId, group] of byTemplate.entries()) {
      const groupTaskIds = group.tasks.map((t) => String(t._id));
      const groupSubs = submissions.filter((s) => groupTaskIds.includes(String(s.task_id)));
      const completedTaskIds = new Set(groupSubs.filter((s) => s.status === 'completed').map((s) => String(s.task_id)));
      const total = group.tasks.length;
      const completed = completedTaskIds.size;
      const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const overdue = group.tasks.filter((t) => new Date(t.due_at_utc) < now && !completedTaskIds.has(String(t._id))).length;
      const hasSubmission = new Set(groupSubs.map((s) => String(s.task_id)));
      const not_started = group.tasks.filter((t) => !hasSubmission.has(String(t._id))).length;

      lines.push([
        JSON.stringify(group.title || 'Misc Tasks'),
        total,
        completed,
        completion_rate,
        overdue,
        not_started,
      ]);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="daily_per_template.csv"');
    return res.status(200).send(lines.map(r => r.join(',')).join('\n'));
  } catch (e) {
    console.error('Daily export error:', e);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
}));
