import dbConnect from '@/lib/db';
import TaskHistory from '@/models/TaskHistory';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const decoded = verifyToken(req);
    if (!decoded) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    await dbConnect();

    const { id } = req.query;

    const history = await TaskHistory.find({ task_id: id })
      .populate('changed_by', 'name email')
      .sort({ created_at: -1 })
      .limit(50);

    res.status(200).json({ history });
  } catch (error) {
    console.error('Get task history error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
}
