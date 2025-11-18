const { connectDB } = require('@/lib/db');
const TaskSubmission = require('@/models/TaskSubmission');
const Task = require('@/models/Task');
const { requireAuth, requireRole } = require('@/lib/auth');

export default requireAuth(requireRole('ceo')(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }
  try {
    await connectDB();
    const { department_id, status, start, end } = req.query;

    const query = {};
    if (status && ['not_started','partial','completed','rejected'].includes(status)) query.status = status;

    if (department_id) {
      const ids = await Task.find({ department_id }).select('_id');
      const arr = ids.map(t=>t._id);
      if (arr.length === 0) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
        return res.status(200).send('task_title,department,user_name,user_email,status,points,created_at\n');
      }
      query.task_id = { $in: arr };
    }
    if (start || end) {
      query.created_at = {};
      if (start) query.created_at.$gte = new Date(start);
      if (end) query.created_at.$lte = new Date(end);
    }

    const subs = await TaskSubmission.find(query)
      .populate('user_id', 'name email')
      .populate({ path: 'task_id', select: 'title department_id', populate: { path: 'department_id', select: 'name' } })
      .sort({ created_at: -1 })
      .limit(50000);

    const header = ['task_title','department','user_name','user_email','status','points','created_at'];
    const lines = [header.join(',')];
    for (const s of subs) {
      const row = [
        JSON.stringify(s.task_id?.title || ''),
        JSON.stringify(s.task_id?.department_id?.name || ''),
        JSON.stringify(s.user_id?.name || ''),
        JSON.stringify(s.user_id?.email || ''),
        JSON.stringify(s.status || ''),
        s.points_awarded ?? 0,
        JSON.stringify(new Date(s.created_at).toISOString()),
      ];
      lines.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
    return res.status(200).send(lines.join('\n'));
  } catch (e) {
    console.error('Export submissions error:', e);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
}));
