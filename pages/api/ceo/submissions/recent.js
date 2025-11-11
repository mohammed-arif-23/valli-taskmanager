const { connectDB } = require('@/lib/db');
const TaskSubmission = require('@/models/TaskSubmission');
const { requireAuth, requireRole } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { limit = 10 } = req.query;

    // Get recent submissions with user and task details
    const submissions = await TaskSubmission.find()
      .populate('user_id', 'name email role')
      .populate('task_id', 'title department_id')
      .populate({
        path: 'task_id',
        populate: {
          path: 'department_id',
          select: 'name',
        },
      })
      .sort({ created_at: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({ submissions });
  } catch (error) {
    console.error('Get recent submissions error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('ceo')(handler));
