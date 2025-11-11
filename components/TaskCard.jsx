import { utcToIstDisplay } from '@/lib/date';
import { useRouter } from 'next/router';
import { memo } from 'react';

function TaskCard({ task, submission }) {
  const router = useRouter();

  const getTypeBadgeColor = (type) => {
    return type === 'primary' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'bg-red-100 text-red-700 border-red-300';
    if (priority === 'medium') return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'high') return '🔴';
    if (priority === 'medium') return '🟡';
    return '🟢';
  };

  const isOverdue = new Date(task.due_at_utc) < new Date() && !isCompleted;

  const handleClick = () => {
    if (!isCompleted) {
      router.push(`/task/${task._id}`);
    }
  };

  const isCompleted = submission?.status === 'completed';

  return (
    <div
      onClick={handleClick}
      className={`bg-white border-2 rounded-xl p-5 transition-smooth relative ${
        isOverdue ? 'border-red-500 bg-red-50' : 'border-quinacridone-magenta'
      } ${
        isCompleted ? 'opacity-75 cursor-not-allowed' : 'hover-lift card-interactive cursor-pointer'
      }`}
    >
      {isCompleted && (
        <div className="absolute inset-0 bg-green-500 bg-opacity-10 rounded-xl flex items-center justify-center pointer-events-none"></div>
      )}

      <div className="flex justify-between items-start mb-3">
        <h3 className={`text-lg font-bold text-dark-purple ${isCompleted ? 'line-through' : ''}`}>
          {task.title}
        </h3>
        {task.is_archived && (
          <span className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded-full font-semibold">
            Archived
          </span>
        )}
        {isCompleted && !task.is_archived && (
          <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-semibold">
            ✓ Done
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span
          className={`text-xs px-3 py-1 rounded-full font-semibold ${getTypeBadgeColor(task.type)}`}
        >
          {task.type.toUpperCase()}
        </span>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${getPriorityColor(task.priority)}`}>
          {getPriorityIcon(task.priority)} {task.priority.toUpperCase()}
        </span>
        {isOverdue && (
          <span className="text-xs px-3 py-1 rounded-full font-semibold bg-red-600 text-white animate-pulse">
            ⚠️ OVERDUE
          </span>
        )}
      </div>

      <div className="flex justify-between items-center text-sm">
        <div className="text-gray-600">
          <svg
            className="w-4 h-4 inline mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {utcToIstDisplay(new Date(task.due_at_utc), 'dd MMM, hh:mm a')}
        </div>
        <span className="font-bold text-quinacridone-magenta text-lg">
          {task.default_points} pts
        </span>
      </div>
    </div>
  );
}

export default memo(TaskCard);
