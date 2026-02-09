'use client';

import { useHealthMetrics } from '../hooks/useHealthMetrics';
import { TimeRange } from '../types';

interface HealthMetricsCardProps {
  timeRange?: TimeRange;
  className?: string;
}

export function HealthMetricsCard({ timeRange = '1h', className }: HealthMetricsCardProps) {
  const { data, loading, error } = useHealthMetrics(timeRange);

  if (loading) return <div className={className}>Loading health metrics...</div>;
  if (error) return <div className={className}>Error: {error}</div>;
  if (!data) return null;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">System Health ({data.timeRange})</h3>

      {/* API health overview */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-2xl font-bold">{data.apiHealth.avgResponseTimeMs}ms</div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{data.apiHealth.requestCount}</div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{data.apiHealth.p95ResponseTimeMs}ms</div>
          <div className="text-sm text-gray-600">P95 Response Time</div>
        </div>
        <div>
          <div className="text-2xl font-bold">
            {(data.apiHealth.errorRate * 100).toFixed(2)}%
          </div>
          <div className="text-sm text-gray-600">Error Rate</div>
        </div>
      </div>

      {/* Slowest endpoints */}
      {data.endpointBreakdown.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Slowest Endpoints</h4>
          <ul className="space-y-1">
            {data.endpointBreakdown
              .sort((a, b) => b.avgDurationMs - a.avgDurationMs)
              .slice(0, 5)
              .map((ep, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="font-mono">{ep.endpoint}</span>
                  <span className="text-orange-600">{ep.avgDurationMs}ms</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Rate limit hits */}
      {data.rateLimitHits > 0 && (
        <div className="text-sm text-yellow-600">
          ⚠️ {data.rateLimitHits} rate limit hits
        </div>
      )}
    </div>
  );
}
