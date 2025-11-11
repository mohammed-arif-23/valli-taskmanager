const { connectDB } = require('@/lib/db');
const User = require('@/models/User');
const TaskSubmission = require('@/models/TaskSubmission');
const Task = require('@/models/Task');
const { requireAuth, requireRole } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { department_id, role, search } = req.query;

    // Get admin's user info
    const adminUser = await User.findById(req.user.userId);
    if (!adminUser) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    // Build query - admins can see all users in their department
    const query = {
      department_id: adminUser.department_id,
      is_active: true,
    };

    // If specific role filter is applied
    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Get all staff in department
    const staff = await User.find(query)
      .select('name email role department_id created_at')
      .populate('department_id', 'name')
      .sort({ name: 1 });

    // Get performance data for each staff member
    const staffWithPerformance = await Promise.all(
      staff.map(async (user) => {
        // Get all submissions by this user
        const submissions = await TaskSubmission.find({ user_id: user._id });
        const receivedPoints = submissions.reduce((sum, sub) => sum + sub.points_awarded, 0);

        // Get all tasks for their department
        const tasks = await Task.find({
          department_id: user.department_id,
          is_archived: false,
        });
        const allocatedPoints = tasks.reduce((sum, task) => sum + task.default_points, 0);

        const percent = allocatedPoints > 0 ? Math.round((receivedPoints / allocatedPoints) * 100) : 0;

        // Get submission count by status
        const completedCount = submissions.filter((s) => s.status === 'completed').length;
        const partialCount = submissions.filter((s) => s.status === 'partial').length;
        const notStartedCount = submissions.filter((s) => s.status === 'not_started').length;

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department_id?.name || 'N/A',
          performance: {
            allocated_points: allocatedPoints,
            received_points: receivedPoints,
            percent,
            completed_count: completedCount,
            partial_count: partialCount,
            not_started_count: notStartedCount,
            total_submissions: submissions.length,
          },
          created_at: user.created_at,
        };
      })
    );

    return res.status(200).json({ staff: staffWithPerformance });
  } catch (error) {
    console.error('Get staff error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('administrator', 'manager')(handler));
