const mongoose = require('mongoose');

const ceoTodoSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  start_time: {
    type: String, // Format: "HH:MM"
  },
  end_time: {
    type: String, // Format: "HH:MM"
  },
  completed: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  category: {
    type: String,
    enum: ['meeting', 'task', 'reminder', 'event', 'other'],
    default: 'task',
  },
  notes: {
    type: String,
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

ceoTodoSchema.index({ user_id: 1, date: 1 });

module.exports = mongoose.models.CeoTodo || mongoose.model('CeoTodo', ceoTodoSchema);
