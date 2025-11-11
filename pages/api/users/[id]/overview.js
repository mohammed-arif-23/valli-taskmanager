const { connectDB } = require('@/lib/db');
const User = require('@/models/User');
const Task = require('@/models/Task');
const TaskSubmission = require('@/models/TaskSubmission');
const Settings = require('@/models/Settings');
const { requireAuth } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { id } = req.query;

    // Get user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    // Calculate total allocated points (all non-archived tasks in user's department)
    const allTasks = await Task.find({
      department_id: user.department_id,
      is_archived: false,
    });
    const allocatedPoints = allTasks.reduce((sum, task) => sum + task.default_points, 0);

    // Calculate total received points (sum of points_awarded from user's submissions)
    const submissions = await TaskSubmission.find({ user_id: id });
    const receivedPoints = submissions.reduce((sum, sub) => sum + sub.points_awarded, 0);

    // Calculate percentage
    const percent = allocatedPoints > 0 ? Math.round((receivedPoints / allocatedPoints) * 100) : 0;

    // Get thresholds from settings
    let settings = await Settings.findById('site_settings');
    if (!settings) {
      settings = await Settings.create({ _id: 'site_settings' });
    }

    return res.status(200).json({
      allocated_points: allocatedPoints,
      received_points: receivedPoints,
      percent,
      thresholds: settings.thresholds,
    });
  } catch (error) {
    console.error('Get user overview error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(handler);
