const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['primary', 'secondary'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
  },
  default_points: {
    type: Number,
    required: true,
    min: 1,
  },
  due_at_utc: {
    type: Date,
    required: true,
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  recurrence: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  is_archived: {
    type: Boolean,
    default: false,
  },
  archived_at: {
    type: Date,
    default: null,
  },
  allow_late_submission: {
    type: Boolean,
    default: false,
  },
  row_version: {
    type: Number,
    default: 0,
  },
});

// Compound indexes for efficient queries
taskSchema.index({ due_at_utc: 1, department_id: 1, is_archived: 1 });
taskSchema.index({ department_id: 1, is_archived: 1 });

// Pre-save hook to increment row_version and update updated_at
taskSchema.pre('save', function (next) {
  this.updated_at = new Date();
  if (!this.isNew) {
    this.row_version += 1;
  }
  next();
});

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);
