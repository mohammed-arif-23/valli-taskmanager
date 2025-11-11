const mongoose = require('mongoose');

const taskHistorySchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  changed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'archived', 'unarchived'],
    required: true,
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

taskHistorySchema.index({ task_id: 1, created_at: -1 });

module.exports = mongoose.models.TaskHistory || mongoose.model('TaskHistory', taskHistorySchema);
