const jwt = require('jsonwebtoken');

/**
 * Middleware to require authentication via JWT
 * Validates token from Authorization header
 * Adds user info to req.user
 */
function requireAuth(handler) {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: {
            code: 'AUTH_TOKEN_MISSING',
            message: 'Authorization token required',
          },
        });
      }

      const token = authHeader.split(' ')[1];

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, role, email }
        return handler(req, res);
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: {
              code: 'AUTH_TOKEN_EXPIRED',
              message: 'Token has expired',
            },
          });
        }
        return res.status(401).json({
          error: {
            code: 'AUTH_INVALID_TOKEN',
            message: 'Invalid token',
          },
        });
      }
    } catch (error) {
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error',
        },
      });
    }
  };
}

/**
 * Middleware to require specific roles (RBAC)
 * Must be used after requireAuth
 */
function requireRole(...allowedRoles) {
  return (handler) => {
    return async (req, res) => {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required',
          },
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: {
            code: 'AUTH_INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions',
          },
        });
      }

      return handler(req, res);
    };
  };
}

/**
 * Generate JWT access token
 */
function generateAccessToken(userId, role, email) {
  return jwt.sign({ userId, role, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '15m',
  });
}

/**
 * Generate refresh token
 */
function generateRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d',
  });
}

module.exports = {
  requireAuth,
  requireRole,
  generateAccessToken,
  generateRefreshToken,
};
