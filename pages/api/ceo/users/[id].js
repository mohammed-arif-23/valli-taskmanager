const bcrypt = require('bcrypt');
const { connectDB } = require('@/lib/db');
const User = require('@/models/User');
const { requireAuth, requireRole } = require('@/lib/auth');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  try {
    await connectDB();

    const { id } = req.query;

    if (req.method === 'GET') {
      const user = await User.findById(id)
        .select('-password_hash')
        .populate('department_id', 'name');

      if (!user) {
        return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }

      return res.status(200).json({ user });
    }

    if (req.method === 'PATCH') {
      const updates = req.body;
      const oldUser = await User.findById(id);

      if (!oldUser) {
        return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }

      // If password is being updated, hash it
      if (updates.password) {
        updates.password_hash = await bcrypt.hash(updates.password, 10);
        delete updates.password;
      }

      // Update user
      const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password_hash');

      // Create audit log
      await createAuditLog('user', user._id, 'update', req.user.userId, {
        before: oldUser.toObject(),
        after: user.toObject(),
      });

      return res.status(200).json({ user });
    }

    if (req.method === 'DELETE') {
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }

      // Soft delete - set is_active to false
      user.is_active = false;
      await user.save();

      // Create audit log
      await createAuditLog('user', user._id, 'delete', req.user.userId, {
        user: user.toObject(),
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  } catch (error) {
    console.error('User management error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('ceo')(handler));
