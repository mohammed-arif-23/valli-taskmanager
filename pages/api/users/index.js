import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { requireAuth, requireRole } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    await connectDB();

    // Return a list of all active users, just name and email for the dropdown
    const users = await User.find({ is_active: true })
      .select('name email')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
}

export default requireAuth(requireRole('ceo', 'administrator', 'manager')(handler));
