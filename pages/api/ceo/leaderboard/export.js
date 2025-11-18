const { connectDB } = require('@/lib/db');
const TaskSubmission = require('@/models/TaskSubmission');
const { requireAuth, requireRole } = require('@/lib/auth');

function getQuarterRange(date) {
  const d = date ? new Date(date) : new Date();
  const q = Math.floor(d.getMonth() / 3);
  const start = new Date(d.getFullYear(), q * 3, 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
  return { start, end };
}

export default requireAuth(requireRole('ceo','administrator','manager')(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }
  try {
    await connectDB();
    const { type = 'department', timeframe = 'lifetime', department_id, start, end } = req.query;

    let rows = [];
    if (type === 'department') {
      const pipeline = [
        {
          $lookup: { from: 'tasks', localField: 'task_id', foreignField: '_id', as: 'task' }
        },
        { $unwind: '$task' },
        ...(department_id ? [{ $match: { 'task.department_id': require('mongoose').Types.ObjectId(department_id) } }] : []),
        {
          $group: { _id: '$task.department_id', points: { $sum: '$points_awarded' }, submissions: { $sum: 1 } }
        },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
        { $project: { name: '$dept.name', points: 1, submissions: 1, _id: 0 } },
        { $sort: { points: -1 } },
        { $limit: 1000 },
      ];
      rows = await TaskSubmission.aggregate(pipeline);
      const header = ['name','points','submissions'];
      const lines = [header.join(',')].concat(rows.map(r => [JSON.stringify(r.name||''), r.points||0, r.submissions||0].join(',')));
      res.setHeader('Content-Type','text/csv');
      res.setHeader('Content-Disposition','attachment; filename="leaderboard_department.csv"');
      return res.status(200).send(lines.join('\n'));
    }

    // user leaderboard
    const match = {};
    if (start || end) {
      match.created_at = {};
      if (start) match.created_at.$gte = new Date(start);
      if (end) match.created_at.$lte = new Date(end);
    } else if (timeframe === 'quarter') {
      const { start: qs, end: qe } = getQuarterRange();
      match.created_at = { $gte: qs, $lte: qe };
    }
    const pipeline = [
      { $match: match },
      {
        $group: { _id: '$user_id', points: { $sum: '$points_awarded' }, submissions: { $sum: 1 } }
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$user.name', email: '$user.email', points: 1, submissions: 1, _id: 0 } },
      { $sort: { points: -1 } },
      { $limit: 5000 },
    ];
    rows = await TaskSubmission.aggregate(pipeline);
    const header = ['name','email','points','submissions'];
    const lines = [header.join(',')].concat(rows.map(r => [JSON.stringify(r.name||''), JSON.stringify(r.email||''), r.points||0, r.submissions||0].join(',')));
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="leaderboard_users.csv"');
    return res.status(200).send(lines.join('\n'));
  } catch (e) {
    console.error('Export leaderboard error:', e);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
}));
