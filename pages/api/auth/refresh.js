const jwt = require('jsonwebtoken');
const { connectDB } = require('@/lib/db');
const User = require('@/models/User');
const { generateAccessToken } = require('@/lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Refresh token required',
        },
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({
        error: {
          code: 'AUTH_INVALID_TOKEN',
          message: 'Invalid refresh token',
        },
      });
    }

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({
        error: {
          code: 'AUTH_USER_INVALID',
          message: 'User not found or inactive',
        },
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id.toString(), user.role, user.email);

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
}
