const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication endpoints
 * 5 requests per minute per IP
 */
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: 5,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for task submission endpoints
 * 30 requests per minute per user
 */
const submissionLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.userId || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for bulk operations
 * 2 requests per minute per user
 */
const bulkOperationLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: 2,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many bulk operations, please try again later',
    },
  },
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  submissionLimiter,
  bulkOperationLimiter,
};
