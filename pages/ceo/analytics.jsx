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
  const [heatmap, setHeatmap] = useState({ buckets: [] });
  const [heatStart, setHeatStart] = useState('');
  const [heatEnd, setHeatEnd] = useState('');
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');

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
      fetchHeatmap(token);
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

  const fetchHeatmap = async (token) => {
    try {
      const q = new URLSearchParams();
      if (filterDept) q.append('department_id', filterDept);
      if (heatStart) q.append('start', `${heatStart}T00:00:00.000Z`);
      if (heatEnd) q.append('end', `${heatEnd}T23:59:59.999Z`);
      const res = await fetch(`/api/ceo/analytics/heatmap?${q.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to load heatmap');
      setHeatmap({ buckets: data.buckets || [] });
    } catch (e) {
      // non-fatal
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
    await fetchHeatmap(token);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ceo_analytics_presets');
      if (raw) setPresets(JSON.parse(raw));
    } catch {}
  }, []);

  const savePreset = () => {
    const name = prompt('Preset name');
    if (!name) return;
    const p = { name, department_id: filterDept, template_id: filterTemplate, heatStart, heatEnd, days };
    const next = [...presets.filter(x => x.name !== name), p];
    setPresets(next);
    localStorage.setItem('ceo_analytics_presets', JSON.stringify(next));
    setSelectedPreset(name);
  };

  const applyPreset = async (name) => {
    const p = presets.find(x => x.name === name);
    if (!p) return;
    setSelectedPreset(name);
    setFilterDept(p.department_id || '');
    setFilterTemplate(p.template_id || '');
    setHeatStart(p.heatStart || '');
    setHeatEnd(p.heatEnd || '');
    setDays(p.days || 14);
    await refresh();
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
          <div className="flex items-end gap-3 mb-4">
            <h2 className="text-xl font-bold text-dark-purple flex-1">SLA · Missed vs Completed by Hour (IST)</h2>
            <div>
              <label className="block text-xs text-gray-600">Start</label>
              <input type="date" value={heatStart} onChange={(e)=>setHeatStart(e.target.value)} className="border px-2 py-1 rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-600">End</label>
              <input type="date" value={heatEnd} onChange={(e)=>setHeatEnd(e.target.value)} className="border px-2 py-1 rounded" />
            </div>
            <button onClick={()=>{ const token = localStorage.getItem('accessToken'); fetchHeatmap(token); }} className="px-3 py-2 rounded bg-palatinate text-white">Apply</button>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-sm text-gray-600">Presets</label>
            <select value={selectedPreset} onChange={(e)=>applyPreset(e.target.value)} className="border px-2 py-1 rounded min-w-[200px]">
              <option value="">Select preset</option>
              {presets.map((p)=>(<option key={p.name} value={p.name}>{p.name}</option>))}
            </select>
            <button onClick={savePreset} className="px-3 py-1 rounded bg-gray-200">Save</button>
          </div>
          {heatmap.buckets.length === 0 ? (
            <p className="text-gray-500">No data</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-[900px] w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs text-gray-500 py-1 px-2">Day/Hour</th>
                    {Array.from({length:24},(_,h)=> (
                      <th key={h} className="text-center text-xs text-gray-500 py-1 px-1">{String(h).padStart(2,'0')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({length:7},(_,d)=>d).map(dow => (
                    <tr key={dow}>
                      <td className="text-xs text-gray-600 py-1 px-2 font-medium">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow]}</td>
                      {Array.from({length:24},(_,h)=>{
                        const b = heatmap.buckets.find(x=>x.dow===dow && x.hour===h) || { missed:0, completed:0 };
                        const total = (b.missed||0)+(b.completed||0);
                        const missPct = total>0 ? Math.round((b.missed/total)*100) : 0;
                        const color = missPct>66 ? '#fecaca' : missPct>33 ? '#fde68a' : '#bbf7d0';
                        const title = `Hour ${String(h).padStart(2,'0')}:00\nMissed: ${b.missed||0}\nCompleted: ${b.completed||0}\nMiss%: ${missPct}%`;
                        return (
                          <td key={h} title={title} className="py-1 px-1">
                            <div className="w-6 h-6 rounded" style={{ backgroundColor: color }} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
