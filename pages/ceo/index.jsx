import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CEODashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'ceo') {
      toast.error('Access denied - CEO only');
      router.push('/');
      return;
    }

    setUser(parsedUser);
    fetchData(token);
  }, []);

  const fetchData = async (token) => {
    try {
      const [deptRes, submissionsRes] = await Promise.all([
        fetch('/api/ceo/departments', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/ceo/submissions/recent?limit=10', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Check for authentication errors
      if (deptRes.status === 401 || submissionsRes.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      if (deptRes.ok) {
        const data = await deptRes.json();
        setDepartments(data.departments || []);
      } else {
        console.error('Departments fetch failed:', await deptRes.text());
      }

      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setRecentSubmissions(data.submissions || []);
      } else {
        console.error('Submissions fetch failed:', await submissionsRes.text());
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      router.push('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const COLORS = ['#912f56', '#521945', '#361f27', '#eaf2ef', '#0d090a'];

  const pieData = departments.map((dept) => ({
    name: dept.name,
    value: dept.completion_rate,
  }));

  const barData = departments.map((dept) => ({
    name: dept.name,
    allocated: dept.total_allocated_points,
    received: dept.total_received_points,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-mint-cream flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mint-cream">
      <nav className="gradient-dark shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">CEO Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-mint-cream">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-white hover:text-red-200 transition-smooth"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Management Quick Actions */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div
            onClick={() => router.push('/ceo/users')}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover-lift card-interactive fade-in"
          >
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-dark-purple">Manage Users</h2>
            <p className="text-gray-600 text-sm">Create, edit, and manage all users</p>
          </div>

          <div
            onClick={() => router.push('/ceo/calendar')}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover-lift card-interactive fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-dark-purple">Calendar & Tasks</h2>
            <p className="text-gray-600 text-sm">Manage your schedule and personal tasks</p>
          </div>

          <div
            onClick={() => router.push('/ceo/tasks')}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover-lift card-interactive fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-dark-purple">Manage Tasks</h2>
            <p className="text-gray-600 text-sm">Create, edit, and manage all tasks</p>
          </div>

          <div
            onClick={() => router.push('/ceo/submissions')}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover-lift card-interactive fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-dark-purple">Manage Submissions</h2>
            <p className="text-gray-600 text-sm">View and delete task submissions</p>
          </div>
        </div>

        {/* Additional Quick Actions */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div
            onClick={() => router.push('/admin/audit')}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover-lift card-interactive fade-in"
          >
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-dark-purple">Audit Logs</h2>
            <p className="text-gray-600 text-sm">View all system activity logs</p>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 fade-in">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Departments</h3>
            <p className="text-3xl font-bold text-quinacridone-magenta">{departments.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Staff</h3>
            <p className="text-3xl font-bold text-palatinate">
              {departments.reduce((sum, d) => sum + d.staff_count, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Active Tasks</h3>
            <p className="text-3xl font-bold text-dark-purple">
              {departments.reduce((sum, d) => sum + d.active_tasks, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Submissions</h3>
            <p className="text-3xl font-bold text-quinacridone-magenta">
              {departments.reduce((sum, d) => sum + (d.submissions?.total || 0), 0)}
            </p>
          </div>
        </div>

        {/* Department Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-dark-purple mb-4">Departments Overview</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {departments.map((dept, index) => (
              <div
                key={dept.id}
                onClick={() => router.push(`/ceo/department/${dept.id}`)}
                className="bg-white rounded-xl shadow-lg p-6 hover-lift fade-in cursor-pointer card-interactive"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h3 className="text-lg font-bold text-dark-purple mb-3">{dept.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completion:</span>
                    <span className={`font-bold ${
                      dept.completion_rate >= 66 ? 'text-green-600' :
                      dept.completion_rate >= 33 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {dept.completion_rate}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Staff:</span>
                    <span className="font-semibold text-dark-purple">{dept.staff_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Tasks:</span>
                    <span className="font-semibold text-dark-purple">{dept.active_tasks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Points:</span>
                    <span className="font-semibold text-quinacridone-magenta">
                      {dept.total_received_points}/{dept.total_allocated_points}
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs text-quinacridone-magenta font-semibold flex items-center gap-1">
                    View Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 scale-in">
            <h2 className="text-xl font-bold text-dark-purple mb-4">Completion Rate by Department</h2>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={true}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Completion Rate']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #912f56',
                      borderRadius: '8px',
                      padding: '10px'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 scale-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-xl font-bold text-dark-purple mb-4">Points Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="allocated" fill="#912f56" name="Allocated" />
                <Bar dataKey="received" fill="#521945" name="Received" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-xl shadow-lg p-6 scale-in mb-8" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-dark-purple mb-4">Recent Task Submissions</h2>
          {recentSubmissions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No submissions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-quinacridone-magenta">
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">User</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Task</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Department</th>
                    <th className="text-center py-3 px-4 text-dark-purple font-semibold">Status</th>
                    <th className="text-center py-3 px-4 text-dark-purple font-semibold">Points</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.map((submission, index) => (
                    <tr
                      key={submission._id}
                      className="border-b border-gray-200 hover:bg-mint-cream transition-smooth stagger-item"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-dark-purple">{submission.user_id?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{submission.user_id?.role || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{submission.task_id?.title || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {submission.task_id?.department_id?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          submission.status === 'completed' ? 'bg-green-100 text-green-700' :
                          submission.status === 'partial' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {submission.status === 'completed' ? '✓ Completed' :
                           submission.status === 'partial' ? '◐ Partial' : '✗ Not Started'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-quinacridone-magenta">
                        {submission.points_awarded}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(submission.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
