"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientSiteAdminPage = ClientSiteAdminPage;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * =============================================================================
 * CLIENT SITE ADMIN - Your App's Admin Dashboard
 * =============================================================================
 *
 * This is the foundation for YOUR app-specific admin area.
 * The MVP admin (/admin) handles membership - this handles YOUR data.
 *
 * SEPARATION OF CONCERNS:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  /admin (MVP Admin)              │  /admin/[your-area] (This)      │
 * │  ─────────────────               │  ────────────────────────       │
 * │  • User authentication           │  • Your app's collections       │
 * │  • Sessions management           │  • Your app's features          │
 * │  • Role assignments              │  • Content moderation           │
 * │  • Tier/subscription mgmt        │  • App-specific analytics       │
 * │  • Site-wide analytics           │  • Custom admin tools           │
 * │  • vibe_app collection           │  • your_app collection          │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * USAGE:
 * ```tsx
 * // app/admin/your-area/page.tsx
 * import { ClientSiteAdminPage } from '@payez/next-mvp/pages/client-admin';
 *
 * export default function YourAdminPage() {
 *   return (
 *     <ClientSiteAdminPage
 *       title="Your Admin"
 *       subtitle="Manage your app data"
 *       collectionName="your_collection"
 *       tabs={[
 *         { id: 'overview', label: 'Overview', icon: '📊' },
 *         { id: 'items', label: 'Items', icon: '📦', table: 'items' },
 *       ]}
 *       renderTabContent={(tab, data) => <YourCustomContent />}
 *     />
 *   );
 * }
 * ```
 *
 * =============================================================================
 */
const react_1 = require("react");
const better_auth_client_1 = require("../../client/better-auth-client");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
// Icons - using basic SVGs to avoid lucide dependency issues
const IconRefresh = () => ((0, jsx_runtime_1.jsx)("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }));
const IconArrowLeft = () => ((0, jsx_runtime_1.jsx)("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 19l-7-7m0 0l7-7m-7 7h18" }) }));
const IconShield = () => ((0, jsx_runtime_1.jsx)("svg", { className: "w-16 h-16", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" }) }));
const IconChart = ({ className = "w-5 h-5" }) => ((0, jsx_runtime_1.jsx)("svg", { className: className, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }));
function ClientSiteAdminPage({ title, subtitle = 'Manage your app data', collectionName, tabs, allowedRoles = ['vibe_app_admin'], renderOverview, renderTabContent, isDark: isDarkProp, backUrl = '/', backLabel = 'Back to Site', }) {
    const { data: sessionData, isPending } = better_auth_client_1.authClient.useSession();
    const session = sessionData;
    const status = isPending ? 'loading' : session ? 'authenticated' : 'unauthenticated';
    const router = (0, navigation_1.useRouter)();
    // Theme detection
    const [isDarkState, setIsDarkState] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (isDarkProp === undefined) {
            const checkDark = () => {
                const isDark = document.documentElement.classList.contains('dark') ||
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
                setIsDarkState(isDark);
            };
            checkDark();
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            mq.addEventListener('change', checkDark);
            return () => mq.removeEventListener('change', checkDark);
        }
    }, [isDarkProp]);
    const isDark = isDarkProp ?? isDarkState;
    const [activeTab, setActiveTab] = (0, react_1.useState)(tabs[0]?.id || 'overview');
    const [tableData, setTableData] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [stats, setStats] = (0, react_1.useState)([]);
    const [statsLoading, setStatsLoading] = (0, react_1.useState)(false);
    const userRoles = session?.user?.roles || [];
    const hasAccess = allowedRoles.some(role => userRoles.includes(role));
    const themeClasses = {
        bg: isDark ? 'bg-slate-950' : 'bg-gray-50',
        cardBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200',
        headerBg: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200',
        text: isDark ? 'text-white' : 'text-gray-900',
        textMuted: isDark ? 'text-slate-400' : 'text-gray-600',
        tabBg: isDark ? 'bg-slate-800' : 'bg-gray-100',
        tabActive: 'bg-amber-600 text-white shadow-lg',
        tabInactive: isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-200',
    };
    // Fetch collection stats
    const fetchStats = (0, react_1.useCallback)(async () => {
        setStatsLoading(true);
        try {
            const res = await fetch(`/api/vibe/collections/${collectionName}/tables`);
            if (res.ok) {
                const data = await res.json();
                const tables = data.tables || data || [];
                setStats(tables.map((tbl) => ({
                    table: typeof tbl === 'string' ? tbl : tbl.name,
                    count: typeof tbl === 'object' ? (tbl.document_count || tbl.count || 0) : 0,
                    label: (typeof tbl === 'string' ? tbl : tbl.name)
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase()),
                })));
            }
        }
        catch (err) {
            console.error('Failed to fetch stats:', err);
        }
        finally {
            setStatsLoading(false);
        }
    }, [collectionName]);
    // Fetch table data
    const fetchTableData = (0, react_1.useCallback)(async (tableName) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/vibe/data/${collectionName}/${tableName}?limit=100`);
            if (res.ok) {
                const data = await res.json();
                setTableData(data.data || []);
            }
        }
        catch (err) {
            console.error('Failed to fetch table:', err);
            setTableData([]);
        }
        finally {
            setLoading(false);
        }
    }, [collectionName]);
    // Handle tab change
    const handleTabChange = (0, react_1.useCallback)((tabId) => {
        setActiveTab(tabId);
        const tab = tabs.find(t => t.id === tabId);
        if (tab?.table) {
            fetchTableData(tab.table);
        }
    }, [tabs, fetchTableData]);
    // Initial load
    (0, react_1.useEffect)(() => {
        if (status === 'unauthenticated') {
            router.push(`/account-auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        }
        else if (status === 'authenticated' && !hasAccess) {
            router.push('/?error=unauthorized');
        }
        else if (status === 'authenticated' && hasAccess) {
            fetchStats();
        }
    }, [status, hasAccess, router, fetchStats]);
    // Loading state
    if (status === 'loading') {
        return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen flex items-center justify-center ${themeClasses.bg}`, children: (0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" }) }));
    }
    // Access denied
    if (status === 'authenticated' && !hasAccess) {
        return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen flex items-center justify-center ${themeClasses.bg}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: isDark ? 'text-red-400' : 'text-red-500', children: (0, jsx_runtime_1.jsx)(IconShield, {}) }), (0, jsx_runtime_1.jsx)("h1", { className: `text-2xl font-bold mb-2 ${themeClasses.text}`, children: "Access Denied" }), (0, jsx_runtime_1.jsx)("p", { className: `mb-6 ${themeClasses.textMuted}`, children: "You need admin access for this area." }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/", className: "inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700", children: [(0, jsx_runtime_1.jsx)(IconArrowLeft, {}), " Return to Home"] })] }) }));
    }
    if (status === 'unauthenticated')
        return null;
    const currentTab = tabs.find(t => t.id === activeTab);
    return ((0, jsx_runtime_1.jsxs)("div", { className: `min-h-screen ${themeClasses.bg}`, children: [(0, jsx_runtime_1.jsx)("header", { className: `sticky top-0 z-40 border-b ${themeClasses.headerBg}`, children: (0, jsx_runtime_1.jsx)("div", { className: "container mx-auto px-4 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `p-2 rounded-lg ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'}`, children: (0, jsx_runtime_1.jsx)(IconChart, { className: `w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}` }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: `text-xl font-bold ${themeClasses.text}`, children: title }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${themeClasses.textMuted}`, children: subtitle })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => { fetchStats(); if (currentTab?.table)
                                            fetchTableData(currentTab.table); }, disabled: loading || statsLoading, className: `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${themeClasses.textMuted} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'} ${(loading || statsLoading) ? 'opacity-50' : ''}`, children: [(0, jsx_runtime_1.jsx)("span", { className: (loading || statsLoading) ? 'animate-spin' : '', children: (0, jsx_runtime_1.jsx)(IconRefresh, {}) }), "Refresh"] }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: backUrl, className: `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${themeClasses.textMuted} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`, children: [(0, jsx_runtime_1.jsx)(IconArrowLeft, {}), " ", backLabel] })] })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "container mx-auto px-4 py-6 space-y-6", children: [(0, jsx_runtime_1.jsx)("div", { className: `flex flex-wrap gap-1 p-1 rounded-xl ${themeClasses.tabBg}`, children: tabs.map((tab) => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => handleTabChange(tab.id), className: `py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? themeClasses.tabActive : themeClasses.tabInactive}`, children: [(0, jsx_runtime_1.jsx)("span", { className: "mr-2", children: tab.icon }), tab.label] }, tab.id))) }), renderTabContent ? (renderTabContent(currentTab, tableData, loading)) : activeTab === 'overview' || !currentTab?.table ? (
                    // Default Overview
                    (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-lg font-semibold mb-4 ${themeClasses.text}`, children: "Data Overview" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: stats.map((stat) => ((0, jsx_runtime_1.jsxs)(link_1.default, { href: `/admin/data?collection=${collectionName}&table=${stat.table}`, className: `p-4 rounded-xl border transition-all hover:scale-[1.02] ${themeClasses.cardBg}`, children: [(0, jsx_runtime_1.jsx)("p", { className: `text-xs font-medium ${themeClasses.textMuted}`, children: stat.label }), (0, jsx_runtime_1.jsx)("p", { className: `text-2xl font-bold ${themeClasses.text}`, children: statsLoading ? '...' : stat.count.toLocaleString() })] }, stat.table))) })] }), renderOverview && renderOverview(stats)] })) : (
                    // Default Table View
                    (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h2", { className: `text-lg font-semibold mb-4 ${themeClasses.text}`, children: [currentTab.label, " (", tableData.length, ")"] }), loading ? ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center py-12", children: (0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" }) })) : ((0, jsx_runtime_1.jsx)("div", { className: `rounded-lg border overflow-hidden ${themeClasses.cardBg}`, children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-sm", children: [(0, jsx_runtime_1.jsx)("thead", { className: isDark ? 'bg-slate-800' : 'bg-gray-50', children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left font-medium ${themeClasses.textMuted}`, children: "ID" }), (0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left font-medium ${themeClasses.textMuted}`, children: "User" }), (0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left font-medium ${themeClasses.textMuted}`, children: "Data" }), (0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left font-medium ${themeClasses.textMuted}`, children: "Created" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: `divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`, children: tableData.length === 0 ? ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 4, className: `px-4 py-8 text-center ${themeClasses.textMuted}`, children: "No data found" }) })) : tableData.map((row) => ((0, jsx_runtime_1.jsxs)("tr", { className: isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50', children: [(0, jsx_runtime_1.jsx)("td", { className: `px-4 py-3 ${themeClasses.text}`, children: row.document_id }), (0, jsx_runtime_1.jsx)("td", { className: `px-4 py-3 ${themeClasses.text}`, children: row.user_id }), (0, jsx_runtime_1.jsxs)("td", { className: `px-4 py-3 ${themeClasses.textMuted} max-w-xs truncate`, children: [JSON.stringify(row.data).substring(0, 50), "..."] }), (0, jsx_runtime_1.jsx)("td", { className: `px-4 py-3 ${themeClasses.textMuted}`, children: new Date(row.created_at).toLocaleDateString() })] }, row.document_id))) })] }) }) }))] }))] })] }));
}
exports.default = ClientSiteAdminPage;
