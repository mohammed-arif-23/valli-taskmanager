import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

export default function DepartmentDashboard() {
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [deptId, setDeptId] = useState('');
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    const user = JSON.parse(userData);
    if (!['ceo','administrator','manager'].includes(user.role)) { toast.error('Access denied'); router.push('/'); return; }
    fetchDepartments(token);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) fetchDaily(token);
  }, [deptId]);

  const fetchDepartments = async (token) => {
    try {
      const res = await fetch('/api/ceo/departments', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
        if ((data.departments||[]).length > 0) setDeptId(data.departments[0]._id || data.departments[0].id);
      }
    } catch {}
  };

  const fetchDaily = async (token) => {
    try {
      const q = new URLSearchParams();
      if (deptId) q.append('department_id', deptId);
      const res = await fetch(`/api/ceo/analytics/daily?${q.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to load');
      setDaily(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const perTemplate = daily?.per_template || [];
  const perStaff = daily?.per_staff || [];

  const kpis = useMemo(() => {
    const totalTasks = perTemplate.reduce((s,t) => s + (t.total||0), 0);
    const completed = perTemplate.reduce((s,t) => s + (t.completed||0), 0);
    const notStarted = perTemplate.reduce((s,t) => s + (t.not_started||0), 0);
    const overdue = perTemplate.reduce((s,t) => s + (t.overdue||0), 0);
    const completionPct = totalTasks>0 ? Math.round((completed/totalTasks)*100) : 0;
    return { totalTasks, completed, notStarted, overdue, completionPct };
  }, [perTemplate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mint-cream flex items-center justify-center"><div className="spinner"></div></div>
    );
  }

  return (
    <div className="min-h-screen bg-mint-cream">
      <nav className="gradient-dark shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">CEO · Department Dashboard</h1>
          <button onClick={()=>router.push('/ceo')} className="px-3 py-2 rounded bg-white/20 text-white">Back</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-white rounded-xl shadow p-4">
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-sm text-gray-600">Department</label>
              <select value={deptId} onChange={(e)=>setDeptId(e.target.value)} className="border px-3 py-2 rounded min-w-[260px]">
                {departments.map((d)=>(<option key={d._id||d.id} value={d._id||d.id}>{d.name}</option>))}
              </select>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-500">Completion %</div>
            <div className="text-3xl font-bold text-emerald-600">{kpis.completionPct}%</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-500">Overdue</div>
            <div className="text-3xl font-bold text-red-600">{kpis.overdue}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-500">Not Started</div>
            <div className="text-3xl font-bold text-orange-600">{kpis.notStarted}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-3xl font-bold text-palatinate">{kpis.completed}</div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-dark-purple">Per-staff Compliance</h2>
            <button
              onClick={()=>{
                const q = new URLSearchParams();
                if (deptId) q.append('department_id', deptId);
                q.append('kind','per_staff');
                window.open(`/api/ceo/analytics/daily/export?${q.toString()}`,'_blank');
              }}
              className="px-3 py-2 rounded bg-emerald-600 text-white"
            >Export CSV</button>
          </div>
          {perStaff.length === 0 ? <p className="text-gray-500">No staff tasks today</p> : (
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
                  {perStaff.map((s)=>(
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
            <h2 className="text-xl font-bold text-dark-purple">Per-template Completion (Today)</h2>
            <button
              onClick={()=>{
                const q = new URLSearchParams();
                if (deptId) q.append('department_id', deptId);
                q.append('kind','per_template');
                window.open(`/api/ceo/analytics/daily/export?${q.toString()}`,'_blank');
              }}
              className="px-3 py-2 rounded bg-emerald-600 text-white"
            >Export CSV</button>
          </div>
          {perTemplate.length === 0 ? <p className="text-gray-500">No data for today</p> : (
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
                  {perTemplate.map((t)=>(
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
      </main>
    </div>
  );
}
