const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'site_settings',
  },
  rounding_policy: {
    method: {
      type: String,
      default: 'half_up',
    },
    partial_ratio: {
      type: Number,
      default: 0.5,
    },
  },
  thresholds: {
    red: {
      type: Number,
      default: 33,
    },
    orange: {
      type: Number,
      default: 66,
    },
    green: {
      type: Number,
      default: 100,
    },
  },
  scoring_mode: {
    type: String,
    enum: ['absolute', 'percentage'],
    default: 'absolute',
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  row_version: {
    type: Number,
    default: 0,
  },
});

// Pre-save hook to increment row_version and update updated_at
settingsSchema.pre('save', function (next) {
  this.updated_at = new Date();
  if (!this.isNew) {
    this.row_version += 1;
  }
  next();
});

module.exports = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
