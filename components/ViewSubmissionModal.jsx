import React from 'react';
import { utcToIstDisplay } from '@/lib/date';

export default function ViewSubmissionModal({ submission, onClose }) {
  if (!submission) return null;
  const s = submission;
  const reason = s.status === 'not_started' ? (s.not_started_reason || '—') : s.status === 'rejected' ? (s.rejection_reason || '—') : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark-purple">Submission Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Task</div>
              <div className="font-semibold text-dark-purple">{s.task_id?.title || 'Task'}</div>
              <div className="text-xs text-gray-600">Dept: {s.task_id?.department_id?.name || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">User</div>
              <div className="font-semibold text-dark-purple">{s.user_id?.name || 'User'}</div>
              <div className="text-xs text-gray-600">{s.user_id?.email}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className="font-semibold capitalize">{s.status}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Submitted At</div>
              <div className="font-semibold">{s.created_at ? new Date(s.created_at).toLocaleString() : '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Points Awarded</div>
              <div className="font-semibold text-quinacridone-magenta">{s.points_awarded}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Task Due</div>
              <div className="font-semibold">{s.task_id?.due_at_utc ? utcToIstDisplay(new Date(s.task_id.due_at_utc)) : '—'}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Reason</div>
            <div className="px-3 py-2 border rounded bg-gray-50 text-sm min-h-[44px]">{reason}</div>
          </div>

          {s.evidence_url && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Evidence</div>
              {/* naive preview: image/pdf or generic link */}
              {/(\.png|\.jpg|\.jpeg|\.gif|\.webp)$/i.test(s.evidence_url) ? (
                <img src={s.evidence_url} alt="Evidence" className="max-h-72 rounded border" />
              ) : (
                <a href={s.evidence_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open Evidence</a>
              )}
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t flex items-center justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Close</button>
        </div>
      </div>
    </div>
  );
}
