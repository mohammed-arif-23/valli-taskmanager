const { connectDB } = require('@/lib/db');
const TaskSubmission = require('@/models/TaskSubmission');
const { requireAuth, requireRole } = require('@/lib/auth');
const { submissionOverrideSchema } = require('@/lib/validation');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { id } = req.query;

    // Validate request body
    const { error, value } = submissionOverrideSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
      });
    }

    // Get submission
    const submission = await TaskSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({
        error: { code: 'SUBMISSION_NOT_FOUND', message: 'Submission not found' },
      });
    }

    // Check optimistic locking
    if (submission.row_version !== value.row_version) {
      return res.status(409).json({
        error: {
          code: 'OPTIMISTIC_LOCK_FAILED',
          message: 'Submission has been modified by another user',
        },
        current: submission,
      });
    }

    const before = submission.toObject();

    // Update points_awarded
    submission.points_awarded = value.points_awarded;
    submission.row_version += 1;
    await submission.save();

    // Create audit log
    await createAuditLog('submission', submission._id, 'override', req.user.userId, {
      before: { points_awarded: before.points_awarded },
      after: { points_awarded: submission.points_awarded },
      reason: value.reason,
    });

    return res.status(200).json({ submission });
  } catch (error) {
    console.error('Override submission error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('administrator', 'ceo', 'manager')(handler));
