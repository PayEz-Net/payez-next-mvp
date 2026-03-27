"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsTab = SessionsTab;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------
function SessionsTab({ isDark = true, apiBasePath = '/api/admin/sessions' }) {
    const [sessions, setSessions] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [lastRefresh, setLastRefresh] = (0, react_1.useState)(null);
    const [filterStatus, setFilterStatus] = (0, react_1.useState)('all');
    const [filterEmail, setFilterEmail] = (0, react_1.useState)('');
    const [stats, setStats] = (0, react_1.useState)(null);
    const [revokingId, setRevokingId] = (0, react_1.useState)(null);
    const [revokingUserId, setRevokingUserId] = (0, react_1.useState)(null);
    const themeClasses = {
        cardBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm',
        inputBg: isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900',
        textPrimary: isDark ? 'text-white' : 'text-gray-900',
        textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
        textMuted: isDark ? 'text-gray-500' : 'text-gray-500',
    };
    // Fetch sessions
    const fetchSessions = (0, react_1.useCallback)(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filterStatus !== 'all')
                params.set('status', filterStatus);
            if (filterEmail)
                params.set('email', filterEmail);
            const response = await fetch(`${apiBasePath}?${params}`);
            const data = await response.json();
            if (response.ok) {
                setSessions(data.sessions || []);
                setLastRefresh(new Date());
            }
            else {
                setError(data.error || 'Failed to fetch sessions');
            }
        }
        catch (err) {
            setError('Network error. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    }, [filterStatus, filterEmail, apiBasePath]);
    // Fetch stats
    const fetchStats = (0, react_1.useCallback)(async () => {
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
        }
        catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }, [apiBasePath]);
    // Initial fetch
    (0, react_1.useEffect)(() => {
        fetchSessions();
        fetchStats();
    }, [fetchSessions, fetchStats]);
    // Revoke single session
    const handleRevokeSession = async (sessionId) => {
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
            }
            else {
                alert(data.error || 'Failed to revoke session');
            }
        }
        catch (err) {
            alert('Network error. Please try again.');
        }
        finally {
            setRevokingId(null);
        }
    };
    // Revoke all sessions for a user
    const handleRevokeAllUserSessions = async (userId, userEmail) => {
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
            }
            else {
                alert(data.error || 'Failed to revoke sessions');
            }
        }
        catch (err) {
            alert('Network error. Please try again.');
        }
        finally {
            setRevokingUserId(null);
        }
    };
    // Format time ago
    const getTimeAgo = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        if (diffSec < 60)
            return 'Just now';
        if (diffMin < 60)
            return `${diffMin}m ago`;
        if (diffHour < 24)
            return `${diffHour}h ago`;
        if (diffDay < 7)
            return `${diffDay}d ago`;
        return date.toLocaleDateString();
    };
    // Format location
    const formatLocation = (session) => {
        const parts = [session.city, session.region, session.country_code].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Unknown';
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [stats && ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-xl p-4`, children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-emerald-400", children: stats.totalActive }), (0, jsx_runtime_1.jsx)("div", { className: `text-sm ${themeClasses.textMuted}`, children: "Active Sessions" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-xl p-4`, children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-red-400", children: stats.totalRevoked }), (0, jsx_runtime_1.jsx)("div", { className: `text-sm ${themeClasses.textMuted}`, children: "Revoked Sessions" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-xl p-4`, children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-blue-400", children: stats.uniqueUsers }), (0, jsx_runtime_1.jsx)("div", { className: `text-sm ${themeClasses.textMuted}`, children: "Unique Users" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-xl p-4`, children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold text-purple-400", children: stats.recentLogins }), (0, jsx_runtime_1.jsx)("div", { className: `text-sm ${themeClasses.textMuted}`, children: "Logins (24h)" })] })] })), (0, jsx_runtime_1.jsx)("div", { className: `${themeClasses.cardBg} border rounded-xl p-4`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-1 min-w-[200px]", children: (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Filter by email...", value: filterEmail, onChange: (e) => setFilterEmail(e.target.value), onKeyDown: (e) => e.key === 'Enter' && fetchSessions(), className: `w-full px-4 py-2 rounded-lg border ${themeClasses.inputBg}` }) }), (0, jsx_runtime_1.jsxs)("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: `px-4 py-2 rounded-lg border ${themeClasses.inputBg}`, children: [(0, jsx_runtime_1.jsx)("option", { value: "all", children: "All Status" }), (0, jsx_runtime_1.jsx)("option", { value: "active", children: "Active Only" }), (0, jsx_runtime_1.jsx)("option", { value: "revoked", children: "Revoked Only" })] }), (0, jsx_runtime_1.jsx)("button", { onClick: fetchSessions, disabled: isLoading, className: "px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50", children: isLoading ? 'Loading...' : 'Search' }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs ${themeClasses.textMuted}`, children: lastRefresh ? `Last: ${lastRefresh.toLocaleTimeString()}` : '' })] }) }), error && ((0, jsx_runtime_1.jsx)("div", { className: "p-4 rounded-lg bg-red-500/20 border border-red-500 text-red-400", children: error })), (0, jsx_runtime_1.jsx)("div", { className: `${themeClasses.cardBg} border rounded-xl overflow-hidden`, children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: `border-b ${isDark ? 'border-slate-700' : 'border-gray-200'} bg-opacity-50 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`, children: [(0, jsx_runtime_1.jsx)("th", { className: `text-left py-3 px-4 ${themeClasses.textSecondary} font-medium text-sm`, children: "User" }), (0, jsx_runtime_1.jsx)("th", { className: `text-left py-3 px-4 ${themeClasses.textSecondary} font-medium text-sm`, children: "Location" }), (0, jsx_runtime_1.jsx)("th", { className: `text-left py-3 px-4 ${themeClasses.textSecondary} font-medium text-sm`, children: "Device" }), (0, jsx_runtime_1.jsx)("th", { className: `text-left py-3 px-4 ${themeClasses.textSecondary} font-medium text-sm`, children: "Status" }), (0, jsx_runtime_1.jsx)("th", { className: `text-left py-3 px-4 ${themeClasses.textSecondary} font-medium text-sm`, children: "Created" }), (0, jsx_runtime_1.jsx)("th", { className: `text-left py-3 px-4 ${themeClasses.textSecondary} font-medium text-sm`, children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: sessions.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 6, className: `text-center py-8 ${themeClasses.textMuted}`, children: isLoading ? 'Loading sessions...' : 'No sessions found' }) })) : (sessions.map((session) => ((0, jsx_runtime_1.jsxs)("tr", { className: `border-b ${isDark ? 'border-slate-700' : 'border-gray-100'} last:border-0`, children: [(0, jsx_runtime_1.jsx)("td", { className: "py-3 px-4", children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: `font-medium ${themeClasses.textPrimary}`, children: session.name || session.email.split('@')[0] }), (0, jsx_runtime_1.jsx)("div", { className: `text-xs ${themeClasses.textMuted}`, children: session.email }), (0, jsx_runtime_1.jsxs)("div", { className: `text-xs ${themeClasses.textMuted}`, children: ["ID: ", session.idp_user_id] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 px-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-lg", children: session.country_flag || '🌍' }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: themeClasses.textPrimary, children: formatLocation(session) }), (0, jsx_runtime_1.jsx)("div", { className: `text-xs font-mono ${themeClasses.textMuted}`, children: session.ip_address })] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 px-4", children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.textPrimary} capitalize`, children: [session.device_type === 'desktop' ? '💻' : session.device_type === 'mobile' ? '📱' : '📲', " ", session.device_type] }), (0, jsx_runtime_1.jsxs)("div", { className: `text-xs ${themeClasses.textMuted}`, children: [session.browser, " / ", session.os] })] }) }), (0, jsx_runtime_1.jsxs)("td", { className: "py-3 px-4", children: [(0, jsx_runtime_1.jsx)("span", { className: `px-2 py-1 rounded text-xs font-medium ${session.status === 'active'
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : session.status === 'revoked'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-gray-500/20 text-gray-400'}`, children: session.status }), session.status === 'revoked' && session.revoked_at && ((0, jsx_runtime_1.jsx)("div", { className: `text-xs ${themeClasses.textMuted} mt-1`, children: getTimeAgo(session.revoked_at) }))] }), (0, jsx_runtime_1.jsxs)("td", { className: `py-3 px-4 ${themeClasses.textMuted} text-sm`, children: [(0, jsx_runtime_1.jsx)("div", { children: getTimeAgo(session.created_at) }), session.last_activity && ((0, jsx_runtime_1.jsxs)("div", { className: `text-xs ${themeClasses.textMuted}`, children: ["Active: ", getTimeAgo(session.last_activity)] }))] }), (0, jsx_runtime_1.jsx)("td", { className: "py-3 px-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [session.status === 'active' && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => handleRevokeSession(session.id), disabled: revokingId === session.id, className: "px-3 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50", title: "Revoke this session", children: revokingId === session.id ? '...' : 'Revoke' }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleRevokeAllUserSessions(session.idp_user_id, session.email), disabled: revokingUserId === session.idp_user_id, className: "px-3 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 disabled:opacity-50", title: "Revoke all sessions for this user", children: revokingUserId === session.idp_user_id ? '...' : 'Revoke All' })] })), session.status === 'revoked' && ((0, jsx_runtime_1.jsxs)("span", { className: `text-xs ${themeClasses.textMuted}`, children: ["By: ", session.revoked_by?.split('@')[0]] }))] }) })] }, session.id)))) })] }) }) }), stats && ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-xl p-4`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `font-semibold ${themeClasses.textPrimary} mb-3`, children: "Sessions by Device" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: Object.entries(stats.byDevice).map(([device, count]) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("span", { className: `${themeClasses.textSecondary} capitalize`, children: [device === 'desktop' ? '💻' : device === 'mobile' ? '📱' : '📲', " ", device] }), (0, jsx_runtime_1.jsx)("span", { className: themeClasses.textPrimary, children: count })] }, device))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-xl p-4`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `font-semibold ${themeClasses.textPrimary} mb-3`, children: "Sessions by Country" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2 max-h-48 overflow-y-auto", children: Object.entries(stats.byCountryWithFlags)
                                    .sort((a, b) => b[1].count - a[1].count)
                                    .map(([code, data]) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("span", { className: themeClasses.textSecondary, children: [data.flag, " ", code] }), (0, jsx_runtime_1.jsx)("span", { className: themeClasses.textPrimary, children: data.count })] }, code))) })] })] }))] }));
}
exports.default = SessionsTab;
