const { connectDB } = require('@/lib/db');
const { requireAuth, requireRole } = require('@/lib/auth');
const CeoTodo = require('@/models/CeoTodo');

async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const { month, year } = req.query;
      
      let query = { user_id: req.user.userId };
      
      if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        query.date = { $gte: startDate, $lte: endDate };
      }

      const todos = await CeoTodo.find(query).sort({ date: 1, start_time: 1 });
      return res.status(200).json({ todos });
    }

    if (req.method === 'POST') {
      const { title, description, date, start_time, end_time, priority, category, notes } = req.body;

      if (!title || !date) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Title and date are required' },
        });
      }

      const todo = await CeoTodo.create({
        user_id: req.user.userId,
        title,
        description,
        date: new Date(date),
        start_time,
        end_time,
        priority: priority || 'medium',
        category: category || 'task',
        notes,
      });

      return res.status(201).json({ todo });
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
