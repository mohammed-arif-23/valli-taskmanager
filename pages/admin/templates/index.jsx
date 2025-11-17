import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import AdminTemplateEditor from '@/components/AdminTemplateEditor';

export default function AdminTemplates() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (!['administrator', 'ceo', 'manager'].includes(user.role)) {
      toast.error('Access denied');
      router.push('/');
      return;
    }

    fetchTemplates(token);
  }, []);

  const fetchTemplates = async (token) => {
    try {
      const res = await fetch('/api/admin/templates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (e) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (tpl) => {
    setEditingId(tpl._id);
    setEditingTemplate(tpl);
    setCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTemplate(null);
  };

  const handleSave = async (form) => {
    const token = localStorage.getItem('accessToken');
    setBusy(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/admin/templates/${editingId}` : '/api/admin/templates';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || (isEdit ? 'Failed to update template' : 'Failed to create template'));
      toast.success(isEdit ? 'Template updated' : 'Template created');
      setCreating(false);
      setEditingId(null);
      setEditingTemplate(null);
      await fetchTemplates(token);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Delete failed');
      toast.success('Template deleted');
      await fetchTemplates(token);
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Admin Templates</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-sm text-white hover:text-mint-cream transition-smooth">Back to Admin</button>
            <button onClick={() => setCreating(true)} className="bg-white text-quinacridone-magenta px-4 py-2 rounded-lg hover-lift font-semibold">+ New Template</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {(creating || editingId) && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-quinacridone-magenta mb-8">
            <h2 className="text-xl font-bold mb-4 text-dark-purple">{editingId ? 'Edit Template' : 'Create Template'}</h2>
            <AdminTemplateEditor onSave={handleSave} initialValues={editingTemplate} onCancel={cancelEdit} />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          {templates.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No templates yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-quinacridone-magenta">
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Frequency</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Due Time (IST)</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Roles</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Assign</th>
                    <th className="text-left py-3 px-4 text-dark-purple font-semibold">Active</th>
                    <th className="text-center py-3 px-4 text-dark-purple font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t._id} className="border-b border-gray-200">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-dark-purple">{t.title}</div>
                        <div className="text-xs text-gray-500">{t.name}</div>
                      </td>
                      <td className="py-3 px-4">{t.frequency || 'none'}</td>
                      <td className="py-3 px-4">{t.due_time_ist || '-'}</td>
                      <td className="py-3 px-4 text-sm">{(t.applies_to_roles || []).join(', ')}</td>
                      <td className="py-3 px-4 text-sm">{t.assignment_mode}</td>
                      <td className="py-3 px-4">{t.active ? 'Yes' : 'No'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => startEdit(t)} className="text-blue-600 hover:text-blue-800">Edit</button>
                          <button onClick={() => handleDelete(t._id)} className="text-red-600 hover:text-red-800">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
