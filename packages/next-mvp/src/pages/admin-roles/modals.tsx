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

import { useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface PagePermission {
  page_permission_id: number;
  route_pattern: string;
  display_name: string;
  requires_2fa: boolean;
}

interface Role {
  role_id?: number;
  role_name: string;
  display_name?: string;
  description?: string;
  page_permissions?: string[];
  requires_2fa?: boolean;
  is_system_role?: boolean;
}

interface User {
  user_id: number;
  email: string;
  full_name?: string;
  roles: {
    idp: string[];
    app: string[];
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

// Role name validation (Security Addendum)
function validateRoleName(name: string): { valid: boolean; error?: string } {
  if (!name) return { valid: false, error: 'Role name is required' };
  if (name.length < 3) return { valid: false, error: 'Role name must be at least 3 characters' };
  if (name.length > 50) return { valid: false, error: 'Role name must be at most 50 characters' };
  if (!/^[a-z0-9_]+$/.test(name)) return { valid: false, error: 'Only lowercase letters, numbers, and underscores allowed' };
  if (name.startsWith('payez_')) return { valid: false, error: 'Role name cannot start with "payez_"' };
  return { valid: true };
}

// ============================================================================
// ROLE EDITOR MODAL
// ============================================================================

/**
 * RoleEditorModal - Create or edit a role
 */
export function RoleEditorModal({
  role,
  pagePermissions,
  adminAccessiblePages,
  onSave,
  onClose,
  isDark = true,
}: {
  role?: Role;
  pagePermissions: PagePermission[];
  adminAccessiblePages?: string[];
  onSave: (data: {
    role_name: string;
    display_name?: string;
    description?: string;
    page_permissions: string[];
    requires_2fa: boolean;
  }) => Promise<void>;
  onClose: () => void;
  isDark?: boolean;
}) {
  const isEditing = !!role?.role_id;

  // Form state
  const [roleName, setRoleName] = useState(role?.role_name || '');
  const [displayName, setDisplayName] = useState(role?.display_name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role?.page_permissions || []);
  const [requires2FA, setRequires2FA] = useState(role?.requires_2fa || false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Role name validation
  const [nameValidation, setNameValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });

  useEffect(() => {
    if (!isEditing && roleName) {
      setNameValidation(validateRoleName(roleName));
    }
  }, [roleName, isEditing]);

  // Filter permissions based on admin access (Security Addendum)
  const availablePermissions = adminAccessiblePages
    ? pagePermissions.filter((p) =>
        adminAccessiblePages.some((ap) => p.route_pattern.startsWith(ap.replace('*', '')))
      )
    : pagePermissions;

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (pattern: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(pattern) ? prev.filter((p) => p !== pattern) : [...prev, pattern]
    );
  };

  // Theme colors
  const modalBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-slate-700' : 'bg-white';
  const inputBorder = isDark ? 'border-slate-600' : 'border-gray-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-full max-w-lg mx-4 rounded-lg shadow-xl ${modalBg} border ${borderColor} max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${borderColor} flex items-center justify-between`}>
          <h3 className={`text-lg font-semibold ${textPrimary}`}>
            {isEditing ? `Edit Role: ${role?.role_name}` : 'Create New Role'}
          </h3>
          <button onClick={onClose} className={textMuted}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {/* Role Name */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${textMuted}`}>
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                disabled={isEditing}
                className={`w-full px-3 py-2 rounded-md border ${inputBorder} ${inputBg} ${textPrimary} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''} font-mono`}
                placeholder="e.g., content_editor"
              />
              {!isEditing && roleName && !nameValidation.valid && (
                <p className="mt-1 text-sm text-red-500">{nameValidation.error}</p>
              )}
              {!isEditing && (
                <p className={`mt-1 text-xs ${textMuted}`}>
                  3-50 characters, lowercase letters, numbers, underscores only
                </p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${textMuted}`}>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border ${inputBorder} ${inputBg} ${textPrimary}`}
                placeholder="e.g., Content Editor"
              />
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${textMuted}`}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={`w-full px-3 py-2 rounded-md border ${inputBorder} ${inputBg} ${textPrimary}`}
                placeholder="What does this role do?"
              />
            </div>

            {/* Page Permissions */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textMuted}`}>Page Permissions</label>
              <div className={`border ${borderColor} rounded-md max-h-48 overflow-y-auto`}>
                {availablePermissions.length === 0 ? (
                  <p className={`p-3 text-sm ${textMuted}`}>No page permissions available</p>
                ) : (
                  availablePermissions.map((perm) => (
                    <label
                      key={perm.page_permission_id}
                      className={`flex items-center px-3 py-2 border-b last:border-b-0 ${borderColor} cursor-pointer hover:${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.route_pattern)}
                        onChange={() => togglePermission(perm.route_pattern)}
                        className="mr-3"
                      />
                      <div>
                        <span className={`font-mono text-sm ${textPrimary}`}>{perm.route_pattern}</span>
                        {perm.display_name && (
                          <span className={`block text-xs ${textMuted}`}>{perm.display_name}</span>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Security Options */}
            <div className={`border-t ${borderColor} pt-4`}>
              <label className={`block text-sm font-medium mb-2 ${textMuted}`}>Security Options</label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={requires2FA}
                  onChange={(e) => setRequires2FA(e.target.checked)}
                  className="mr-3"
                />
                <span className={textPrimary}>Requires 2FA for all pages</span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-900/30 border border-red-600 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`px-6 py-4 border-t ${borderColor} flex justify-end gap-3`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-md border ${borderColor} ${textMuted}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (!isEditing && !nameValidation.valid)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// USER ROLE ASSIGNER MODAL
// ============================================================================

/**
 * UserRoleAssignerModal - Assign roles to a user
 */
export function UserRoleAssignerModal({
  user,
  availableRoles,
  isLastAdmin,
  currentUserId,
  onSave,
  onClose,
  isDark = true,
}: {
  user: User;
  availableRoles: { role_name: string; display_name?: string; description?: string }[];
  isLastAdmin?: boolean;
  currentUserId?: number;
  onSave: (userId: number, appRoles: string[]) => Promise<void>;
  onClose: () => void;
  isDark?: boolean;
}) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles.app);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update roles');
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    );
  };

  // Theme colors
  const modalBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-full max-w-md mx-4 rounded-lg shadow-xl ${modalBg} border ${borderColor}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${borderColor} flex items-center justify-between`}>
          <div>
            <h3 className={`text-lg font-semibold ${textPrimary}`}>Edit Roles</h3>
            <p className={`text-sm ${textMuted}`}>{user.full_name || user.email}</p>
          </div>
          <button onClick={onClose} className={textMuted}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {/* IDP Roles (read-only) */}
            {user.roles.idp.length > 0 && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${textMuted}`}>
                  IDP Roles (read-only)
                  <svg className="inline w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </label>
                <div className="space-y-1">
                  {user.roles.idp.map((role) => (
                    <div key={role} className={`flex items-center px-3 py-2 rounded ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                      <span className={textMuted}>{role}</span>
                      <span className={`ml-auto text-xs ${textMuted}`}>assigned by IDP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Application Roles */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textMuted}`}>Application Roles</label>
              <div className={`border ${borderColor} rounded-md`}>
                {availableRoles.map((role) => (
                  <label
                    key={role.role_name}
                    className={`flex items-start px-3 py-2 border-b last:border-b-0 ${borderColor} cursor-pointer hover:${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.role_name)}
                      onChange={() => toggleRole(role.role_name)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <span className={textPrimary}>{role.display_name || role.role_name}</span>
                      {role.description && (
                        <span className={`block text-xs ${textMuted}`}>{role.description}</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-900/30 border border-red-600 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`px-6 py-4 border-t ${borderColor} flex justify-end gap-3`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-md border ${borderColor} ${textMuted}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
