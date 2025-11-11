import { useState, useEffect } from 'react';

export default function AdminTaskEditor({ task, departments, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'primary',
    priority: 'medium',
    default_points: 5,
    due_date_ist: '',
    department_id: '',
    allow_late_submission: false,
    row_version: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    if (task) {
      // Edit mode - populate form
      const dueDate = new Date(task.due_at_utc);
      const istDate = new Date(dueDate.getTime() + 5.5 * 60 * 60 * 1000);
      const istString = istDate.toISOString().slice(0, 16);

      setFormData({
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        default_points: task.default_points,
        due_date_ist: istString,
        department_id: task.department_id,
        allow_late_submission: task.allow_late_submission || false,
        row_version: task.row_version,
      });
    }

    // Load templates
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetch('/api/admin/templates', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setTemplates(data.templates || []))
        .catch(err => console.error('Failed to load templates:', err));
    }
  }, [task]);

  const loadTemplate = (templateId) => {
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title,
        description: template.description,
        type: template.type,
        priority: template.priority,
        default_points: template.default_points,
        allow_late_submission: template.allow_late_submission,
      }));
    }
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: templateName,
          title: formData.title,
          description: formData.description,
          type: formData.type,
          priority: formData.priority,
          default_points: formData.default_points,
          allow_late_submission: formData.allow_late_submission,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTemplates(prev => [data.template, ...prev]);
        setShowSaveTemplate(false);
        setTemplateName('');
        alert('Template saved successfully!');
      }
    } catch (err) {
      setError('Failed to save template');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.department_id) {
      setError('Department is required');
      return;
    }

    if (!formData.due_date_ist) {
      setError('Due date is required');
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
    } catch (err) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Template Selection */}
      {!task && templates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📋 Load from Template
          </label>
          <select
            onChange={(e) => e.target.value && loadTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a template...</option>
            {templates.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="default_points" className="block text-sm font-medium text-gray-700 mb-1">
            Points <span className="text-red-500">*</span>
          </label>
          <input
            id="default_points"
            name="default_points"
            type="number"
            min="1"
            value={formData.default_points}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label htmlFor="due_date_ist" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date (IST) <span className="text-red-500">*</span>
          </label>
          <input
            id="due_date_ist"
            name="due_date_ist"
            type="datetime-local"
            value={formData.due_date_ist}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-1">
          Department <span className="text-red-500">*</span>
        </label>
        <select
          id="department_id"
          name="department_id"
          value={formData.department_id}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
          required
        >
          <option value="">Select Department</option>
          {departments?.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center">
        <input
          id="allow_late_submission"
          name="allow_late_submission"
          type="checkbox"
          checked={formData.allow_late_submission}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          disabled={loading}
        />
        <label htmlFor="allow_late_submission" className="ml-2 text-sm text-gray-700">
          Allow late submission
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </button>
        {!task && (
          <button
            type="button"
            onClick={() => setShowSaveTemplate(!showSaveTemplate)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            💾
          </button>
        )}
      </div>

      {showSaveTemplate && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Save as Template
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={saveAsTemplate}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
