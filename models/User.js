const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['reception', 'staff', 'administrator', 'ceo', 'manager'],
    default: 'reception',
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  tz: {
    type: String,
    default: 'Asia/Kolkata',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  row_version: {
    type: Number,
    default: 0,
  },
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ department_id: 1, role: 1 });

// Pre-save hook to increment row_version and update updated_at
userSchema.pre('save', function (next) {
  this.updated_at = new Date();
  if (!this.isNew) {
    this.row_version += 1;
  }
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
