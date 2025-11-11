const { connectDB } = require('@/lib/db');
const User = require('@/models/User');
const { requireAuth } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    // Get user from database
    const user = await User.findById(req.user.userId).select('-password_hash');

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        tz: user.tz,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
}

export default requireAuth(handler);
