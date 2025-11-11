const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const User = require('@/models/User');
const { requireAuth } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { cursor, limit = 50, show_archived = 'false' } = req.query;

    // Get user's department
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    // Build query
    const query = {
      department_id: user.department_id,
    };

    // Filter archived tasks unless requested
    if (show_archived !== 'true') {
      query.is_archived = false;
    }

    // Cursor-based pagination
    if (cursor) {
      query._id = { $gt: Buffer.from(cursor, 'base64').toString() };
    }

    const limitNum = Math.min(parseInt(limit), 50);

    // Fetch tasks with minimal fields
    const tasks = await Task.find(query)
      .select('title type priority default_points due_at_utc is_archived')
      .sort({ _id: 1 })
      .limit(limitNum + 1);

    const hasMore = tasks.length > limitNum;
    const tasksToReturn = hasMore ? tasks.slice(0, limitNum) : tasks;

    const nextCursor = hasMore
      ? Buffer.from(tasksToReturn[tasksToReturn.length - 1]._id.toString()).toString('base64')
      : null;

    return res.status(200).json({
      tasks: tasksToReturn,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(handler);
