const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, 
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
    return req.user?.userId || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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
