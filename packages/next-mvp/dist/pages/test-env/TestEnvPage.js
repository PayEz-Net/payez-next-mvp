"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestEnvPage = TestEnvPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const better_auth_client_1 = require("../../client/better-auth-client");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
/**
 * Test Environment Index Page
 *
 * Debug tools index showing session status and links to debug pages.
 *
 * Usage in consuming app:
 * ```typescript
 * // app/test-env/page.tsx
 * export { TestEnvPage as default } from '@payez/next-mvp/pages/test-env';
 * ```
 */
function TestEnvPage() {
    const { data: sessionData, isPending } = better_auth_client_1.authClient.useSession();
    const session = sessionData;
    const status = isPending ? 'loading' : session ? 'authenticated' : 'unauthenticated';
    const [isDarkMode, setIsDarkMode] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
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
    const testPages = [
        {
            name: 'JWT Inspector',
            url: '/test-env/jwt-inspect',
            description: 'Decode and inspect JWT tokens, view all claims',
        },
    ];
    const extSession = session;
    return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen p-8 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-4xl mx-auto", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold mb-6", children: "Test Environment" }), (0, jsx_runtime_1.jsxs)("div", { className: `mb-8 p-4 rounded-lg ${isDarkMode ? 'bg-slate-900' : 'bg-white border'}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold mb-3", children: "Current Session" }), status === 'loading' ? ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "Loading..." })) : status === 'unauthenticated' ? ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-500", children: "Not logged in" })) : ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [(0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("strong", { children: "Email:" }) }), (0, jsx_runtime_1.jsx)("div", { children: session?.user?.email || 'N/A' }), (0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("strong", { children: "Has Access Token:" }) }), (0, jsx_runtime_1.jsx)("div", { className: extSession?.accessToken ? 'text-green-500' : 'text-red-500', children: extSession?.accessToken ? 'Yes' : 'No' }), (0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("strong", { children: "Has Refresh Token:" }) }), (0, jsx_runtime_1.jsx)("div", { className: extSession?.refreshToken ? 'text-green-500' : 'text-red-500', children: extSession?.refreshToken ? 'Yes' : 'No' }), (0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("strong", { children: "Token Expires:" }) }), (0, jsx_runtime_1.jsx)("div", { children: extSession?.accessTokenExpires ? new Date(extSession.accessTokenExpires).toLocaleString() : 'N/A' }), (0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("strong", { children: "2FA Required:" }) }), (0, jsx_runtime_1.jsx)("div", { children: extSession?.user?.requiresTwoFactor ? 'Yes' : 'No' }), (0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("strong", { children: "2FA Verified:" }) }), (0, jsx_runtime_1.jsx)("div", { children: extSession?.user?.twoFactorSessionVerified ? 'Yes' : 'No' })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-8", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold mb-4", children: "Debug Tools" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: testPages.map((page) => ((0, jsx_runtime_1.jsxs)(link_1.default, { href: page.url, className: `p-4 rounded-lg transition-colors ${isDarkMode
                                    ? 'bg-slate-900 hover:bg-slate-800 border border-slate-700'
                                    : 'bg-white hover:bg-gray-50 border'}`, children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold mb-2", children: page.name }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`, children: page.description })] }, page.url))) })] }), session && !extSession.refreshToken && ((0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${isDarkMode ? 'bg-amber-900/30 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `font-semibold mb-2 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`, children: "No Refresh Token" }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`, children: "This session does not have a refresh token. This typically means 2FA has not been completed. Token refresh will fail when the access token expires." })] }))] }) }));
}
exports.default = TestEnvPage;
