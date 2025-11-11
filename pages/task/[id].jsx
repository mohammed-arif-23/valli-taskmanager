import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TaskDetail from '@/components/TaskDetail';
import { toast } from 'react-toastify';

export default function TaskPage() {
  const router = useRouter();
  const { id } = router.query;
  const [task, setTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [roundingPolicy, setRoundingPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchData(token);
  }, [id]);

  const fetchData = async (token) => {
    try {
      // Fetch task details
      const taskRes = await fetch(`/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!taskRes.ok) {
        throw new Error('Failed to load task');
      }

      const taskData = await taskRes.json();
      setTask(taskData.task);
      setSubmissions(taskData.submissions);

      // Fetch settings for rounding policy
      const settingsRes = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setRoundingPolicy(settingsData.settings.rounding_policy);
      }
    } catch (error) {
      toast.error(error.message);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (submissionData) => {
    const token = localStorage.getItem('accessToken');

    const res = await fetch(`/api/tasks/${id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(submissionData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Submission failed');
    }

    toast.success('Task submitted successfully!');
    // Add timestamp to force dashboard refresh
    router.push('/?refresh=' + Date.now());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mint-cream flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const currentSubmission = submissions && submissions.length > 0 ? submissions[0] : null;

  return (
    <div className="min-h-screen bg-mint-cream">
      <nav className="gradient-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/')}
            className="text-white hover:text-mint-cream transition-smooth flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {task && roundingPolicy && (
          <TaskDetail
            task={task}
            roundingPolicy={roundingPolicy}
            currentSubmission={currentSubmission}
            onSubmit={handleSubmit}
          />
        )}
      </main>
    </div>
  );
}
