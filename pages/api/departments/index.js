const { connectDB } = require('@/lib/db');
const Department = require('@/models/Department');
const { requireAuth } = require('@/lib/auth');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    const departments = await Department.find().sort({ name: 1 });

    return res.status(200).json({ departments });
  } catch (error) {
    console.error('Get departments error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(handler);
