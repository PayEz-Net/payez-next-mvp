import { TimeRange } from '../types';
import { useErrorMetrics } from './useErrorMetrics';
import { useHealthMetrics } from './useHealthMetrics';
import { useAuditLog } from './useAuditLog';

/**
 * Combined hook for admin analytics
 * Fetches both error and health metrics
 */
export function useAdminAnalytics(timeRange: TimeRange = '24h') {
  const errorMetrics = useErrorMetrics(timeRange);
  const healthMetrics = useHealthMetrics(timeRange);
  const auditLog = useAuditLog();

  return {
    errorMetrics,
    healthMetrics,
    auditLog,
    loading: errorMetrics.loading || healthMetrics.loading,
    error: errorMetrics.error || healthMetrics.error,
  };
}
