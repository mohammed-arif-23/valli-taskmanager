const { connectDB } = require('@/lib/db');
const TaskSubmission = require('@/models/TaskSubmission');
const Task = require('@/models/Task');
const { requireAuth, requireRole } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { department_id, status, start, end, page = 1, pageSize = 50 } = req.query;

    // Build query for submissions
    const query = {};
    if (status && ['not_started', 'partial', 'completed', 'rejected'].includes(status)) {
      query.status = status;
    }

    // If department filter is provided, first find task IDs for that department
    let taskFilter = {};
    if (department_id) {
      taskFilter.department_id = department_id;
      const taskIds = await Task.find(taskFilter).select('_id').lean();
      const ids = taskIds.map((t) => t._id);
      if (ids.length === 0) {
        return res.status(200).json({ submissions: [] });
      }
      query.task_id = { $in: ids };
    }

    // Date filter
    if (start || end) {
      query.created_at = {};
      if (start) query.created_at.$gte = new Date(start);
      if (end) query.created_at.$lte = new Date(end);
    }

    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 50, 1), 200);
    const pg = Math.max(parseInt(page, 10) || 1, 1);

    const [subs, total] = await Promise.all([
      TaskSubmission.find(query)
      .populate('user_id', 'name email role')
      .populate({
        path: 'task_id',
        select: 'title description type priority default_points due_at_utc department_id assigned_to allow_late_submission is_archived',
        populate: { path: 'department_id', select: 'name' },
      })
      .sort({ created_at: -1 })
      .skip((pg - 1) * ps)
      .limit(ps),
      TaskSubmission.countDocuments(query),
    ]);

    return res.status(200).json({ submissions: subs, page: pg, pageSize: ps, total, hasMore: (pg * ps) < total });
  } catch (error) {
    console.error('Get filtered submissions error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
}

export default requireAuth(requireRole('ceo')(handler));
