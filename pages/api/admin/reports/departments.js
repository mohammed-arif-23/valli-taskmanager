const { connectDB } = require('@/lib/db');
const Department = require('@/models/Department');
const Task = require('@/models/Task');
const TaskSubmission = require('@/models/TaskSubmission');
const { requireAuth, requireRole } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { cursor, limit = 50 } = req.query;

    // Build query
    const query = {};

    if (cursor) {
      query._id = { $gt: Buffer.from(cursor, 'base64').toString() };
    }

    const limitNum = Math.min(parseInt(limit), 50);

    const departments = await Department.find(query)
      .sort({ _id: 1 })
      .limit(limitNum + 1);

    const hasMore = departments.length > limitNum;
    const depsToReturn = hasMore ? departments.slice(0, limitNum) : departments;

    // Calculate stats for each department
    const departmentStats = await Promise.all(
      depsToReturn.map(async (dept) => {
        // Get all tasks for department
        const tasks = await Task.find({ department_id: dept._id });
        const totalTasks = tasks.length;

        // Get all submissions for these tasks
        const taskIds = tasks.map((t) => t._id);
        const submissions = await TaskSubmission.find({
          task_id: { $in: taskIds },
          status: 'completed',
        });

        const completedSubmissions = submissions.length;
        const completionRate =
          totalTasks > 0 ? Math.round((completedSubmissions / totalTasks) * 100) : 0;

        // Calculate average completion time
        let avgCompletionTime = 0;
        if (submissions.length > 0) {
          const completionTimes = await Promise.all(
            submissions.map(async (sub) => {
              const task = await Task.findById(sub.task_id);
              if (task) {
                return sub.created_at - task.created_at;
              }
              return 0;
            })
          );

          const totalTime = completionTimes.reduce((sum, time) => sum + time, 0);
          avgCompletionTime = Math.round(totalTime / submissions.length / (1000 * 60 * 60)); // hours
        }

        return {
          id: dept._id,
          name: dept.name,
          completion_rate: completionRate,
          avg_completion_time: avgCompletionTime,
          total_tasks: totalTasks,
          completed_submissions: completedSubmissions,
        };
      })
    );

    const nextCursor = hasMore
      ? Buffer.from(depsToReturn[depsToReturn.length - 1]._id.toString()).toString('base64')
      : null;

    return res.status(200).json({
      departments: departmentStats,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Get department reports error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('administrator', 'ceo', 'manager')(handler));
