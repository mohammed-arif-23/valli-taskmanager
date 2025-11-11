import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

export default function Leaderboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchLeaderboard(token);
  }, []);

  const fetchLeaderboard = async (token) => {
    try {
      const res = await fetch('/api/leaderboard/departments', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
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
          <button
            onClick={() => router.push('/')}
            className="text-white hover:text-mint-cream transition-smooth flex items-center gap-2 font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-white">🏆 Department Leaderboard</h1>
          <div className="w-32"></div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-quinacridone-magenta">
          <div className="space-y-4">
            {leaderboard.map((dept, index) => (
              <div
                key={dept._id}
                className={`p-6 rounded-xl border-2 transition-smooth hover-lift ${
                  index === 0 ? 'bg-yellow-50 border-yellow-400' :
                  index === 1 ? 'bg-gray-50 border-gray-400' :
                  index === 2 ? 'bg-orange-50 border-orange-400' :
                  'bg-white border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold">{getMedalEmoji(index)}</span>
                    <div>
                      <h3 className="text-xl font-bold text-dark-purple">{dept.department_name}</h3>
                      <p className="text-sm text-gray-600">{dept.user_count} staff members</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-quinacridone-magenta">
                      {dept.completion_rate.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600">
                      {dept.total_received} / {dept.total_allocated} points
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-quinacridone-magenta to-palatinate h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(dept.completion_rate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
