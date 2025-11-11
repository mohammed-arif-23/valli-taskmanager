import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TaskCard from '@/components/TaskCard';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { toast } from 'react-toastify';

export default function ArchivedTasks() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchArchivedTasks(token);
  }, []);

  const fetchArchivedTasks = async (token) => {
    try {
      const res = await fetch('/api/tasks?show_archived=true', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        // Filter only archived tasks
        const archivedOnly = data.tasks.filter((task) => task.is_archived);
        setTasks(archivedOnly);
      }
    } catch (error) {
      toast.error('Failed to load archived tasks');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-mint-cream">
        <nav className="gradient-primary shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="h-8 bg-white/20 rounded w-48 animate-pulse"></div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mint-cream">
      <nav className="gradient-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Archived Tasks</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-mint-cream font-medium">{user?.name}</span>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-white hover:text-mint-cream transition-smooth"
            >
              Back to Dashboard
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
        <div className="bg-white rounded-xl shadow-lg p-6 fade-in">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-8 h-8 text-quinacridone-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold text-dark-purple">Archived Tasks</h2>
              <p className="text-gray-600 text-sm">Tasks that have passed their due date</p>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 text-lg">No archived tasks found</p>
              <p className="text-gray-400 text-sm mt-2">Tasks will appear here after their due date</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task, index) => (
                <div key={task._id} className="stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
                  <TaskCard task={task} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
