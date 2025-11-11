import { useState, useEffect } from 'react';
import { calculatePoints } from '@/lib/points';

export default function SubmissionForm({ task, roundingPolicy, onSubmit, currentSubmission }) {
  const [status, setStatus] = useState(currentSubmission?.status || 'completed');
  const [notStartedReason, setNotStartedReason] = useState(currentSubmission?.not_started_reason || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate not_started_reason
    if (status === 'not_started' && !notStartedReason.trim()) {
      setError('Reason is required when status is "not started"');
      return;
    }

    if (notStartedReason.length > 200) {
      setError('Reason must be 200 characters or less');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        status,
        not_started_reason: status === 'not_started' ? notStartedReason : undefined,
      });
    } catch (err) {
      setError(err.message || 'Failed to submit task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="fade-in">
        <label htmlFor="status" className="block text-sm font-bold text-dark-purple mb-2">
          Task Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate transition-smooth"
          disabled={loading}
        >
          <option value="completed">✓ Completed</option>
          <option value="partial">◐ Partially Done</option>
          <option value="not_started">✗ Not Started</option>
        </select>
      </div>

      {status === 'not_started' && (
        <div className="fade-in">
          <label htmlFor="reason" className="block text-sm font-bold text-dark-purple mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            value={notStartedReason}
            onChange={(e) => setNotStartedReason(e.target.value)}
            maxLength={200}
            rows={3}
            className="w-full px-4 py-3 border-2 border-quinacridone-magenta rounded-lg focus:outline-none focus:ring-2 focus:ring-palatinate transition-smooth"
            placeholder="Please explain why this task was not started..."
            disabled={loading}
            required
          />
          <p className="text-xs text-gray-600 mt-1 font-medium">
            {notStartedReason.length}/200 characters
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 fade-in">
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full gradient-primary text-white py-3 px-4 rounded-lg hover-lift btn-ripple micro-bounce disabled:opacity-50 disabled:cursor-not-allowed transition-smooth font-bold text-lg fade-in"
        style={{ animationDelay: '0.1s' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Submitting...
          </span>
        ) : (
          'Submit Task'
        )}
      </button>
    </form>
  );
}
