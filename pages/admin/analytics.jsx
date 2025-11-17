import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { utcToIstDisplay } from '@/lib/date';

export default function AdminAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

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

    fetchDaily(token);
  }, []);

  const fetchDaily = async (token) => {
    try {
      const res = await fetch('/api/admin/analytics/daily', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch analytics');
      setData(json);
    } catch (e) {
      toast.error(e.message);
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

  return (
    <div className="min-h-screen bg-mint-cream">
      <nav className="gradient-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Daily Analytics</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-sm text-white hover:text-mint-cream transition-smooth">Back to Admin</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!data ? (
          <p className="text-center text-gray-500 py-8">No analytics available</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Summary cards */}
            <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow p-4 border-2 border-green-400">
                <div className="text-sm text-gray-600">Date (IST)</div>
                <div className="text-2xl font-bold text-dark-purple">{utcToIstDisplay(new Date(data.date), 'dd MMM yyyy')}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 border-2 border-palatinate">
                <div className="text-sm text-gray-600">Total Tasks</div>
                <div className="text-2xl font-bold text-dark-purple">{data.total_tasks}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 border-2 border-emerald-400">
                <div className="text-sm text-gray-600">Completed Tasks</div>
                <div className="text-2xl font-bold text-dark-purple">{data.completed_tasks}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-4 border-2 border-indigo-400">
                <div className="text-sm text-gray-600">Completion Rate</div>
                <div className="text-2xl font-bold text-dark-purple">{data.completion_rate}%</div>
              </div>
            </div>

            {/* Overdue / Not Started */}
            <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="text-sm text-gray-600">Overdue Tasks</div>
                <div className="text-3xl font-bold text-red-600">{data.overdue_tasks}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <div className="text-sm text-gray-600">Not Started</div>
                <div className="text-3xl font-bold text-orange-600">{data.not_started_tasks}</div>
              </div>
            </div>

            {/* Per staff compliance */}
            <div className="lg:col-span-12 bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dark-purple">Per-staff Compliance</h2>
              </div>
              {(!data.per_staff || data.per_staff.length === 0) ? (
                <p className="text-center text-gray-500 py-6">No staff data</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-quinacridone-magenta">
                        <th className="text-left py-3 px-4 text-dark-purple font-semibold">Staff</th>
                        <th className="text-center py-3 px-4 text-dark-purple font-semibold">Compliance</th>
                        <th className="text-center py-3 px-4 text-dark-purple font-semibold">Completed</th>
                        <th className="text-center py-3 px-4 text-dark-purple font-semibold">Overdue</th>
                        <th className="text-center py-3 px-4 text-dark-purple font-semibold">Total Relevant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.per_staff.map((s) => (
                        <tr key={s.user_id} className="border-b border-gray-200">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-dark-purple">{s.name}</div>
                            <div className="text-xs text-gray-500">{s.email}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-bold">{s.compliance_percent}%</td>
                          <td className="py-3 px-4 text-center">{s.completed}</td>
                          <td className="py-3 px-4 text-center">{s.overdue}</td>
                          <td className="py-3 px-4 text-center">{s.total_relevant}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
