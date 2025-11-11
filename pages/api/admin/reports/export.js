const { connectDB } = require('@/lib/db');
const Department = require('@/models/Department');
const Task = require('@/models/Task');
const User = require('@/models/User');
const TaskSubmission = require('@/models/TaskSubmission');
const { requireAuth, requireRole } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { type, format = 'csv' } = req.query;

    if (format !== 'csv') {
      return res.status(400).json({
        error: { code: 'INVALID_FORMAT', message: 'Only CSV format is supported' },
      });
    }

    let csvData = '';

    if (type === 'departments') {
      csvData = await exportDepartments();
    } else if (type === 'users') {
      csvData = await exportUsers();
    } else if (type === 'tasks') {
      csvData = await exportTasks();
    } else {
      return res.status(400).json({
        error: { code: 'INVALID_TYPE', message: 'Invalid export type' },
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
    return res.status(200).send(csvData);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

async function exportDepartments() {
  const departments = await Department.find();
  let csv = 'ID,Name,Total Tasks,Completed Tasks,Completion Rate\n';

  for (const dept of departments) {
    const tasks = await Task.find({ department_id: dept._id });
    const totalTasks = tasks.length;

    const taskIds = tasks.map((t) => t._id);
    const completedSubmissions = await TaskSubmission.countDocuments({
      task_id: { $in: taskIds },
      status: 'completed',
    });

    const completionRate = totalTasks > 0 ? Math.round((completedSubmissions / totalTasks) * 100) : 0;

    csv += `${dept._id},"${dept.name}",${totalTasks},${completedSubmissions},${completionRate}%\n`;
  }

  return csv;
}

async function exportUsers() {
  const users = await User.find().populate('department_id', 'name');
  let csv = 'ID,Name,Email,Role,Department,Active,Created At\n';

  for (const user of users) {
    csv += `${user._id},"${user.name}","${user.email}","${user.role}","${user.department_id?.name || 'N/A'}",${user.is_active},${user.created_at.toISOString()}\n`;
  }

  return csv;
}

async function exportTasks() {
  const tasks = await Task.find().populate('department_id', 'name').populate('created_by', 'name');
  let csv = 'ID,Title,Type,Priority,Points,Due Date,Department,Created By,Archived\n';

  for (const task of tasks) {
    csv += `${task._id},"${task.title}","${task.type}","${task.priority}",${task.default_points},${task.due_at_utc.toISOString()},"${task.department_id?.name || 'N/A'}","${task.created_by?.name || 'N/A'}",${task.is_archived}\n`;
  }

  return csv;
}

export default requireAuth(requireRole('administrator', 'ceo', 'manager')(handler));
