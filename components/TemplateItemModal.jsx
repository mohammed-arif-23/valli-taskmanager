import { useEffect, useState } from 'react';

export default function TemplateItemModal({
  open,
  title = 'Task Item',
  initialItem = null,
  onSave,
  onDelete,
  onClose,
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'primary',
    priority: 'medium',
    default_points: 1,
    due_time_ist: '',
    allow_late_submission: false,
    active: true,
  });

  useEffect(() => {
    if (initialItem) {
      setForm({
        title: initialItem.title || '',
        description: initialItem.description || '',
        type: initialItem.type || 'primary',
        priority: initialItem.priority || 'medium',
        default_points: Number(initialItem.default_points || 1),
        due_time_ist: initialItem.due_time_ist || '',
        allow_late_submission: !!initialItem.allow_late_submission,
        active: initialItem.active !== false,
      });
    } else {
      setForm({
        title: '',
        description: '',
        type: 'primary',
        priority: 'medium',
        default_points: 1,
        due_time_ist: '',
        allow_late_submission: false,
        active: true,
      });
    }
  }, [initialItem, open]);

  if (!open) return null;

  const handleSave = () => {
    if (!form.title?.trim()) return;
    onSave?.({ ...initialItem, ...form });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl mx-4">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark-purple">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              className="mt-1 border-2 px-3 py-2 rounded w-full focus:outline-none focus:border-palatinate"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Daily Standup"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="mt-1 border-2 px-3 py-2 rounded w-full focus:outline-none focus:border-palatinate"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Details or instructions"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Points</label>
              <input
                type="number"
                min={1}
                className="mt-1 border-2 px-3 py-2 rounded w-full focus:outline-none focus:border-palatinate"
                value={form.default_points}
                onChange={(e) => setForm({ ...form, default_points: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                className="mt-1 border-2 px-3 py-2 rounded w-full focus:outline-none focus:border-palatinate"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Time (IST)</label>
              <input
                className="mt-1 border-2 px-3 py-2 rounded w-full focus:outline-none focus:border-palatinate"
                value={form.due_time_ist}
                onChange={(e) => setForm({ ...form, due_time_ist: e.target.value })}
                placeholder="HH:mm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                className="mt-1 border-2 px-3 py-2 rounded w-full focus:outline-none focus:border-palatinate"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="primary">primary</option>
                <option value="secondary">secondary</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-5 pt-1">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.allow_late_submission}
                onChange={(e) => setForm({ ...form, allow_late_submission: e.target.checked })}
              />
              Allow late submission
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active
            </label>
          </div>
        </div>
        <div className="px-5 py-4 border-t flex items-center justify-between">
          {onDelete ? (
            <button onClick={onDelete} className="px-3 py-2 rounded bg-red-600 text-white text-sm">Delete</button>
          ) : <span />}
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-gray-800 text-sm">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded bg-palatinate text-white font-semibold text-sm">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
