import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import AdminTemplateEditor from '@/components/AdminTemplateEditor';
import TemplateItemModal from '@/components/TemplateItemModal';

export default function CeoTemplates() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bulkSelection, setBulkSelection] = useState({});
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [itemsDraft, setItemsDraft] = useState([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null => creating

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userData);
    if (!['ceo', 'administrator', 'manager'].includes(user.role)) {
      toast.error('Access denied');
      router.push('/');
      return;
    }
    fetchTemplates(token);
    fetchDepartments(token);
  }, []);

  const fetchTemplates = async (token) => {
    try {
      const res = await fetch('/api/admin/templates', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!templateId) return;
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Delete failed');
      toast.success('Template deleted');
      await fetchTemplates(token);
      if (selected === templateId) {
        setSelected(null);
        setItemsDraft([]);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const createTemplate = async (payload) => {
    const token = localStorage.getItem('accessToken');
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Create failed');
      toast.success('Template created');
      // refresh and select the new one
      await fetchTemplates(token);
      setCreating(false);
      const newId = data.template?._id;
      setSelected(newId);
      setEditing(false);

      // One-click Generate Now
      if (newId && window.confirm('Generate today\'s tasks for this template now?')) {
        await triggerGeneration(false, true, newId);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const fetchDepartments = async (token) => {
    try {
      const res = await fetch('/api/ceo/departments', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
      }
    } catch (e) {
      // ignore
    }
  };

  const current = useMemo(() => templates.find(t => t._id === selected) || null, [templates, selected]);

  // Sync items draft when template selection changes or templates list updates
  useEffect(() => {
    if (current) {
      setItemsDraft(Array.isArray(current.items) ? [...current.items].sort((a,b) => (a.sort_order||0)-(b.sort_order||0)) : []);
    } else {
      setItemsDraft([]);
    }
  }, [current]);

  const saveTemplate = async (payload) => {
    const token = localStorage.getItem('accessToken');
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/templates/${selected}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Update failed');
      toast.success('Template updated');
      await fetchTemplates(token);
      setEditing(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const updateItemsLocal = (mutateFn) => {
    setItemsDraft((prev) => mutateFn([...(Array.isArray(prev) ? prev : [])]));
  };

  const duplicateItem = (idx) => {
    updateItemsLocal((items) => {
      const cp = { ...items[idx] };
      delete cp._id; // let Mongo generate new _id
      cp.title = cp.title + ' (copy)';
      items.splice(idx + 1, 0, cp);
      return items.map((it, i) => ({ ...it, sort_order: i }));
    });
  };

  const bulkActivate = async (active) => {
    const ids = Object.keys(bulkSelection).filter(id => bulkSelection[id]);
    if (!ids.length) return;
    updateItemsLocal((items) => items.map((it) => ids.includes(String(it._id)) ? { ...it, active } : it));
    setBulkSelection({});
  };

  const removeItem = (idx) => {
    updateItemsLocal((items) => items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sort_order: i })));
  };

  const addItem = () => {
    setEditingIndex(null);
    setItemModalOpen(true);
  };

  const saveItemInlineLocal = (idx, patch) => {
    updateItemsLocal((items) => items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const openEditItemModal = (idx) => {
    setEditingIndex(idx);
    setItemModalOpen(true);
  };

  const handleSaveItem = (item) => {
    setItemsDraft((prev) => {
      const items = Array.isArray(prev) ? [...prev] : [];
      if (editingIndex === null || editingIndex === undefined) {
        // create
        items.push({
          ...item,
          sort_order: items.length,
        });
      } else {
        items[editingIndex] = { ...items[editingIndex], ...item };
      }
      // normalize sort_order
      return items.map((it, i) => ({ ...it, sort_order: i }));
    });
    setItemModalOpen(false);
    setEditingIndex(null);
  };

  const handleDeleteItem = () => {
    if (editingIndex === null || editingIndex === undefined) {
      setItemModalOpen(false);
      return;
    }
    updateItemsLocal((items) => items.filter((_, i) => i !== editingIndex).map((it, i) => ({ ...it, sort_order: i })));
    setItemModalOpen(false);
    setEditingIndex(null);
  };

  const reorder = (from, to) => {
    if (from === to) return;
    updateItemsLocal((items) => {
      const arr = [...items];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr.map((it, i) => ({ ...it, sort_order: i }));
    });
  };

  const saveItems = async () => {
    if (!current) return;
    await saveTemplate({ items: itemsDraft });
    // refetch and sync will occur via fetchTemplates in saveTemplate
  };

  const cancelItems = () => {
    if (!current) return;
    setItemsDraft(Array.isArray(current.items) ? [...current.items].sort((a,b) => (a.sort_order||0)-(b.sort_order||0)) : []);
    setBulkSelection({});
  };

  const triggerGeneration = async (preview = false, force = false, templateId = null) => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch('/api/admin/tasks/generate-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preview, force, template_id: templateId, department_id: selectedDept || null }),
      });
      if (res.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed');
      const created = data.result?.created ?? 0;
      toast.success(preview ? `Preview: would create ${created} tasks` : `Created ${created} tasks`);
    } catch (e) {
      toast.error(e.message);
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
      <nav className="gradient-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-3 justify-between items-center">
          <h1 className="text-2xl font-bold text-white">CEO · Templates & Daily Generation</h1>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs text-white/80">Department Scope</label>
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="px-3 py-2 rounded bg-white text-dark-purple min-w-[220px]">
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <button onClick={() => triggerGeneration(true, false)} className="px-3 py-2 rounded bg-white text-palatinate font-semibold">Preview Generation</button>
            <button onClick={() => triggerGeneration(false, true)} className="px-3 py-2 rounded bg-emerald-500 text-white font-semibold">Regenerate Today</button>
            <button onClick={() => router.push('/ceo')} className="px-3 py-2 rounded bg-white/20 text-white">Back</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-dark-purple">Templates</h2>
            <button onClick={() => { setCreating(true); setEditing(false); }} className="px-3 py-2 rounded bg-palatinate text-white text-sm">+ New Template</button>
          </div>
          {creating && (
            <div className="mb-4 border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-dark-purple">Create Template</h3>
                <button onClick={() => setCreating(false)} className="text-sm text-gray-600">Cancel</button>
              </div>
              <AdminTemplateEditor onSave={createTemplate} onCancel={() => setCreating(false)} />
            </div>
          )}
          <ul className="divide-y">
            {templates.map((t) => (
              <li key={t._id} className={`p-3 rounded ${selected === t._id ? 'bg-mint-cream' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 cursor-pointer" onClick={() => { setSelected(t._id); setEditing(false); }}>
                    <div className="font-semibold text-dark-purple">{t.title}</div>
                    <div className="text-xs text-gray-500">{t.frequency} · {t.assignment_mode} · items: {t.items?.length || 0}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelected(t._id); setEditing(true); }} className="px-2 py-1 text-xs rounded bg-white border">Edit</button>
                    <button onClick={() => triggerGeneration(true, false, t._id)} className="px-2 py-1 text-xs rounded bg-white border">Preview</button>
                    <button onClick={() => triggerGeneration(false, true, t._id)} className="px-2 py-1 text-xs rounded bg-emerald-500 text-white">Regenerate</button>
                    <button onClick={() => deleteTemplate(t._id)} className="px-2 py-1 text-xs rounded bg-red-600 text-white">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-8">
          {!current ? (
            <div className="bg-white rounded-xl shadow p-6 text-gray-500">Select a template</div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow p-6">
                {!editing ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-dark-purple">{current.title}</div>
                      <div className="text-gray-500 text-sm">{current.name}</div>
                    </div>
                    <button onClick={() => setEditing(true)} className="px-3 py-2 rounded bg-palatinate text-white font-semibold">Edit Template</button>
                  </div>
                ) : (
                  <AdminTemplateEditor initialValues={current} onCancel={() => setEditing(false)} onSave={saveTemplate} />
                )}
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-dark-purple">Items</h3>
                  <div className="flex gap-2">
                    <button onClick={() => bulkActivate(true)} className="px-3 py-2 rounded bg-emerald-500 text-white text-sm">Activate Selected</button>
                    <button onClick={() => bulkActivate(false)} className="px-3 py-2 rounded bg-red-500 text-white text-sm">Deactivate Selected</button>
                    <button onClick={addItem} className="px-3 py-2 rounded bg-palatinate text-white text-sm">+ Add Item</button>
                  </div>
                </div>
                {(itemsDraft.length || 0) === 0 ? (
                  <p className="text-gray-500">No items yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="py-2 px-2"><input type="checkbox" onChange={(e) => {
                            const checked = e.target.checked;
                            const map = {};
                            (itemsDraft || []).forEach(it => map[String(it._id || it.title+it.sort_order)] = checked);
                            setBulkSelection(map);
                          }} /></th>
                          <th className="text-left py-2 px-2">Title</th>
                          <th className="text-left py-2 px-2">Points</th>
                          <th className="text-left py-2 px-2">Priority</th>
                          <th className="text-left py-2 px-2">Due (IST)</th>
                          <th className="text-center py-2 px-2">Active</th>
                          <th className="text-center py-2 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(itemsDraft || []).map((it, idx) => (
                          <tr key={String(it._id || `${it.title}-${idx}`)} className="border-b hover:bg-mint-cream/50">
                            <td className="py-2 px-2 text-center">
                              <input type="checkbox" checked={!!bulkSelection[String(it._id || it.title+it.sort_order)]} onChange={(e) => setBulkSelection({ ...bulkSelection, [String(it._id || it.title+it.sort_order)]: e.target.checked })} />
                            </td>
                            <td className="py-2 px-2">
                              <div className="font-medium text-dark-purple">{it.title}</div>
                              {it.description ? (
                                <div className="text-xs text-gray-600 mt-1 line-clamp-2">{it.description}</div>
                              ) : null}
                            </td>
                            <td className="py-2 px-2 w-24">{it.default_points || 1}</td>
                            <td className="py-2 px-2 w-32 capitalize">{it.priority || 'medium'}</td>
                            <td className="py-2 px-2 w-28">{it.due_time_ist || '-'}</td>
                            <td className="py-2 px-2 text-center w-20">{it.active !== false ? 'Yes' : 'No'}</td>
                            <td className="py-2 px-2 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => reorder(idx, Math.max(0, idx-1))} className="text-sm text-gray-600">↑</button>
                                <button onClick={() => reorder(idx, idx+1)} className="text-sm text-gray-600">↓</button>
                                <button onClick={() => openEditItemModal(idx)} className="text-sm text-palatinate">Edit</button>
                                <button onClick={() => duplicateItem(idx)} className="text-sm text-blue-600">Duplicate</button>
                                <button onClick={() => removeItem(idx)} className="text-sm text-red-600">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={cancelItems} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Cancel</button>
                  <button onClick={saveItems} className="px-4 py-2 rounded bg-palatinate text-white font-semibold">Save Items</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      {itemModalOpen && (
        <TemplateItemModal
          open={itemModalOpen}
          title={editingIndex === null || editingIndex === undefined ? 'Add Item' : 'Edit Item'}
          initialItem={editingIndex === null || editingIndex === undefined ? null : itemsDraft[editingIndex]}
          onSave={handleSaveItem}
          onDelete={editingIndex === null || editingIndex === undefined ? undefined : handleDeleteItem}
          onClose={() => { setItemModalOpen(false); setEditingIndex(null); }}
        />
      )}
    </div>
  );
}
