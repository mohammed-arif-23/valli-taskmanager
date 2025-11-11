const mongoose = require('mongoose');

const taskTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
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
  allow_late_submission: {
    type: Boolean,
    default: false,
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
});

taskTemplateSchema.index({ created_by: 1, created_at: -1 });

taskTemplateSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.models.TaskTemplate || mongoose.model('TaskTemplate', taskTemplateSchema);
