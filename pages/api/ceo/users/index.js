const bcrypt = require('bcrypt');
const { connectDB } = require('@/lib/db');
const User = require('@/models/User');
const { requireAuth, requireRole } = require('@/lib/auth');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      // Get all users
      const users = await User.find()
        .select('-password_hash')
        .populate('department_id', 'name')
        .sort({ created_at: -1 });

      return res.status(200).json({ users });
    }

    if (req.method === 'POST') {
      // Create new user
      const { name, email, password, role, department_id } = req.body;

      // Validation
      if (!name || !email || !password || !role || !department_id) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'All fields are required' },
        });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          error: { code: 'EMAIL_EXISTS', message: 'Email already exists' },
        });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password_hash,
        role,
        department_id,
        is_active: true,
      });

      // Create audit log
      await createAuditLog('user', user._id, 'create', req.user.userId, {
        user: { name, email, role, department_id },
      });

      return res.status(201).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department_id: user.department_id,
        },
      });
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
