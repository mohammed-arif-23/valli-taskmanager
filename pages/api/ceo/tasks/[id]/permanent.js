const mongoose = require('mongoose');
const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const TaskSubmission = require('@/models/TaskSubmission');
const { requireAuth, requireRole } = require('@/lib/auth');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { id } = req.query;

    // Start transaction for safe deletion
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const task = await Task.findById(id);

      if (!task) {
        await session.abortTransaction();
        return res.status(404).json({ error: { code: 'TASK_NOT_FOUND', message: 'Task not found' } });
      }

      // Create audit log before deletion
      await createAuditLog('task', task._id, 'delete', req.user.userId, {
        task: task.toObject(),
        permanent: true,
      });

      // Delete all submissions for this task
      await TaskSubmission.deleteMany({ task_id: id }, { session });

      // Delete the task
      await Task.findByIdAndDelete(id, { session });

      await session.commitTransaction();

      return res.status(200).json({ 
        success: true,
        message: 'Task and all related submissions permanently deleted'
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Permanent delete task error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('ceo')(handler));
