import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

export default function CEOUsers() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'reception',
    department_id: '',
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
      const [usersRes, deptsRes] = await Promise.all([
        fetch('/api/ceo/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/departments', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');

    try {
      const url = editingUser ? `/api/ceo/users/${editingUser._id}` : '/api/ceo/users';
      const method = editingUser ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingUser ? 'User updated!' : 'User created!');
        setShowForm(false);
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'reception', department_id: '' });
        fetchData(token);
      } else {
        const data = await res.json();
        toast.error(data.error?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department_id: user.department_id?._id || user.department_id,
    });
    setShowForm(true);
  };

  const handleDeactivate = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/ceo/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('User deactivated');
        fetchData(token);
      }
    } catch (error) {
      toast.error('Failed to deactivate user');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('⚠️ PERMANENT DELETE: This will permanently delete the user and all their data. This cannot be undone. Are you sure?')) return;

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/ceo/users/${userId}/permanent`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('User permanently deleted');
        fetchData(token);
      } else {
        const data = await res.json();
        toast.error(data.error?.message || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
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
          <h1 className="text-2xl font-bold text-white">User Management</h1>
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
            <h2 className="text-2xl font-bold text-dark-purple">All Users</h2>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingUser(null);
                setFormData({ name: '', email: '', password: '', role: 'reception', department_id: '' });
              }}
              className="gradient-primary text-white px-6 py-2 rounded-lg hover-lift btn-ripple"
            >
              {showForm ? 'Cancel' : '+ Add User'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 p-6 bg-mint-cream rounded-xl fade-in">
              <h3 className="text-xl font-bold text-dark-purple mb-4">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-dark-purple mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark-purple mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                    placeholder="john@hospital.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark-purple mb-2">
                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark-purple mb-2">Role *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate"
                  >
                    <option value="reception">Reception</option>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="administrator">Administrator</option>
                    <option value="ceo">CEO</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-dark-purple mb-2">Department *</label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
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
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="gradient-primary text-white px-6 py-3 rounded-lg hover-lift btn-ripple font-bold"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
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
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Email</th>
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Role</th>
                  <th className="text-left py-3 px-4 text-dark-purple font-semibold">Department</th>
                  <th className="text-center py-3 px-4 text-dark-purple font-semibold">Status</th>
                  <th className="text-center py-3 px-4 text-dark-purple font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-200 hover:bg-mint-cream transition-smooth">
                    <td className="py-4 px-4 font-medium text-dark-purple">{user.name}</td>
                    <td className="py-4 px-4 text-gray-600">{user.email}</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-palatinate text-white">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{user.department_id?.name || 'N/A'}</td>
                    <td className="py-4 px-4 text-center">
                      {user.is_active ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 transition-smooth font-semibold"
                        >
                          Edit
                        </button>
                        {user.is_active && (
                          <button
                            onClick={() => handleDeactivate(user._id)}
                            className="text-orange-600 hover:text-orange-800 transition-smooth font-semibold"
                          >
                            Deactivate
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user._id)}
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
