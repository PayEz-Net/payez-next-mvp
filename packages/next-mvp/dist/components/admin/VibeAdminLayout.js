"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VibeAdminLayout = VibeAdminLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("next-auth/react");
const navigation_1 = require("next/navigation");
const react_2 = require("react");
const link_1 = __importDefault(require("next/link"));
const VibeAdminContext_1 = require("./VibeAdminContext");
const lucide_react_1 = require("lucide-react");
const defaultNavItems = [
    { id: 'stats', label: 'Dashboard', icon: lucide_react_1.LayoutDashboard },
    { id: 'users', label: 'Users', icon: lucide_react_1.Users },
    { id: 'sessions', label: 'Sessions', icon: lucide_react_1.Activity },
    { id: 'analytics', label: 'Analytics', icon: lucide_react_1.BarChart3 },
    { id: 'data', label: 'Data Browser', icon: lucide_react_1.Database },
    { id: 'settings', label: 'Settings', icon: lucide_react_1.Settings },
];
function VibeAdminLayout({ children, activeTabId = 'stats', onTabChange, headerContent, isDarkMode: isDarkModeProp, adminRole = 'vibe_app_admin', }) {
    const { data: session, status } = (0, react_1.useSession)();
    const router = (0, navigation_1.useRouter)();
    const adminConfig = (0, VibeAdminContext_1.useVibeAdmin)();
    const isDark = isDarkModeProp ?? adminConfig.isDarkMode ?? false;
    const basePath = adminConfig.basePath || '/vibe-admin';
    const navItems = [...defaultNavItems];
    adminConfig.customTabs?.forEach((tab) => {
        navItems.push({
            id: tab.id,
            label: tab.label,
            icon: tab.icon || lucide_react_1.LayoutDashboard,
        });
    });
    const userRoles = session?.user?.roles || [];
    const hasAdminRole = userRoles.includes(adminRole) || userRoles.includes('payez_admin');
    (0, react_2.useEffect)(() => {
        if (status === 'unauthenticated') {
            router.push('/account-auth/login?callbackUrl=' + basePath);
            return;
        }
        if (status === 'authenticated' && !hasAdminRole) {
            router.push('/?error=unauthorized');
        }
    }, [status, hasAdminRole, router, basePath]);
    if (status === 'loading') {
        return ((0, jsx_runtime_1.jsx)("div", { className: 'min-h-screen flex items-center justify-center ' + (isDark ? 'bg-slate-950' : 'bg-gray-50'), children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" }), (0, jsx_runtime_1.jsx)("p", { className: isDark ? 'text-slate-400' : 'text-slate-600', children: "Loading..." })] }) }));
    }
    if (status === 'authenticated' && !hasAdminRole) {
        return ((0, jsx_runtime_1.jsx)("div", { className: 'min-h-screen flex items-center justify-center ' + (isDark ? 'bg-slate-950' : 'bg-gray-50'), children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Shield, { className: 'w-16 h-16 mx-auto mb-4 ' + (isDark ? 'text-red-400' : 'text-red-500') }), (0, jsx_runtime_1.jsx)("h1", { className: 'text-2xl font-bold mb-2 ' + (isDark ? 'text-white' : 'text-gray-900'), children: "Access Denied" }), (0, jsx_runtime_1.jsx)("p", { className: 'mb-6 ' + (isDark ? 'text-slate-400' : 'text-slate-600'), children: "You do not have permission to access the admin panel." }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/", className: "inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { className: "w-4 h-4" }), "Return to Home"] })] }) }));
    }
    if (status === 'unauthenticated') {
        return null;
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: 'min-h-screen ' + (isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'), children: [(0, jsx_runtime_1.jsx)("header", { className: 'sticky top-0 z-40 border-b ' + (isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'), children: (0, jsx_runtime_1.jsx)("div", { className: "container mx-auto px-4 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [adminConfig.logoUrl && ((0, jsx_runtime_1.jsx)("div", { className: 'p-2 rounded-lg ' + (isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'), children: (0, jsx_runtime_1.jsx)("img", { src: adminConfig.logoUrl, alt: adminConfig.appName, className: "w-6 h-6" }) })), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-bold", children: "Platform Admin" }), (0, jsx_runtime_1.jsxs)("p", { className: 'text-sm ' + (isDark ? 'text-slate-400' : 'text-slate-600'), children: [adminConfig.appName, " - ", adminConfig.collectionName] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [headerContent, (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/", className: 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ' + (isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-slate-600'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { className: "w-4 h-4" }), "Back to App"] })] })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "container mx-auto px-4 py-4", children: [(0, jsx_runtime_1.jsx)("nav", { className: 'flex items-center gap-1 mb-6 border-b ' + (isDark ? 'border-slate-800' : 'border-gray-200'), children: navItems.map((item) => {
                            const isActive = activeTabId === item.id;
                            const Icon = item.icon;
                            const activeClass = isDark
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-indigo-600 text-indigo-700';
                            const inactiveClass = isDark
                                ? 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                                : 'border-transparent text-slate-600 hover:text-gray-900 hover:border-gray-300';
                            return ((0, jsx_runtime_1.jsxs)("button", { onClick: () => onTabChange?.(item.id), className: 'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ' + (isActive ? activeClass : inactiveClass), children: [(0, jsx_runtime_1.jsx)(Icon, { className: "w-4 h-4" }), item.label] }, item.id));
                        }) }), (0, jsx_runtime_1.jsx)("main", { className: "min-w-0", children: children })] })] }));
}
exports.default = VibeAdminLayout;
