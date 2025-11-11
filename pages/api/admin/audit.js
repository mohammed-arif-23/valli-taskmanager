const { connectDB } = require('@/lib/db');
const AuditLog = require('@/models/AuditLog');
const { requireAuth, requireRole } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const { cursor, limit = 100, entity_type, entity_id, start_date, end_date } = req.query;

    // Build query
    const query = {};

    if (entity_type) {
      query.entity_type = entity_type;
    }

    if (entity_id) {
      query.entity_id = entity_id;
    }

    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) {
        query.created_at.$gte = new Date(start_date);
      }
      if (end_date) {
        query.created_at.$lte = new Date(end_date);
      }
    }

    // Cursor-based pagination
    if (cursor) {
      query._id = { $gt: Buffer.from(cursor, 'base64').toString() };
    }

    const limitNum = Math.min(parseInt(limit), 100);

    const logs = await AuditLog.find(query)
      .populate('performed_by', 'name email')
      .sort({ created_at: -1, _id: 1 })
      .limit(limitNum + 1);

    const hasMore = logs.length > limitNum;
    const logsToReturn = hasMore ? logs.slice(0, limitNum) : logs;

    const nextCursor = hasMore
      ? Buffer.from(logsToReturn[logsToReturn.length - 1]._id.toString()).toString('base64')
      : null;

    return res.status(200).json({
      logs: logsToReturn,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('administrator', 'ceo', 'manager')(handler));
