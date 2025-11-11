const mongoose = require('mongoose');
const { connectDB } = require('@/lib/db');
const User = require('@/models/User');
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

    // Prevent CEO from deleting themselves
    if (id === req.user.userId) {
      return res.status(400).json({
        error: { code: 'CANNOT_DELETE_SELF', message: 'You cannot delete your own account' },
      });
    }

    // Start transaction for safe deletion
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(id);

      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }

      // Create audit log before deletion
      await createAuditLog('user', user._id, 'delete', req.user.userId, {
        user: user.toObject(),
        permanent: true,
      });

      // Delete all submissions by this user
      await TaskSubmission.deleteMany({ user_id: id }, { session });

      // Delete the user
      await User.findByIdAndDelete(id, { session });

      await session.commitTransaction();

      return res.status(200).json({ 
        success: true,
        message: 'User and all related data permanently deleted'
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Permanent delete user error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('ceo')(handler));
