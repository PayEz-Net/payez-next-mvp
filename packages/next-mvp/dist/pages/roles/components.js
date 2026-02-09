"use strict";
/**
 * Shared Role Components for @payez/next-mvp
 *
 * Components for displaying roles and permissions:
 * - RoleBadge: Small badge showing role name and source
 * - RoleCard: Expandable card showing role details and permissions
 * - PermissionsList: Grouped list of permissions
 *
 * @see docs/specs/ROLES_MANAGEMENT_SPEC.md
 */
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleBadge = RoleBadge;
exports.PermissionsList = PermissionsList;
exports.RoleCard = RoleCard;
exports.RoleSourceHeader = RoleSourceHeader;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
// Format date helper
function formatDate(dateString) {
    if (!dateString)
        return '';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
    catch {
        return dateString;
    }
}
// Role icon based on name
function getRoleIcon(roleName) {
    if (roleName.includes('admin'))
        return 'shield';
    if (roleName.includes('editor'))
        return 'edit';
    if (roleName.includes('viewer'))
        return 'eye';
    return 'user';
}
/**
 * RoleBadge - Small badge showing role name and source
 */
function RoleBadge({ roleName, source, size = 'md', isDark = true, }) {
    const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
    const sourceColor = source === 'idp'
        ? isDark ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-300'
        : isDark ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300';
    return ((0, jsx_runtime_1.jsxs)("span", { className: `inline-flex items-center gap-1 rounded-full border ${sizeClasses} ${sourceColor}`, children: [source === 'idp' && ((0, jsx_runtime_1.jsx)("svg", { className: "w-3 h-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }) })), roleName] }));
}
/**
 * PermissionsList - Grouped list of permissions
 */
function PermissionsList({ permissions, grouped = true, isDark = true, }) {
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
    const borderColor = isDark ? 'border-slate-600' : 'border-gray-300';
    if (!permissions || permissions.length === 0) {
        return (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMuted}`, children: "No specific permissions defined" });
    }
    if (!grouped) {
        return ((0, jsx_runtime_1.jsx)("ul", { className: "space-y-1", children: permissions.map((perm, idx) => ((0, jsx_runtime_1.jsxs)("li", { className: `text-sm ${textMuted} flex items-center gap-2`, children: [(0, jsx_runtime_1.jsx)("span", { className: "text-green-400", children: "+" }), perm.display] }, idx))) }));
    }
    // Group by type
    const pagePerms = permissions.filter((p) => p.type === 'page');
    const featurePerms = permissions.filter((p) => p.type === 'feature');
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [pagePerms.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `text-xs font-medium uppercase tracking-wider mb-1 ${textMuted}`, children: "Page Access" }), (0, jsx_runtime_1.jsx)("ul", { className: `pl-4 border-l-2 ${borderColor} space-y-1`, children: pagePerms.map((perm, idx) => ((0, jsx_runtime_1.jsx)("li", { className: `text-sm ${textPrimary}`, children: perm.display }, idx))) })] })), featurePerms.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `text-xs font-medium uppercase tracking-wider mb-1 ${textMuted}`, children: "Features" }), (0, jsx_runtime_1.jsx)("ul", { className: `pl-4 border-l-2 ${borderColor} space-y-1`, children: featurePerms.map((perm, idx) => ((0, jsx_runtime_1.jsx)("li", { className: `text-sm ${textPrimary}`, children: perm.display }, idx))) })] }))] }));
}
/**
 * RoleCard - Expandable card showing role details and permissions
 */
function RoleCard({ role, source, showPermissions = true, defaultExpanded = false, isDark = true, }) {
    const [expanded, setExpanded] = (0, react_1.useState)(defaultExpanded);
    const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
    const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
    const hoverBg = isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50';
    const statusColors = {
        active: isDark ? 'text-green-400' : 'text-green-600',
        pending: isDark ? 'text-yellow-400' : 'text-yellow-600',
        expired: isDark ? 'text-red-400' : 'text-red-600',
    };
    const iconMap = {
        shield: ((0, jsx_runtime_1.jsx)("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" }) })),
        edit: ((0, jsx_runtime_1.jsx)("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" }) })),
        eye: ((0, jsx_runtime_1.jsxs)("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [(0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })] })),
        user: ((0, jsx_runtime_1.jsx)("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) })),
    };
    const icon = iconMap[getRoleIcon(role.role_name)] || iconMap.user;
    return ((0, jsx_runtime_1.jsxs)("div", { className: `rounded-lg border ${borderColor} ${cardBg} overflow-hidden`, children: [(0, jsx_runtime_1.jsx)("div", { className: `p-4 ${showPermissions ? `cursor-pointer ${hoverBg}` : ''}`, onClick: () => showPermissions && setExpanded(!expanded), children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'} ${textMuted}`, children: icon }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("h3", { className: `font-semibold ${textPrimary}`, children: role.display_name || role.role_name }), source === 'idp' && ((0, jsx_runtime_1.jsx)("svg", { className: `w-4 h-4 ${textMuted}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }) }))] }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMuted}`, children: role.description || 'No description' }), role.assigned_at && ((0, jsx_runtime_1.jsxs)("p", { className: `text-xs ${textMuted} mt-1`, children: ["Assigned: ", formatDate(role.assigned_at)] }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [role.status && ((0, jsx_runtime_1.jsxs)("span", { className: `flex items-center gap-1 text-sm ${statusColors[role.status]}`, children: [(0, jsx_runtime_1.jsx)("span", { className: "w-2 h-2 rounded-full bg-current" }), role.status.charAt(0).toUpperCase() + role.status.slice(1)] })), showPermissions && ((0, jsx_runtime_1.jsx)("svg", { className: `w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''} ${textMuted}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) }))] })] }) }), showPermissions && expanded && role.permissions && ((0, jsx_runtime_1.jsx)("div", { className: `px-4 pb-4 pt-2 border-t ${borderColor}`, children: (0, jsx_runtime_1.jsx)(PermissionsList, { permissions: role.permissions, isDark: isDark }) }))] }));
}
/**
 * RoleSourceHeader - Section header for role groups
 */
function RoleSourceHeader({ source, count, isDark = true, }) {
    const bgColor = isDark ? 'bg-slate-700' : 'bg-gray-100';
    const textColor = isDark ? 'text-slate-300' : 'text-gray-700';
    const labels = {
        idp: 'Identity Roles (from PayEz IDP)',
        app: 'Application Roles',
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: `${bgColor} px-4 py-2 rounded-lg flex items-center justify-between`, children: [(0, jsx_runtime_1.jsx)("span", { className: `text-sm font-medium ${textColor}`, children: labels[source] }), count !== undefined && ((0, jsx_runtime_1.jsxs)("span", { className: `text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`, children: [count, " role", count !== 1 ? 's' : ''] }))] }));
}
