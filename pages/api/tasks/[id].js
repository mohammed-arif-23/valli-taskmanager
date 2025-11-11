const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const TaskSubmission = require('@/models/TaskSubmission');
const { requireAuth } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { id } = req.query;

    // Get task
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' },
      });
    }

    // Get submissions for current user
    const submissions = await TaskSubmission.find({
      task_id: id,
      user_id: req.user.userId,
    }).sort({ created_at: -1 });

    return res.status(200).json({
      task,
      submissions,
    });
  } catch (error) {
    console.error('Get task detail error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(handler);
