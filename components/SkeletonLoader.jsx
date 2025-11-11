export function SkeletonCard() {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
        <div className="h-6 bg-gray-300 rounded w-16"></div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-300 rounded-full w-20"></div>
        <div className="h-6 bg-gray-300 rounded w-16"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-300 rounded w-32"></div>
        <div className="h-6 bg-gray-300 rounded w-16"></div>
      </div>
    </div>
  );
}

export function SkeletonMeter() {
  return (
    <div className="w-full animate-pulse">
      <div className="flex justify-between items-center mb-3">
        <div className="h-6 bg-gray-300 rounded w-48"></div>
        <div className="h-5 bg-gray-300 rounded w-32"></div>
      </div>
      <div className="w-full h-10 bg-gray-300 rounded-xl"></div>
      <div className="flex justify-between mt-2">
        <div className="h-3 bg-gray-300 rounded w-8"></div>
        <div className="h-3 bg-gray-300 rounded w-8"></div>
        <div className="h-3 bg-gray-300 rounded w-8"></div>
        <div className="h-3 bg-gray-300 rounded w-8"></div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4 mb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 bg-gray-300 rounded flex-1"></div>
        ))}
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 mb-3">
          {[1, 2, 3, 4, 5, 6].map((j) => (
            <div key={j} className="h-8 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
      <div className="h-10 bg-gray-300 rounded w-16 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-32"></div>
    </div>
  );
}
