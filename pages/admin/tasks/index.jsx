import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { utcToIstDisplay } from '@/lib/date';

export default function AdminTasks() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterArchived, setFilterArchived] = useState('false');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (!['administrator', 'ceo', 'manager'].includes(user.role)) {
      toast.error('Access denied');
      router.push('/');
      return;
    }

    fetchTasks(token);
  }, [filterArchived]);

  const fetchTasks = async (token) => {
    try {
      const res = await fetch(`/api/admin/tasks?is_archived=${filterArchived}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (taskId) => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Task archived');
        fetchTasks(token);
      }
    } catch (error) {
      toast.error('Failed to archive task');
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
      <nav className="gradient-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Manage Tasks</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="text-sm text-white hover:text-mint-cream transition-smooth"
            >
              Back to Admin
            </button>
            <button
              onClick={() => router.push('/admin/tasks/new')}
              className="bg-white text-quinacridone-magenta px-4 py-2 rounded-lg hover-lift font-semibold"
            >
              + Create Task
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-dark-purple">All Tasks</h2>
            <select
              value={filterArchived}
              onChange={(e) => setFilterArchived(e.target.value)}
              className="px-4 py-2 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
            >
              <option value="false">Active Tasks</option>
              <option value="true">Archived Tasks</option>
            </select>
          </div>

          {tasks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No tasks found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-quinacridone-magenta">
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Title</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Priority</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Points</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Due Date</th>
                    <th className="text-center py-3 px-4 text-dark-purple font-semibold">Actions</th>
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
                      <td className="py-4 px-4 font-bold text-quinacridone-magenta">{task.default_points}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {utcToIstDisplay(new Date(task.due_at_utc))}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/tasks/${task._id}`)}
                            className="text-blue-600 hover:text-blue-800 transition-smooth"
                          >
                            View
                          </button>
                          {!task.is_archived && (
                            <button
                              onClick={() => handleArchive(task._id)}
                              className="text-red-600 hover:text-red-800 transition-smooth"
                            >
                              Archive
                            </button>
                          )}
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
