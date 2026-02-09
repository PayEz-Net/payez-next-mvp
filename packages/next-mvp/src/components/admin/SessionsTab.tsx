'use client';

import React, { useState, useEffect, useCallback } from 'react';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface LoginSession {
  id: number;
  idp_user_id: number;
  email: string;
  name?: string;
  status: 'active' | 'revoked' | 'expired';
  ip_address?: string;
  city?: string;
  region?: string;
  country_code?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  created_at: string;
  last_activity?: string;
  revoked_at?: string;
  revoked_by?: string;
  country_flag?: string;
}

export interface SessionStats {
  totalActive: number;
  totalRevoked: number;
  uniqueUsers: number;
  recentLogins: number;
  byCountryWithFlags: Record<string, { count: number; flag: string }>;
  byDevice: Record<string, number>;
}

export interface SessionsTabProps {
  isDark?: boolean;
  /** Base API path for sessions (default: /api/admin/sessions) */
  apiBasePath?: string;
}

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

export function SessionsTab({ isDark = true, apiBasePath = '/api/admin/sessions' }: SessionsTabProps) {
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'revoked'>('all');
  const [filterEmail, setFilterEmail] = useState('');
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [revokingUserId, setRevokingUserId] = useState<number | null>(null);

  const themeClasses = {
    cardBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm',
    inputBg: isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900',
    textPrimary: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-500' : 'text-gray-500',
  };

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterEmail) params.set('email', filterEmail);

      const response = await fetch(`${apiBasePath}?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSessions(data.sessions || []);
        setLastRefresh(new Date());
      } else {
        setError(data.error || 'Failed to fetch sessions');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, filterEmail, apiBasePath]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(apiBasePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats' }),
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [apiBasePath]);

  // Initial fetch
  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, [fetchSessions, fetchStats]);

  // Revoke single session
  const handleRevokeSession = async (sessionId: number) => {
    if (!confirm('Are you sure you want to revoke this session? The user will be logged out.')) {
      return;
    }

    setRevokingId(sessionId);
    try {
      const response = await fetch(`${apiBasePath}/${sessionId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Revoked from admin dashboard' }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchSessions();
        await fetchStats();
      } else {
        alert(data.error || 'Failed to revoke session');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setRevokingId(null);
    }
  };

  // Revoke all sessions for a user
  const handleRevokeAllUserSessions = async (userId: number, userEmail: string) => {
    if (!confirm(`Are you sure you want to revoke ALL sessions for ${userEmail}? They will be logged out from all devices.`)) {
      return;
    }

    setRevokingUserId(userId);
    try {
      const response = await fetch(`${apiBasePath}/user/${userId}/revoke-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'All sessions revoked from admin dashboard' }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Revoked ${data.revokedCount} session(s) for ${userEmail}`);
        await fetchSessions();
        await fetchStats();
      } else {
        alert(data.error || 'Failed to revoke sessions');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setRevokingUserId(null);
    }
  };

  // Format time ago
  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  // Format location
  const formatLocation = (session: LoginSession) => {
    const parts = [session.city, session.region, session.country_code].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`${themeClasses.cardBg} border rounded-xl p-4`}>
            <div className="text-2xl font-bold text-emerald-400">{stats.totalActive}</div>
            <div className={`text-sm ${themeClasses.textMuted}`}>Active Sessions</div>
          </div>
          <div className={`${themeClasses.cardBg} border rounded-xl p-4`}>
            <div className="text-2xl font-bold text-red-400">{stats.totalRevoked}</div>
            <div className={`text-sm ${themeClasses.textMuted}`}>Revoked Sessions</div>
          </div>
          <div className={`${themeClasses.cardBg} border rounded-xl p-4`}>
            <div className="text-2xl font-bold text-blue-400">{stats.uniqueUsers}</div>
            <div className={`text-sm ${themeClasses.textMuted}`}>Unique Users</div>
          </div>
          <div className={`${themeClasses.cardBg} border rounded-xl p-4`}>
            <div className="text-2xl font-bold text-purple-400">{stats.recentLogins}</div>
            <div className={`text-sm ${themeClasses.textMuted}`}>Logins (24h)</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`${themeClasses.cardBg} border rounded-xl p-4`}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Filter by email..."
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSessions()}
              className={`w-full px-4 py-2 rounded-lg border ${themeClasses.inputBg}`}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'revoked')}
            className={`px-4 py-2 rounded-lg border ${themeClasses.inputBg}`}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="revoked">Revoked Only</option>
          </select>
          <button
            onClick={fetchSessions}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Search'}
          </button>
          <span className={`text-xs ${themeClasses.textMuted}`}>
            {lastRefresh ? `Last: ${lastRefresh.toLocaleTimeString()}` : ''}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/20 border border-red-500 text-red-400">
          {error}
        </div>
      )}

      {/* Sessions Table */}
      <div className={`${themeClasses.cardBg} border rounded-xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-gray-200'} bg-opacity-50 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium text-sm`}>User</th>
                <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium text-sm`}>Location</th>
                <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium text-sm`}>Device</th>
                <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium text-sm`}>Status</th>
                <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium text-sm`}>Created</th>
                <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium text-sm`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`text-center py-8 ${themeClasses.textMuted}`}>
                    {isLoading ? 'Loading sessions...' : 'No sessions found'}
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className={`border-b ${isDark ? 'border-slate-700' : 'border-gray-100'} last:border-0`}>
                    <td className="py-3 px-4">
                      <div>
                        <div className={`font-medium ${themeClasses.textPrimary}`}>
                          {session.name || session.email.split('@')[0]}
                        </div>
                        <div className={`text-xs ${themeClasses.textMuted}`}>{session.email}</div>
                        <div className={`text-xs ${themeClasses.textMuted}`}>ID: {session.idp_user_id}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{session.country_flag || '🌍'}</span>
                        <div>
                          <div className={themeClasses.textPrimary}>{formatLocation(session)}</div>
                          <div className={`text-xs font-mono ${themeClasses.textMuted}`}>{session.ip_address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className={`${themeClasses.textPrimary} capitalize`}>
                          {session.device_type === 'desktop' ? '💻' : session.device_type === 'mobile' ? '📱' : '📲'} {session.device_type}
                        </div>
                        <div className={`text-xs ${themeClasses.textMuted}`}>{session.browser} / {session.os}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        session.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : session.status === 'revoked'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {session.status}
                      </span>
                      {session.status === 'revoked' && session.revoked_at && (
                        <div className={`text-xs ${themeClasses.textMuted} mt-1`}>
                          {getTimeAgo(session.revoked_at)}
                        </div>
                      )}
                    </td>
                    <td className={`py-3 px-4 ${themeClasses.textMuted} text-sm`}>
                      <div>{getTimeAgo(session.created_at)}</div>
                      {session.last_activity && (
                        <div className={`text-xs ${themeClasses.textMuted}`}>
                          Active: {getTimeAgo(session.last_activity)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {session.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleRevokeSession(session.id)}
                              disabled={revokingId === session.id}
                              className="px-3 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                              title="Revoke this session"
                            >
                              {revokingId === session.id ? '...' : 'Revoke'}
                            </button>
                            <button
                              onClick={() => handleRevokeAllUserSessions(session.idp_user_id, session.email)}
                              disabled={revokingUserId === session.idp_user_id}
                              className="px-3 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 disabled:opacity-50"
                              title="Revoke all sessions for this user"
                            >
                              {revokingUserId === session.idp_user_id ? '...' : 'Revoke All'}
                            </button>
                          </>
                        )}
                        {session.status === 'revoked' && (
                          <span className={`text-xs ${themeClasses.textMuted}`}>
                            By: {session.revoked_by?.split('@')[0]}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device and Country Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* By Device */}
          <div className={`${themeClasses.cardBg} border rounded-xl p-4`}>
            <h3 className={`font-semibold ${themeClasses.textPrimary} mb-3`}>Sessions by Device</h3>
            <div className="space-y-2">
              {Object.entries(stats.byDevice).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <span className={`${themeClasses.textSecondary} capitalize`}>
                    {device === 'desktop' ? '💻' : device === 'mobile' ? '📱' : '📲'} {device}
                  </span>
                  <span className={themeClasses.textPrimary}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Country */}
          <div className={`${themeClasses.cardBg} border rounded-xl p-4`}>
            <h3 className={`font-semibold ${themeClasses.textPrimary} mb-3`}>Sessions by Country</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(stats.byCountryWithFlags)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([code, data]) => (
                  <div key={code} className="flex items-center justify-between">
                    <span className={themeClasses.textSecondary}>
                      {data.flag} {code}
                    </span>
                    <span className={themeClasses.textPrimary}>{data.count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionsTab;
