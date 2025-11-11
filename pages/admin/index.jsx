import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'administrator' && parsedUser.role !== 'manager') {
      router.push('/');
      return;
    }

    setUser(parsedUser);
    fetchStaff(token);
  }, [filterRole, searchTerm]);

  const fetchStaff = async (token) => {
    try {
      const params = new URLSearchParams();
      if (filterRole) params.append('role', filterRole);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`/api/admin/staff?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff);
      }
    } catch (error) {
      toast.error('Failed to load staff data');
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

  const getPerformanceColor = (percent) => {
    if (percent >= 66) return 'text-green-600 bg-green-50';
    if (percent >= 33) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mint-cream flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mint-cream">
      <nav className="gradient-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-mint-cream">{user?.name}</span>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-white hover:text-mint-cream transition-smooth"
            >
              Dashboard
            </button>
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
        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div
            onClick={() => router.push('/admin/tasks/new')}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover-lift card-interactive fade-in"
          >
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-dark-purple">Create Task</h2>
            <p className="text-gray-600 text-sm">Create a new task for your department</p>
          </div>

          <div
            onClick={() => router.push('/admin/tasks')}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover-lift card-interactive fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-dark-purple">Manage Tasks</h2>
            <p className="text-gray-600 text-sm">View and edit all tasks</p>
          </div>

          <div
            onClick={() => router.push('/admin/audit')}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover-lift card-interactive fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-dark-purple">Audit Logs</h2>
            <p className="text-gray-600 text-sm">View system audit trail</p>
          </div>
        </div>

        {/* Staff Performance Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 scale-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-dark-purple">Department Staff Performance</h2>
            <div className="flex gap-4">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate transition-smooth"
              >
                <option value="">All Roles</option>
                <option value="reception">Reception</option>
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
              </select>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate transition-smooth w-64"
              />
            </div>
          </div>

          {staff.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No staff members found</p>
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
                    <th className="text-center py-3 px-4 text-dark-purple font-semibold">Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member, index) => (
                    <tr
                      key={member.id}
                      className="border-b border-gray-200 hover:bg-mint-cream transition-smooth stagger-item"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="py-4 px-4 font-medium text-dark-purple">{member.name}</td>
                      <td className="py-4 px-4 text-gray-600">{member.email}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-palatinate text-white">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getPerformanceColor(member.performance.percent)}`}>
                          {member.performance.percent}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-sm">
                        <div className="font-semibold text-quinacridone-magenta">
                          {member.performance.received_points}
                        </div>
                        <div className="text-gray-500 text-xs">
                          / {member.performance.allocated_points}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex justify-center gap-2 text-xs">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                            ✓ {member.performance.completed_count}
                          </span>
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                            ◐ {member.performance.partial_count}
                          </span>
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                            ✗ {member.performance.not_started_count}
                          </span>
                        </div>
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
