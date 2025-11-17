import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export default function CeoAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState(null);
  const [series, setSeries] = useState([]);
  const [days, setDays] = useState(14);
  const [filterDept, setFilterDept] = useState('');
  const [filterTemplate, setFilterTemplate] = useState('');
  const [departments, setDepartments] = useState([]);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    const user = JSON.parse(userData);
    if (!['ceo','administrator','manager'].includes(user.role)) { toast.error('Access denied'); router.push('/'); return; }
    // load filters
    fetchOptions(token).then(() => {
      fetchDaily(token);
      fetchTrends(token, days);
    });
  }, []);

  const fetchDaily = async (token) => {
    try {
      const q = new URLSearchParams();
      if (filterDept) q.append('department_id', filterDept);
      if (filterTemplate) q.append('template_id', filterTemplate);
      const res = await fetch(`/api/ceo/analytics/daily?${q.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to load daily analytics');
      setDaily(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async (token, ndays) => {
    try {
      const q = new URLSearchParams();
      q.append('days', String(ndays));
      if (filterDept) q.append('department_id', filterDept);
      if (filterTemplate) q.append('template_id', filterTemplate);
      const res = await fetch(`/api/ceo/analytics/trends?${q.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to load trends');
      setSeries(data.series || []);
      setDays(data.days || ndays);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const fetchOptions = async (token) => {
    try {
      const [depRes, tplRes] = await Promise.all([
        fetch('/api/ceo/departments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/templates', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (depRes.ok) {
        const data = await depRes.json();
        setDepartments(data.departments || []);
      }
      if (tplRes.ok) {
        const data = await tplRes.json();
        setTemplates(data.templates || []);
      }
    } catch (e) {
      // silent
    }
  };

  const refresh = async () => {
    const token = localStorage.getItem('accessToken');
    await fetchDaily(token);
    await fetchTrends(token, days);
  };

  const perTemplate = daily?.per_template || [];
  const perStaff = daily?.per_staff || [];

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
          <h1 className="text-2xl font-bold text-white">CEO · Analytics</h1>
          <div className="flex gap-2 items-center">
            <button onClick={() => router.push('/ceo')} className="px-3 py-2 rounded bg-white/20 text-white">Back</button>
            <button onClick={refresh} className="px-3 py-2 rounded bg-emerald-500 text-white font-semibold">Refresh</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-white rounded-xl shadow p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-600">Department</label>
              <select value={filterDept} onChange={async (e) => {
                setFilterDept(e.target.value);
                const token = localStorage.getItem('accessToken');
                await fetchDaily(token);
                await fetchTrends(token, days);
              }} className="border px-3 py-2 rounded">
                <option value="">All</option>
                {departments.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Template</label>
              <select value={filterTemplate} onChange={async (e) => {
                setFilterTemplate(e.target.value);
                const token = localStorage.getItem('accessToken');
                await fetchDaily(token);
                await fetchTrends(token, days);
              }} className="border px-3 py-2 rounded min-w-[240px]">
                <option value="">All</option>
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>
        </section>
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-dark-purple mb-4">Today · Per-template Completion</h2>
          {perTemplate.length === 0 ? (
            <p className="text-gray-500">No data for today</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Template</th>
                    <th className="text-center py-2 px-2">Completed</th>
                    <th className="text-center py-2 px-2">Total</th>
                    <th className="text-center py-2 px-2">Completion</th>
                    <th className="text-center py-2 px-2">Overdue</th>
                    <th className="text-center py-2 px-2">Not Started</th>
                  </tr>
                </thead>
                <tbody>
                  {perTemplate.map((t) => (
                    <tr key={t.template_id} className="border-b">
                      <td className="py-2 px-2 font-semibold text-dark-purple">{t.title}</td>
                      <td className="py-2 px-2 text-center text-emerald-600 font-bold">{t.completed}</td>
                      <td className="py-2 px-2 text-center">{t.total}</td>
                      <td className="py-2 px-2 text-center font-semibold">{t.completion_rate}%</td>
                      <td className="py-2 px-2 text-center text-red-600">{t.overdue}</td>
                      <td className="py-2 px-2 text-center text-orange-600">{t.not_started}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-dark-purple mb-4">Today · Per-staff Compliance</h2>
          {perStaff.length === 0 ? (
            <p className="text-gray-500">No staff tasks today</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Staff</th>
                    <th className="text-center py-2 px-2">Compliance</th>
                    <th className="text-center py-2 px-2">Completed</th>
                    <th className="text-center py-2 px-2">Overdue</th>
                    <th className="text-center py-2 px-2">Total Relevant</th>
                  </tr>
                </thead>
                <tbody>
                  {perStaff.map((s) => (
                    <tr key={s.user_id} className="border-b">
                      <td className="py-2 px-2">
                        <div className="font-semibold text-dark-purple">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.email}</div>
                      </td>
                      <td className="py-2 px-2 text-center font-bold">{s.compliance_percent}%</td>
                      <td className="py-2 px-2 text-center">{s.completed}</td>
                      <td className="py-2 px-2 text-center">{s.overdue}</td>
                      <td className="py-2 px-2 text-center">{s.total_relevant}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-dark-purple">Trend · Completion by Template (last {days} days)</h2>
            <div className="flex gap-2">
              <button onClick={async () => { const token = localStorage.getItem('accessToken'); await fetchTrends(token, 7); }} className="px-3 py-1 rounded bg-gray-200">7d</button>
              <button onClick={async () => { const token = localStorage.getItem('accessToken'); await fetchTrends(token, 14); }} className="px-3 py-1 rounded bg-gray-200">14d</button>
              <button onClick={async () => { const token = localStorage.getItem('accessToken'); await fetchTrends(token, 30); }} className="px-3 py-1 rounded bg-gray-200">30d</button>
            </div>
          </div>
          {series.length === 0 ? (
            <p className="text-gray-500">No trend data</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })} />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip formatter={(value, name) => [`${value}%`, name]} labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })} />
                <Legend />
                {Object.keys(series[0]).filter(k => k !== 'date').map((key, idx) => (
                  <Line key={key} type="monotone" dataKey={key} strokeWidth={2} stroke={['#912f56','#521945','#361f27','#0d090a','#16a34a','#2563eb','#d97706'][idx % 7]} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>
      </main>
    </div>
  );
}
