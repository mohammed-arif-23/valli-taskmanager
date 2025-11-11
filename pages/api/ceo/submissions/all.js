const { connectDB } = require('@/lib/db');
const TaskSubmission = require('@/models/TaskSubmission');
const { requireAuth, requireRole } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    // Get all submissions with populated user and task details
    const submissions = await TaskSubmission.find()
      .populate('user_id', 'name email role')
      .populate({
        path: 'task_id',
        select: 'title department_id',
        populate: {
          path: 'department_id',
          select: 'name',
        },
      })
      .sort({ created_at: -1 })
      .limit(500); // Limit to last 500 submissions

    return res.status(200).json({ submissions });
  } catch (error) {
    console.error('Get all submissions error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('ceo')(handler));
