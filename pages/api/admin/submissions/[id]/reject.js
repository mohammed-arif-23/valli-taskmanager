import dbConnect from '@/lib/db';
import TaskSubmission from '@/models/TaskSubmission';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const decoded = verifyToken(req);
    if (!decoded || !['administrator', 'ceo', 'manager'].includes(decoded.role)) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    await dbConnect();

    const { id } = req.query;
    const { rejection_reason } = req.body;

    if (!rejection_reason || rejection_reason.trim().length === 0) {
      return res.status(400).json({ error: { message: 'Rejection reason is required' } });
    }

    const submission = await TaskSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({ error: { message: 'Submission not found' } });
    }

    // Get user's previous points
    const user = await User.findById(submission.user_id);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Deduct points if submission was completed
    if (submission.status === 'completed') {
      user.received_points = Math.max(0, user.received_points - submission.points_awarded);
      await user.save();
    }

    // Update submission
    submission.status = 'rejected';
    submission.rejection_reason = rejection_reason.trim();
    submission.rejected_by = decoded.userId;
    submission.rejected_at = new Date();
    submission.points_awarded = 0;
    await submission.save();

    await logAudit({
      user_id: decoded.userId,
      action: 'reject_submission',
      resource_type: 'submission',
      resource_id: submission._id,
      details: { rejection_reason, user_id: submission.user_id },
    });

    res.status(200).json({ message: 'Submission rejected successfully', submission });
  } catch (error) {
    console.error('Reject submission error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
}
