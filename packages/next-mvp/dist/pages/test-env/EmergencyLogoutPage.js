"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyLogoutPage = EmergencyLogoutPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("next-auth/react");
const react_2 = require("react");
/**
 * Emergency Logout Page
 *
 * Nuclear option for clearing auth state when things go wrong.
 * Clears cookies, localStorage, and forces NextAuth signout.
 *
 * Usage in consuming app:
 * ```typescript
 * // app/test-env/emergency-logout/page.tsx
 * export { EmergencyLogoutPage as default } from '@payez/next-mvp/pages/test-env';
 * ```
 */
function EmergencyLogoutPage() {
    const { status } = (0, react_1.useSession)();
    const [isDarkMode, setIsDarkMode] = (0, react_2.useState)(false);
    const [isLoggingOut, setIsLoggingOut] = (0, react_2.useState)(false);
    const [logoutComplete, setLogoutComplete] = (0, react_2.useState)(false);
    const [logs, setLogs] = (0, react_2.useState)([]);
    (0, react_2.useEffect)(() => {
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark') ||
                window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(isDark);
        };
        checkDarkMode();
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', checkDarkMode);
        return () => mediaQuery.removeEventListener('change', checkDarkMode);
    }, []);
    const addLog = (message) => {
        setLogs(prev => [...prev, `[${new Date().toISOString().substring(11, 19)}] ${message}`]);
    };
    const handleEmergencyLogout = async () => {
        setIsLoggingOut(true);
        setLogs([]);
        try {
            // Step 1: Clear all cookies
            addLog('Clearing cookies...');
            document.cookie.split(';').forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            });
            addLog('Cookies cleared');
            // Step 2: Clear localStorage
            addLog('Clearing localStorage...');
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key)
                    keysToRemove.push(key);
            }
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                addLog(`  Removed: ${key}`);
            });
            addLog(`localStorage cleared (${keysToRemove.length} items)`);
            // Step 3: Clear sessionStorage
            addLog('Clearing sessionStorage...');
            sessionStorage.clear();
            addLog('sessionStorage cleared');
            // Step 4: Call NextAuth signOut
            addLog('Calling NextAuth signOut...');
            await (0, react_1.signOut)({ redirect: false });
            addLog('NextAuth signOut complete');
            // Step 5: Clear any auth-related fetch cache
            addLog('Invalidating caches...');
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
                addLog(`Cleared ${cacheNames.length} caches`);
            }
            addLog('Emergency logout complete!');
            setLogoutComplete(true);
        }
        catch (error) {
            addLog(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setIsLoggingOut(false);
        }
    };
    const handleRedirectHome = () => {
        window.location.href = '/';
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen p-8 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-2xl mx-auto", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold mb-2", children: "Emergency Logout" }), (0, jsx_runtime_1.jsx)("p", { className: `mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`, children: "Nuclear option for when auth gets into a bad state. Clears everything." }), (0, jsx_runtime_1.jsxs)("div", { className: `mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-slate-900' : 'bg-white border'}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: "font-semibold mb-2", children: "Current Status" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: `inline-block w-3 h-3 rounded-full ${status === 'authenticated' ? 'bg-green-500' :
                                        status === 'loading' ? 'bg-yellow-500' : 'bg-red-500'}` }), (0, jsx_runtime_1.jsx)("span", { className: "capitalize", children: status })] })] }), !logoutComplete ? ((0, jsx_runtime_1.jsx)("button", { onClick: handleEmergencyLogout, disabled: isLoggingOut, className: `w-full py-3 px-4 rounded-lg font-semibold transition-colors ${isLoggingOut
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'}`, children: isLoggingOut ? 'Logging out...' : 'Emergency Logout' })) : ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `p-4 rounded-lg ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`, children: (0, jsx_runtime_1.jsx)("p", { className: `font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`, children: "Logout complete! All auth state has been cleared." }) }), (0, jsx_runtime_1.jsx)("button", { onClick: handleRedirectHome, className: "w-full py-3 px-4 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors", children: "Go to Home Page" })] })), logs.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: `mt-6 p-4 rounded-lg font-mono text-sm ${isDarkMode ? 'bg-slate-900' : 'bg-gray-100'}`, children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold mb-2", children: "Log" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-1", children: logs.map((log, i) => ((0, jsx_runtime_1.jsx)("div", { className: log.includes('ERROR') ? 'text-red-500' : isDarkMode ? 'text-gray-300' : 'text-gray-700', children: log }, i))) })] })), (0, jsx_runtime_1.jsxs)("div", { className: `mt-8 p-4 rounded-lg ${isDarkMode ? 'bg-slate-900' : 'bg-white border'}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: "font-semibold mb-2", children: "What this does" }), (0, jsx_runtime_1.jsxs)("ul", { className: `list-disc list-inside space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`, children: [(0, jsx_runtime_1.jsx)("li", { children: "Clears all browser cookies" }), (0, jsx_runtime_1.jsx)("li", { children: "Clears localStorage (theme, preferences, etc.)" }), (0, jsx_runtime_1.jsx)("li", { children: "Clears sessionStorage" }), (0, jsx_runtime_1.jsx)("li", { children: "Calls NextAuth signOut" }), (0, jsx_runtime_1.jsx)("li", { children: "Invalidates browser caches" })] })] })] }) }));
}
exports.default = EmergencyLogoutPage;
