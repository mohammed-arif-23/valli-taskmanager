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
  // New fields to support fixed, recurring staff tasks
  frequency: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none',
  },
  // HH:mm in IST timezone for due time
  due_time_ist: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: 'due_time_ist must be in HH:mm format',
    },
  },
  // Apply by roles (e.g., ['staff'])
  applies_to_roles: {
    type: [String],
    default: [],
  },
  // Optionally restrict to a department
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  // Whether to create a task per individual staff or a department-level task
  assignment_mode: {
    type: String,
    enum: ['each_staff', 'department'],
    default: 'each_staff',
  },
  // For weekly schedules (0=Sun..6=Sat); reserved for future use
  days_of_week: {
    type: [Number],
    default: [],
  },
  active: {
    type: Boolean,
    default: true,
  },
  // Embedded items: each item represents one checklist task to generate
  items: {
    type: [
      new mongoose.Schema(
        {
          title: { type: String, required: true },
          description: { type: String, default: '' },
          type: { type: String, enum: ['primary', 'secondary'], default: 'primary' },
          priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
          default_points: { type: Number, required: true, min: 1, default: 1 },
          // Optional override; if not provided, template-level due_time_ist applies
          due_time_ist: {
            type: String,
            validate: {
              validator: function (v) {
                return !v || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
              },
              message: 'item.due_time_ist must be in HH:mm format',
            },
          },
          allow_late_submission: { type: Boolean, default: false },
          active: { type: Boolean, default: true },
          sort_order: { type: Number, default: 0 },
        },
        { _id: true, timestamps: false }
      ),
    ],
    default: [],
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
taskTemplateSchema.index({ frequency: 1, active: 1 });
taskTemplateSchema.index({ department_id: 1, active: 1 });


taskTemplateSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.models.TaskTemplate || mongoose.model('TaskTemplate', taskTemplateSchema);
