import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { utcToIstDisplay } from '@/lib/date';

export default function CEOTasks() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
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
      const [tasksRes, deptsRes] = await Promise.all([
        fetch('/api/ceo/tasks', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/departments', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks);
      }

      if (deptsRes.ok) {
        const data = await deptsRes.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-quinacridone-magenta">
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Title</th>
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Department</th>
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Assigned To</th>
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Type</th>
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Priority</th>
                  <th className="text-center py-3 px-4 text-dark-purple font-semibold">Points</th>
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Due Date</th>
                  <th className="text-center py-3 px-4 text-dark-purple font-semibold">Status</th>
                  <th className="text-center py-3 px-4 text-dark-purple font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} className="border-b border-gray-200 hover:bg-mint-cream transition-smooth">
                    <td className="py-4 px-4 font-medium text-dark-purple">{task.title}</td>
                    <td className="py-4 px-4 text-gray-600">{task.department_id?.name || 'N/A'}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {!task.assigned_to || task.assigned_to.length === 0 ? (
                        <span className="text-green-600 font-semibold">All Staff</span>
                      ) : (
                        <span className="text-palatinate font-semibold">{task.assigned_to.length} specific</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-palatinate text-white">
                        {task.type}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-sm font-semibold ${
                        task.priority === 'high' ? 'text-red-600' :
                        task.priority === 'medium' ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-quinacridone-magenta">
                      {task.default_points}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {utcToIstDisplay(new Date(task.due_at_utc))}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {task.is_archived ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                          Archived
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(task)}
                          className="text-blue-600 hover:text-blue-800 transition-smooth font-semibold"
                        >
                          Edit
                        </button>
                        {!task.is_archived && (
                          <button
                            onClick={() => handleArchive(task._id)}
                            className="text-orange-600 hover:text-orange-800 transition-smooth font-semibold"
                          >
                            Archive
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="text-red-600 hover:text-red-800 transition-smooth font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
