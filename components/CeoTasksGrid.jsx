import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { utcToIstDisplay } from '@/lib/date';
import { toast } from 'react-toastify';
import TaskDetailsDrawer from '@/components/TaskDetailsDrawer';

const ALL_COLUMNS = [
  { id: 'title', name: 'Title' },
  { id: 'department', name: 'Department' },
  { id: 'priority', name: 'Priority' },
  { id: 'due_date', name: 'Due (IST)' },
  { id: 'archived', name: 'Archived' },
];

const DEFAULT_VISIBLE_COLUMNS = new Set(['title', 'department', 'priority', 'due_date', 'archived']);

export default function CeoTasksGrid({ defaultDepartmentId = '' }) {
  const router = useRouter();

  const handlePermanentDelete = async (taskId) => {
    if (!confirm('⚠️ This will permanently delete the task and all its submissions. This action cannot be undone. Are you sure?')) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/ceo/tasks/${taskId}/permanent`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Task permanently deleted');
        fetchTasks(); // Refresh the grid
      } else {
        const data = await res.json();
        toast.error(data.error?.message || 'Failed to delete task');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});

  // filters
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId);
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [assignedCsv, setAssignedCsv] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [dueFrom, setDueFrom] = useState(''); // YYYY-MM-DD
  const [dueTo, setDueTo] = useState('');     // YYYY-MM-DD

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  // dropdown options
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);

  const q = useMemo(() => ({
    page,
    limit,
    sortBy,
    sortDir,
    department_id: departmentId || undefined,
    is_archived: archived ? 'true' : undefined,
    search: search || undefined,
    assigned_to: assignedCsv.trim() ? assignedCsv.trim() : undefined,
    template_id: templateId || undefined,
    due_from: dueFrom ? `${dueFrom}T00:00:00.000Z` : undefined,
    due_to: dueTo ? `${dueTo}T23:59:59.999Z` : undefined,
  }), [page, limit, sortBy, sortDir, departmentId, archived, search, assignedCsv, templateId, dueFrom, dueTo]);

  async function fetchTasks() {
    const token = localStorage.getItem('accessToken');
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.set(k, String(v)); });
      const res = await fetch(`/api/ceo/tasks?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.clear();
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to load tasks');
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total || 0));
      setSelected({});
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTasks(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, limit, sortBy, sortDir, departmentId, archived]);
  // reflect filters too
  useEffect(() => { fetchTasks(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [search, assignedCsv, templateId, dueFrom, dueTo]);

  // Fetch dropdown data on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    async function fetchOptions() {
      try {
        const [usersRes, tplRes, deptsRes] = await Promise.all([
          fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/templates', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/departments', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users || []);
        }
        if (tplRes.ok) {
          const data = await tplRes.json();
          setTemplates(data.templates || []);
        }
        if (deptsRes.ok) {
          const data = await deptsRes.json();
          setDepartments(data.departments || []);
        }
      } catch (e) {
        toast.error('Failed to load filter options');
      }
    }
    fetchOptions();

    // Load column visibility from localStorage
    try {
      const saved = localStorage.getItem('ceo_tasks_cols');
      if (saved) {
        setVisibleColumns(new Set(JSON.parse(saved)));
      }
    } catch (e) { /* ignore */ }
  }, []);

  // URL-state: read from query on mount
  useEffect(() => {
    if (!router.isReady) return;
    const qp = router.query || {};
    setPage(Number(qp.page || 1));
    setLimit(Number(qp.limit || 20));
    setSortBy(String(qp.sortBy || 'created_at'));
    setSortDir(String(qp.sortDir || 'desc'));
    setDepartmentId(String(qp.department_id || defaultDepartmentId || ''));
    setArchived(String(qp.is_archived || 'false') === 'true');
    setSearch(String(qp.search || ''));
    setAssignedCsv(String(qp.assigned_to || ''));
    setTemplateId(String(qp.template_id || ''));
    setDueFrom(String(qp.due_from || '').split('T')[0] || '');
    setDueTo(String(qp.due_to || '').split('T')[0] || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // push to URL on state change (shallow)
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.set(k, String(v)); });
    const url = `${router.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(url, undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Save column visibility to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ceo_tasks_cols', JSON.stringify(Array.from(visibleColumns)));
    } catch (e) { /* ignore */ }
  }, [visibleColumns]);

  const toggleAll = (checked) => {
    const map = {};
    if (checked) items.forEach((it) => { map[String(it._id)] = true; });
    setSelected(map);
  };

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  const applyBulk = async (action, payload = {}) => {
    if (selectedIds.length === 0) return;
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch('/api/ceo/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, task_ids: selectedIds, payload }),
      });
      if (res.status === 401) { toast.error('Session expired'); localStorage.clear(); window.location.href = '/login'; return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Bulk action failed');
      toast.success(`Updated ${data.count} task(s)`);
      fetchTasks();
    } catch (e) { toast.error(e.message); }
  };

  const archiveOne = async (taskId, doUnarchive = false) => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch('/api/ceo/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: doUnarchive ? 'unarchive' : 'archive', task_ids: [taskId] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Action failed');
      toast.success(doUnarchive ? 'Unarchived' : 'Archived');
      fetchTasks();
    } catch (e) { toast.error(e.message); }
  };

  const openDrawer = (task) => { setActiveTask(task); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setActiveTask(null); };
  const onSaved = () => { closeDrawer(); fetchTasks(); };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Search</label>
          <input value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter'){ setPage(1); fetchTasks(); } }} className="px-3 py-2 border rounded min-w-[220px]" placeholder="Title or description" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Department</label>
          <select value={departmentId} onChange={(e)=>{ setDepartmentId(e.target.value); setPage(1); }} className="px-3 py-2 border rounded min-w-[220px]">
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Assigned To</label>
          <select value={assignedCsv} onChange={(e)=>{ setAssignedCsv(e.target.value); setPage(1); }} className="px-3 py-2 border rounded min-w-[220px]">
            <option value="">All Users</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Template</label>
          <select value={templateId} onChange={(e)=>{ setTemplateId(e.target.value); setPage(1); }} className="px-3 py-2 border rounded min-w-[220px]">
            <option value="">All Templates</option>
            {templates.map(t => (
              <option key={t._id} value={t._id}>{t.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Due From</label>
          <input type="date" value={dueFrom} onChange={(e)=>{ setDueFrom(e.target.value); setPage(1); }} className="px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Due To</label>
          <input type="date" value={dueTo} onChange={(e)=>{ setDueTo(e.target.value); setPage(1); }} className="px-3 py-2 border rounded" />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={archived} onChange={(e)=>{ setArchived(e.target.checked); setPage(1); }} />
          <span className="text-sm text-gray-700">Show archived</span>
        </label>
        <div className="relative ml-4">
          <button onClick={(e) => {
            const menu = e.currentTarget.nextElementSibling;
            menu.classList.toggle('hidden');
          }} className="px-3 py-2 border rounded">Columns</button>
          <div className="hidden absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10">
            {ALL_COLUMNS.map(col => (
              <label key={col.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={visibleColumns.has(col.id)}
                  onChange={(e) => {
                    const next = new Set(visibleColumns);
                    if (e.target.checked) next.add(col.id); else next.delete(col.id);
                    setVisibleColumns(next);
                  }}
                />
                <span>{col.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-end gap-2">
          <label className="block text-xs text-gray-600 mb-1">Rows</label>
          <select value={limit} onChange={(e)=>{ setLimit(Number(e.target.value)); setPage(1); }} className="px-3 py-2 border rounded">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="py-2 px-2 text-center"><input type="checkbox" checked={selectedIds.length===items.length && items.length>0} onChange={(e)=>toggleAll(e.target.checked)} /></th>
              {ALL_COLUMNS.map(col => visibleColumns.has(col.id) && (
                <th key={col.id} className="py-2 px-2 text-left cursor-pointer" onClick={() => {
                  if (col.id === 'title') { setSortBy('created_at'); setSortDir(sortBy === 'created_at' && sortDir === 'asc' ? 'desc' : 'asc'); }
                  if (col.id === 'priority') { setSortBy('priority'); setSortDir(sortBy === 'priority' && sortDir === 'asc' ? 'desc' : 'asc'); }
                  if (col.id === 'due_date') { setSortBy('due_at_utc'); setSortDir(sortBy === 'due_at_utc' && sortDir === 'asc' ? 'desc' : 'asc'); }
                }}>{col.name}</th>
              ))}
              <th className="py-2 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-6 text-center text-gray-500">Loading...</td></tr>
            ) : (items.length === 0 ? (
              <tr><td colSpan={7} className="py-6 text-center text-gray-500">No tasks</td></tr>
            ) : items.map((t)=>{
              const dept = t.department_id?.name || t.department_id || '-';
              return (
                <tr key={t._id} className="border-b">
                  <td className="py-2 px-2 text-center">
                    <input type="checkbox" checked={!!selected[String(t._id)]} onChange={(e)=>setSelected({ ...selected, [String(t._id)]: e.target.checked })} />
                  </td>
                  {visibleColumns.has('title') && (
                    <td className="py-2 px-2">
                      <div className="font-medium text-dark-purple cursor-pointer" onClick={()=>openDrawer(t)}>{t.title}</div>
                      <div className="text-xs text-gray-600 line-clamp-1">{t.description}</div>
                    </td>
                  )}
                  {visibleColumns.has('department') && <td className="py-2 px-2 text-center">{dept}</td>}
                  {visibleColumns.has('priority') && <td className="py-2 px-2 text-center capitalize">{t.priority}</td>}
                  {visibleColumns.has('due_date') && <td className="py-2 px-2 text-center">{t.due_at_utc ? utcToIstDisplay(new Date(t.due_at_utc)) : '-'}</td>}
                  {visibleColumns.has('archived') && <td className="py-2 px-2 text-center">{t.is_archived ? 'Yes' : 'No'}</td>}
                  <td className="py-2 px-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={()=>openDrawer(t)} className="px-2 py-1 text-xs rounded bg-white border">View/Edit</button>
                      {!t.is_archived ? (
                        <button onClick={() => archiveOne(t._id, false)} className="text-sm text-green-600 font-semibold">Unarchive</button>
                      ) : (
                        <button onClick={() => archiveOne(t._id, true)} className="px-2 py-1 text-xs rounded bg-emerald-600 text-white">Unarchive</button>
                      )}
                      <button onClick={() => handlePermanentDelete(t._id)} className="text-sm text-red-600 font-semibold">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 text-sm">
        <div>
          Showing {(items.length>0? (page-1)*limit+1:0)} - {Math.min(page*limit, total)} of {total}
        </div>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=>setPage((p)=>Math.max(1, p-1))} className={`px-3 py-1 rounded border ${page<=1? 'text-gray-400 bg-gray-100':'bg-white'}`}>Prev</button>
          <button disabled={page*limit>=total} onClick={()=>setPage((p)=>p+1)} className={`px-3 py-1 rounded border ${(page*limit)>=total? 'text-gray-400 bg-gray-100':'bg-white'}`}>Next</button>
        </div>
      </div>

      {/* Bulk toolbar */}
      <div className="flex items-center gap-2 mt-4">
        <button disabled={selectedIds.length===0} onClick={()=>applyBulk('archive')} className={`px-3 py-2 rounded ${selectedIds.length===0?'bg-gray-200 text-gray-500':'bg-red-600 text-white'}`}>Archive Selected</button>
        <button disabled={selectedIds.length===0} onClick={()=>applyBulk('unarchive')} className={`px-3 py-2 rounded ${selectedIds.length===0?'bg-gray-200 text-gray-500':'bg-emerald-600 text-white'}`}>Unarchive Selected</button>
      </div>

      {drawerOpen && (
        <TaskDetailsDrawer open={drawerOpen} task={activeTask} onClose={closeDrawer} onSaved={onSaved} />
      )}
    </div>
  );
}
