"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtInspectPage = JwtInspectPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const better_auth_client_1 = require("../../client/better-auth-client");
const react_1 = require("react");
// Decode JWT header (contains kid, alg, typ)
function decodeJwtHeader(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const header = parts[0].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(header);
        return JSON.parse(decoded);
    }
    catch {
        return null;
    }
}
// Decode JWT payload (contains claims)
function decodeJwtPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(payload);
        return JSON.parse(decoded);
    }
    catch {
        return null;
    }
}
/**
 * Session Inspector Page
 *
 * Debug page for inspecting session data from Redis.
 * Shows user info, roles, 2FA status, and tokens.
 *
 * Usage in consuming app:
 * ```typescript
 * // app/test-env/jwt-inspect/page.tsx
 * export { JwtInspectPage as default } from '@payez/next-mvp/pages/test-env';
 * ```
 */
function JwtInspectPage() {
    const { data: sessionData, isPending } = better_auth_client_1.authClient.useSession();
    const session = sessionData;
    const status = isPending ? 'loading' : session ? 'authenticated' : 'unauthenticated';
    const [copied, setCopied] = (0, react_1.useState)(null);
    const [isDarkMode, setIsDarkMode] = (0, react_1.useState)(false);
    const [jwtHeader, setJwtHeader] = (0, react_1.useState)(null);
    const [jwtPayload, setJwtPayload] = (0, react_1.useState)(null);
    // Detect dark mode
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
    // Decode JWT header and payload when accessToken changes
    (0, react_1.useEffect)(() => {
        const ext = session;
        if (ext?.accessToken) {
            setJwtHeader(decodeJwtHeader(ext.accessToken));
            setJwtPayload(decodeJwtPayload(ext.accessToken));
        }
    }, [session]);
    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };
    if (status === 'loading') {
        return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen p-8 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`, children: "Loading session..." }));
    }
    if (status === 'unauthenticated') {
        return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen p-8 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`, children: (0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${isDarkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold mb-2", children: "Not Authenticated" }), (0, jsx_runtime_1.jsx)("p", { children: "Please log in to inspect session data." })] }) }));
    }
    // Extended session with all custom fields
    const ext = session;
    const user = ext?.user || {};
    // Card styling helpers
    const cardClass = isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200';
    const labelClass = isDarkMode ? 'text-slate-400' : 'text-gray-500';
    const valueClass = isDarkMode ? 'text-white' : 'text-gray-900';
    return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen p-8 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-4xl mx-auto space-y-6", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold", children: "Session Inspector" }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${labelClass}`, children: "Session data from Redis (via NextAuth session callback)" }), (0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${cardClass}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold mb-4", children: "User Identity" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 text-sm", children: [(0, jsx_runtime_1.jsx)(InfoRow, { label: "User ID", value: user.id, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "Email", value: user.email, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "Name", value: user.name, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "OAuth Provider", value: user.oauthProvider, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "IDP Client ID", value: user.idpClientId, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "Merchant ID", value: user.merchantId, labelClass: labelClass, valueClass: valueClass })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/30 border border-purple-700' : 'bg-purple-50 border border-purple-200'}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold mb-4", children: "Roles" }), user.roles && user.roles.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-2", children: user.roles.map((role) => ((0, jsx_runtime_1.jsx)("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-purple-800 text-purple-100' : 'bg-purple-200 text-purple-800'}`, children: role }, role))) })) : ((0, jsx_runtime_1.jsx)("p", { className: labelClass, children: "No roles assigned" }))] }), (0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${isDarkMode ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold mb-4", children: "2FA Status" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 text-sm", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: labelClass, children: "2FA Verified:" }), ' ', (0, jsx_runtime_1.jsx)(StatusBadge, { value: user.twoFactorSessionVerified, trueText: "Yes", falseText: "No", isDarkMode: isDarkMode })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: labelClass, children: "Requires 2FA:" }), ' ', (0, jsx_runtime_1.jsx)(StatusBadge, { value: user.requiresTwoFactor, trueText: "Yes", falseText: "No", isDarkMode: isDarkMode, invertColors: true })] }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "Auth Methods (AMR)", value: user.authenticationMethods?.join(', '), labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "Auth Level (ACR)", value: user.authenticationLevel, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "MFA Completed At", value: user.mfaCompletedAt ? new Date(user.mfaCompletedAt).toISOString() : undefined, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "MFA Expires At", value: user.mfaExpiresAt ? new Date(user.mfaExpiresAt).toISOString() : undefined, labelClass: labelClass, valueClass: valueClass })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold mb-4", children: "Tokens" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [(0, jsx_runtime_1.jsx)("span", { className: labelClass, children: "Session Token (Redis Key):" }), ext.sessionToken && ((0, jsx_runtime_1.jsx)(CopyButton, { onClick: () => copyToClipboard(ext.sessionToken, 'session'), copied: copied === 'session', isDarkMode: isDarkMode }))] }), (0, jsx_runtime_1.jsx)("code", { className: `block p-2 rounded text-xs break-all ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: ext.sessionToken || 'N/A' })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [(0, jsx_runtime_1.jsx)("span", { className: labelClass, children: "Access Token (IDP):" }), ext.accessToken && ((0, jsx_runtime_1.jsx)(CopyButton, { onClick: () => copyToClipboard(ext.accessToken, 'access'), copied: copied === 'access', isDarkMode: isDarkMode }))] }), (0, jsx_runtime_1.jsx)("code", { className: `block p-2 rounded text-xs break-all max-h-24 overflow-auto ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: ext.accessToken || 'N/A' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 text-sm", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: labelClass, children: "Has Refresh Token:" }), ' ', (0, jsx_runtime_1.jsx)(StatusBadge, { value: !!ext.refreshToken, trueText: "Yes", falseText: "No", isDarkMode: isDarkMode })] }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "Access Token Expires", value: ext.accessTokenExpires ? new Date(ext.accessTokenExpires).toISOString() : undefined, labelClass: labelClass, valueClass: valueClass })] })] })] }), jwtHeader && ((0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${isDarkMode ? 'bg-orange-900/30 border border-orange-700' : 'bg-orange-50 border border-orange-200'}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold mb-4", children: "JWT Header" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 text-sm", children: [(0, jsx_runtime_1.jsx)(InfoRow, { label: "Algorithm (alg)", value: jwtHeader.alg, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "Type (typ)", value: jwtHeader.typ, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: labelClass, children: "Key ID (kid):" }), ' ', (0, jsx_runtime_1.jsx)("span", { className: `font-mono ${jwtHeader.kid ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`, children: jwtHeader.kid || 'NOT PRESENT' })] }), Object.entries(jwtHeader)
                                    .filter(([key]) => !['alg', 'typ', 'kid'].includes(key))
                                    .map(([key, value]) => ((0, jsx_runtime_1.jsx)(InfoRow, { label: key, value: typeof value === 'object' ? JSON.stringify(value) : String(value), labelClass: labelClass, valueClass: valueClass }, key)))] })] })), jwtPayload && ((0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold mb-4", children: "JWT Payload Claims" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 text-sm", children: [(0, jsx_runtime_1.jsx)(InfoRow, { label: "Subject (sub)", value: jwtPayload.sub, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "Issuer (iss)", value: jwtPayload.iss, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "Audience (aud)", value: Array.isArray(jwtPayload.aud) ? jwtPayload.aud.join(', ') : jwtPayload.aud, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "Client ID", value: jwtPayload.client_id, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "Expires (exp)", value: jwtPayload.exp ? new Date(jwtPayload.exp * 1000).toISOString() : undefined, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "Issued At (iat)", value: jwtPayload.iat ? new Date(jwtPayload.iat * 1000).toISOString() : undefined, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "AMR (Auth Methods)", value: Array.isArray(jwtPayload.amr) ? jwtPayload.amr.join(', ') : jwtPayload.amr, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "ACR (Auth Context)", value: jwtPayload.acr, labelClass: labelClass, valueClass: valueClass })] })] })), (0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${cardClass}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold mb-4", children: "Session Metadata" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 text-sm", children: [(0, jsx_runtime_1.jsx)(InfoRow, { label: "Session Expires", value: session?.expires ? new Date(session.expires).toISOString() : undefined, labelClass: labelClass, valueClass: valueClass }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "Error", value: ext.error, labelClass: labelClass, valueClass: ext.error ? 'text-red-500' : valueClass })] })] }), (0, jsx_runtime_1.jsxs)("details", { className: `p-4 rounded-lg ${cardClass}`, children: [(0, jsx_runtime_1.jsx)("summary", { className: "font-semibold cursor-pointer", children: "Raw Session Data (Click to expand)" }), (0, jsx_runtime_1.jsx)("pre", { className: `mt-4 text-xs overflow-auto p-3 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: JSON.stringify(session, null, 2) })] })] }) }));
}
// Helper Components
function InfoRow({ label, value, labelClass, valueClass, }) {
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("span", { className: labelClass, children: [label, ":"] }), ' ', (0, jsx_runtime_1.jsx)("span", { className: valueClass, children: value || 'N/A' })] }));
}
function StatusBadge({ value, trueText, falseText, isDarkMode, invertColors = false, }) {
    const isPositive = invertColors ? !value : value;
    const colorClass = isPositive
        ? isDarkMode ? 'bg-green-800 text-green-100' : 'bg-green-200 text-green-800'
        : isDarkMode ? 'bg-red-800 text-red-100' : 'bg-red-200 text-red-800';
    return ((0, jsx_runtime_1.jsx)("span", { className: `px-2 py-0.5 rounded text-xs font-medium ${colorClass}`, children: value ? trueText : falseText }));
}
function CopyButton({ onClick, copied, isDarkMode, }) {
    return ((0, jsx_runtime_1.jsx)("button", { onClick: onClick, className: `px-2 py-1 rounded text-xs ${copied
            ? 'bg-green-600 text-white'
            : isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`, children: copied ? 'Copied!' : 'Copy' }));
}
exports.default = JwtInspectPage;
