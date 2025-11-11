import dbConnect from '@/lib/db';
import TaskTemplate from '@/models/TaskTemplate';
import { verifyToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export default async function handler(req, res) {
  try {
    const decoded = verifyToken(req);
    if (!decoded || !['administrator', 'ceo', 'manager'].includes(decoded.role)) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    await dbConnect();

    if (req.method === 'GET') {
      const templates = await TaskTemplate.find()
        .populate('created_by', 'name email')
        .sort({ created_at: -1 });

      return res.status(200).json({ templates });
    }

    if (req.method === 'POST') {
      const { name, title, description, type, priority, default_points, allow_late_submission } = req.body;

      if (!name || !title || !description || !type || !priority || !default_points) {
        return res.status(400).json({ error: { message: 'Missing required fields' } });
      }

      const template = await TaskTemplate.create({
        name,
        title,
        description,
        type,
        priority,
        default_points,
        allow_late_submission: allow_late_submission || false,
        created_by: decoded.userId,
      });

      await logAudit({
        user_id: decoded.userId,
        action: 'create_template',
        resource_type: 'task_template',
        resource_id: template._id,
        details: { name, title },
      });

      return res.status(201).json({ template });
    }

    return res.status(405).json({ error: { message: 'Method not allowed' } });
  } catch (error) {
    console.error('Task template error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
}
