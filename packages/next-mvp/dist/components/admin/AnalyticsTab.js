"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsTab = AnalyticsTab;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------
function AnalyticsTab({ isDark = true, apiBasePath = '/api/admin/analytics', geoMapComponent, showBusinessMetrics = true, }) {
    const [period, setPeriod] = (0, react_1.useState)('week');
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    // Business metrics data
    const [tierData, setTierData] = (0, react_1.useState)(null);
    const [featureData, setFeatureData] = (0, react_1.useState)(null);
    const [revenueData, setRevenueData] = (0, react_1.useState)(null);
    const themeClasses = {
        cardBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm',
        textPrimary: isDark ? 'text-white' : 'text-gray-900',
        textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
        textMuted: isDark ? 'text-gray-500' : 'text-gray-500',
        barBg: isDark ? 'bg-slate-700' : 'bg-gray-200',
    };
    const fetchAnalytics = (0, react_1.useCallback)(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${apiBasePath}/logins?period=${period}`);
            if (!res.ok)
                throw new Error('Failed to fetch analytics');
            const json = await res.json();
            setData(json);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, [period, apiBasePath]);
    // Fetch tier, feature, and revenue data
    const fetchBusinessMetrics = (0, react_1.useCallback)(async () => {
        if (!showBusinessMetrics)
            return;
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
        }
        catch (err) {
            console.error('Failed to fetch business metrics:', err);
        }
    }, [apiBasePath, showBusinessMetrics]);
    (0, react_1.useEffect)(() => {
        fetchAnalytics();
        fetchBusinessMetrics();
    }, [fetchAnalytics, fetchBusinessMetrics]);
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    // Simple bar chart component
    const BarChart = ({ data, maxValue, colorClass = 'bg-blue-500' }) => ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: data.map((item, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: `text-xs ${themeClasses.textSecondary} w-20 truncate`, children: item.label }), (0, jsx_runtime_1.jsx)("div", { className: `flex-1 h-6 ${themeClasses.barBg} rounded overflow-hidden`, children: (0, jsx_runtime_1.jsx)("div", { className: `h-full ${colorClass} transition-all duration-300`, style: { width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` } }) }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs ${themeClasses.textPrimary} w-12 text-right`, children: item.value })] }, i))) }));
    // Time series line chart (simplified as bar chart)
    const TimeSeriesChart = ({ series }) => {
        const maxCount = Math.max(...series.map(s => s.count), 1);
        return ((0, jsx_runtime_1.jsx)("div", { className: "h-48 flex items-end gap-1", children: series.map((item, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex-1 flex flex-col items-center group relative", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-400", style: { height: `${(item.count / maxCount) * 100}%`, minHeight: item.count > 0 ? '4px' : '0' } }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-full mb-2 hidden group-hover:block z-10", children: (0, jsx_runtime_1.jsxs)("div", { className: `${isDark ? 'bg-slate-900' : 'bg-gray-800'} text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap`, children: [item.label, ": ", item.count] }) })] }, i))) }));
    };
    if (loading && !data) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center py-12", children: (0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin h-8 w-8 text-blue-400", viewBox: "0 0 24 24", fill: "none", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" })] }) }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: `${isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-300'} border rounded-lg p-4 ${isDark ? 'text-red-300' : 'text-red-700'}`, children: [error, (0, jsx_runtime_1.jsx)("button", { onClick: fetchAnalytics, className: "ml-4 underline", children: "Retry" })] }));
    }
    if (!data)
        return null;
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
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex gap-2", children: ['today', 'week', 'month', 'year'].map((p) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setPeriod(p), className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p
                                ? 'bg-blue-600 text-white'
                                : isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, children: p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year' }, p))) }), (0, jsx_runtime_1.jsx)("button", { onClick: fetchAnalytics, disabled: loading, className: `p-2 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary} transition-colors disabled:opacity-50`, title: "Refresh", children: (0, jsx_runtime_1.jsx)("svg", { className: `w-5 h-5 ${loading ? 'animate-spin' : ''}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-4`, children: [(0, jsx_runtime_1.jsx)("p", { className: themeClasses.textSecondary + ' text-sm', children: "Total Logins" }), (0, jsx_runtime_1.jsx)("p", { className: `text-3xl font-bold ${themeClasses.textPrimary}`, children: data.summary.totalLogins.toLocaleString() })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-4`, children: [(0, jsx_runtime_1.jsx)("p", { className: themeClasses.textSecondary + ' text-sm', children: "Unique Users" }), (0, jsx_runtime_1.jsx)("p", { className: "text-3xl font-bold text-blue-400", children: data.summary.uniqueUsers.toLocaleString() })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-4`, children: [(0, jsx_runtime_1.jsx)("p", { className: themeClasses.textSecondary + ' text-sm', children: "New Users" }), (0, jsx_runtime_1.jsx)("p", { className: "text-3xl font-bold text-green-400", children: data.summary.newUsers.toLocaleString() })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-4`, children: [(0, jsx_runtime_1.jsx)("p", { className: themeClasses.textSecondary + ' text-sm', children: "Peak Hour" }), (0, jsx_runtime_1.jsx)("p", { className: "text-3xl font-bold text-purple-400", children: data.summary.peakHour })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-4`, children: [(0, jsx_runtime_1.jsx)("p", { className: themeClasses.textSecondary + ' text-sm', children: "Avg/Day" }), (0, jsx_runtime_1.jsx)("p", { className: "text-3xl font-bold text-orange-400", children: data.summary.avgLoginsPerDay.toLocaleString() })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-6`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `text-lg font-semibold ${themeClasses.textPrimary} mb-4`, children: "Logins Over Time" }), (0, jsx_runtime_1.jsx)(TimeSeriesChart, { series: data.timeSeries }), (0, jsx_runtime_1.jsxs)("div", { className: `flex justify-between mt-2 text-xs ${themeClasses.textMuted}`, children: [(0, jsx_runtime_1.jsx)("span", { children: data.timeSeries[0]?.label }), (0, jsx_runtime_1.jsx)("span", { children: data.timeSeries[data.timeSeries.length - 1]?.label })] })] }), geoMapComponent && ((0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-6`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `text-lg font-semibold ${themeClasses.textPrimary} mb-4`, children: "Geographic Distribution" }), geoMapComponent] })), (0, jsx_runtime_1.jsxs)("div", { className: "grid md:grid-cols-2 gap-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-6`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `text-lg font-semibold ${themeClasses.textPrimary} mb-4`, children: "Top Countries" }), data.byCountry.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: data.byCountry.slice(0, 8).map((country, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xl", children: country.flag }), (0, jsx_runtime_1.jsx)("span", { className: `${themeClasses.textPrimary} flex-1`, children: country.country }), (0, jsx_runtime_1.jsx)("div", { className: `w-24 h-4 ${themeClasses.barBg} rounded overflow-hidden`, children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-green-500", style: { width: `${country.percentage}%` } }) }), (0, jsx_runtime_1.jsxs)("span", { className: `${themeClasses.textSecondary} text-sm w-16 text-right`, children: [country.count, " (", country.percentage, "%)"] })] }, i))) })) : ((0, jsx_runtime_1.jsx)("p", { className: `${themeClasses.textMuted} text-center py-4`, children: "No data" }))] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-6`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `text-lg font-semibold ${themeClasses.textPrimary} mb-4`, children: "Device Types" }), deviceData.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: deviceData.map((item, i) => {
                                    const total = deviceData.reduce((sum, d) => sum + d.value, 0);
                                    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                    const icon = item.label.toLowerCase() === 'mobile' ? '📱' :
                                        item.label.toLowerCase() === 'tablet' ? '📱' : '💻';
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xl", children: icon }), (0, jsx_runtime_1.jsx)("span", { className: `${themeClasses.textPrimary} w-20`, children: item.label }), (0, jsx_runtime_1.jsx)("div", { className: `flex-1 h-6 ${themeClasses.barBg} rounded overflow-hidden`, children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-purple-500", style: { width: `${percentage}%` } }) }), (0, jsx_runtime_1.jsxs)("span", { className: `${themeClasses.textSecondary} text-sm w-20 text-right`, children: [item.value, " (", percentage, "%)"] })] }, i));
                                }) })) : ((0, jsx_runtime_1.jsx)("p", { className: `${themeClasses.textMuted} text-center py-4`, children: "No data" }))] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-6`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `text-lg font-semibold ${themeClasses.textPrimary} mb-4`, children: "Browsers" }), (0, jsx_runtime_1.jsx)(BarChart, { data: browserData, maxValue: Math.max(...browserData.map(d => d.value), 1), colorClass: "bg-orange-500" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-6`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `text-lg font-semibold ${themeClasses.textPrimary} mb-4`, children: "Operating Systems" }), (0, jsx_runtime_1.jsx)(BarChart, { data: osData, maxValue: Math.max(...osData.map(d => d.value), 1), colorClass: "bg-cyan-500" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg overflow-hidden`, children: [(0, jsx_runtime_1.jsx)("div", { className: `p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`, children: (0, jsx_runtime_1.jsx)("h3", { className: `text-lg font-semibold ${themeClasses.textPrimary}`, children: "Top Users by Login Count" }) }), (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-sm", children: [(0, jsx_runtime_1.jsx)("thead", { className: isDark ? 'bg-slate-700/50' : 'bg-gray-50', children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`, children: "#" }), (0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`, children: "User" }), (0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`, children: "Logins" }), (0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`, children: "Last Login" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: `divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`, children: data.topUsers.length > 0 ? (data.topUsers.map((user, i) => ((0, jsx_runtime_1.jsxs)("tr", { className: isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50', children: [(0, jsx_runtime_1.jsx)("td", { className: `px-4 py-3 ${themeClasses.textMuted}`, children: i + 1 }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3", children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `${themeClasses.textPrimary} font-medium`, children: user.name }), (0, jsx_runtime_1.jsx)("p", { className: `${themeClasses.textSecondary} text-xs`, children: user.email })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3", children: (0, jsx_runtime_1.jsx)("span", { className: "px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium", children: user.count }) }), (0, jsx_runtime_1.jsx)("td", { className: `px-4 py-3 ${themeClasses.textSecondary}`, children: formatDate(user.lastLogin) })] }, i)))) : ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 4, className: `px-4 py-8 text-center ${themeClasses.textMuted}`, children: "No login data for this period" }) })) })] }) })] }), showBusinessMetrics && ((0, jsx_runtime_1.jsxs)("div", { className: `border-t ${isDark ? 'border-slate-700' : 'border-gray-200'} pt-6 mt-6`, children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-xl font-bold ${themeClasses.textPrimary} mb-6`, children: "Business Metrics" }), revenueData && ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-4`, children: [(0, jsx_runtime_1.jsx)("p", { className: themeClasses.textSecondary + ' text-sm', children: "Monthly Revenue (MRR)" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-3xl font-bold text-green-400", children: ["$", revenueData.mrr.toLocaleString()] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-4`, children: [(0, jsx_runtime_1.jsx)("p", { className: themeClasses.textSecondary + ' text-sm', children: "Annual Revenue (ARR)" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-3xl font-bold text-green-400", children: ["$", revenueData.arr.toLocaleString()] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-4`, children: [(0, jsx_runtime_1.jsx)("p", { className: themeClasses.textSecondary + ' text-sm', children: "Paid Subscribers" }), (0, jsx_runtime_1.jsx)("p", { className: "text-3xl font-bold text-blue-400", children: revenueData.paidSubscribers.toLocaleString() })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-4`, children: [(0, jsx_runtime_1.jsx)("p", { className: themeClasses.textSecondary + ' text-sm', children: "Conversion Rate" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-3xl font-bold text-purple-400", children: [revenueData.conversionRate, "%"] })] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "grid md:grid-cols-2 gap-6", children: [tierData && ((0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-6`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `text-lg font-semibold ${themeClasses.textPrimary} mb-4`, children: "Tier Distribution" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative w-40 h-40", children: [(0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 100 100", className: "transform -rotate-90", children: (() => {
                                                            const colors = {
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
                                                                return ((0, jsx_runtime_1.jsx)("circle", { cx: "50", cy: "50", r: "40", fill: "transparent", stroke: colors[tier.tier] || '#64748b', strokeWidth: "20", strokeDasharray: strokeDasharray, strokeDashoffset: strokeDashoffset }, tier.tier));
                                                            });
                                                        })() }), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 flex items-center justify-center", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: `text-2xl font-bold ${themeClasses.textPrimary}`, children: tierData.total }), (0, jsx_runtime_1.jsx)("p", { className: `text-xs ${themeClasses.textSecondary}`, children: "Total" })] }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 space-y-2", children: tierData.distribution.map((tier) => {
                                                    const colors = {
                                                        free: 'bg-slate-500',
                                                        premium: 'bg-blue-500',
                                                        ultimate: 'bg-amber-500',
                                                        enterprise: 'bg-purple-500',
                                                    };
                                                    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-3 h-3 rounded-full ${colors[tier.tier] || 'bg-slate-500'}` }), (0, jsx_runtime_1.jsx)("span", { className: `${themeClasses.textPrimary} capitalize`, children: tier.tier })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("span", { className: `${themeClasses.textPrimary} font-medium`, children: tier.count }), (0, jsx_runtime_1.jsxs)("span", { className: `${themeClasses.textMuted} text-sm ml-2`, children: ["(", tier.percentage, "%)"] })] })] }, tier.tier));
                                                }) })] })] })), featureData && ((0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-lg p-6`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `text-lg font-semibold ${themeClasses.textPrimary} mb-4`, children: "Feature Usage" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: featureData.features.map((feature) => {
                                            const maxUses = Math.max(...featureData.features.map(f => f.uses), 1);
                                            const percentage = (feature.uses / maxUses) * 100;
                                            return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-1", children: [(0, jsx_runtime_1.jsx)("span", { className: `${themeClasses.textPrimary} text-sm`, children: feature.name }), (0, jsx_runtime_1.jsxs)("span", { className: `${themeClasses.textSecondary} text-xs`, children: [feature.uses.toLocaleString(), " uses"] })] }), (0, jsx_runtime_1.jsx)("div", { className: `h-4 ${themeClasses.barBg} rounded overflow-hidden`, children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300", style: { width: `${percentage}%` } }) })] }, feature.name));
                                        }) })] }))] }), revenueData && revenueData.revenueByTier.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: `mt-6 ${themeClasses.cardBg} border rounded-lg overflow-hidden`, children: [(0, jsx_runtime_1.jsx)("div", { className: `p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`, children: (0, jsx_runtime_1.jsx)("h3", { className: `text-lg font-semibold ${themeClasses.textPrimary}`, children: "Revenue by Tier" }) }), (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-sm", children: [(0, jsx_runtime_1.jsx)("thead", { className: isDark ? 'bg-slate-700/50' : 'bg-gray-50', children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`, children: "Tier" }), (0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`, children: "Subscribers" }), (0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`, children: "Price/Mo" }), (0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`, children: "MRR" }), (0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left ${themeClasses.textSecondary} font-medium`, children: "% of Revenue" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: `divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`, children: revenueData.revenueByTier.map((tier) => {
                                                const totalMrr = revenueData.revenueByTier.reduce((sum, t) => sum + t.mrr, 0);
                                                const percentage = totalMrr > 0 ? Math.round((tier.mrr / totalMrr) * 100) : 0;
                                                const tierColors = {
                                                    premium: 'text-blue-400',
                                                    ultimate: 'text-amber-400',
                                                    enterprise: 'text-purple-400',
                                                };
                                                return ((0, jsx_runtime_1.jsxs)("tr", { className: isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50', children: [(0, jsx_runtime_1.jsx)("td", { className: `px-4 py-3 font-medium capitalize ${tierColors[tier.tier] || themeClasses.textPrimary}`, children: tier.tier }), (0, jsx_runtime_1.jsx)("td", { className: `px-4 py-3 ${themeClasses.textPrimary}`, children: tier.subscribers.toLocaleString() }), (0, jsx_runtime_1.jsxs)("td", { className: `px-4 py-3 ${themeClasses.textSecondary}`, children: ["$", tier.pricePerMonth] }), (0, jsx_runtime_1.jsxs)("td", { className: "px-4 py-3 text-green-400 font-medium", children: ["$", tier.mrr.toLocaleString()] }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-16 h-2 ${themeClasses.barBg} rounded overflow-hidden`, children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-green-500", style: { width: `${percentage}%` } }) }), (0, jsx_runtime_1.jsxs)("span", { className: `${themeClasses.textSecondary} text-xs`, children: [percentage, "%"] })] }) })] }, tier.tier));
                                            }) })] }) })] })), revenueData && revenueData.trend.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: `mt-6 ${themeClasses.cardBg} border rounded-lg p-6`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `text-lg font-semibold ${themeClasses.textPrimary} mb-4`, children: "MRR Trend (6 Months)" }), (0, jsx_runtime_1.jsx)("div", { className: "h-48 flex items-end gap-2", children: revenueData.trend.map((point, i) => {
                                    const maxMrr = Math.max(...revenueData.trend.map(p => p.mrr), 1);
                                    const height = (point.mrr / maxMrr) * 100;
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex-1 flex flex-col items-center group", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative w-full", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t transition-all duration-300 hover:from-green-500 hover:to-green-300", style: { height: `${height * 1.8}px`, minHeight: '4px' } }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10", children: (0, jsx_runtime_1.jsxs)("div", { className: `${isDark ? 'bg-slate-900' : 'bg-gray-800'} text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap`, children: ["$", point.mrr.toLocaleString()] }) })] }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs ${themeClasses.textMuted} mt-2`, children: point.month })] }, i));
                                }) })] }))] }))] }));
}
exports.default = AnalyticsTab;
