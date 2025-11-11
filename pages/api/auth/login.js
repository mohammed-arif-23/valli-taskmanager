const bcrypt = require('bcrypt');
const { connectDB } = require('@/lib/db');
const User = require('@/models/User');
const { generateAccessToken, generateRefreshToken } = require('@/lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        error: {
          code: 'AUTH_USER_INACTIVE',
          message: 'User account is inactive',
        },
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role, user.email);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Set refresh token as HTTP-only secure cookie
    res.setHeader('Set-Cookie', [
      `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
    ]);

    return res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
}
