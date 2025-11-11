const mongoose = require('mongoose');

const taskSubmissionSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['not_started', 'partial', 'completed', 'rejected'],
    required: true,
  },
  points_awarded: {
    type: Number,
    required: true,
  },
  not_started_reason: {
    type: String,
    maxlength: 200,
  },
  evidence_url: {
    type: String,
  },
  rejection_reason: {
    type: String,
    maxlength: 500,
  },
  rejected_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejected_at: {
    type: Date,
  },
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  row_version: {
    type: Number,
    default: 0,
  },
});

// Compound indexes for efficient queries
taskSubmissionSchema.index({ user_id: 1, task_id: 1, created_at: -1 });
taskSubmissionSchema.index({ task_id: 1, created_at: -1 });

module.exports =
  mongoose.models.TaskSubmission || mongoose.model('TaskSubmission', taskSubmissionSchema);
