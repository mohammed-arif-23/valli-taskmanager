const { connectDB } = require('@/lib/db');
const Task = require('@/models/Task');
const { requireAuth, requireRole } = require('@/lib/auth');
const { istToUtc } = require('@/lib/date');
const { createAuditLog } = require('@/lib/audit');
const mongoose = require('mongoose');

async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      // Filters: department_id, assigned_to, template_id, is_archived, due_from, due_to, occurrence_date, search
      // Pagination: page, limit
      // Sorting: sortBy, sortDir
      const {
        department_id,
        assigned_to,
        template_id,
        is_archived,
        due_from,
        due_to,
        occurrence_date,
        search,
        page = '1',
        limit = '20',
        sortBy = 'created_at',
        sortDir = 'desc',
      } = req.query;

      const query = {};
      if (department_id && mongoose.Types.ObjectId.isValid(department_id)) {
        query.department_id = department_id;
      }
      if (assigned_to && mongoose.Types.ObjectId.isValid(assigned_to)) {
        query.assigned_to = { $in: [assigned_to] };
      }
      if (template_id && mongoose.Types.ObjectId.isValid(template_id)) {
        query.source_template_id = template_id;
      }
      if (is_archived !== undefined) query.is_archived = is_archived === 'true';
      if (occurrence_date) {
        // Filter tasks generated for a specific IST date (stored as UTC date-only in occurrence_date)
        // Expecting ISO date string (YYYY-MM-DD)
        const dayStart = new Date(occurrence_date);
        const dayEnd = new Date(occurrence_date);
        dayEnd.setUTCHours(23, 59, 59, 999);
        query.occurrence_date = { $gte: dayStart, $lte: dayEnd };
      }
      if (due_from || due_to) {
        query.due_at_utc = {};
        if (due_from) query.due_at_utc.$gte = new Date(due_from);
        if (due_to) query.due_at_utc.$lte = new Date(due_to);
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const skip = (pageNum - 1) * limitNum;

      const sort = {};
      const allowedSort = new Set(['created_at', 'updated_at', 'due_at_utc', 'priority']);
      const dir = String(sortDir).toLowerCase() === 'asc' ? 1 : -1;
      sort[allowedSort.has(sortBy) ? sortBy : 'created_at'] = dir;

      const [items, total] = await Promise.all([
        Task.find(query)
          .populate('department_id', 'name')
          .populate('created_by', 'name email')
          .populate('assigned_to', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Task.countDocuments(query),
      ]);

      return res.status(200).json({ items, total, page: pageNum, limit: limitNum });
    }

    if (req.method === 'POST') {
      const { title, description, type, priority, default_points, due_date_ist, department_id, assigned_to, allow_late_submission } = req.body;

      // Validation
      if (!title || !description || !type || !priority || !default_points || !due_date_ist || !department_id) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'All fields are required' },
        });
      }

      // Convert IST to UTC
      const dueAtUtc = istToUtc(due_date_ist);

      // Create task
      const task = await Task.create({
        title,
        description,
        type,
        priority,
        default_points,
        due_at_utc: dueAtUtc,
        department_id,
        assigned_to: assigned_to || [], // Empty array means all users in department
        allow_late_submission: allow_late_submission || false,
        created_by: req.user.userId,
      });

      // Create audit log
      await createAuditLog('task', task._id, 'create', req.user.userId, {
        task: task.toObject(),
      });

      return res.status(201).json({ task });
    }

    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  } catch (error) {
    console.error('Task management error:', error);
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
}

export default requireAuth(requireRole('ceo', 'administrator', 'manager')(handler));
