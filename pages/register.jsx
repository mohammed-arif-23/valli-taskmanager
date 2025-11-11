import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department_id: '',
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/auth/departments');
      const data = await res.json();
      if (res.ok) {
        setDepartments(data.departments || []);
      } else {
        toast.error('Failed to load departments');
      }
    } catch (error) {
      toast.error('Error loading departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!formData.department_id) {
      toast.error('Please select a department');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          department_id: formData.department_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      toast.success('Registration successful! Please login.');
      router.push('/login');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mint-cream gradient-radial py-8">
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-dark-purple mb-2">Staff Registration</h1>
          <p className="text-gray-600">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="fade-in">
            <label htmlFor="name" className="block text-sm font-medium text-dark-purple mb-2">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate transition-smooth"
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          <div className="fade-in" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="email" className="block text-sm font-medium text-dark-purple mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate transition-smooth"
              placeholder="your.email@hospital.com"
              required
              disabled={loading}
            />
          </div>

          <div className="fade-in" style={{ animationDelay: '0.2s' }}>
            <label
              htmlFor="department_id"
              className="block text-sm font-medium text-dark-purple mb-2"
            >
              Department
            </label>
            <select
              id="department_id"
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate transition-smooth"
              required
              disabled={loading || loadingDepartments}
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="fade-in" style={{ animationDelay: '0.3s' }}>
            <label htmlFor="password" className="block text-sm font-medium text-dark-purple mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate transition-smooth"
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <div className="fade-in" style={{ animationDelay: '0.4s' }}>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-dark-purple mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate transition-smooth"
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || loadingDepartments}
            className="w-full gradient-primary text-white py-3 px-4 rounded-lg hover-lift btn-ripple micro-bounce disabled:opacity-50 disabled:cursor-not-allowed transition-smooth font-semibold text-lg fade-in"
            style={{ animationDelay: '0.5s' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Account...
              </span>
            ) : (
              'Register'
            )}
          </button>

          <div className="text-center mt-4 fade-in" style={{ animationDelay: '0.6s' }}>
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-palatinate hover:text-dark-purple font-semibold transition-smooth"
              >
                Login here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
