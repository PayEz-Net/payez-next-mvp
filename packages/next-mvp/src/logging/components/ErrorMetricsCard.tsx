'use client';

import { useErrorMetrics } from '../hooks/useErrorMetrics';
import { TimeRange } from '../types';

interface ErrorMetricsCardProps {
  timeRange?: TimeRange;
  className?: string;
}

export function ErrorMetricsCard({ timeRange = '24h', className }: ErrorMetricsCardProps) {
  const { data, loading, error } = useErrorMetrics(timeRange);

  if (loading) return <div className={className}>Loading error metrics...</div>;
  if (error) return <div className={className}>Error: {error}</div>;
  if (!data) return null;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">
        Error Metrics
        <span className="text-sm text-gray-500 ml-2">
          ({new Date(data.periodStart).toLocaleDateString()} - {new Date(data.periodEnd).toLocaleDateString()})
        </span>
      </h3>

      {/* Total errors */}
      <div className="mb-4">
        <span className="text-3xl font-bold">{data.totalErrors}</span>
        <span className="text-gray-600 ml-2">total errors</span>
      </div>

      {/* Top failing routes */}
      {data.topFailingRoutes && data.topFailingRoutes.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Top Failing Routes</h4>
          <ul className="space-y-1">
            {data.topFailingRoutes.slice(0, 5).map((route, idx) => (
              <li key={idx} className="flex justify-between text-sm">
                <span className="font-mono">{route.route}</span>
                <span className="text-red-600">{route.count} errors</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors by level */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">By Severity</h4>
        <div className="flex gap-4">
          <div className="text-sm">
            <span className="font-medium">Error:</span>
            <span className="ml-1">{data.errorCount}</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">Warn:</span>
            <span className="ml-1">{data.warnCount}</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">Fatal:</span>
            <span className="ml-1">{data.fatalCount}</span>
          </div>
        </div>
      </div>

      {/* By category */}
      {data.byCategory && data.byCategory.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">By Category</h4>
          <div className="flex flex-wrap gap-2">
            {data.byCategory.map((cat, idx) => (
              <div key={idx} className="text-sm bg-gray-100 px-2 py-1 rounded">
                <span className="font-medium">{cat.category}:</span>
                <span className="ml-1">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top error codes */}
      {data.topErrorCodes && data.topErrorCodes.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Top Error Codes</h4>
          <ul className="space-y-1">
            {data.topErrorCodes.slice(0, 5).map((code, idx) => (
              <li key={idx} className="flex justify-between text-sm">
                <span className="font-mono">{code.errorCode}</span>
                <span className="text-orange-600">{code.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
