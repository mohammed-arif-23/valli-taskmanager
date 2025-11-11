const mongoose = require('mongoose');
const { connectDB } = require('@/lib/db');
const { requireAuth, requireRole } = require('@/lib/auth');

const todoSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  completed: Boolean,
  priority: String,
  due_date: Date,
  created_at: Date,
  updated_at: Date,
});

const Todo = mongoose.models.Todo || mongoose.model('Todo', todoSchema);

async function handler(req, res) {
  try {
    await connectDB();

    const { id } = req.query;

    if (req.method === 'PATCH') {
      const todo = await Todo.findOneAndUpdate(
        { _id: id, user_id: req.user.userId },
        { ...req.body, updated_at: new Date() },
        { new: true }
      );

      if (!todo) {
        return res.status(404).json({ error: { code: 'TODO_NOT_FOUND', message: 'Todo not found' } });
      }

      return res.status(200).json({ todo });
    }

    if (req.method === 'DELETE') {
      const todo = await Todo.findOneAndDelete({ _id: id, user_id: req.user.userId });

      if (!todo) {
        return res.status(404).json({ error: { code: 'TODO_NOT_FOUND', message: 'Todo not found' } });
      }

      return res.status(200).json({ success: true });
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
