import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function TaskDetailsDrawer({ open, task, onClose, onSaved }) {
  const [model, setModel] = useState(null);

  useEffect(() => {
    setModel(task || null);
  }, [task]);

  if (!open || !model) return null;

  const save = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/ceo/tasks/${model._id}` , {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: model.title,
          description: model.description,
          priority: model.priority,
          allow_late_submission: !!model.allow_late_submission,
          row_version: model.row_version,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Update failed');
      toast.success('Task updated');
      onSaved?.();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[540px] bg-white shadow-xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-dark-purple">Task Details</h3>
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100">Close</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Title</label>
            <input value={model.title||''} onChange={(e)=>setModel({ ...model, title: e.target.value })} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Description</label>
            <textarea value={model.description||''} onChange={(e)=>setModel({ ...model, description: e.target.value })} className="w-full px-3 py-2 border rounded" rows={4} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Priority</label>
            <select value={model.priority||'medium'} onChange={(e)=>setModel({ ...model, priority: e.target.value })} className="w-full px-3 py-2 border rounded">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!model.allow_late_submission} onChange={(e)=>setModel({ ...model, allow_late_submission: e.target.checked })} />
            <span className="text-sm">Allow late submission</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={save} className="px-4 py-2 rounded bg-palatinate text-white">Save</button>
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
