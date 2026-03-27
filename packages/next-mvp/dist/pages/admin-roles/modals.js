"use strict";
/**
 * Admin Role Modals for @payez/next-mvp
 *
 * - RoleEditorModal: Create/edit roles with permissions
 * - UserRoleAssignerModal: Assign roles to users
 *
 * Security Addendum implemented:
 * - Role name validation (3-50 chars, lowercase alphanumeric + underscore, no payez_ prefix)
 * - Last admin warning
 * - IDP roles read-only
 * - Self-assignment warning
 *
 * @see docs/specs/ROLES_MANAGEMENT_SPEC.md
 */
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleEditorModal = RoleEditorModal;
exports.UserRoleAssignerModal = UserRoleAssignerModal;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
// ============================================================================
// VALIDATION
// ============================================================================
// Role name validation (Security Addendum)
function validateRoleName(name) {
    if (!name)
        return { valid: false, error: 'Role name is required' };
    if (name.length < 3)
        return { valid: false, error: 'Role name must be at least 3 characters' };
    if (name.length > 50)
        return { valid: false, error: 'Role name must be at most 50 characters' };
    if (!/^[a-z0-9_]+$/.test(name))
        return { valid: false, error: 'Only lowercase letters, numbers, and underscores allowed' };
    if (name.startsWith('payez_'))
        return { valid: false, error: 'Role name cannot start with "payez_"' };
    return { valid: true };
}
// ============================================================================
// ROLE EDITOR MODAL
// ============================================================================
/**
 * RoleEditorModal - Create or edit a role
 */
function RoleEditorModal({ role, pagePermissions, adminAccessiblePages, onSave, onClose, isDark = true, }) {
    const isEditing = !!role?.role_id;
    // Form state
    const [roleName, setRoleName] = (0, react_1.useState)(role?.role_name || '');
    const [displayName, setDisplayName] = (0, react_1.useState)(role?.display_name || '');
    const [description, setDescription] = (0, react_1.useState)(role?.description || '');
    const [selectedPermissions, setSelectedPermissions] = (0, react_1.useState)(role?.page_permissions || []);
    const [requires2FA, setRequires2FA] = (0, react_1.useState)(role?.requires_2fa || false);
    const [error, setError] = (0, react_1.useState)('');
    const [saving, setSaving] = (0, react_1.useState)(false);
    // Role name validation
    const [nameValidation, setNameValidation] = (0, react_1.useState)({ valid: true });
    (0, react_1.useEffect)(() => {
        if (!isEditing && roleName) {
            setNameValidation(validateRoleName(roleName));
        }
    }, [roleName, isEditing]);
    // Filter permissions based on admin access (Security Addendum)
    const availablePermissions = adminAccessiblePages
        ? pagePermissions.filter((p) => adminAccessiblePages.some((ap) => p.route_pattern.startsWith(ap.replace('*', ''))))
        : pagePermissions;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!isEditing) {
            const validation = validateRoleName(roleName);
            if (!validation.valid) {
                setError(validation.error || 'Invalid role name');
                return;
            }
        }
        try {
            setSaving(true);
            await onSave({
                role_name: roleName,
                display_name: displayName || undefined,
                description: description || undefined,
                page_permissions: selectedPermissions,
                requires_2fa: requires2FA,
            });
            onClose();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save role');
        }
        finally {
            setSaving(false);
        }
    };
    const togglePermission = (pattern) => {
        setSelectedPermissions((prev) => prev.includes(pattern) ? prev.filter((p) => p !== pattern) : [...prev, pattern]);
    };
    // Theme colors
    const modalBg = isDark ? 'bg-slate-800' : 'bg-white';
    const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
    const inputBg = isDark ? 'bg-slate-700' : 'bg-white';
    const inputBorder = isDark ? 'border-slate-600' : 'border-gray-300';
    return ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: (0, jsx_runtime_1.jsxs)("div", { className: `w-full max-w-lg mx-4 rounded-lg shadow-xl ${modalBg} border ${borderColor} max-h-[90vh] overflow-hidden flex flex-col`, children: [(0, jsx_runtime_1.jsxs)("div", { className: `px-6 py-4 border-b ${borderColor} flex items-center justify-between`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `text-lg font-semibold ${textPrimary}`, children: isEditing ? `Edit Role: ${role?.role_name}` : 'Create New Role' }), (0, jsx_runtime_1.jsx)("button", { onClick: onClose, className: textMuted, children: (0, jsx_runtime_1.jsx)("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "flex-1 overflow-y-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "px-6 py-4 space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: `block text-sm font-medium mb-1 ${textMuted}`, children: ["Role Name ", (0, jsx_runtime_1.jsx)("span", { className: "text-red-500", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: roleName, onChange: (e) => setRoleName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')), disabled: isEditing, className: `w-full px-3 py-2 rounded-md border ${inputBorder} ${inputBg} ${textPrimary} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''} font-mono`, placeholder: "e.g., content_editor" }), !isEditing && roleName && !nameValidation.valid && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-red-500", children: nameValidation.error })), !isEditing && ((0, jsx_runtime_1.jsx)("p", { className: `mt-1 text-xs ${textMuted}`, children: "3-50 characters, lowercase letters, numbers, underscores only" }))] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium mb-1 ${textMuted}`, children: "Display Name" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: displayName, onChange: (e) => setDisplayName(e.target.value), className: `w-full px-3 py-2 rounded-md border ${inputBorder} ${inputBg} ${textPrimary}`, placeholder: "e.g., Content Editor" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium mb-1 ${textMuted}`, children: "Description" }), (0, jsx_runtime_1.jsx)("textarea", { value: description, onChange: (e) => setDescription(e.target.value), rows: 2, className: `w-full px-3 py-2 rounded-md border ${inputBorder} ${inputBg} ${textPrimary}`, placeholder: "What does this role do?" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium mb-2 ${textMuted}`, children: "Page Permissions" }), (0, jsx_runtime_1.jsx)("div", { className: `border ${borderColor} rounded-md max-h-48 overflow-y-auto`, children: availablePermissions.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { className: `p-3 text-sm ${textMuted}`, children: "No page permissions available" })) : (availablePermissions.map((perm) => ((0, jsx_runtime_1.jsxs)("label", { className: `flex items-center px-3 py-2 border-b last:border-b-0 ${borderColor} cursor-pointer hover:${isDark ? 'bg-slate-700' : 'bg-gray-50'}`, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: selectedPermissions.includes(perm.route_pattern), onChange: () => togglePermission(perm.route_pattern), className: "mr-3" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: `font-mono text-sm ${textPrimary}`, children: perm.route_pattern }), perm.display_name && ((0, jsx_runtime_1.jsx)("span", { className: `block text-xs ${textMuted}`, children: perm.display_name }))] })] }, perm.page_permission_id)))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: `border-t ${borderColor} pt-4`, children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium mb-2 ${textMuted}`, children: "Security Options" }), (0, jsx_runtime_1.jsxs)("label", { className: "flex items-center cursor-pointer", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: requires2FA, onChange: (e) => setRequires2FA(e.target.checked), className: "mr-3" }), (0, jsx_runtime_1.jsx)("span", { className: textPrimary, children: "Requires 2FA for all pages" })] })] }), error && ((0, jsx_runtime_1.jsx)("div", { className: "bg-red-900/30 border border-red-600 rounded-lg p-3", children: (0, jsx_runtime_1.jsx)("p", { className: "text-red-400 text-sm", children: error }) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: `px-6 py-4 border-t ${borderColor} flex justify-end gap-3`, children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: onClose, className: `px-4 py-2 rounded-md border ${borderColor} ${textMuted}`, children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: saving || (!isEditing && !nameValidation.valid), className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50", children: saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Role' })] })] })] }) }));
}
// ============================================================================
// USER ROLE ASSIGNER MODAL
// ============================================================================
/**
 * UserRoleAssignerModal - Assign roles to a user
 */
function UserRoleAssignerModal({ user, availableRoles, isLastAdmin, currentUserId, onSave, onClose, isDark = true, }) {
    const [selectedRoles, setSelectedRoles] = (0, react_1.useState)(user.roles.app);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // Security: Self-assignment warning
        if (user.user_id === currentUserId) {
            if (!confirm('You are modifying your own roles. Changes take effect on next login. Continue?')) {
                return;
            }
        }
        // Security Addendum: Last admin warning
        const hadAdmin = user.roles.app.some((r) => r.includes('admin'));
        const hasAdmin = selectedRoles.some((r) => r.includes('admin'));
        if (hadAdmin && !hasAdmin && isLastAdmin) {
            if (!confirm('Warning: This is the last administrator. Removing admin access will lock out admin access. Continue?')) {
                return;
            }
        }
        try {
            setSaving(true);
            await onSave(user.user_id, selectedRoles);
            onClose();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update roles');
        }
        finally {
            setSaving(false);
        }
    };
    const toggleRole = (roleName) => {
        setSelectedRoles((prev) => prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]);
    };
    // Theme colors
    const modalBg = isDark ? 'bg-slate-800' : 'bg-white';
    const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
    return ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: (0, jsx_runtime_1.jsxs)("div", { className: `w-full max-w-md mx-4 rounded-lg shadow-xl ${modalBg} border ${borderColor}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: `px-6 py-4 border-b ${borderColor} flex items-center justify-between`, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: `text-lg font-semibold ${textPrimary}`, children: "Edit Roles" }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMuted}`, children: user.full_name || user.email })] }), (0, jsx_runtime_1.jsx)("button", { onClick: onClose, className: textMuted, children: (0, jsx_runtime_1.jsx)("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, children: [(0, jsx_runtime_1.jsxs)("div", { className: "px-6 py-4 space-y-4", children: [user.roles.idp.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: `block text-sm font-medium mb-2 ${textMuted}`, children: ["IDP Roles (read-only)", (0, jsx_runtime_1.jsx)("svg", { className: "inline w-4 h-4 ml-1", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-1", children: user.roles.idp.map((role) => ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center px-3 py-2 rounded ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`, children: [(0, jsx_runtime_1.jsx)("span", { className: textMuted, children: role }), (0, jsx_runtime_1.jsx)("span", { className: `ml-auto text-xs ${textMuted}`, children: "assigned by IDP" })] }, role))) })] })), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium mb-2 ${textMuted}`, children: "Application Roles" }), (0, jsx_runtime_1.jsx)("div", { className: `border ${borderColor} rounded-md`, children: availableRoles.map((role) => ((0, jsx_runtime_1.jsxs)("label", { className: `flex items-start px-3 py-2 border-b last:border-b-0 ${borderColor} cursor-pointer hover:${isDark ? 'bg-slate-700' : 'bg-gray-50'}`, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: selectedRoles.includes(role.role_name), onChange: () => toggleRole(role.role_name), className: "mt-1 mr-3" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: textPrimary, children: role.display_name || role.role_name }), role.description && ((0, jsx_runtime_1.jsx)("span", { className: `block text-xs ${textMuted}`, children: role.description }))] })] }, role.role_name))) })] }), error && ((0, jsx_runtime_1.jsx)("div", { className: "bg-red-900/30 border border-red-600 rounded-lg p-3", children: (0, jsx_runtime_1.jsx)("p", { className: "text-red-400 text-sm", children: error }) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: `px-6 py-4 border-t ${borderColor} flex justify-end gap-3`, children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: onClose, className: `px-4 py-2 rounded-md border ${borderColor} ${textMuted}`, children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: saving, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50", children: saving ? 'Saving...' : 'Save Changes' })] })] })] }) }));
}
