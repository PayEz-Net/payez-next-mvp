import { useState, useEffect } from 'react';
import { HealthMetrics, TimeRange } from '../types';
import { getHealthMetrics } from '../api/admin-analytics';

export function useHealthMetrics(timeRange: TimeRange = '1h') {
  const [data, setData] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await getHealthMetrics(timeRange);
        if (mounted) {
          setData(result.data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch health metrics');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    // Auto-refresh health metrics every minute
    const interval = setInterval(fetchData, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [timeRange]);

  return { data, loading, error };
}
