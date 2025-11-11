import { utcToIstDisplay } from '@/lib/date';
import SubmissionForm from './SubmissionForm';

export default function TaskDetail({ task, roundingPolicy, currentSubmission, onSubmit }) {
  const getTypeBadgeColor = (type) => {
    return type === 'primary' ? 'bg-palatinate text-white' : 'bg-quinacridone-magenta text-white';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'text-red-600';
    if (priority === 'medium') return 'text-orange-600';
    return 'text-green-600';
  };

  const isCompleted = currentSubmission?.status === 'completed';

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-quinacridone-magenta rounded-xl p-6 shadow-lg fade-in relative">
        {isCompleted && (
          <div className="absolute top-4 right-4">
            <span className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
              ✓ COMPLETED
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-start mb-4">
          <h1 className={`text-3xl font-bold text-dark-purple ${isCompleted ? 'line-through' : ''}`}>
            {task.title}
          </h1>
          {task.is_archived && (
            <span className="bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
              Archived
            </span>
          )}
        </div>

        <p className="text-gray-700 mb-6 text-lg">{task.description}</p>

        <div className="flex gap-3 mb-6">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getTypeBadgeColor(task.type)}`}>
            {task.type}
          </span>
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${getPriorityColor(task.priority)}`}>
            {task.priority.toUpperCase()} PRIORITY
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6 bg-mint-cream p-4 rounded-lg">
          <div>
            <span className="text-gray-600 text-sm font-medium">Due Date:</span>
            <p className="font-bold text-dark-purple text-lg">
              {utcToIstDisplay(new Date(task.due_at_utc), 'dd MMM yyyy, hh:mm a')}
            </p>
          </div>
          <div>
            <span className="text-gray-600 text-sm font-medium">Points:</span>
            <p className="font-bold text-quinacridone-magenta text-2xl">{task.default_points}</p>
          </div>
        </div>

        {currentSubmission && (
          <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h3 className="font-bold text-dark-purple mb-2">Current Status:</h3>
            <div className="flex justify-between items-center">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                currentSubmission.status === 'completed' ? 'bg-green-100 text-green-700' :
                currentSubmission.status === 'partial' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {currentSubmission.status === 'completed' ? '✓ Completed' :
                 currentSubmission.status === 'partial' ? '◐ Partial' : '✗ Not Started'}
              </span>
              <span className="font-bold text-quinacridone-magenta text-xl">
                {currentSubmission.points_awarded} points
              </span>
            </div>
            {currentSubmission.not_started_reason && (
              <p className="text-sm text-gray-700 mt-2">
                <strong>Reason:</strong> {currentSubmission.not_started_reason}
              </p>
            )}
          </div>
        )}
      </div>

      {!task.is_archived && (
        <div className="bg-white border-2 border-quinacridone-magenta rounded-xl p-6 shadow-lg scale-in">
          <h2 className="text-2xl font-bold text-dark-purple mb-4">
            {currentSubmission ? 'Update Submission' : 'Submit Task'}
          </h2>
          <SubmissionForm 
            task={task} 
            roundingPolicy={roundingPolicy} 
            currentSubmission={currentSubmission}
            onSubmit={onSubmit} 
          />
        </div>
      )}
    </div>
  );
}
