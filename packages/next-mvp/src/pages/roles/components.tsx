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

import React, { useState } from 'react';

// Types
export interface Permission {
  type: 'page' | 'feature';
  pattern?: string;
  name?: string;
  display: string;
}

export interface Role {
  role_name: string;
  display_name?: string;
  description?: string;
  assigned_at?: string;
  status?: 'active' | 'pending' | 'expired';
  permissions?: Permission[];
  user_count?: number;
  permission_count?: number;
  is_system_role?: boolean;
}

// Role source type
export type RoleSource = 'idp' | 'app';

// Format date helper
function formatDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// Role icon based on name
function getRoleIcon(roleName: string): string {
  if (roleName.includes('admin')) return 'shield';
  if (roleName.includes('editor')) return 'edit';
  if (roleName.includes('viewer')) return 'eye';
  return 'user';
}

/**
 * RoleBadge - Small badge showing role name and source
 */
export function RoleBadge({
  roleName,
  source,
  size = 'md',
  isDark = true,
}: {
  roleName: string;
  source: RoleSource;
  size?: 'sm' | 'md';
  isDark?: boolean;
}) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  const sourceColor = source === 'idp'
    ? isDark ? 'bg-purple-900/30 text-purple-400 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-300'
    : isDark ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${sizeClasses} ${sourceColor}`}>
      {source === 'idp' && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )}
      {roleName}
    </span>
  );
}

/**
 * PermissionsList - Grouped list of permissions
 */
export function PermissionsList({
  permissions,
  grouped = true,
  isDark = true,
}: {
  permissions: Permission[];
  grouped?: boolean;
  isDark?: boolean;
}) {
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
  const borderColor = isDark ? 'border-slate-600' : 'border-gray-300';

  if (!permissions || permissions.length === 0) {
    return <p className={`text-sm ${textMuted}`}>No specific permissions defined</p>;
  }

  if (!grouped) {
    return (
      <ul className="space-y-1">
        {permissions.map((perm, idx) => (
          <li key={idx} className={`text-sm ${textMuted} flex items-center gap-2`}>
            <span className="text-green-400">+</span>
            {perm.display}
          </li>
        ))}
      </ul>
    );
  }

  // Group by type
  const pagePerms = permissions.filter((p) => p.type === 'page');
  const featurePerms = permissions.filter((p) => p.type === 'feature');

  return (
    <div className="space-y-3">
      {pagePerms.length > 0 && (
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${textMuted}`}>Page Access</p>
          <ul className={`pl-4 border-l-2 ${borderColor} space-y-1`}>
            {pagePerms.map((perm, idx) => (
              <li key={idx} className={`text-sm ${textPrimary}`}>{perm.display}</li>
            ))}
          </ul>
        </div>
      )}
      {featurePerms.length > 0 && (
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${textMuted}`}>Features</p>
          <ul className={`pl-4 border-l-2 ${borderColor} space-y-1`}>
            {featurePerms.map((perm, idx) => (
              <li key={idx} className={`text-sm ${textPrimary}`}>{perm.display}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * RoleCard - Expandable card showing role details and permissions
 */
export function RoleCard({
  role,
  source,
  showPermissions = true,
  defaultExpanded = false,
  isDark = true,
}: {
  role: Role;
  source: RoleSource;
  showPermissions?: boolean;
  defaultExpanded?: boolean;
  isDark?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

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

  const iconMap: Record<string, React.ReactNode> = {
    shield: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    edit: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    eye: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    user: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  };

  const icon = iconMap[getRoleIcon(role.role_name)] || iconMap.user;

  return (
    <div className={`rounded-lg border ${borderColor} ${cardBg} overflow-hidden`}>
      {/* Header */}
      <div className={`p-4 ${showPermissions ? `cursor-pointer ${hoverBg}` : ''}`} onClick={() => showPermissions && setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'} ${textMuted}`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${textPrimary}`}>{role.display_name || role.role_name}</h3>
                {source === 'idp' && (
                  <svg className={`w-4 h-4 ${textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </div>
              <p className={`text-sm ${textMuted}`}>{role.description || 'No description'}</p>
              {role.assigned_at && (
                <p className={`text-xs ${textMuted} mt-1`}>Assigned: {formatDate(role.assigned_at)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role.status && (
              <span className={`flex items-center gap-1 text-sm ${statusColors[role.status]}`}>
                <span className="w-2 h-2 rounded-full bg-current" />
                {role.status.charAt(0).toUpperCase() + role.status.slice(1)}
              </span>
            )}
            {showPermissions && (
              <svg
                className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''} ${textMuted}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Permissions (expandable) */}
      {showPermissions && expanded && role.permissions && (
        <div className={`px-4 pb-4 pt-2 border-t ${borderColor}`}>
          <PermissionsList permissions={role.permissions} isDark={isDark} />
        </div>
      )}
    </div>
  );
}

/**
 * RoleSourceHeader - Section header for role groups
 */
export function RoleSourceHeader({
  source,
  count,
  isDark = true,
}: {
  source: RoleSource;
  count?: number;
  isDark?: boolean;
}) {
  const bgColor = isDark ? 'bg-slate-700' : 'bg-gray-100';
  const textColor = isDark ? 'text-slate-300' : 'text-gray-700';

  const labels = {
    idp: 'Identity Roles (from PayEz IDP)',
    app: 'Application Roles',
  };

  return (
    <div className={`${bgColor} px-4 py-2 rounded-lg flex items-center justify-between`}>
      <span className={`text-sm font-medium ${textColor}`}>{labels[source]}</span>
      {count !== undefined && (
        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{count} role{count !== 1 ? 's' : ''}</span>
      )}
    </div>
  );
}
