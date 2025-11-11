import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      // Store access token in memory (could use context/state management)
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('Login successful!');

      // Redirect based on role
      if (data.user.role === 'ceo') {
        router.push('/ceo');
      } else if (data.user.role === 'administrator' || data.user.role === 'manager') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mint-cream gradient-radial">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md scale-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-dark-purple mb-2">Hospital Task Manager</h1>
          <p className="text-gray-600">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="fade-in">
            <label htmlFor="email" className="block text-sm font-medium text-dark-purple mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate transition-smooth"
              placeholder="your.email@hospital.com"
              required
              disabled={loading}
            />
          </div>

          <div className="fade-in" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="password" className="block text-sm font-medium text-dark-purple mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate transition-smooth"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-white py-3 px-4 rounded-lg hover-lift btn-ripple micro-bounce disabled:opacity-50 disabled:cursor-not-allowed transition-smooth font-semibold text-lg fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>

          <div className="text-center mt-4 fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-palatinate hover:text-dark-purple font-semibold transition-smooth">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
