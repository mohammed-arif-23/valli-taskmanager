const { connectDB } = require('@/lib/db');
const TaskSubmission = require('@/models/TaskSubmission');
const { requireAuth, requireRole } = require('@/lib/auth');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { id } = req.query;

    const submission = await TaskSubmission.findById(id);

    if (!submission) {
      return res.status(404).json({
        error: { code: 'SUBMISSION_NOT_FOUND', message: 'Submission not found' },
      });
    }

    // Create audit log before deletion
    await createAuditLog('submission', submission._id, 'delete', req.user.userId, {
      submission: submission.toObject(),
      permanent: true,
    });

    // Delete the submission
    await TaskSubmission.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Submission permanently deleted',
    });
  } catch (error) {
    console.error('Delete submission error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('ceo')(handler));
