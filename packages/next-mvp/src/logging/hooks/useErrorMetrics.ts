import { useState, useEffect } from 'react';
import { ErrorMetrics, TimeRange } from '../types';
import { getErrorMetrics } from '../api/admin-analytics';

export function useErrorMetrics(timeRange: TimeRange = '24h') {
  const [data, setData] = useState<ErrorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await getErrorMetrics(timeRange);
        if (mounted) {
          setData(result.data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch error metrics');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [timeRange]);

  return { data, loading, error };
}
