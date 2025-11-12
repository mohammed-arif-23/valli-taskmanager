const { connectDB } = require('@/lib/db');
const { requireAuth, requireRole } = require('@/lib/auth');
const CeoTodo = require('@/models/CeoTodo');

async function handler(req, res) {
  try {
    await connectDB();

    const { id } = req.query;

    if (req.method === 'GET') {
      const todo = await CeoTodo.findOne({ _id: id, user_id: req.user.userId });

      if (!todo) {
        return res.status(404).json({ error: { code: 'TODO_NOT_FOUND', message: 'Todo not found' } });
      }

      return res.status(200).json({ todo });
    }

    if (req.method === 'PATCH') {
      const updateData = { ...req.body, updated_at: new Date() };
      
      if (req.body.date) {
        updateData.date = new Date(req.body.date);
      }

      const todo = await CeoTodo.findOneAndUpdate(
        { _id: id, user_id: req.user.userId },
        updateData,
        { new: true }
      );

      if (!todo) {
        return res.status(404).json({ error: { code: 'TODO_NOT_FOUND', message: 'Todo not found' } });
      }

      return res.status(200).json({ todo });
    }

    if (req.method === 'DELETE') {
      const todo = await CeoTodo.findOneAndDelete({ _id: id, user_id: req.user.userId });

      if (!todo) {
        return res.status(404).json({ error: { code: 'TODO_NOT_FOUND', message: 'Todo not found' } });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  } catch (error) {
    console.error('Calendar todo error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('ceo')(handler));
