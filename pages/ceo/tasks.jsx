import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { utcToIstDisplay } from '@/lib/date';
import ViewSubmissionModal from '@/components/ViewSubmissionModal';

export default function CEOTasks() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedMap, setSelectedMap] = useState({});
  const [submissionsList, setSubmissionsList] = useState([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | completed | partial | not_started | rejected
  const [startDate, setStartDate] = useState(''); // ISO date string (YYYY-MM-DD)
  const [endDate, setEndDate] = useState('');   // ISO date string (YYYY-MM-DD)
  const [subsPage, setSubsPage] = useState(1);
  const [subsPageSize, setSubsPageSize] = useState(50);
  const [subsTotal, setSubsTotal] = useState(0);
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [subsSelectAll, setSubsSelectAll] = useState(false);
  const [bulkAction, setBulkAction] = useState(''); // archive | reassign | change_due | extend_sla
  const [bulkDeptId, setBulkDeptId] = useState('');
  const [bulkUsersCsv, setBulkUsersCsv] = useState('');
  const [bulkDueIso, setBulkDueIso] = useState('');
  const [bulkMinutes, setBulkMinutes] = useState('');
  const [showArchivedTasks, setShowArchivedTasks] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'primary',
    priority: 'medium',
    default_points: '',
    due_date_ist: '',
    department_id: '',
    assigned_to: [],
    assign_to_all: true,
    allow_late_submission: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'ceo') {
      toast.error('Access denied - CEO only');
      router.push('/');
      return;
    }

    fetchData(token);
  }, []);

  const fetchData = async (token) => {
    try {
      let tasksUrl = selectedDeptFilter ? `/api/ceo/tasks?department_id=${encodeURIComponent(selectedDeptFilter)}` : '/api/ceo/tasks';
      if (showArchivedTasks) {
        tasksUrl += (tasksUrl.includes('?') ? '&' : '?') + 'is_archived=true';
      }
      // Build filtered submissions URL
      const params = new URLSearchParams();
      if (selectedDeptFilter) params.set('department_id', selectedDeptFilter);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (startDate) params.set('start', `${startDate}T00:00:00.000Z`);
      if (endDate) params.set('end', `${endDate}T23:59:59.999Z`);
      params.set('page', String(subsPage));
      params.set('pageSize', String(subsPageSize));
      const subsUrl = `/api/ceo/submissions${params.toString() ? `?${params.toString()}` : ''}`;

      const [tasksRes, deptsRes, subsRes] = await Promise.all([
        fetch(tasksUrl, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/departments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(subsUrl, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks);
        // clear selections if tasks list changed
        setSelectedMap({});
      }

      if (deptsRes.ok) {
        const data = await deptsRes.json();
        setDepartments(data.departments || []);
      }

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubmissionsList(Array.isArray(subsData.submissions) ? subsData.submissions : []);
        if (typeof subsData.total === 'number') setSubsTotal(subsData.total);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Presets: load on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ceo_tasks_presets');
      if (raw) setPresets(JSON.parse(raw));
    } catch {}
  }, []);

  const savePreset = () => {
    const name = prompt('Preset name');
    if (!name) return;
    const p = { name, department_id: selectedDeptFilter, status: statusFilter, start: startDate, end: endDate };
    const next = [...presets.filter(x => x.name !== name), p];
    setPresets(next);
    localStorage.setItem('ceo_tasks_presets', JSON.stringify(next));
    setSelectedPreset(name);
  };

  const applyPreset = (name) => {
    const p = presets.find(x => x.name === name);
    if (!p) return;
    setSelectedPreset(name);
    setSelectedDeptFilter(p.department_id || '');
    setStatusFilter(p.status || 'all');
    setStartDate(p.start || '');
    setEndDate(p.end || '');
    setSubsPage(1);
    const token = localStorage.getItem('accessToken');
    if (token) fetchData(token);
  };

  const toggleSelectAll = (checked) => {
    const map = {};
    if (checked) {
      tasks.forEach((t) => { map[t._id] = true; });
    }
    setSelectedMap(map);
  };

  const toggleSelectOne = (taskId, checked) => {
    setSelectedMap((prev) => ({ ...prev, [taskId]: checked }));
  };

  const bulkDeleteSelected = async () => {
    const ids = Object.keys(selectedMap).filter((k) => selectedMap[k]);
    if (ids.length === 0) return;
    if (!confirm(`⚠️ PERMANENT DELETE: Delete ${ids.length} selected task(s) and all their submissions? This cannot be undone.`)) return;
    const token = localStorage.getItem('accessToken');
    try {
      // perform deletions in parallel
      const responses = await Promise.all(ids.map((id) => fetch(`/api/ceo/tasks/${id}/permanent`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })));
      const failed = [];
      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].ok) failed.push(ids[i]);
      }
      if (failed.length) {
        toast.error(`Failed to delete ${failed.length} task(s).`);
      } else {
        toast.success(`Deleted ${ids.length} task(s).`);
      }
      setSelectedMap({});
      fetchData(token);
    } catch (e) {
      toast.error('Bulk delete failed');
    }
  };

  const fetchDepartmentUsers = async (departmentId) => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/ceo/departments/${departmentId}/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setDepartmentUsers(data.staff || []);
      }
    } catch (error) {
      toast.error('Failed to load department users');
    }
  };

  const handleDepartmentChange = (departmentId) => {
    setFormData({ ...formData, department_id: departmentId, assigned_to: [], assign_to_all: true });
    if (departmentId) {
      fetchDepartmentUsers(departmentId);
    } else {
      setDepartmentUsers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');

    try {
      const url = editingTask ? `/api/ceo/tasks/${editingTask._id}` : '/api/ceo/tasks';
      const method = editingTask ? 'PATCH' : 'POST';

      // Prepare data - if assign_to_all is true, send empty array
      const submitData = {
        ...formData,
        assigned_to: formData.assign_to_all ? [] : formData.assigned_to,
      };
      delete submitData.assign_to_all;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        toast.success(editingTask ? 'Task updated!' : 'Task created!');
        setShowForm(false);
        setEditingTask(null);
        setFormData({
          title: '',
          description: '',
          type: 'primary',
          priority: 'medium',
          default_points: '',
          due_date_ist: '',
          department_id: '',
          assigned_to: [],
          assign_to_all: true,
          allow_late_submission: false,
        });
        setDepartmentUsers([]);
        fetchData(token);
      } else {
        const data = await res.json();
        toast.error(data.error?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    // Convert UTC to IST for the form
    const dueDate = new Date(task.due_at_utc);
    const istDate = new Date(dueDate.getTime() + (5.5 * 60 * 60 * 1000));
    const formattedDate = istDate.toISOString().slice(0, 16);

    const departmentId = task.department_id?._id || task.department_id;
    const assignedTo = task.assigned_to || [];
    const assignToAll = assignedTo.length === 0;

    setFormData({
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      default_points: task.default_points,
      due_date_ist: formattedDate,
      department_id: departmentId,
      assigned_to: assignedTo,
      assign_to_all: assignToAll,
      allow_late_submission: task.allow_late_submission,
    });
    
    if (departmentId) {
      fetchDepartmentUsers(departmentId);
    }
    
    setShowForm(true);
  };

  const handleArchive = async (taskId) => {
    if (!confirm('Are you sure you want to archive this task?')) return;

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/ceo/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Task archived');
        fetchData(token);
      }
    } catch (error) {
      toast.error('Failed to archive task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('⚠️ PERMANENT DELETE: This will permanently delete the task and all its submissions. This cannot be undone. Are you sure?')) return;

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/ceo/tasks/${taskId}/permanent`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Task permanently deleted');
        fetchData(token);
      } else {
        const data = await res.json();
        toast.error(data.error?.message || 'Failed to delete task');
      }
    } catch (error) {
      toast.error('Failed to delete task');
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
      <nav className="gradient-dark shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Task Management</h1>
          <button
            onClick={() => router.push('/ceo')}
            className="text-sm text-white hover:text-mint-cream transition-smooth"
          >
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-dark-purple">All Tasks</h2>
            <div className="flex items-center gap-3">
              <button
                disabled={Object.keys(selectedMap).filter((k) => selectedMap[k]).length === 0}
                onClick={bulkDeleteSelected}
                className={`px-4 py-2 rounded-lg font-semibold ${Object.keys(selectedMap).filter((k) => selectedMap[k]).length === 0 ? 'bg-gray-200 text-gray-500' : 'bg-red-600 text-white'}`}
              >
                Delete Selected
              </button>
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingTask(null);
                  setFormData({
                    title: '',
                    description: '',
                    type: 'primary',
                    priority: 'medium',
                    default_points: '',
                    due_date_ist: '',
                    department_id: '',
                    assigned_to: [],
                    assign_to_all: true,
                    allow_late_submission: false,
                  });
                  setDepartmentUsers([]);
                }}
                className="gradient-primary text-white px-6 py-2 rounded-lg hover-lift btn-ripple"
              >
                {showForm ? 'Cancel' : '+ Add Task'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Presets</label>
              <div className="flex gap-2">
                <select value={selectedPreset} onChange={(e)=>applyPreset(e.target.value)} className="px-3 py-2 border-2 rounded-lg min-w-[200px]">
                  <option value="">Select preset</option>
                  {presets.map((p)=>(<option key={p.name} value={p.name}>{p.name}</option>))}
                </select>
                <button onClick={savePreset} className="px-3 py-2 rounded bg-gray-200">Save</button>
              </div>
            </div>
            <button
              onClick={() => {
                const q = new URLSearchParams();
                if (selectedDeptFilter) q.append('department_id', selectedDeptFilter);
                if (statusFilter && statusFilter !== 'all') q.append('status', statusFilter);
                if (startDate) q.append('start', `${startDate}T00:00:00.000Z`);
                if (endDate) q.append('end', `${endDate}T23:59:59.999Z`);
                window.open(`/api/ceo/submissions/export?${q.toString()}`, '_blank');
              }}
              className="ml-auto px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold"
            >
              Export CSV
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 p-6 bg-mint-cream rounded-xl fade-in">
              <h3 className="text-xl font-bold text-dark-purple mb-4">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-dark-purple mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                    placeholder="Task title"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-dark-purple mb-2">Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                    placeholder="Task description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark-purple mb-2">Type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark-purple mb-2">Priority *</label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark-purple mb-2">Points *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.default_points}
                    onChange={(e) => setFormData({ ...formData, default_points: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark-purple mb-2">Due Date (IST) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.due_date_ist}
                    onChange={(e) => setFormData({ ...formData, due_date_ist: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark-purple mb-2">Department *</label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_late_submission}
                      onChange={(e) => setFormData({ ...formData, allow_late_submission: e.target.checked })}
                      className="w-5 h-5 text-quinacridone-magenta rounded focus:ring-2 focus:ring-palatinate"
                    />
                    <span className="text-sm font-bold text-dark-purple">Allow Late Submission</span>
                  </label>
                </div>
                {formData.department_id && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-dark-purple mb-2">Assign To</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.assign_to_all}
                          onChange={() => setFormData({ ...formData, assign_to_all: true, assigned_to: [] })}
                          className="w-4 h-4 text-quinacridone-magenta"
                        />
                        <span className="text-sm font-semibold text-dark-purple">All staff in department</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!formData.assign_to_all}
                          onChange={() => setFormData({ ...formData, assign_to_all: false })}
                          className="w-4 h-4 text-quinacridone-magenta"
                        />
                        <span className="text-sm font-semibold text-dark-purple">Specific staff members</span>
                      </label>
                      {!formData.assign_to_all && (
                        <div className="ml-6 mt-2 p-4 bg-white rounded-lg border-2 border-quinacridone-magenta max-h-48 overflow-y-auto">
                          {departmentUsers.length === 0 ? (
                            <p className="text-sm text-gray-500">No staff members in this department</p>
                          ) : (
                            <div className="space-y-2">
                              {departmentUsers.map((user) => (
                                <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-mint-cream p-2 rounded">
                                  <input
                                    type="checkbox"
                                    checked={formData.assigned_to.includes(user.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({
                                          ...formData,
                                          assigned_to: [...formData.assigned_to, user.id],
                                        });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          assigned_to: formData.assigned_to.filter((id) => id !== user.id),
                                        });
                                      }
                                    }}
                                    className="w-4 h-4 text-quinacridone-magenta rounded"
                                  />
                                  <span className="text-sm text-dark-purple">
                                    {user.name} ({user.email})
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="gradient-primary text-white px-6 py-3 rounded-lg hover-lift btn-ripple font-bold"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTask(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-smooth font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Filters: Department then Submission Status */}
          <div className="mb-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={selectedDeptFilter}
                onChange={(e) => {
                  setSelectedDeptFilter(e.target.value);
                  // refetch tasks and submissions scoped by department
                  const token = localStorage.getItem('accessToken');
                  setSubsPage(1);
                  if (token) fetchData(token);
                }}
                className="px-3 py-2 border-2 rounded-lg"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Submission Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border-2 rounded-lg"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="partial">Partial</option>
                <option value="not_started">Not Started</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border-2 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <input
                id="show-archived"
                type="checkbox"
                checked={showArchivedTasks}
                onChange={(e)=>{
                  setShowArchivedTasks(e.target.checked);
                  const token = localStorage.getItem('accessToken');
                  if (token) fetchData(token);
                }}
                className="w-4 h-4"
              />
              <label htmlFor="show-archived" className="text-sm text-gray-700">Show Archived Tasks (for edit/delete)</label>
            </div>
            <button
              onClick={() => {
                const token = localStorage.getItem('accessToken');
                setSubsPage(1);
                if (token) fetchData(token);
              }}
              className="px-4 py-2 rounded-lg bg-palatinate text-white font-semibold"
            >
              Apply Filters
            </button>
            {/* Bulk Actions Toolbar */}
            <div className="ml-auto w-full sm:w-auto flex flex-col sm:flex-row gap-2 items-end bg-white/60 p-2 rounded-lg border">
              <div className="flex items-end gap-2 flex-wrap">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Action</label>
                  <select value={bulkAction} onChange={(e)=>setBulkAction(e.target.value)} className="px-3 py-2 border-2 rounded-lg">
                    <option value="">Select</option>
                    <option value="archive">Archive</option>
                    <option value="reassign">Reassign</option>
                    <option value="change_due">Change Due</option>
                    <option value="extend_sla">Extend SLA</option>
                  </select>
                </div>
                {bulkAction==='reassign' && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Department ID</label>
                      <input value={bulkDeptId} onChange={(e)=>setBulkDeptId(e.target.value)} placeholder="optional" className="px-3 py-2 border-2 rounded-lg min-w-[220px]" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">User IDs (CSV)</label>
                      <input value={bulkUsersCsv} onChange={(e)=>setBulkUsersCsv(e.target.value)} placeholder="empty => dept-wide" className="px-3 py-2 border-2 rounded-lg min-w-[220px]" />
                    </div>
                  </>
                )}
                {bulkAction==='change_due' && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">New Due (ISO)</label>
                    <input value={bulkDueIso} onChange={(e)=>setBulkDueIso(e.target.value)} placeholder="2025-12-31T17:30:00Z" className="px-3 py-2 border-2 rounded-lg min-w-[260px]" />
                  </div>
                )}
                {bulkAction==='extend_sla' && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minutes</label>
                    <input type="number" value={bulkMinutes} onChange={(e)=>setBulkMinutes(e.target.value)} placeholder="e.g., 15" className="px-3 py-2 border-2 rounded-lg min-w-[120px]" />
                  </div>
                )}
              </div>
              <button
                disabled={Object.keys(selectedMap).filter(k=>selectedMap[k]).length===0 || !bulkAction}
                onClick={async()=>{
                  const ids = Object.keys(selectedMap).filter(k=>selectedMap[k]);
                  if (ids.length===0) return;
                  const token = localStorage.getItem('accessToken');
                  try {
                    if (bulkAction==='archive') {
                      const res = await fetch('/api/ceo/tasks/bulk/archive',{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ task_ids: ids }) });
                      if (res.status===401){ toast.error('Session expired'); localStorage.clear(); router.push('/login'); return; }
                      const data = await res.json(); if (!res.ok) throw new Error(data.error?.message||'Failed');
                      toast.success(`Archived ${data.updated} task(s)`);
                    } else if (bulkAction==='reassign') {
                      const payload = { task_ids: ids, assigned_to: bulkUsersCsv.trim()? bulkUsersCsv.split(',').map(s=>s.trim()).filter(Boolean): [] };
                      if (bulkDeptId) payload.department_id = bulkDeptId;
                      if (!payload.department_id && payload.assigned_to.length===0) { toast.info('Nothing to update'); return; }
                      const res = await fetch('/api/ceo/tasks/bulk/reassign',{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(payload) });
                      if (res.status===401){ toast.error('Session expired'); localStorage.clear(); router.push('/login'); return; }
                      const data = await res.json(); if (!res.ok) throw new Error(data.error?.message||'Failed');
                      toast.success(`Updated ${data.updated} task(s)`);
                    } else if (bulkAction==='change_due') {
                      if (!bulkDueIso) { toast.error('Provide new due date/time'); return; }
                      const res = await fetch('/api/ceo/tasks/bulk/change-due',{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ task_ids: ids, due_at_utc: bulkDueIso }) });
                      if (res.status===401){ toast.error('Session expired'); localStorage.clear(); router.push('/login'); return; }
                      const data = await res.json(); if (!res.ok) throw new Error(data.error?.message||'Failed');
                      toast.success(`Updated ${data.updated} task(s)`);
                    } else if (bulkAction==='extend_sla') {
                      const minutes = Number(bulkMinutes);
                      if (!Number.isFinite(minutes)) { toast.error('Invalid minutes'); return; }
                      const res = await fetch('/api/ceo/tasks/bulk/extend-sla',{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ task_ids: ids, minutes }) });
                      if (res.status===401){ toast.error('Session expired'); localStorage.clear(); router.push('/login'); return; }
                      const data = await res.json(); if (!res.ok) throw new Error(data.error?.message||'Failed');
                      toast.success(`Updated ${data.updated} task(s)`);
                    }
                    setSelectedMap({});
                    setBulkAction(''); setBulkDeptId(''); setBulkUsersCsv(''); setBulkDueIso(''); setBulkMinutes('');
                  } catch (e) { toast.error(e.message||'Failed'); }
                }}
                className={`px-4 py-2 rounded-lg font-semibold ${Object.keys(selectedMap).filter(k=>selectedMap[k]).length===0 || !bulkAction ? 'bg-gray-200 text-gray-500' : 'bg-emerald-600 text-white'}`}
              >Apply</button>
            </div>
          </div>

          {/* Submissions under filters */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-quinacridone-magenta">
                  <th className="py-3 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={subsSelectAll}
                      onChange={(e)=>{
                        const checked = e.target.checked;
                        setSubsSelectAll(checked);
                        const filtered = submissionsList || [];
                        const map = { ...selectedMap };
                        filtered.forEach((s)=>{
                          const id = s.task_id?._id;
                          if (id) map[id] = checked;
                        });
                        setSelectedMap(map);
                      }}
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Task</th>
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Department</th>
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">User</th>
                  <th className="text-center py-3 px-4 text-dark-purple font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Reason</th>
                  <th className="text-center py-3 px-4 text-dark-purple font-semibold">Points</th>
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Date</th>
                  <th className="text-center py-3 px-4 text-dark-purple font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = submissionsList || [];
                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-gray-500">No submissions found for the selected filters.</td>
                      </tr>
                    );
                  }

                  return filtered.map((s) => (
                    <tr key={s._id} className="border-b border-gray-200 hover:bg-mint-cream/60">
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!selectedMap[s.task_id?._id]}
                          onChange={(e)=>{
                            const id = s.task_id?._id;
                            if (!id) return;
                            setSelectedMap((prev)=>({ ...prev, [id]: e.target.checked }));
                          }}
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-dark-purple">{s.task_id?.title || 'Task'}</td>
                      <td className="py-3 px-4 text-gray-600">{s.task_id?.department_id?.name || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <div className="text-dark-purple font-medium">{s.user_id?.name || 'User'}</div>
                        <div className="text-xs text-gray-500">{s.user_id?.email}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          s.status === 'completed' ? 'bg-green-100 text-green-700' :
                          s.status === 'partial' ? 'bg-orange-100 text-orange-700' :
                          s.status === 'not_started' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {s.status === 'not_started' && (s.not_started_reason || '—')}
                        {s.status === 'rejected' && (s.rejection_reason || '—')}
                        {(s.status === 'completed' || s.status === 'partial') && '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-quinacridone-magenta">{s.points_awarded}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{new Date(s.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => setViewingSubmission(s)} className="text-dark-purple font-semibold">View</button>
                          {s.task_id?._id && (
                            <>
                            <button onClick={() => handleEdit(s.task_id)} className="text-blue-600 font-semibold">Edit</button>
                            {!s.task_id.is_archived && (
                              <button onClick={() => handleArchive(s.task_id._id)} className="text-orange-600 font-semibold">Archive</button>
                            )}
                            <button onClick={() => handleDelete(s.task_id._id)} className="text-red-600 font-semibold">Delete</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Page {subsPage} · {(subsTotal ? Math.ceil(subsTotal / subsPageSize) : 1)} pages · {subsTotal} total</div>
            <div className="flex items-center gap-2">
              <button
                disabled={subsPage <= 1}
                onClick={() => {
                  if (subsPage <= 1) return;
                  setSubsPage((p) => p - 1);
                  const token = localStorage.getItem('accessToken');
                  if (token) fetchData(token);
                }}
                className={`px-3 py-2 rounded ${subsPage <= 1 ? 'bg-gray-200 text-gray-500' : 'bg-white border'}`}
              >
                Prev
              </button>
              <button
                disabled={subsTotal <= subsPage * subsPageSize}
                onClick={() => {
                  if (subsTotal <= subsPage * subsPageSize) return;
                  setSubsPage((p) => p + 1);
                  const token = localStorage.getItem('accessToken');
                  if (token) fetchData(token);
                }}
                className={`px-3 py-2 rounded ${subsTotal <= subsPage * subsPageSize ? 'bg-gray-200 text-gray-500' : 'bg-white border'}`}
              >
                Next
              </button>
              <select
                value={subsPageSize}
                onChange={(e) => {
                  setSubsPageSize(Number(e.target.value));
                  setSubsPage(1);
                  const token = localStorage.getItem('accessToken');
                  if (token) fetchData(token);
                }}
                className="px-2 py-2 border rounded"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>
        </div>
      </main>
      {/* View Submission Modal */}
      {viewingSubmission && (
        <ViewSubmissionModal submission={viewingSubmission} onClose={() => setViewingSubmission(null)} />
      )}
    </div>
  );
}
