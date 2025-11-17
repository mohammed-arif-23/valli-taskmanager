const { connectDB } = require('@/lib/db');
const { requireAuth, requireRole } = require('@/lib/auth');
const User = require('@/models/User');
const Task = require('@/models/Task');
const TaskSubmission = require('@/models/TaskSubmission');
const { getIstMidnightUtc } = require('@/lib/generation');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    // Determine department of the admin making the request
    const admin = await User.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    const todayUtc = getIstMidnightUtc(new Date());

    // All fixed tasks generated for today in this department
    const tasks = await Task.find({ department_id: admin.department_id, occurrence_date: todayUtc })
      .select('_id due_at_utc assigned_to');
    const taskIds = tasks.map((t) => t._id);

    // All submissions for these tasks
    const submissions = await TaskSubmission.find({ task_id: { $in: taskIds } })
      .select('task_id user_id status created_at');

    // Completion rate by distinct tasks (task considered complete if it has at least one completed submission)
    const completedTaskIds = new Set(
      submissions.filter((s) => s.status === 'completed').map((s) => String(s.task_id))
    );

    const totalTasks = tasks.length;
    const completedTasks = completedTaskIds.size;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Per-staff compliance for fixed tasks (today)
    const staff = await User.find({ department_id: admin.department_id, role: 'staff', is_active: true })
      .select('_id name email');

    const now = new Date();

    const staffCompliance = await Promise.all(
      staff.map(async (u) => {
        // relevant = tasks assigned to all (assigned_to empty) or explicitly to user
        const relevantTaskIds = tasks
          .filter((t) => (t.assigned_to?.length || 0) === 0 || (t.assigned_to || []).some((id) => String(id) === String(u._id)))
          .map((t) => String(t._id));

        const userSubs = submissions.filter((s) => String(s.user_id) === String(u._id));
        const userCompletedIds = new Set(userSubs.filter((s) => s.status === 'completed').map((s) => String(s.task_id)));

        const totalRelevant = relevantTaskIds.length;
        const completed = relevantTaskIds.filter((id) => userCompletedIds.has(id)).length;
        const overdue = tasks.filter((t) => relevantTaskIds.includes(String(t._id)) && new Date(t.due_at_utc) < now && !userCompletedIds.has(String(t._id))).length;

        const compliance = totalRelevant > 0 ? Math.round((completed / totalRelevant) * 100) : 0;
        return {
          user_id: u._id,
          name: u.name,
          email: u.email,
          total_relevant: totalRelevant,
          completed,
          overdue,
          compliance_percent: compliance,
        };
      })
    );

    // Overdue tasks (no completed submissions by anyone and past due)
    const overdueTasks = tasks.filter((t) => new Date(t.due_at_utc) < now && !completedTaskIds.has(String(t._id))).length;

    // Not started tasks (no submissions at all)
    const taskHasSubmission = new Set(submissions.map((s) => String(s.task_id)));
    const notStartedTasks = tasks.filter((t) => !taskHasSubmission.has(String(t._id))).length;

    return res.status(200).json({
      date: todayUtc,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      completion_rate: completionRate,
      overdue_tasks: overdueTasks,
      not_started_tasks: notStartedTasks,
      per_staff: staffCompliance,
    });
  } catch (error) {
    console.error('Daily analytics error:', error);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
}

module.exports = requireAuth(requireRole('administrator', 'ceo', 'manager')(handler));
