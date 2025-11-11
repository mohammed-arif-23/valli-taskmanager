const { connectDB } = require('@/lib/db');
const TaskSubmission = require('@/models/TaskSubmission');
const { requireAuth } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { task_ids } = req.body;

    if (!task_ids || !Array.isArray(task_ids)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'task_ids array is required' },
      });
    }

    // Get submissions for these tasks by current user
    const submissions = await TaskSubmission.find({
      task_id: { $in: task_ids },
      user_id: req.user.userId,
    });

    return res.status(200).json({ submissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(handler);
