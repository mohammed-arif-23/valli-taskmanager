import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Meter from '@/components/Meter';
import TaskCard from '@/components/TaskCard';
import { SkeletonCard, SkeletonMeter } from '@/components/SkeletonLoader';
import { toast } from 'react-toastify';
import { IST_TIMEZONE } from '@/lib/date';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // all | daily | overdueToday

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsed = JSON.parse(userData);
    // If CEO, redirect to CEO dashboard and do not render staff UI
    if (parsed.role === 'ceo') {
      router.push('/ceo');
      return;
    }
    setUser(parsed);
    fetchData(token, parsed);
  }, [showArchived, router.query.refresh]);

  const fetchData = async (token, userData) => {
    try {
      // Fetch overview
      const overviewRes = await fetch(`/api/users/${userData.id}/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (overviewRes.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.clear();
        router.push('/login');
        return;
      }

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setOverview(overviewData);
      }

      // Fetch tasks
      const tasksRes = await fetch(`/api/tasks?show_archived=${showArchived}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (tasksRes.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.clear();
        router.push('/login');
        return;
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        let submissionsMap = {};

        // Fetch submissions for these tasks if there are any
        if (tasksData.tasks && tasksData.tasks.length > 0) {
          const taskIds = tasksData.tasks.map((t) => t._id);
          try {
            const submissionsRes = await fetch('/api/tasks/submissions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ task_ids: taskIds }),
            });

            if (submissionsRes.ok) {
              const submissionsData = await submissionsRes.json();
              submissionsData.submissions.forEach((sub) => {
                submissionsMap[sub.task_id] = sub;
              });
              setSubmissions(submissionsMap);
            }
          } catch (err) {
            console.error('Failed to fetch submissions:', err);
            // Continue without submissions
          }

          // Sort tasks: incomplete first, then completed
          const sortedTasks = tasksData.tasks.sort((a, b) => {
            const aCompleted = submissionsMap[a._id]?.status === 'completed';
            const bCompleted = submissionsMap[b._id]?.status === 'completed';
            if (aCompleted === bCompleted) return 0;
            return aCompleted ? 1 : -1;
          });

          setTasks(sortedTasks);
        } else {
          setTasks([]);
        }
        setNextCursor(tasksData.nextCursor);
      }
    } catch (error) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-mint-cream">
        <nav className="gradient-primary shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="h-8 bg-white/20 rounded w-48 animate-pulse"></div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <SkeletonMeter />
          </div>
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
          <h1 className="text-2xl font-bold text-white">Task Manager</h1>
          {/* Navbar simplified: removed user action buttons for a cleaner user view */}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats Widget */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-green-400 scale-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Completed Today</p>
                <p className="text-3xl font-bold text-green-600">
                  {tasks.filter(t => submissions[t._id]?.status === 'completed' && 
                    new Date(submissions[t._id].created_at).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-orange-400 scale-in" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-orange-600">
                  {tasks.filter(t => !submissions[t._id] || submissions[t._id]?.status !== 'completed').length}
                </p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-red-400 scale-in" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Overdue</p>
                <p className="text-3xl font-bold text-red-600">
                  {tasks.filter(t => new Date(t.due_at_utc) < new Date() && 
                    (!submissions[t._id] || submissions[t._id]?.status !== 'completed')).length}
                </p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Tasks Grid - Main Content (Left Side - 8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl shadow-lg p-6 border-2 border-quinacridone-magenta fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-dark-purple">Your Tasks</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/archived')}
                  className="flex items-center gap-2 px-4 py-2 bg-palatinate text-white rounded-lg hover-lift transition-smooth font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  Archived
                </button>
                <label className="flex items-center gap-2 text-sm font-medium text-dark-purple cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="w-4 h-4 text-quinacridone-magenta rounded focus:ring-2 focus:ring-palatinate"
                  />
                  Include archived
                </label>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-3">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${viewMode === 'all' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${viewMode === 'daily' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Daily Tasks (Today)
                </button>
                <button
                  onClick={() => setViewMode('overdueToday')}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${viewMode === 'overdueToday' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Overdue Today
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tasks by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border-2 border-gray-300 rounded-lg focus:border-quinacridone-magenta focus:outline-none"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex gap-3 flex-wrap">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-quinacridone-magenta focus:outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-quinacridone-magenta focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="completed">✅ Completed</option>
                  <option value="overdue">⚠️ Overdue</option>
                </select>
                {(searchQuery || filterPriority !== 'all' || filterStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterPriority('all');
                      setFilterStatus('all');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-smooth font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {(() => {
              // Apply filters
              let filteredTasks = tasks.filter(task => {
                // Daily/Overdue Today filters based on occurrence_date == today's IST midnight
                if (viewMode !== 'all') {
                  const now = new Date();
                  const istNow = utcToZonedTime(now, IST_TIMEZONE);
                  const istMidnight = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 0, 0, 0, 0);
                  const todayIstMidnightUtc = zonedTimeToUtc(istMidnight, IST_TIMEZONE);

                  const occ = task.occurrence_date ? new Date(task.occurrence_date) : null;
                  const isTodayFixed = occ && occ.getTime() === todayIstMidnightUtc.getTime();
                  const submission = submissions[task._id];
                  const isCompleted = submission?.status === 'completed';
                  const isOverdue = new Date(task.due_at_utc) < now && !isCompleted;

                  if (viewMode === 'daily' && !isTodayFixed) return false;
                  if (viewMode === 'overdueToday' && !(isTodayFixed && isOverdue)) return false;
                }

                // Search filter
                if (searchQuery) {
                  const query = searchQuery.toLowerCase();
                  if (!task.title.toLowerCase().includes(query) && 
                      !task.description.toLowerCase().includes(query)) {
                    return false;
                  }
                }
                
                // Priority filter
                if (filterPriority !== 'all' && task.priority !== filterPriority) {
                  return false;
                }
                
                // Status filter
                if (filterStatus !== 'all') {
                  const isCompleted = submissions[task._id]?.status === 'completed';
                  const isOverdue = new Date(task.due_at_utc) < new Date() && !isCompleted;
                  
                  if (filterStatus === 'completed' && !isCompleted) return false;
                  if (filterStatus === 'pending' && (isCompleted || isOverdue)) return false;
                  if (filterStatus === 'overdue' && !isOverdue) return false;
                }
                
                return true;
              });

              if (filteredTasks.length === 0) {
                return (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-gray-500 text-lg">No tasks found</p>
                    {(searchQuery || filterPriority !== 'all' || filterStatus !== 'all') && (
                      <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                    )}
                  </div>
                );
              }

              // In Daily view, group tasks by source_template_id to render a checklist with progress
              if (viewMode === 'daily') {
                const groups = {};
                for (const t of filteredTasks) {
                  const key = t.source_template_id?._id || t.source_template_id || 'ungrouped';
                  if (!groups[key]) {
                    groups[key] = { title: t.source_template_id?.title || 'Misc Tasks', items: [] };
                  }
                  groups[key].items.push(t);
                }

                const groupEntries = Object.entries(groups);
                return (
                  <div className="space-y-6">
                    {groupEntries.map(([gid, group], gi) => {
                      // Progress: N completed out of M
                      const total = group.items.length;
                      const completed = group.items.filter((it) => submissions[it._id]?.status === 'completed').length;
                      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                      return (
                        <div key={gid} className="border-2 border-quinacridone-magenta rounded-xl p-4 bg-white stagger-item" style={{ animationDelay: `${gi * 0.05}s` }}>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-bold text-dark-purple">{group.title}</h3>
                            <div className="text-sm text-gray-600 font-medium">{completed} / {total} completed ({percent}%)</div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                            {group.items.map((task, index) => (
                              <div key={task._id} className="stagger-item" style={{ animationDelay: `${index * 0.03}s` }}>
                                <TaskCard task={task} submission={submissions[task._id]} />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              // Non-daily views: render flat list
              return (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                  {filteredTasks.map((task, index) => (
                    <div
                      key={task._id}
                      className="stagger-item"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <TaskCard task={task} submission={submissions[task._id]} />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Performance Gauge - Sidebar (Right Side - 4 cols) */}
          {overview && (
            <div className="lg:col-span-4 bg-white rounded-xl shadow-lg p-6 border-2 border-quinacridone-magenta scale-in">
              <h2 className="text-2xl font-bold mb-4 text-dark-purple text-center">
                Your Performance
              </h2>
              <Meter
                allocatedPoints={overview.allocated_points}
                receivedPoints={overview.received_points}
                thresholds={overview.thresholds}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
