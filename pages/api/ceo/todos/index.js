const mongoose = require('mongoose');
const { connectDB } = require('@/lib/db');
const { requireAuth, requireRole } = require('@/lib/auth');

// Define Todo schema inline
const todoSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  completed: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  due_date: Date,
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const Todo = mongoose.models.Todo || mongoose.model('Todo', todoSchema);

async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const todos = await Todo.find({ user_id: req.user.userId }).sort({ created_at: -1 });
      return res.status(200).json({ todos });
    }

    if (req.method === 'POST') {
      const { title, description, priority, due_date } = req.body;

      if (!title) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Title is required' },
        });
      }

      const todo = await Todo.create({
        user_id: req.user.userId,
        title,
        description,
        priority: priority || 'medium',
        due_date: due_date ? new Date(due_date) : null,
      });

      return res.status(201).json({ todo });
    }

    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  } catch (error) {
    console.error('Todo error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('ceo')(handler));
