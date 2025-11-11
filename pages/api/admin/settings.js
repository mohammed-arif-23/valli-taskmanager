const { connectDB } = require('@/lib/db');
const Settings = require('@/models/Settings');
const { requireAuth, requireRole } = require('@/lib/auth');
const { settingsUpdateSchema } = require('@/lib/validation');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'PATCH') {
    return handleUpdate(req, res);
  }

  return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
}

async function handleGet(req, res) {
  try {
    await connectDB();

    let settings = await Settings.findById('site_settings');
    if (!settings) {
      settings = await Settings.create({ _id: 'site_settings' });
    }

    return res.status(200).json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

async function handleUpdate(req, res) {
  // Check admin role for updates
  if (!['administrator', 'ceo'].includes(req.user.role)) {
    return res.status(403).json({
      error: {
        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions',
      },
    });
  }

  try {
    await connectDB();

    // Validate request body
    const { error, value } = settingsUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
      });
    }

    let settings = await Settings.findById('site_settings');
    if (!settings) {
      settings = await Settings.create({ _id: 'site_settings' });
    }

    const before = settings.toObject();

    // Update fields
    if (value.rounding_policy) {
      if (value.rounding_policy.method) {
        settings.rounding_policy.method = value.rounding_policy.method;
      }
      if (value.rounding_policy.partial_ratio !== undefined) {
        settings.rounding_policy.partial_ratio = value.rounding_policy.partial_ratio;
      }
    }

    if (value.thresholds) {
      if (value.thresholds.red !== undefined) {
        settings.thresholds.red = value.thresholds.red;
      }
      if (value.thresholds.orange !== undefined) {
        settings.thresholds.orange = value.thresholds.orange;
      }
      if (value.thresholds.green !== undefined) {
        settings.thresholds.green = value.thresholds.green;
      }
    }

    if (value.scoring_mode) {
      settings.scoring_mode = value.scoring_mode;
    }

    await settings.save();

    // Create audit log
    await createAuditLog('setting', settings._id, 'update', req.user.userId, {
      before,
      after: settings.toObject(),
    });

    return res.status(200).json({ settings });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

// GET is open to all authenticated users, PATCH requires admin
export default requireAuth(handler);
