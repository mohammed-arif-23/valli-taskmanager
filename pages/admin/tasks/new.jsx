import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminTaskEditor from '@/components/AdminTaskEditor';
import { toast } from 'react-toastify';

export default function NewTask() {
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

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

    fetchDepartments(token);
  }, []);

  const fetchDepartments = async (token) => {
    try {
      const res = await fetch('/api/departments', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments);
      }
    } catch (error) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    const token = localStorage.getItem('accessToken');

    const res = await fetch('/api/admin/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to create task');
    }

    toast.success('Task created successfully!');
    router.push('/admin');
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/admin')}
            className="text-white hover:text-mint-cream transition-smooth flex items-center gap-2 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Admin Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-quinacridone-magenta scale-in">
          <h1 className="text-3xl font-bold mb-6 text-dark-purple">Create New Task</h1>
          <AdminTaskEditor departments={departments} onSave={handleSave} />
        </div>
      </main>
    </div>
  );
}
