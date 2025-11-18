const { connectDB } = require('@/lib/db');
const TaskSubmission = require('@/models/TaskSubmission');
const Task = require('@/models/Task');
const User = require('@/models/User');
const { requireAuth, requireRole } = require('@/lib/auth');

function getQuarterRange(date) {
  const d = date ? new Date(date) : new Date();
  const q = Math.floor(d.getMonth() / 3);
  const start = new Date(d.getFullYear(), q * 3, 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
  return { start, end };
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { type = 'department', timeframe = 'lifetime', department_id, start, end } = req.query;

    if (type === 'department') {
      // Sum points per department
      const pipeline = [
        ...(department_id ? [{ $match: { department_id: require('mongoose').Types.ObjectId(department_id) } }] : []),
        {
          $lookup: {
            from: 'tasks',
            localField: 'task_id',
            foreignField: '_id',
            as: 'task',
          },
        },
        { $unwind: '$task' },
        {
          $group: {
            _id: '$task.department_id',
            points: { $sum: '$points_awarded' },
            submissions: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'departments',
            localField: '_id',
            foreignField: '_id',
            as: 'dept',
          },
        },
        { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
        { $project: { department_id: '$_id', name: '$dept.name', points: 1, submissions: 1, _id: 0 } },
        { $sort: { points: -1 } },
        { $limit: 50 },
      ];
      const rows = await TaskSubmission.aggregate(pipeline);
      return res.status(200).json({ leaderboard: rows });
    }

    // User leaderboards: lifetime or quarterly or explicit date range
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
      ...(department_id ? [{
        $lookup: { from: 'tasks', localField: 'task_id', foreignField: '_id', as: 'task' }
      }, { $unwind: '$task' }, { $match: { 'task.department_id': require('mongoose').Types.ObjectId(department_id) } }] : []),
      {
        $group: {
          _id: '$user_id',
          points: { $sum: '$points_awarded' },
          submissions: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { user_id: '$_id', name: '$user.name', email: '$user.email', points: 1, submissions: 1, _id: 0 } },
      { $sort: { points: -1 } },
      { $limit: 100 },
    ];

    const rows = await TaskSubmission.aggregate(pipeline);
    return res.status(200).json({ leaderboard: rows });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
}

export default requireAuth(requireRole('ceo', 'administrator', 'manager')(handler));
