const mongoose = require('mongoose');
const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const { requireAuth, requireRole } = require('@/lib/auth');
const { taskCreationSchema } = require('@/lib/validation');
const { istToUtc } = require('@/lib/date');
const { createAuditLog } = require('@/lib/audit');
const { bulkOperationLimiter } = require('@/lib/rateLimit');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tasks array is required and must not be empty',
        },
      });
    }

    // Validate all tasks first
    const validatedTasks = [];
    for (let i = 0; i < tasks.length; i++) {
      const { error, value } = taskCreationSchema.validate(tasks[i]);
      if (error) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Task ${i + 1}: ${error.details[0].message}`,
          },
        });
      }
      validatedTasks.push(value);
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const createdTasks = [];

      for (const taskData of validatedTasks) {
        const dueAtUtc = istToUtc(taskData.due_date_ist);

        const task = await Task.create(
          [
            {
              title: taskData.title,
              description: taskData.description,
              type: taskData.type,
              priority: taskData.priority,
              default_points: taskData.default_points,
              due_at_utc: dueAtUtc,
              department_id: taskData.department_id,
              recurrence: taskData.recurrence || null,
              allow_late_submission: taskData.allow_late_submission || false,
              created_by: req.user.userId,
            },
          ],
          { session }
        );

        createdTasks.push(task[0]);
      }

      // Create single audit log for bulk operation
      await createAuditLog('task', null, 'create', req.user.userId, {
        bulk: true,
        count: createdTasks.length,
        task_ids: createdTasks.map((t) => t._id),
      });

      await session.commitTransaction();

      return res.status(201).json({
        created: createdTasks.length,
        tasks: createdTasks,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Bulk create tasks error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('administrator', 'ceo', 'manager')(handler));
