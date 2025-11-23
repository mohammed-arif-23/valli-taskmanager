import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import CeoTasksGrid from '@/components/CeoTasksGrid';

export default function CEOTasks() {
  const router = useRouter();

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
    }
  }, [router]);

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
          <CeoTasksGrid />
        </div>
      </main>
    </div>
  );
}
