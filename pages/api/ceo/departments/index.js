const { connectDB } = require('@/lib/db');
const Department = require('@/models/Department');
const User = require('@/models/User');
const Task = require('@/models/Task');
const TaskSubmission = require('@/models/TaskSubmission');
const { requireAuth, requireRole } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const departments = await Department.find().sort({ name: 1 });

    const departmentsWithStats = await Promise.all(
      departments.map(async (dept) => {
        // Get all users in this department (exclude admin roles for staff count)
        const allUsers = await User.find({ department_id: dept._id, is_active: true });
        const staffUsers = allUsers.filter(u => !['administrator', 'ceo', 'manager'].includes(u.role));
        
        // Get all tasks for this department
        const tasks = await Task.find({ department_id: dept._id });
        const activeTasks = tasks.filter((t) => !t.is_archived);
        const archivedTasks = tasks.filter((t) => t.is_archived);

        // Get submissions from ALL users in this department (including admins)
        const submissions = await TaskSubmission.find({
          user_id: { $in: allUsers.map((u) => u._id) },
        });

        // Calculate points based on active tasks only
        const totalAllocated = activeTasks.reduce((sum, t) => sum + t.default_points, 0);
        const totalReceived = submissions.reduce((sum, s) => sum + s.points_awarded, 0);
        const completionRate = totalAllocated > 0 ? Math.round((totalReceived / totalAllocated) * 100) : 0;

        // Get submission breakdown
        const completedSubmissions = submissions.filter(s => s.status === 'completed').length;
        const partialSubmissions = submissions.filter(s => s.status === 'partial').length;
        const notStartedSubmissions = submissions.filter(s => s.status === 'not_started').length;

        return {
          id: dept._id,
          name: dept.name,
          staff_count: staffUsers.length, // Only non-admin staff
          total_users: allUsers.length, // All users including admins
          active_tasks: activeTasks.length,
          archived_tasks: archivedTasks.length,
          total_tasks: tasks.length,
          total_allocated_points: totalAllocated,
          total_received_points: totalReceived,
          completion_rate: completionRate,
          submissions: {
            total: submissions.length,
            completed: completedSubmissions,
            partial: partialSubmissions,
            not_started: notStartedSubmissions,
          },
        };
      })
    );

    return res.status(200).json({ departments: departmentsWithStats });
  } catch (error) {
    console.error('Get departments error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('ceo')(handler));
