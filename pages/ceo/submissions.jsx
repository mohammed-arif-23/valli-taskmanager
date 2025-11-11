import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

export default function CEOSubmissions() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
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

    fetchData(token);
  }, [filterStatus, filterDepartment]);

  const fetchData = async (token) => {
    try {
      const [submissionsRes, deptsRes] = await Promise.all([
        fetch('/api/ceo/submissions/all', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/departments', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        let filtered = data.submissions;

        if (filterStatus) {
          filtered = filtered.filter(s => s.status === filterStatus);
        }

        if (filterDepartment) {
          filtered = filtered.filter(s => s.task_id?.department_id?._id === filterDepartment);
        }

        setSubmissions(filtered);
      }

      if (deptsRes.ok) {
        const data = await deptsRes.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (submissionId) => {
    if (!confirm('⚠️ PERMANENT DELETE: This will permanently delete this submission. This cannot be undone. Are you sure?')) return;

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/ceo/submissions/${submissionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Submission permanently deleted');
        fetchData(token);
      } else {
        const data = await res.json();
        toast.error(data.error?.message || 'Failed to delete submission');
      }
    } catch (error) {
      toast.error('Failed to delete submission');
    }
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
      <nav className="gradient-dark shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Submissions Management</h1>
          <button
            onClick={() => router.push('/ceo')}
            className="text-sm text-white hover:text-mint-cream transition-smooth"
          >
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-dark-purple">All Task Submissions</h2>
            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="partial">Partial</option>
                <option value="not_started">Not Started</option>
              </select>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-2 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {submissions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No submissions found</p>
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
                    <th className="text-center py-3 px-4 text-dark-purple font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission, index) => (
                    <tr
                      key={submission._id}
                      className="border-b border-gray-200 hover:bg-mint-cream transition-smooth stagger-item"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium text-dark-purple">
                          {submission.user_id?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">{submission.user_id?.email || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{submission.task_id?.title || 'N/A'}</td>
                      <td className="py-4 px-4 text-gray-600">
                        {submission.task_id?.department_id?.name || 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            submission.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : submission.status === 'partial'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {submission.status === 'completed'
                            ? '✓ Completed'
                            : submission.status === 'partial'
                            ? '◐ Partial'
                            : '✗ Not Started'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-quinacridone-magenta">
                        {submission.points_awarded}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(submission.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleDelete(submission._id)}
                          className="text-red-600 hover:text-red-800 transition-smooth font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Warning:</strong> Deleting submissions will permanently remove them from the database
              and affect user performance calculations. This action cannot be undone.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
