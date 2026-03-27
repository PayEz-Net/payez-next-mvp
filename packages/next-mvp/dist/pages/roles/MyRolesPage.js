"use strict";
/**
 * My Roles Page for @payez/next-mvp
 *
 * User view of their assigned roles (/account/roles).
 * Shows roles from both IDP and app sources with expandable permissions.
 * Read-only - users cannot self-assign roles.
 *
 * @see docs/specs/ROLES_MANAGEMENT_SPEC.md
 */
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MyRolesPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const useTheme_1 = require("../../theme/useTheme");
const components_1 = require("./components");
function MyRolesPage({ initialData, rolesEndpoint = '/api/account/my-roles', }) {
    const layout = (0, useTheme_1.useLayout)();
    const colors = (0, useTheme_1.useColors)();
    // Determine dark mode
    const isDark = colors?.background?.includes('slate-9') ||
        colors?.background?.includes('gray-9') ||
        colors?.card?.includes('slate-8');
    // State
    const [data, setData] = (0, react_1.useState)(initialData || null);
    const [loading, setLoading] = (0, react_1.useState)(!initialData);
    const [error, setError] = (0, react_1.useState)(null);
    // Theme colors
    const bgColor = isDark ? 'bg-slate-900' : 'bg-gray-50';
    const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
    const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
    // Fetch roles
    const fetchRoles = (0, react_1.useCallback)(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(rolesEndpoint, { credentials: 'include' });
            if (!response.ok) {
                throw new Error('Failed to load roles');
            }
            const result = await response.json();
            setData(result);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load roles');
        }
        finally {
            setLoading(false);
        }
    }, [rolesEndpoint]);
    (0, react_1.useEffect)(() => {
        if (!initialData) {
            fetchRoles();
        }
    }, [initialData, fetchRoles]);
    // Loading state
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen ${bgColor} flex items-center justify-center`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center space-y-4", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin h-8 w-8 text-blue-500", viewBox: "0 0 24 24", fill: "none", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" })] }), (0, jsx_runtime_1.jsx)("p", { className: textMuted, children: "Loading roles..." })] }) }));
    }
    // Error state
    if (error) {
        return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen ${bgColor} flex items-center justify-center`, children: (0, jsx_runtime_1.jsxs)("div", { className: `${cardBg} border ${borderColor} rounded-lg p-8 text-center max-w-md`, children: [(0, jsx_runtime_1.jsx)("svg", { className: "w-12 h-12 text-red-500 mx-auto mb-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }), (0, jsx_runtime_1.jsx)("h2", { className: `text-lg font-semibold ${textPrimary} mb-2`, children: "Failed to Load Roles" }), (0, jsx_runtime_1.jsx)("p", { className: `${textMuted} mb-4`, children: error }), (0, jsx_runtime_1.jsx)("button", { onClick: fetchRoles, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700", children: "Try Again" })] }) }));
    }
    const idpRoles = data?.idp_roles || [];
    const appRoles = data?.app_roles || [];
    const totalRoles = idpRoles.length + appRoles.length;
    return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen ${bgColor}`, children: (0, jsx_runtime_1.jsxs)("div", { className: `max-w-2xl mx-auto ${layout?.padding || 'p-6'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: `text-3xl font-bold ${textPrimary}`, children: "My Roles" }), totalRoles > 0 && ((0, jsx_runtime_1.jsxs)("p", { className: `mt-1 ${textMuted}`, children: ["You have ", totalRoles, " role", totalRoles !== 1 ? 's' : '', " across ", data?.summary?.sources?.length || 0, " source", (data?.summary?.sources?.length || 0) !== 1 ? 's' : '', "."] }))] }), (0, jsx_runtime_1.jsx)("a", { href: "/account/profile", className: `text-sm hover:underline ${textMuted}`, children: "Back to Profile" })] }), totalRoles === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: `${cardBg} border ${borderColor} rounded-lg p-8 text-center`, children: [(0, jsx_runtime_1.jsx)("svg", { className: `w-12 h-12 mx-auto mb-4 ${textMuted}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" }) }), (0, jsx_runtime_1.jsx)("h2", { className: `text-lg font-semibold ${textPrimary} mb-2`, children: "No Roles Assigned" }), (0, jsx_runtime_1.jsx)("p", { className: textMuted, children: "You don't have any roles assigned yet. Contact your administrator for access." })] })), idpRoles.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-6", children: [(0, jsx_runtime_1.jsx)(components_1.RoleSourceHeader, { source: "idp", count: idpRoles.length, isDark: isDark }), (0, jsx_runtime_1.jsx)("div", { className: "mt-3 space-y-3", children: idpRoles.map((role) => ((0, jsx_runtime_1.jsx)(components_1.RoleCard, { role: role, source: "idp", isDark: isDark }, role.role_name))) })] })), appRoles.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-6", children: [(0, jsx_runtime_1.jsx)(components_1.RoleSourceHeader, { source: "app", count: appRoles.length, isDark: isDark }), (0, jsx_runtime_1.jsx)("div", { className: "mt-3 space-y-3", children: appRoles.map((role) => ((0, jsx_runtime_1.jsx)(components_1.RoleCard, { role: role, source: "app", isDark: isDark }, role.role_name))) })] })), totalRoles > 0 && ((0, jsx_runtime_1.jsx)("div", { className: `border-t ${borderColor} pt-4 mt-6`, children: (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMuted}`, children: "Need additional access? Contact your administrator." }) })), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 flex justify-between", children: [(0, jsx_runtime_1.jsx)("a", { href: "/account/security", className: `text-sm hover:underline ${textMuted}`, children: "\u2190 Security Settings" }), (0, jsx_runtime_1.jsx)("a", { href: "/account/settings", className: `text-sm hover:underline ${textMuted}`, children: "Settings \u2192" })] })] }) }));
}
