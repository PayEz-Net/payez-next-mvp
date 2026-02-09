"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsTab = StatsTab;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------
function StatsTab({ isDark = true, apiBasePath = '/api/admin/stats', customStats, quickActions, children, }) {
    const [stats, setStats] = (0, react_1.useState)([]);
    const [recentActivity, setRecentActivity] = (0, react_1.useState)([]);
    const [systemStatus, setSystemStatus] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const themeClasses = {
        cardBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm',
        textPrimary: isDark ? 'text-white' : 'text-gray-900',
        textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
        textMuted: isDark ? 'text-gray-500' : 'text-gray-500',
    };
    const colorClasses = {
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: 'text-blue-400' },
        green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'text-emerald-400' },
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'text-purple-400' },
        orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: 'text-orange-400' },
        red: { bg: 'bg-red-500/10', text: 'text-red-400', icon: 'text-red-400' },
        cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', icon: 'text-cyan-400' },
    };
    const defaultIcons = {
        users: lucide_react_1.Users,
        sessions: lucide_react_1.Activity,
        uptime: lucide_react_1.Clock,
        growth: lucide_react_1.TrendingUp,
        security: lucide_react_1.Shield,
        system: lucide_react_1.Server,
    };
    const fetchStats = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiBasePath);
            if (!res.ok)
                throw new Error('Failed to fetch stats');
            const data = await res.json();
            // Map API response to stat cards
            const apiStats = [];
            if (data.totalUsers !== undefined) {
                apiStats.push({
                    id: 'users',
                    label: 'Total Users',
                    value: data.totalUsers,
                    change: data.userGrowth ? `+${data.userGrowth}%` : undefined,
                    changeType: 'positive',
                    icon: lucide_react_1.Users,
                    color: 'blue',
                });
            }
            if (data.activeSessions !== undefined) {
                apiStats.push({
                    id: 'sessions',
                    label: 'Active Sessions',
                    value: data.activeSessions,
                    icon: lucide_react_1.Activity,
                    color: 'green',
                });
            }
            if (data.todayLogins !== undefined) {
                apiStats.push({
                    id: 'logins',
                    label: 'Today Logins',
                    value: data.todayLogins,
                    icon: lucide_react_1.Clock,
                    color: 'purple',
                });
            }
            if (data.newUsersToday !== undefined) {
                apiStats.push({
                    id: 'new_users',
                    label: 'New Users Today',
                    value: data.newUsersToday,
                    icon: lucide_react_1.TrendingUp,
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
        }
        catch (err) {
            setError(err.message);
            // Use custom stats as fallback
            if (customStats) {
                setStats(customStats);
            }
        }
        finally {
            setLoading(false);
        }
    }, [apiBasePath, customStats]);
    (0, react_1.useEffect)(() => {
        fetchStats();
        // Refresh stats every 60 seconds
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [fetchStats]);
    const getTimeAgo = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        if (diffSec < 60)
            return 'Just now';
        if (diffMin < 60)
            return `${diffMin}m ago`;
        if (diffHour < 24)
            return `${diffHour}h ago`;
        return date.toLocaleDateString();
    };
    if (loading && stats.length === 0) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center py-12", children: (0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin h-8 w-8 text-blue-400", viewBox: "0 0 24 24", fill: "none", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" })] }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [error && ((0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-300'} border ${isDark ? 'text-red-300' : 'text-red-700'}`, children: [error, (0, jsx_runtime_1.jsx)("button", { onClick: fetchStats, className: "ml-4 underline", children: "Retry" })] })), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: stats.map((stat) => {
                    const Icon = stat.icon || defaultIcons[stat.id] || lucide_react_1.Activity;
                    const colors = colorClasses[stat.color || 'blue'];
                    return ((0, jsx_runtime_1.jsx)("div", { className: `${themeClasses.cardBg} border rounded-xl p-5`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm ${themeClasses.textSecondary}`, children: stat.label }), (0, jsx_runtime_1.jsx)("p", { className: `text-3xl font-bold ${themeClasses.textPrimary} mt-1`, children: typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value }), stat.change && ((0, jsx_runtime_1.jsx)("p", { className: `text-sm mt-1 ${stat.changeType === 'positive' ? 'text-emerald-400' :
                                                stat.changeType === 'negative' ? 'text-red-400' :
                                                    themeClasses.textMuted}`, children: stat.change }))] }), (0, jsx_runtime_1.jsx)("div", { className: `p-3 rounded-lg ${colors.bg}`, children: (0, jsx_runtime_1.jsx)(Icon, { className: `w-6 h-6 ${colors.icon}` }) })] }) }, stat.id));
                }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: `lg:col-span-2 ${themeClasses.cardBg} border rounded-xl`, children: [(0, jsx_runtime_1.jsx)("div", { className: `px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`, children: (0, jsx_runtime_1.jsx)("h3", { className: `font-semibold ${themeClasses.textPrimary}`, children: "Recent Activity" }) }), (0, jsx_runtime_1.jsx)("div", { className: "p-5", children: recentActivity.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: recentActivity.map((activity) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-2 h-2 rounded-full mt-2 ${activity.type === 'login' ? 'bg-green-400' :
                                                    activity.type === 'signup' ? 'bg-blue-400' :
                                                        activity.type === 'error' ? 'bg-red-400' :
                                                            'bg-gray-400'}` }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm ${themeClasses.textPrimary}`, children: activity.message }), (0, jsx_runtime_1.jsxs)("div", { className: `flex items-center gap-2 text-xs ${themeClasses.textMuted} mt-1`, children: [activity.user && (0, jsx_runtime_1.jsx)("span", { children: activity.user }), (0, jsx_runtime_1.jsx)("span", { children: getTimeAgo(activity.timestamp) })] })] })] }, activity.id))) })) : ((0, jsx_runtime_1.jsx)("p", { className: `text-center py-8 ${themeClasses.textMuted}`, children: "No recent activity" })) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [quickActions && quickActions.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-xl`, children: [(0, jsx_runtime_1.jsx)("div", { className: `px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`, children: (0, jsx_runtime_1.jsx)("h3", { className: `font-semibold ${themeClasses.textPrimary}`, children: "Quick Actions" }) }), (0, jsx_runtime_1.jsx)("div", { className: "p-3", children: quickActions.map((action) => {
                                            const Icon = action.icon || lucide_react_1.Activity;
                                            return ((0, jsx_runtime_1.jsx)("button", { onClick: action.onClick, className: `w-full text-left p-3 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(Icon, { className: `w-5 h-5 ${themeClasses.textSecondary}` }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `font-medium ${themeClasses.textPrimary}`, children: action.label }), (0, jsx_runtime_1.jsx)("p", { className: `text-xs ${themeClasses.textMuted}`, children: action.description })] })] }) }, action.id));
                                        }) })] })), systemStatus.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-xl`, children: [(0, jsx_runtime_1.jsx)("div", { className: `px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`, children: (0, jsx_runtime_1.jsx)("h3", { className: `font-semibold ${themeClasses.textPrimary}`, children: "System Status" }) }), (0, jsx_runtime_1.jsx)("div", { className: "p-5 space-y-3", children: systemStatus.map((service) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-2 h-2 rounded-full ${service.status === 'healthy' ? 'bg-emerald-400' :
                                                                service.status === 'degraded' ? 'bg-amber-400' :
                                                                    'bg-red-400'}` }), (0, jsx_runtime_1.jsx)("span", { className: themeClasses.textPrimary, children: service.service })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [service.latency !== undefined && ((0, jsx_runtime_1.jsxs)("span", { className: `text-xs ${themeClasses.textMuted}`, children: [service.latency, "ms"] })), (0, jsx_runtime_1.jsx)("span", { className: `text-xs px-2 py-0.5 rounded ${service.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                service.status === 'degraded' ? 'bg-amber-500/20 text-amber-400' :
                                                                    'bg-red-500/20 text-red-400'}`, children: service.status })] })] }, service.service))) })] }))] })] }), children] }));
}
exports.default = StatsTab;
