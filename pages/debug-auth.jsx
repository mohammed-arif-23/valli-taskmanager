import { useEffect, useState } from 'react';

export default function DebugAuth() {
  const [info, setInfo] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    setInfo({
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token?.substring(0, 20) + '...',
      hasUser: !!user,
      user: user ? JSON.parse(user) : null,
    });
  }, []);

  const testAPI = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch('/api/ceo/departments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(`Status: ${res.status}\n${await res.text()}`);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-mint-cream p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Auth Debug Info</h1>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(info, null, 2)}
        </pre>
        <button
          onClick={testAPI}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Test API Call
        </button>
        <button
          onClick={() => {
            localStorage.clear();
            alert('Cleared! Now go to /login');
          }}
          className="mt-4 ml-4 bg-red-600 text-white px-4 py-2 rounded"
        >
          Clear Storage
        </button>
      </div>
    </div>
  );
}
