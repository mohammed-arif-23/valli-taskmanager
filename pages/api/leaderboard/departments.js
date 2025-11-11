import dbConnect from '@/lib/db';
import User from '@/models/User';
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

    // Aggregate users by department
    const departmentStats = await User.aggregate([
      {
        $match: { is_active: true }
      },
      {
        $group: {
          _id: '$department_id',
          total_allocated: { $sum: '$allocated_points' },
          total_received: { $sum: '$received_points' },
          user_count: { $sum: 1 },
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: '$department'
      },
      {
        $project: {
          department_name: '$department.name',
          total_allocated: 1,
          total_received: 1,
          user_count: 1,
          completion_rate: {
            $cond: [
              { $eq: ['$total_allocated', 0] },
              0,
              { $multiply: [{ $divide: ['$total_received', '$total_allocated'] }, 100] }
            ]
          }
        }
      },
      {
        $sort: { completion_rate: -1 }
      }
    ]);

    res.status(200).json({ leaderboard: departmentStats });
  } catch (error) {
    console.error('Get department leaderboard error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
}
