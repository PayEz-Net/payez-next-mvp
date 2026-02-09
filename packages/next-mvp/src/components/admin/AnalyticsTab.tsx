/**
 * =============================================================================
 * VIBE ADMIN ANALYTICS TAB
 * =============================================================================
 *
 * Generic dashboard tab showing login statistics and analytics.
 * Can be extended by consumer apps with custom components.
 *
 * =============================================================================
 */

'use client';

import React, { useState, useEffect, useCallback, ReactNode } from 'react';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type Period = 'today' | 'week' | 'month' | 'year';

interface TimeSeries {
  date: string;
  count: number;
  label: string;
}

interface CountryStats {
  country: string;
  code: string;
  flag: string;
  count: number;
  percentage: number;
}

interface UserStats {
  email: string;
  name: string;
  count: number;
  lastLogin: string;
}

interface TierDistribution {
  tier: string;
  count: number;
  percentage: number;
}

interface FeatureUsage {
  name: string;
  uses: number;
  uniqueUsers: number;
}

interface RevenueByTier {
  tier: string;
  subscribers: number;
  pricePerMonth: number;
  mrr: number;
}

interface RevenueTrend {
  month: string;
  mrr: number;
}

interface TierData {
  distribution: TierDistribution[];
  total: number;
}

interface FeatureData {
  features: FeatureUsage[];
}

interface RevenueData {
  mrr: number;
  arr: number;
  paidSubscribers: number;
  totalUsers: number;
  conversionRate: number;
  revenueByTier: RevenueByTier[];
  trend: RevenueTrend[];
  currency: string;
}

interface AnalyticsData {
  period: Period;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalLogins: number;
    uniqueUsers: number;
    newUsers: number;
    peakHour: string;
    avgLoginsPerDay: number;
  };
  timeSeries: TimeSeries[];
  byCountry: CountryStats[];
  byDevice: Record<string, number>;
  byBrowser: Record<string, number>;
  byOS: Record<string, number>;
  topUsers: UserStats[];
}

export interface AnalyticsTabProps {
  isDark?: boolean;
  /** Base API path for analytics (default: /api/admin/analytics) */
  apiBasePath?: string;
  /** Optional custom component to render in the geo section (e.g., WorldMap) */
  geoMapComponent?: ReactNode;
  /** Show business metrics section (default: true) */
  showBusinessMetrics?: boolean;
}

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

export function AnalyticsTab({
  isDark = true,
  apiBasePath = '/api/admin/analytics',
  geoMapComponent,
  showBusinessMetrics = true,
}: AnalyticsTabProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Business metrics data
  const [tierData, setTierData] = useState<TierData | null>(null);
  const [featureData, setFeatureData] = useState<FeatureData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);

  const themeClasses = {
    cardBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm',
    textPrimary: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-500' : 'text-gray-500',
    barBg: isDark ? 'bg-slate-700' : 'bg-gray-200',
  };

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBasePath}/logins?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period, apiBasePath]);

  // Fetch tier, feature, and revenue data
  const fetchBusinessMetrics = useCallback(async () => {
    if (!showBusinessMetrics) return;

    try {
      const [tierRes, featureRes, revenueRes] = await Promise.all([
        fetch(`${apiBasePath}/tiers`),
        fetch(`${apiBasePath}/feature-usage`),
        fetch(`${apiBasePath}/revenue`),
      ]);

      if (tierRes.ok) {
        const data = await tierRes.json();
        setTierData(data);
      }
      if (featureRes.ok) {
        const data = await featureRes.json();
        setFeatureData(data);
      }
      if (revenueRes.ok) {
        const data = await revenueRes.json();
        setRevenueData(data);
      }
    } catch (err) {
      console.error('Failed to fetch business metrics:', err);
    }
  }, [apiBasePath, showBusinessMetrics]);

  useEffect(() => {
    fetchAnalytics();
    fetchBusinessMetrics();
  }, [fetchAnalytics, fetchBusinessMetrics]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Simple bar chart component
  const BarChart = ({
    data,
    maxValue,
    colorClass = 'bg-blue-500'
  }: {
    data: { label: string; value: number }[];
    maxValue: number;
    colorClass?: string;
  }) => (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`text-xs ${themeClasses.textSecondary} w-20 truncate`}>{item.label}</span>
          <div className={`flex-1 h-6 ${themeClasses.barBg} rounded overflow-hidden`}>
            <div
              className={`h-full ${colorClass} transition-all duration-300`}
              style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            />
          </div>
          <span className={`text-xs ${themeClasses.textPrimary} w-12 text-right`}>{item.value}</span>
        </div>
      ))}
    </div>
  );

  // Time series line chart (simplified as bar chart)
  const TimeSeriesChart = ({ series }: { series: TimeSeries[] }) => {
    const maxCount = Math.max(...series.map(s => s.count), 1);
    return (
      <div className="h-48 flex items-end gap-1">
        {series.map((item, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center group relative"
          >
            <div
              className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-400"
              style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: item.count > 0 ? '4px' : '0' }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
              <div className={`${isDark ? 'bg-slate-900' : 'bg-gray-800'} text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap`}>
                {item.label}: {item.count}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-300'} border rounded-lg p-4 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
        {error}
        <button onClick={fetchAnalytics} className="ml-4 underline">Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const deviceData = Object.entries(data.byDevice)
    .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }))
    .sort((a, b) => b.value - a.value);

  const browserData = Object.entries(data.byBrowser)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const osData = Object.entries(data.byOS)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['today', 'week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary} transition-colors disabled:opacity-50`}
          title="Refresh"
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`${themeClasses.cardBg} border rounded-lg p-4`}>
          <p className={themeClasses.textSecondary + ' text-sm'}>Total Logins</p>
          <p className={`text-3xl font-bold ${themeClasses.textPrimary}`}>{data.summary.totalLogins.toLocaleString()}</p>
        </div>
        <div className={`${themeClasses.cardBg} border rounded-lg p-4`}>
          <p className={themeClasses.textSecondary + ' text-sm'}>Unique Users</p>
          <p className="text-3xl font-bold text-blue-400">{data.summary.uniqueUsers.toLocaleString()}</p>
        </div>
        <div className={`${themeClasses.cardBg} border rounded-lg p-4`}>
          <p className={themeClasses.textSecondary + ' text-sm'}>New Users</p>
          <p className="text-3xl font-bold text-green-400">{data.summary.newUsers.toLocaleString()}</p>
        </div>
        <div className={`${themeClasses.cardBg} border rounded-lg p-4`}>
          <p className={themeClasses.textSecondary + ' text-sm'}>Peak Hour</p>
          <p className="text-3xl font-bold text-purple-400">{data.summary.peakHour}</p>
        </div>
        <div className={`${themeClasses.cardBg} border rounded-lg p-4`}>
          <p className={themeClasses.textSecondary + ' text-sm'}>Avg/Day</p>
          <p className="text-3xl font-bold text-orange-400">{data.summary.avgLoginsPerDay.toLocaleString()}</p>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className={`${themeClasses.cardBg} border rounded-lg p-6`}>
        <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}>Logins Over Time</h3>
        <TimeSeriesChart series={data.timeSeries} />
        <div className={`flex justify-between mt-2 text-xs ${themeClasses.textMuted}`}>
          <span>{data.timeSeries[0]?.label}</span>
          <span>{data.timeSeries[data.timeSeries.length - 1]?.label}</span>
        </div>
      </div>

      {/* Geographic Map (optional slot) */}
      {geoMapComponent && (
        <div className={`${themeClasses.cardBg} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}>Geographic Distribution</h3>
          {geoMapComponent}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* By Country */}
        <div className={`${themeClasses.cardBg} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}>Top Countries</h3>
          {data.byCountry.length > 0 ? (
            <div className="space-y-3">
              {data.byCountry.slice(0, 8).map((country, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xl">{country.flag}</span>
                  <span className={`${themeClasses.textPrimary} flex-1`}>{country.country}</span>
                  <div className={`w-24 h-4 ${themeClasses.barBg} rounded overflow-hidden`}>
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${country.percentage}%` }}
                    />
                  </div>
                  <span className={`${themeClasses.textSecondary} text-sm w-16 text-right`}>
                    {country.count} ({country.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`${themeClasses.textMuted} text-center py-4`}>No data</p>
          )}
        </div>

        {/* By Device */}
        <div className={`${themeClasses.cardBg} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}>Device Types</h3>
          {deviceData.length > 0 ? (
            <div className="space-y-4">
              {deviceData.map((item, i) => {
                const total = deviceData.reduce((sum, d) => sum + d.value, 0);
                const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                const icon = item.label.toLowerCase() === 'mobile' ? '📱' :
                             item.label.toLowerCase() === 'tablet' ? '📱' : '💻';
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <span className={`${themeClasses.textPrimary} w-20`}>{item.label}</span>
                    <div className={`flex-1 h-6 ${themeClasses.barBg} rounded overflow-hidden`}>
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className={`${themeClasses.textSecondary} text-sm w-20 text-right`}>
                      {item.value} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={`${themeClasses.textMuted} text-center py-4`}>No data</p>
          )}
        </div>

        {/* By Browser */}
        <div className={`${themeClasses.cardBg} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}>Browsers</h3>
          <BarChart
            data={browserData}
            maxValue={Math.max(...browserData.map(d => d.value), 1)}
            colorClass="bg-orange-500"
          />
        </div>

        {/* By OS */}
        <div className={`${themeClasses.cardBg} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}>Operating Systems</h3>
          <BarChart
            data={osData}
            maxValue={Math.max(...osData.map(d => d.value), 1)}
            colorClass="bg-cyan-500"
          />
        </div>
      </div>

      {/* Top Users Table */}
      <div className={`${themeClasses.cardBg} border rounded-lg overflow-hidden`}>
        <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Top Users by Login Count</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={isDark ? 'bg-slate-700/50' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`}>#</th>
                <th className={`px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`}>User</th>
                <th className={`px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`}>Logins</th>
                <th className={`px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`}>Last Login</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
              {data.topUsers.length > 0 ? (
                data.topUsers.map((user, i) => (
                  <tr key={i} className={isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}>
                    <td className={`px-4 py-3 ${themeClasses.textMuted}`}>{i + 1}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className={`${themeClasses.textPrimary} font-medium`}>{user.name}</p>
                        <p className={`${themeClasses.textSecondary} text-xs`}>{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium">
                        {user.count}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${themeClasses.textSecondary}`}>{formatDate(user.lastLogin)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={`px-4 py-8 text-center ${themeClasses.textMuted}`}>
                    No login data for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Metrics Section */}
      {showBusinessMetrics && (
        <div className={`border-t ${isDark ? 'border-slate-700' : 'border-gray-200'} pt-6 mt-6`}>
          <h2 className={`text-xl font-bold ${themeClasses.textPrimary} mb-6`}>Business Metrics</h2>

          {/* Revenue Summary Cards */}
          {revenueData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`${themeClasses.cardBg} border rounded-lg p-4`}>
                <p className={themeClasses.textSecondary + ' text-sm'}>Monthly Revenue (MRR)</p>
                <p className="text-3xl font-bold text-green-400">${revenueData.mrr.toLocaleString()}</p>
              </div>
              <div className={`${themeClasses.cardBg} border rounded-lg p-4`}>
                <p className={themeClasses.textSecondary + ' text-sm'}>Annual Revenue (ARR)</p>
                <p className="text-3xl font-bold text-green-400">${revenueData.arr.toLocaleString()}</p>
              </div>
              <div className={`${themeClasses.cardBg} border rounded-lg p-4`}>
                <p className={themeClasses.textSecondary + ' text-sm'}>Paid Subscribers</p>
                <p className="text-3xl font-bold text-blue-400">{revenueData.paidSubscribers.toLocaleString()}</p>
              </div>
              <div className={`${themeClasses.cardBg} border rounded-lg p-4`}>
                <p className={themeClasses.textSecondary + ' text-sm'}>Conversion Rate</p>
                <p className="text-3xl font-bold text-purple-400">{revenueData.conversionRate}%</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Tier Distribution - Donut Chart */}
            {tierData && (
              <div className={`${themeClasses.cardBg} border rounded-lg p-6`}>
                <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}>Tier Distribution</h3>
                <div className="flex items-center gap-8">
                  {/* Donut Chart */}
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {(() => {
                        const colors: Record<string, string> = {
                          free: '#64748b',
                          premium: '#3b82f6',
                          ultimate: '#f59e0b',
                          enterprise: '#8b5cf6',
                        };
                        let offset = 0;
                        return tierData.distribution.map((tier) => {
                          const strokeDasharray = `${tier.percentage} ${100 - tier.percentage}`;
                          const strokeDashoffset = -offset;
                          offset += tier.percentage;
                          return (
                            <circle
                              key={tier.tier}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke={colors[tier.tier] || '#64748b'}
                              strokeWidth="20"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${themeClasses.textPrimary}`}>{tierData.total}</p>
                        <p className={`text-xs ${themeClasses.textSecondary}`}>Total</p>
                      </div>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex-1 space-y-2">
                    {tierData.distribution.map((tier) => {
                      const colors: Record<string, string> = {
                        free: 'bg-slate-500',
                        premium: 'bg-blue-500',
                        ultimate: 'bg-amber-500',
                        enterprise: 'bg-purple-500',
                      };
                      return (
                        <div key={tier.tier} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colors[tier.tier] || 'bg-slate-500'}`} />
                            <span className={`${themeClasses.textPrimary} capitalize`}>{tier.tier}</span>
                          </div>
                          <div className="text-right">
                            <span className={`${themeClasses.textPrimary} font-medium`}>{tier.count}</span>
                            <span className={`${themeClasses.textMuted} text-sm ml-2`}>({tier.percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Feature Usage Chart */}
            {featureData && (
              <div className={`${themeClasses.cardBg} border rounded-lg p-6`}>
                <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}>Feature Usage</h3>
                <div className="space-y-3">
                  {featureData.features.map((feature) => {
                    const maxUses = Math.max(...featureData.features.map(f => f.uses), 1);
                    const percentage = (feature.uses / maxUses) * 100;
                    return (
                      <div key={feature.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`${themeClasses.textPrimary} text-sm`}>{feature.name}</span>
                          <span className={`${themeClasses.textSecondary} text-xs`}>{feature.uses.toLocaleString()} uses</span>
                        </div>
                        <div className={`h-4 ${themeClasses.barBg} rounded overflow-hidden`}>
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Revenue by Tier */}
          {revenueData && revenueData.revenueByTier.length > 0 && (
            <div className={`mt-6 ${themeClasses.cardBg} border rounded-lg overflow-hidden`}>
              <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Revenue by Tier</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={isDark ? 'bg-slate-700/50' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`}>Tier</th>
                      <th className={`px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`}>Subscribers</th>
                      <th className={`px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`}>Price/Mo</th>
                      <th className={`px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`}>MRR</th>
                      <th className={`px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`}>% of Revenue</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
                    {revenueData.revenueByTier.map((tier) => {
                      const totalMrr = revenueData.revenueByTier.reduce((sum, t) => sum + t.mrr, 0);
                      const percentage = totalMrr > 0 ? Math.round((tier.mrr / totalMrr) * 100) : 0;
                      const tierColors: Record<string, string> = {
                        premium: 'text-blue-400',
                        ultimate: 'text-amber-400',
                        enterprise: 'text-purple-400',
                      };
                      return (
                        <tr key={tier.tier} className={isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}>
                          <td className={`px-4 py-3 font-medium capitalize ${tierColors[tier.tier] || themeClasses.textPrimary}`}>
                            {tier.tier}
                          </td>
                          <td className={`px-4 py-3 ${themeClasses.textPrimary}`}>{tier.subscribers.toLocaleString()}</td>
                          <td className={`px-4 py-3 ${themeClasses.textSecondary}`}>${tier.pricePerMonth}</td>
                          <td className="px-4 py-3 text-green-400 font-medium">${tier.mrr.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-16 h-2 ${themeClasses.barBg} rounded overflow-hidden`}>
                                <div className="h-full bg-green-500" style={{ width: `${percentage}%` }} />
                              </div>
                              <span className={`${themeClasses.textSecondary} text-xs`}>{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MRR Trend Chart */}
          {revenueData && revenueData.trend.length > 0 && (
            <div className={`mt-6 ${themeClasses.cardBg} border rounded-lg p-6`}>
              <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}>MRR Trend (6 Months)</h3>
              <div className="h-48 flex items-end gap-2">
                {revenueData.trend.map((point, i) => {
                  const maxMrr = Math.max(...revenueData.trend.map(p => p.mrr), 1);
                  const height = (point.mrr / maxMrr) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full">
                        <div
                          className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t transition-all duration-300 hover:from-green-500 hover:to-green-300"
                          style={{ height: `${height * 1.8}px`, minHeight: '4px' }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                          <div className={`${isDark ? 'bg-slate-900' : 'bg-gray-800'} text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap`}>
                            ${point.mrr.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs ${themeClasses.textMuted} mt-2`}>{point.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AnalyticsTab;
