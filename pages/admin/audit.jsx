import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { utcToIstDisplay } from '@/lib/date';

export default function AuditLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

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

    fetchLogs(token);
  }, [filterType]);

  const fetchLogs = async (token) => {
    try {
      const params = filterType ? `?entity_type=${filterType}` : '';
      const res = await fetch(`/api/admin/audit${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      toast.error('Failed to load audit logs');
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
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <button
            onClick={() => router.push('/admin')}
            className="text-sm text-white hover:text-mint-cream transition-smooth"
          >
            Back to Admin
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-dark-purple">System Audit Trail</h2>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
            >
              <option value="">All Types</option>
              <option value="task">Tasks</option>
              <option value="submission">Submissions</option>
              <option value="user">Users</option>
              <option value="setting">Settings</option>
            </select>
          </div>

          {logs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No audit logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-quinacridone-magenta">
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Date/Time</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Action</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Entity ID</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b border-gray-200 hover:bg-mint-cream transition-smooth">
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {utcToIstDisplay(new Date(log.created_at))}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-palatinate text-white">
                          {log.entity_type}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          log.action === 'create' ? 'bg-green-100 text-green-700' :
                          log.action === 'update' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'delete' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-mono text-gray-600">
                        {log.entity_id?.toString().slice(-8)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-quinacridone-magenta hover:underline">View Details</summary>
                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-w-md">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-gray-400">No details</span>
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
