/**
 * =============================================================================
 * VIBE ADMIN STATS TAB
 * =============================================================================
 *
 * Generic dashboard stats overview tab.
 * Shows high-level metrics about users, sessions, and system health.
 *
 * =============================================================================
 */

'use client';

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Users,
  Activity,
  Clock,
  TrendingUp,
  Shield,
  Server,
  type LucideIcon,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface StatCard {
  id: string;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  onClick: () => void;
  icon?: LucideIcon;
}

export interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user?: string;
}

export interface SystemStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
}

export interface StatsTabProps {
  isDark?: boolean;
  /** API endpoint to fetch stats (default: /api/admin/stats) */
  apiBasePath?: string;
  /** Custom stat cards to display */
  customStats?: StatCard[];
  /** Quick actions shown in the sidebar */
  quickActions?: QuickAction[];
  /** Additional content to render below stats */
  children?: ReactNode;
}

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

export function StatsTab({
  isDark = true,
  apiBasePath = '/api/admin/stats',
  customStats,
  quickActions,
  children,
}: StatsTabProps) {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const themeClasses = {
    cardBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm',
    textPrimary: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-500' : 'text-gray-500',
  };

  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: 'text-blue-400' },
    green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'text-emerald-400' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'text-purple-400' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: 'text-orange-400' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', icon: 'text-red-400' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', icon: 'text-cyan-400' },
  };

  const defaultIcons: Record<string, LucideIcon> = {
    users: Users,
    sessions: Activity,
    uptime: Clock,
    growth: TrendingUp,
    security: Shield,
    system: Server,
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiBasePath);
      if (!res.ok) throw new Error('Failed to fetch stats');

      const data = await res.json();

      // Map API response to stat cards
      const apiStats: StatCard[] = [];

      if (data.totalUsers !== undefined) {
        apiStats.push({
          id: 'users',
          label: 'Total Users',
          value: data.totalUsers,
          change: data.userGrowth ? `+${data.userGrowth}%` : undefined,
          changeType: 'positive',
          icon: Users,
          color: 'blue',
        });
      }

      if (data.activeSessions !== undefined) {
        apiStats.push({
          id: 'sessions',
          label: 'Active Sessions',
          value: data.activeSessions,
          icon: Activity,
          color: 'green',
        });
      }

      if (data.todayLogins !== undefined) {
        apiStats.push({
          id: 'logins',
          label: 'Today Logins',
          value: data.todayLogins,
          icon: Clock,
          color: 'purple',
        });
      }

      if (data.newUsersToday !== undefined) {
        apiStats.push({
          id: 'new_users',
          label: 'New Users Today',
          value: data.newUsersToday,
          icon: TrendingUp,
          color: 'orange',
        });
      }

      // Merge custom stats with API stats
      setStats(customStats ? [...apiStats, ...customStats] : apiStats);

      // Set recent activity if available
      if (data.recentActivity) {
        setRecentActivity(data.recentActivity);
      }

      // Set system status if available
      if (data.systemStatus) {
        setSystemStatus(data.systemStatus);
      }
    } catch (err: any) {
      setError(err.message);
      // Use custom stats as fallback
      if (customStats) {
        setStats(customStats);
      }
    } finally {
      setLoading(false);
    }
  }, [apiBasePath, customStats]);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return date.toLocaleDateString();
  };

  if (loading && stats.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-300'} border ${isDark ? 'text-red-300' : 'text-red-700'}`}>
          {error}
          <button onClick={fetchStats} className="ml-4 underline">Retry</button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon || defaultIcons[stat.id] || Activity;
          const colors = colorClasses[stat.color || 'blue'];

          return (
            <div key={stat.id} className={`${themeClasses.cardBg} border rounded-xl p-5`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>{stat.label}</p>
                  <p className={`text-3xl font-bold ${themeClasses.textPrimary} mt-1`}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  {stat.change && (
                    <p className={`text-sm mt-1 ${
                      stat.changeType === 'positive' ? 'text-emerald-400' :
                      stat.changeType === 'negative' ? 'text-red-400' :
                      themeClasses.textMuted
                    }`}>
                      {stat.change}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className={`lg:col-span-2 ${themeClasses.cardBg} border rounded-xl`}>
          <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Recent Activity</h3>
          </div>
          <div className="p-5">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'login' ? 'bg-green-400' :
                      activity.type === 'signup' ? 'bg-blue-400' :
                      activity.type === 'error' ? 'bg-red-400' :
                      'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${themeClasses.textPrimary}`}>{activity.message}</p>
                      <div className={`flex items-center gap-2 text-xs ${themeClasses.textMuted} mt-1`}>
                        {activity.user && <span>{activity.user}</span>}
                        <span>{getTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-center py-8 ${themeClasses.textMuted}`}>
                No recent activity
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions & System Status */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {quickActions && quickActions.length > 0 && (
            <div className={`${themeClasses.cardBg} border rounded-xl`}>
              <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Quick Actions</h3>
              </div>
              <div className="p-3">
                {quickActions.map((action) => {
                  const Icon = action.icon || Activity;
                  return (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${themeClasses.textSecondary}`} />
                        <div>
                          <p className={`font-medium ${themeClasses.textPrimary}`}>{action.label}</p>
                          <p className={`text-xs ${themeClasses.textMuted}`}>{action.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* System Status */}
          {systemStatus.length > 0 && (
            <div className={`${themeClasses.cardBg} border rounded-xl`}>
              <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <h3 className={`font-semibold ${themeClasses.textPrimary}`}>System Status</h3>
              </div>
              <div className="p-5 space-y-3">
                {systemStatus.map((service) => (
                  <div key={service.service} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        service.status === 'healthy' ? 'bg-emerald-400' :
                        service.status === 'degraded' ? 'bg-amber-400' :
                        'bg-red-400'
                      }`} />
                      <span className={themeClasses.textPrimary}>{service.service}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {service.latency !== undefined && (
                        <span className={`text-xs ${themeClasses.textMuted}`}>{service.latency}ms</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        service.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                        service.status === 'degraded' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom children content */}
      {children}
    </div>
  );
}

export default StatsTab;
