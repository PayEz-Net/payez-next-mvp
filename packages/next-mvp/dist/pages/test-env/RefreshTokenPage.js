"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenPage = RefreshTokenPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("next-auth/react");
/**
 * Refresh Token Test Page
 *
 * Debug page for testing OAuth refresh token flow.
 * Shows current session state, allows manual refresh trigger,
 * and can force-expire tokens for testing.
 *
 * Usage:
 * ```typescript
 * // app/test-env/refresh-token/page.tsx
 * export { RefreshTokenPage as default } from '@payez/next-mvp/pages/test-env';
 * ```
 */
function RefreshTokenPage() {
    const { data: session, update } = (0, react_2.useSession)();
    const [result, setResult] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [sessionDetails, setSessionDetails] = (0, react_1.useState)(null);
    // Fetch detailed session info on mount
    (0, react_1.useEffect)(() => {
        async function fetchSessionDetails() {
            try {
                const res = await fetch("/api/auth/session", { credentials: "include" });
                const data = await res.json();
                setSessionDetails(data);
            }
            catch (e) {
                console.error("Failed to fetch session details", e);
            }
        }
        fetchSessionDetails();
    }, [result]); // Refetch after refresh
    async function handleRefresh() {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            const data = await res.json();
            setResult({ status: res.status, ...data });
            // Update NextAuth session
            await update();
        }
        catch (e) {
            setResult({ error: e.message });
        }
        finally {
            setLoading(false);
        }
    }
    async function handleForceExpire() {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch("/api/test/force-expire", {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();
            setResult({ action: "force_expire", status: res.status, ...data });
        }
        catch (e) {
            setResult({ error: e.message });
        }
        finally {
            setLoading(false);
        }
    }
    const formatExpiry = (exp) => {
        if (!exp)
            return "N/A";
        const date = new Date(typeof exp === "string" ? exp : exp);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        return `${date.toLocaleTimeString()} (${diffMins}m ${diffSecs}s remaining)`;
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "p-8 max-w-2xl mx-auto bg-gray-900 min-h-screen text-white", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold mb-4", children: "Refresh Token Test" }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-6 rounded border border-blue-500 bg-blue-900/30 p-4", children: [(0, jsx_runtime_1.jsx)("h2", { className: "font-semibold mb-2 text-blue-300", children: "Current Session" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-sm space-y-1 font-mono", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-400", children: "User:" }), " ", session?.user?.email || "Not logged in"] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-400", children: "2FA Complete:" }), " ", String(session?.user?.twoFactorSessionVerified ?? "unknown")] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-400", children: "Access Token:" }), " ", sessionDetails?.accessToken ? `${sessionDetails.accessToken.substring(0, 40)}...` : "N/A"] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-400", children: "Refresh Token:" }), " ", sessionDetails?.refreshToken ? `${sessionDetails.refreshToken.substring(0, 40)}...` : "N/A"] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-gray-400", children: "Access Expires:" }), " ", formatExpiry(sessionDetails?.accessTokenExpires)] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2 mb-4", children: [(0, jsx_runtime_1.jsx)("button", { className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50", onClick: handleRefresh, disabled: loading, children: loading ? "Refreshing..." : "Test Refresh Token" }), (0, jsx_runtime_1.jsx)("button", { className: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50", onClick: handleForceExpire, disabled: loading, children: "Force Expire Token" }), (0, jsx_runtime_1.jsx)("button", { className: "bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded", onClick: () => window.location.reload(), children: "Reload Page" })] }), result && ((0, jsx_runtime_1.jsxs)("div", { className: "rounded border border-gray-600 bg-gray-800 p-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold mb-2 text-gray-300", children: "Result:" }), (0, jsx_runtime_1.jsx)("pre", { className: "text-xs overflow-x-auto whitespace-pre-wrap text-green-400", children: JSON.stringify(result, null, 2) })] })), (0, jsx_runtime_1.jsxs)("details", { className: "mt-4", children: [(0, jsx_runtime_1.jsx)("summary", { className: "cursor-pointer text-gray-400 hover:text-white", children: "Raw Session Details" }), (0, jsx_runtime_1.jsx)("pre", { className: "mt-2 text-xs bg-gray-800 p-2 rounded overflow-x-auto text-gray-300", children: JSON.stringify(sessionDetails, null, 2) })] })] }));
}
exports.default = RefreshTokenPage;
