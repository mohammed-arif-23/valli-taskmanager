const mongoose = require('mongoose');
const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const TaskSubmission = require('@/models/TaskSubmission');
const Settings = require('@/models/Settings');
const { requireAuth } = require('@/lib/auth');
const { taskSubmissionSchema } = require('@/lib/validation');
const { calculatePoints } = require('@/lib/points');
const { createAuditLog } = require('@/lib/audit');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { id } = req.query;

    // Validate request body
    const { error, value } = taskSubmissionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
      });
    }

    // Get task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' },
      });
    }

    // Check if task is archived
    if (task.is_archived && !task.allow_late_submission) {
      return res.status(400).json({
        error: {
          code: 'TASK_ARCHIVED',
          message: 'Cannot submit to archived task',
        },
      });
    }

    // Get settings for rounding policy
    let settings = await Settings.findById('site_settings');
    if (!settings) {
      settings = await Settings.create({ _id: 'site_settings' });
    }

    // Calculate points
    const pointsAwarded = calculatePoints(
      value.status,
      task.default_points,
      settings.rounding_policy
    );

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if submission already exists for this user and task
      let submission = await TaskSubmission.findOne({
        task_id: id,
        user_id: req.user.userId,
      });

      if (submission) {
        // Update existing submission
        const oldStatus = submission.status;
        const oldPoints = submission.points_awarded;

        console.log('Updating submission:', {
          submissionId: submission._id,
          oldStatus,
          oldPoints,
          newStatus: value.status,
          newPoints: pointsAwarded,
          taskDefaultPoints: task.default_points,
        });

        submission.status = value.status;
        submission.points_awarded = pointsAwarded;
        submission.not_started_reason = value.not_started_reason || null;
        submission.evidence_url = value.evidence_url || null;
        await submission.save({ session });

        console.log('Submission saved:', {
          submissionId: submission._id,
          status: submission.status,
          points_awarded: submission.points_awarded,
        });

        // Create audit log for update
        await createAuditLog(
          'submission',
          submission._id,
          'update',
          req.user.userId,
          {
            before: { status: oldStatus, points_awarded: oldPoints },
            after: { status: value.status, points_awarded: pointsAwarded },
            task_id: id,
          }
        );
      } else {
        // Create new submission
        const newSubmission = await TaskSubmission.create(
          [
            {
              task_id: id,
              user_id: req.user.userId,
              status: value.status,
              points_awarded: pointsAwarded,
              not_started_reason: value.not_started_reason || null,
              evidence_url: value.evidence_url || null,
              created_by: req.user.userId,
            },
          ],
          { session }
        );
        submission = newSubmission[0];

        // Create audit log for new submission
        await createAuditLog(
          'submission',
          submission._id,
          'submit',
          req.user.userId,
          {
            status: value.status,
            points_awarded: pointsAwarded,
            task_id: id,
          }
        );
      }

      await session.commitTransaction();

      // Calculate overview
      const allSubmissions = await TaskSubmission.find({ user_id: req.user.userId });
      const receivedPoints = allSubmissions.reduce((sum, sub) => sum + sub.points_awarded, 0);

      const allTasks = await Task.find({
        department_id: task.department_id,
        is_archived: false,
      });
      const allocatedPoints = allTasks.reduce((sum, t) => sum + t.default_points, 0);

      const percent = allocatedPoints > 0 ? Math.round((receivedPoints / allocatedPoints) * 100) : 0;

      return res.status(200).json({
        submission,
        overview: {
          allocated_points: allocatedPoints,
          received_points: receivedPoints,
          percent,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Submit task error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(handler);
