import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function DepartmentDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [department, setDepartment] = useState(null);
  const [staff, setStaff] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'ceo') {
      toast.error('Access denied - CEO only');
      router.push('/');
      return;
    }

    fetchDepartmentDetails(token);
  }, [id]);

  const fetchDepartmentDetails = async (token) => {
    try {
      // Fetch department info
      const deptRes = await fetch('/api/ceo/departments', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (deptRes.ok) {
        const deptData = await deptRes.json();
        const dept = deptData.departments.find((d) => d.id === id);
        setDepartment(dept);
      }

      // Fetch staff for this department
      const staffRes = await fetch(`/api/ceo/departments/${id}/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData.staff || []);
      }

      // Fetch tasks for this department
      const tasksRes = await fetch(`/api/admin/tasks?department_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }
    } catch (error) {
      toast.error('Failed to load department details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mint-cream flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="min-h-screen bg-mint-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Department not found</p>
          <button
            onClick={() => router.push('/ceo')}
            className="gradient-primary text-white px-6 py-2 rounded-lg hover-lift"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const staffPerformanceData = staff.map((s) => ({
    name: s.name.split(' ')[0],
    performance: s.performance?.percent || 0,
    points: s.performance?.received_points || 0,
  }));

  return (
    <div className="min-h-screen bg-mint-cream">
      <nav className="gradient-dark shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">{department.name} Department</h1>
            <p className="text-sm text-mint-cream">Detailed Overview</p>
          </div>
          <button
            onClick={() => router.push('/ceo')}
            className="text-sm text-white hover:text-mint-cream transition-smooth"
          >
            ← Back to CEO Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Department Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 fade-in">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Completion Rate</h3>
            <p className="text-3xl font-bold text-quinacridone-magenta">{department.completion_rate}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Staff Members</h3>
            <p className="text-3xl font-bold text-palatinate">{department.staff_count}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Active Tasks</h3>
            <p className="text-3xl font-bold text-dark-purple">{department.active_tasks}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Points</h3>
            <p className="text-3xl font-bold text-quinacridone-magenta">
              {department.total_received_points}/{department.total_allocated_points}
            </p>
          </div>
        </div>

        {/* Staff Performance Chart */}
        {staff.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 scale-in">
            <h2 className="text-xl font-bold text-dark-purple mb-4">Staff Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={staffPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="performance" fill="#912f56" name="Performance %" />
                <Bar dataKey="points" fill="#521945" name="Points Earned" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Staff Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 scale-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-bold text-dark-purple mb-4">Staff Members</h2>
          {staff.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No staff members in this department</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-quinacridone-magenta">
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Role</th>
                    <th className="text-center py-3 px-4 text-dark-purple font-semibold">Performance</th>
                    <th className="text-center py-3 px-4 text-dark-purple font-semibold">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.id} className="border-b border-gray-200 hover:bg-mint-cream transition-smooth">
                      <td className="py-4 px-4 font-medium text-dark-purple">{member.name}</td>
                      <td className="py-4 px-4 text-gray-600">{member.email}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-palatinate text-white">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          (member.performance?.percent || 0) >= 66 ? 'text-green-600 bg-green-50' :
                          (member.performance?.percent || 0) >= 33 ? 'text-orange-600 bg-orange-50' :
                          'text-red-600 bg-red-50'
                        }`}>
                          {member.performance?.percent || 0}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="font-semibold text-quinacridone-magenta">
                          {member.performance?.received_points || 0}
                        </div>
                        <div className="text-gray-500 text-xs">
                          / {member.performance?.allocated_points || 0}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 scale-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-bold text-dark-purple mb-4">Department Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No tasks assigned to this department</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-quinacridone-magenta">
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Title</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Priority</th>
                    <th className="text-center py-3 px-4 text-dark-purple font-semibold">Points</th>
                    <th className="text-center py-3 px-4 text-dark-purple font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task._id} className="border-b border-gray-200 hover:bg-mint-cream transition-smooth">
                      <td className="py-4 px-4 font-medium text-dark-purple">{task.title}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-palatinate text-white">
                          {task.type}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-sm font-semibold ${
                          task.priority === 'high' ? 'text-red-600' :
                          task.priority === 'medium' ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-quinacridone-magenta">
                        {task.default_points}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {task.is_archived ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                            Archived
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
