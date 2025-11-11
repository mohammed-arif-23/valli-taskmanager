import GaugeComponent from 'react-gauge-component';

export default function Meter({ allocatedPoints, receivedPoints, thresholds }) {
  const percent = allocatedPoints > 0 ? Math.round((receivedPoints / allocatedPoints) * 100) : 0;

  const getZoneLabel = (pct) => {
    if (pct < thresholds.red) return 'Needs Improvement';
    if (pct < thresholds.orange) return 'Good Progress';
    return 'Excellent Performance';
  };

  return (
    <div className="w-full">
      <div
        role="meter"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Performance: ${percent}% - ${getZoneLabel(percent)}`}
      >
        <div className="flex flex-col items-center">
          <GaugeComponent
            type="semicircle"
            arc={{
              width: 0.2,
              padding: 0.005,
              cornerRadius: 1,
              subArcs: [
                {
                  limit: thresholds.red,
                  color: '#ef4444',
                  showTick: true,
                },
                {
                  limit: thresholds.orange,
                  color: '#f97316',
                  showTick: true,
                },
                {
                  limit: 100,
                  color: '#22c55e',
                  showTick: true,
                },
              ],
            }}
            pointer={{
              color: '#912f56',
              length: 0.80,
              width: 15,
              elastic: true,
            }}
            labels={{
              valueLabel: {
                hide: true,
              },
              tickLabels: {
                type: 'outer',
                ticks: [
                  { value: 0 },
                  { value: thresholds.red },
                  { value: thresholds.orange },
                  { value: 100 },
                ],
                defaultTickValueConfig: {
                  formatTextValue: (value) => `${value}%`,
                  style: {
                    fontSize: '12px',
                    fill: '#6b7280',
                  },
                },
              },
            }}
            value={percent}
            minValue={0}
            maxValue={100}
          />
          
          <div className="mt-4 text-center">
            <p className="text-4xl font-bold text-quinacridone-magenta mb-2">
              {percent}%
            </p>
            <p className="text-xl font-bold text-dark-purple mb-3">
              {getZoneLabel(percent)}
            </p>
            <p className="text-lg text-gray-600">
              <span className="font-bold text-quinacridone-magenta text-2xl">{receivedPoints}</span>
              <span className="text-gray-500 mx-2">/</span>
              <span className="font-semibold text-gray-700">{allocatedPoints}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">points earned</p>
          </div>
        </div>

        <span className="sr-only">
          {receivedPoints} out of {allocatedPoints} points earned
        </span>
      </div>
    </div>
  );
}
