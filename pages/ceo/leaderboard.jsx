import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export default function CeoLeaderboard() {
  const router = useRouter();
  const [tab, setTab] = useState('department'); // department | user
  const [timeframe, setTimeframe] = useState('lifetime'); // lifetime | quarter (for user)
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    const user = JSON.parse(userData);
    if (!['ceo','administrator','manager'].includes(user.role)) { toast.error('Access denied'); router.push('/'); return; }
    fetchDeps(token);
    fetchData(token);
  }, [tab, timeframe, departmentId, startDate, endDate]);

  const fetchDeps = async (token) => {
    try {
      const res = await fetch('/api/ceo/departments', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
      }
    } catch {}
  };

  const fetchData = async (token) => {
    try {
      const q = new URLSearchParams();
      q.append('type', tab);
      if (tab === 'user') q.append('timeframe', timeframe);
      if (departmentId && tab === 'department') q.append('department_id', departmentId);
      if (tab === 'user' && departmentId) q.append('department_id', departmentId);
      if (tab === 'user') {
        if (startDate) q.append('start', `${startDate}T00:00:00.000Z`);
        if (endDate) q.append('end', `${endDate}T23:59:59.999Z`);
      }
      const res = await fetch(`/api/ceo/leaderboard?${q.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to load leaderboard');
      setRows(data.leaderboard || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = rows.map((r) => ({
    name: (tab === 'department' ? (r.name || 'Dept') : (r.name || 'User')), points: r.points || 0, submissions: r.submissions || 0,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-mint-cream flex items-center justify-center"><div className="spinner" /></div>
    );
  }

  return (
    <div className="min-h-screen bg-mint-cream">
      <nav className="gradient-dark shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">CEO · Leaderboard</h1>
          <button onClick={()=>router.push('/ceo')} className="px-3 py-2 rounded bg-white/20 text-white">Back</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 items-end">
          <div className="flex gap-2">
            <button onClick={()=>setTab('department')} className={`px-3 py-2 rounded ${tab==='department'?'bg-palatinate text-white':'bg-gray-200'}`}>Department</button>
            <button onClick={()=>setTab('user')} className={`px-3 py-2 rounded ${tab==='user'?'bg-palatinate text-white':'bg-gray-200'}`}>Users</button>
          </div>
          {tab === 'department' && (
            <div>
              <label className="block text-sm text-gray-600">Department</label>
              <select value={departmentId} onChange={(e)=>setDepartmentId(e.target.value)} className="border px-3 py-2 rounded min-w-[240px]">
                <option value="">All</option>
                {departments.map((d)=>(<option key={d._id||d.id} value={d._id||d.id}>{d.name}</option>))}
              </select>
            </div>
          )}
          {tab === 'user' && (
            <div className="flex gap-3 flex-wrap items-end">
              <div>
                <label className="block text-sm text-gray-600">Timeframe</label>
                <select value={timeframe} onChange={(e)=>setTimeframe(e.target.value)} className="border px-3 py-2 rounded">
                  <option value="lifetime">Lifetime</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600">Department</label>
                <select value={departmentId} onChange={(e)=>setDepartmentId(e.target.value)} className="border px-3 py-2 rounded min-w-[240px]">
                  <option value="">All</option>
                  {departments.map((d)=>(<option key={d._id||d.id} value={d._id||d.id}>{d.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600">Start</label>
                <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-600">End</label>
                <input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="border px-3 py-2 rounded" />
              </div>
            </div>
          )}
        </div>

        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-dark-purple">Top Rankings</h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">{rows.length} rows</div>
              <button
                onClick={() => {
                  const q = new URLSearchParams();
                  q.append('type', tab);
                  if (tab === 'user') q.append('timeframe', timeframe);
                  if (departmentId) q.append('department_id', departmentId);
                  if (startDate) q.append('start', `${startDate}T00:00:00.000Z`);
                  if (endDate) q.append('end', `${endDate}T23:59:59.999Z`);
                  window.open(`/api/ceo/leaderboard/export?${q.toString()}`, '_blank');
                }}
                className="px-3 py-2 rounded bg-emerald-600 text-white"
              >Export CSV</button>
            </div>
          </div>
          {rows.length === 0 ? (
            <p className="text-gray-500">No leaderboard data</p>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="points" fill="#912f56" name="Points" />
                <Bar dataKey="submissions" fill="#2563eb" name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">{tab==='department'?'Department':'User'}</th>
                  <th className="text-left py-2 px-2">Points</th>
                  <th className="text-left py-2 px-2">Submissions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx)=>(
                  <tr key={idx} className="border-b">
                    <td className="py-2 px-2 font-semibold text-dark-purple">{r.name || (tab==='department'?'Dept':'User')}</td>
                    <td className="py-2 px-2">{r.points || 0}</td>
                    <td className="py-2 px-2">{r.submissions || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
