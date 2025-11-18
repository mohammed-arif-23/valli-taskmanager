import { useEffect, useState } from 'react';

export default function AdminTemplateEditor({ onSave, initialValues = null, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    title: '',
    description: '',
    type: 'primary',
    priority: 'medium',
    default_points: 5,
    allow_late_submission: false,
    frequency: 'daily',
    due_time_ist: '09:00',
    applies_to_roles: ['staff'],
    department_id: '',
    assignment_mode: 'each_staff',
    days_of_week: [],
    active: true,
  });
  const [busy, setBusy] = useState(false);
  const [departments, setDepartments] = useState([]);
  const isDaily = form.frequency === 'daily';
  const isWeekly = form.frequency === 'weekly';
  const dailyMissingDue = isDaily && !(form.due_time_ist && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(form.due_time_ist));
  const weeklyMissingDays = isWeekly && (!Array.isArray(form.days_of_week) || form.days_of_week.length === 0);

  // populate when editing
  useEffect(() => {
    if (initialValues) {
      setForm({
        name: initialValues.name || '',
        title: initialValues.title || '',
        description: initialValues.description || '',
        type: initialValues.type || 'primary',
        priority: initialValues.priority || 'medium',
        default_points: initialValues.default_points ?? 5,
        allow_late_submission: initialValues.allow_late_submission ?? false,
        frequency: initialValues.frequency || 'none',
        due_time_ist: initialValues.due_time_ist || '',
        applies_to_roles: initialValues.applies_to_roles || [],
        department_id: initialValues.department_id || '',
        assignment_mode: initialValues.assignment_mode || 'each_staff',
        days_of_week: initialValues.days_of_week || [],
        active: initialValues.active ?? true,
      });
    }
  }, [initialValues]);

  // Fetch departments for department assignment mode
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;
    (async () => {
      try {
        const res = await fetch('/api/ceo/departments', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setDepartments(Array.isArray(data.departments) ? data.departments : []);
        }
      } catch (e) {
        // ignore fetch errors here
      }
    })();
  }, []);

  // When switching away from department mode, clear department_id to avoid accidental scoping
  useEffect(() => {
    if (form.assignment_mode !== 'department' && form.department_id) {
      setForm((prev) => ({ ...prev, department_id: '' }));
    }
  }, [form.assignment_mode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleRolesChange = (e) => {
    const value = e.target.value;
    const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
    setForm((prev) => ({ ...prev, applies_to_roles: parts }));
  };

  const handleDaysChange = (e) => {
    const value = e.target.value;
    const nums = value.split(',').map((s) => s.trim()).filter(Boolean).map((v) => Number(v)).filter((n) => !Number.isNaN(n));
    setForm((prev) => ({ ...prev, days_of_week: nums }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(form);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input name="name" value={form.name} onChange={handleChange} className="mt-1 w-full border-2 rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input name="title" value={form.title} onChange={handleChange} className="mt-1 w-full border-2 rounded-lg px-3 py-2" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} className="mt-1 w-full border-2 rounded-lg px-3 py-2" rows={3} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select name="type" value={form.type} onChange={handleChange} className="mt-1 w-full border-2 rounded-lg px-3 py-2">
            <option value="primary">primary</option>
            <option value="secondary">secondary</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Priority</label>
          <select name="priority" value={form.priority} onChange={handleChange} className="mt-1 w-full border-2 rounded-lg px-3 py-2">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Default Points</label>
          <input type="number" name="default_points" min="1" value={form.default_points} onChange={handleChange} className="mt-1 w-full border-2 rounded-lg px-3 py-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Frequency</label>
          <select name="frequency" value={form.frequency} onChange={handleChange} className="mt-1 w-full border-2 rounded-lg px-3 py-2">
            <option value="none">none</option>
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Due Time (IST)</label>
          <input name="due_time_ist" placeholder="HH:mm" value={form.due_time_ist} onChange={handleChange} className="mt-1 w-full border-2 rounded-lg px-3 py-2" />
          {isDaily && (
            <p className={`text-xs mt-1 ${dailyMissingDue ? 'text-red-600' : 'text-gray-500'}`}>
              {dailyMissingDue ? 'Required for daily templates. Please enter HH:mm (e.g., 09:00).' : 'When set at item level, it overrides this template time.'}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Assignment Mode</label>
          <select name="assignment_mode" value={form.assignment_mode} onChange={handleChange} className="mt-1 w-full border-2 rounded-lg px-3 py-2">
            <option value="each_staff">each_staff</option>
            <option value="department">department</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Applies to Roles (comma-separated)</label>
          <input value={form.applies_to_roles.join(', ')} onChange={handleRolesChange} className="mt-1 w-full border-2 rounded-lg px-3 py-2" />
        </div>
        {form.assignment_mode === 'department' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <select
              name="department_id"
              value={form.department_id || ''}
              onChange={handleChange}
              className="mt-1 w-full border-2 rounded-lg px-3 py-2"
              required
            >
              <option value="" disabled>Select a department</option>
              {departments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Tasks from this template will apply only to the selected department.</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700">Department (optional)</label>
            <select
              name="department_id"
              value={form.department_id || ''}
              onChange={handleChange}
              className="mt-1 w-full border-2 rounded-lg px-3 py-2"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">If set, tasks will be scoped to this department; leave blank to apply across all.</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">Days of Week (0-6, comma)</label>
          <input value={form.days_of_week.join(', ')} onChange={handleDaysChange} className="mt-1 w-full border-2 rounded-lg px-3 py-2" />
          {isWeekly && (
            <p className={`text-xs mt-1 ${weeklyMissingDays ? 'text-red-600' : 'text-gray-500'}`}>
              {weeklyMissingDays ? 'Weekly templates should specify one or more days (0=Sun..6=Sat).' : 'Use comma separated values like: 1,3,5'}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="allow_late_submission" checked={form.allow_late_submission} onChange={handleChange} />
          Allow Late Submission
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
          Active
        </label>
      </div>

      <div className="pt-4 flex gap-3">
        <button type="submit" disabled={busy || dailyMissingDue} className={`px-4 py-2 rounded-lg font-semibold ${(busy || dailyMissingDue) ? 'bg-gray-300 text-gray-600' : 'bg-palatinate text-white hover-lift'}`}>
          {busy ? 'Saving…' : (initialValues ? 'Update Template' : 'Save Template')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
