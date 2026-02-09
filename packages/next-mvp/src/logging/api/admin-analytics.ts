import { ErrorMetrics, HealthMetrics, TimeRange } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_VIBE_API_URL || 'http://localhost:32786';

/**
 * Get admin token from app's auth implementation
 * Apps should override this via their own auth logic
 */
function getAdminToken(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('admin_token') || '';
  }
  return '';
}

export async function getErrorMetrics(timeRange: TimeRange = '24h') {
  // Convert timeRange to hours for backend API
  const hoursMap: Record<TimeRange, number> = {
    '1h': 1,
    '24h': 24,
    '7d': 168,
    '30d': 720
  };
  const hours = hoursMap[timeRange];

  const res = await fetch(`${API_BASE}/v1/admin/analytics/errors?hours=${hours}`, {
    headers: {
      Authorization: `Bearer ${getAdminToken()}`
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch error metrics: ${res.statusText}`);
  }

  return res.json();
}

export async function getHealthMetrics(timeRange: TimeRange = '1h') {
  const res = await fetch(`${API_BASE}/v1/admin/analytics/health?timeRange=${timeRange}`, {
    headers: {
      Authorization: `Bearer ${getAdminToken()}`
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch health metrics: ${res.statusText}`);
  }

  return res.json();
}
