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

    const { id } = req.query;

    if (req.method === 'GET') {
      const template = await TaskTemplate.findById(id);
      if (!template) {
        return res.status(404).json({ error: { message: 'Template not found' } });
      }
      return res.status(200).json({ template });
    }

    if (req.method === 'DELETE') {
      const template = await TaskTemplate.findByIdAndDelete(id);
      if (!template) {
        return res.status(404).json({ error: { message: 'Template not found' } });
      }

      await logAudit({
        user_id: decoded.userId,
        action: 'delete_template',
        resource_type: 'task_template',
        resource_id: id,
        details: { name: template.name },
      });

      return res.status(200).json({ message: 'Template deleted successfully' });
    }

    return res.status(405).json({ error: { message: 'Method not allowed' } });
  } catch (error) {
    console.error('Task template error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
}
