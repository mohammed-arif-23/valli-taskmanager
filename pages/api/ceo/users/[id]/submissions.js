const { connectDB } = require('@/lib/db');
const TaskSubmission = require('@/models/TaskSubmission');
const { requireAuth } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  const { id: userId } = req.query;

  try {
    await connectDB();

    // Fetch all submissions for this user, sorted by most recent
    const submissions = await TaskSubmission.find({ user_id: userId })
      .populate('task_id', 'title description default_points type priority')
      .populate('rejected_by', 'name')
      .sort({ created_at: -1 })
      .limit(50); // Limit to last 50 submissions

    return res.status(200).json({ submissions });
  } catch (error) {
    console.error('Get user submissions error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(handler, ['ceo']);
