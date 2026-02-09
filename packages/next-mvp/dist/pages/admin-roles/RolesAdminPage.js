"use strict";
/**
 * Roles Admin Page for @payez/next-mvp
 *
 * Read-only admin interface for viewing roles and permissions (/admin/roles).
 * MVP scope: View IDP roles and their page permissions only.
 * Role creation/editing deferred to post-MVP.
 *
 * @see docs/specs/ROLES_MANAGEMENT_SPEC.md
 */
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RolesAdminPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const useTheme_1 = require("../../theme/useTheme");
const components_1 = require("../roles/components");
function RolesAdminPage({ rolesEndpoint = '/api/v1/admin/roles', matrixEndpoint = '/api/v1/admin/permissions-matrix', }) {
    const layout = (0, useTheme_1.useLayout)();
    const colors = (0, useTheme_1.useColors)();
    const isDark = colors?.background?.includes('slate-9') ||
        colors?.background?.includes('gray-9') ||
        colors?.card?.includes('slate-8');
    // State
    const [viewMode, setViewMode] = (0, react_1.useState)('list');
    const [roles, setRoles] = (0, react_1.useState)([]);
    const [matrixData, setMatrixData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [expandedRole, setExpandedRole] = (0, react_1.useState)(null);
    // Theme colors
    const bgColor = isDark ? 'bg-slate-900' : 'bg-gray-50';
    const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
    const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
    const hoverBg = isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50';
    // Fetch data
    const fetchRoles = (0, react_1.useCallback)(async () => {
        try {
            const res = await fetch(rolesEndpoint, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setRoles(data.roles || data.idp_roles || []);
            }
        }
        catch (err) {
            console.error('Failed to fetch roles:', err);
        }
    }, [rolesEndpoint]);
    const fetchMatrix = (0, react_1.useCallback)(async () => {
        try {
            const res = await fetch(matrixEndpoint, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setMatrixData(data);
            }
        }
        catch (err) {
            console.error('Failed to fetch matrix:', err);
        }
    }, [matrixEndpoint]);
    (0, react_1.useEffect)(() => {
        setLoading(true);
        Promise.all([fetchRoles(), fetchMatrix()])
            .finally(() => setLoading(false));
    }, [fetchRoles, fetchMatrix]);
    const toggleRoleExpanded = (roleName) => {
        setExpandedRole(expandedRole === roleName ? null : roleName);
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen ${bgColor} flex items-center justify-center`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center space-y-4", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin h-8 w-8 text-blue-500", viewBox: "0 0 24 24", fill: "none", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" })] }), (0, jsx_runtime_1.jsx)("p", { className: textMuted, children: "Loading roles..." })] }) }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen ${bgColor}`, children: (0, jsx_runtime_1.jsxs)("div", { className: `max-w-6xl mx-auto ${layout?.padding || 'p-6'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: `text-3xl font-bold ${textPrimary}`, children: "Role Permissions" }), (0, jsx_runtime_1.jsx)("p", { className: `mt-1 ${textMuted}`, children: "View IDP roles and their page access permissions" })] }), (0, jsx_runtime_1.jsx)("a", { href: "/admin", className: `text-sm hover:underline ${textMuted}`, children: "Back to Admin" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `flex border-b ${borderColor} mb-6`, children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setViewMode('list'), className: `px-4 py-3 font-medium text-sm border-b-2 transition-colors ${viewMode === 'list'
                                ? 'border-blue-500 text-blue-500'
                                : `border-transparent ${textMuted} hover:text-blue-400`}`, children: "Role List" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setViewMode('matrix'), className: `px-4 py-3 font-medium text-sm border-b-2 transition-colors ${viewMode === 'matrix'
                                ? 'border-blue-500 text-blue-500'
                                : `border-transparent ${textMuted} hover:text-blue-400`}`, children: "Permissions Matrix" })] }), viewMode === 'list' && ((0, jsx_runtime_1.jsxs)("div", { className: `${cardBg} border ${borderColor} rounded-lg overflow-hidden`, children: [(0, jsx_runtime_1.jsx)("div", { className: `px-4 py-3 border-b ${borderColor}`, children: (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMuted}`, children: "Click a role to see what pages it grants access to" }) }), (0, jsx_runtime_1.jsx)("div", { className: `divide-y ${borderColor}`, children: roles.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: `p-8 text-center ${textMuted}`, children: "No roles found" })) : (roles.map((role) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => toggleRoleExpanded(role.role_name), className: `w-full px-4 py-4 flex items-center justify-between ${hoverBg} transition-colors`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("svg", { className: `w-5 h-5 ${textMuted} transition-transform ${expandedRole === role.role_name ? 'rotate-90' : ''}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "text-left", children: [(0, jsx_runtime_1.jsx)("div", { className: `font-medium ${textPrimary}`, children: role.display_name || role.role_name }), (0, jsx_runtime_1.jsx)("div", { className: `text-sm ${textMuted}`, children: role.role_name })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(components_1.RoleBadge, { roleName: "IDP", source: "idp", size: "sm", isDark: isDark }), (0, jsx_runtime_1.jsxs)("span", { className: `text-sm ${textMuted}`, children: [role.permission_count ?? role.permissions?.length ?? 0, " pages"] })] })] }), expandedRole === role.role_name && ((0, jsx_runtime_1.jsx)("div", { className: `px-4 pb-4 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`, children: (0, jsx_runtime_1.jsx)("div", { className: "pl-8", children: role.permissions && role.permissions.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2 pt-2", children: role.permissions.map((perm) => ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center justify-between py-2 px-3 rounded ${isDark ? 'bg-slate-700/50' : 'bg-white'} border ${borderColor}`, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: `font-mono text-sm ${textPrimary}`, children: perm.route_pattern }), perm.display_name && ((0, jsx_runtime_1.jsxs)("span", { className: `ml-2 text-sm ${textMuted}`, children: ["- ", perm.display_name] }))] }), perm.requires_2fa && ((0, jsx_runtime_1.jsx)("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800", children: "2FA Required" }))] }, perm.page_permission_id))) })) : ((0, jsx_runtime_1.jsx)("p", { className: `py-4 text-sm ${textMuted}`, children: "No page permissions assigned to this role" })) }) }))] }, role.role_name)))) }), (0, jsx_runtime_1.jsxs)("div", { className: `px-4 py-3 border-t ${borderColor} ${textMuted} text-sm`, children: [roles.length, " roles total"] })] })), viewMode === 'matrix' && matrixData && ((0, jsx_runtime_1.jsxs)("div", { className: `${cardBg} border ${borderColor} rounded-lg overflow-hidden`, children: [(0, jsx_runtime_1.jsx)("div", { className: `px-4 py-3 border-b ${borderColor}`, children: (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMuted}`, children: "Read-only view of which roles have access to which pages" }) }), (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full", children: [(0, jsx_runtime_1.jsx)("thead", { className: isDark ? 'bg-slate-700/50' : 'bg-gray-50', children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-left text-sm font-medium ${textMuted} sticky left-0 ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`, children: "Page" }), matrixData.roles.map((role) => ((0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-center text-sm font-medium ${textMuted} whitespace-nowrap`, children: role }, role))), (0, jsx_runtime_1.jsx)("th", { className: `px-4 py-3 text-center text-sm font-medium ${textMuted}`, children: "2FA" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: `divide-y ${borderColor}`, children: matrixData.pages.map((page) => ((0, jsx_runtime_1.jsxs)("tr", { className: hoverBg, children: [(0, jsx_runtime_1.jsx)("td", { className: `px-4 py-3 ${textPrimary} sticky left-0 ${cardBg}`, children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "font-mono text-sm", children: page.route_pattern }), page.display_name && ((0, jsx_runtime_1.jsx)("span", { className: `block text-xs ${textMuted}`, children: page.display_name }))] }) }), matrixData.roles.map((role) => ((0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 text-center", children: page.role_access[role] ? ((0, jsx_runtime_1.jsx)("svg", { className: "w-5 h-5 mx-auto text-green-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) })) : ((0, jsx_runtime_1.jsx)("svg", { className: `w-5 h-5 mx-auto ${textMuted}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })) }, role))), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 text-center", children: page.requires_2fa && ((0, jsx_runtime_1.jsx)("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800", children: "2FA" })) })] }, page.page_permission_id))) })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: `px-4 py-3 border-t ${borderColor} ${textMuted} text-sm flex items-center gap-4`, children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("svg", { className: "w-4 h-4 text-green-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }), "Access granted"] }), (0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("svg", { className: `w-4 h-4 ${textMuted}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }), "No access"] })] })] })), viewMode === 'matrix' && !matrixData && ((0, jsx_runtime_1.jsx)("div", { className: `${cardBg} border ${borderColor} rounded-lg p-8 text-center ${textMuted}`, children: "Unable to load permissions matrix" })), (0, jsx_runtime_1.jsx)("div", { className: `mt-6 p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-3", children: [(0, jsx_runtime_1.jsx)("svg", { className: `w-5 h-5 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'}`, children: "Roles are managed by your Identity Provider" }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`, children: "Role assignments are controlled through your organization's IDP. Contact your system administrator to request role changes." })] })] }) })] }) }));
}
