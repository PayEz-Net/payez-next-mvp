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

import React, { useState, useEffect, useCallback } from 'react';
import { useLayout, useColors } from '../../theme/useTheme';
import { RoleBadge } from '../roles/components';

// Types
interface PagePermission {
  page_permission_id: number;
  route_pattern: string;
  display_name: string;
  requires_2fa: boolean;
}

interface Role {
  role_name: string;
  display_name?: string;
  description?: string;
  permission_count?: number;
  permissions?: PagePermission[];
}

interface MatrixData {
  roles: string[];
  pages: {
    page_permission_id: number;
    route_pattern: string;
    display_name: string;
    requires_2fa: boolean;
    role_access: Record<string, boolean>;
  }[];
}

type ViewMode = 'list' | 'matrix';

interface RolesAdminPageProps {
  rolesEndpoint?: string;
  matrixEndpoint?: string;
}

export default function RolesAdminPage({
  rolesEndpoint = '/api/v1/admin/roles',
  matrixEndpoint = '/api/v1/admin/permissions-matrix',
}: RolesAdminPageProps) {
  const layout = useLayout();
  const colors = useColors();

  const isDark = colors?.background?.includes('slate-9') ||
                 colors?.background?.includes('gray-9') ||
                 colors?.card?.includes('slate-8');

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [roles, setRoles] = useState<Role[]>([]);
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  // Theme colors
  const bgColor = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
  const hoverBg = isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50';

  // Fetch data
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(rolesEndpoint, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || data.idp_roles || []);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  }, [rolesEndpoint]);

  const fetchMatrix = useCallback(async () => {
    try {
      const res = await fetch(matrixEndpoint, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMatrixData(data);
      }
    } catch (err) {
      console.error('Failed to fetch matrix:', err);
    }
  }, [matrixEndpoint]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchRoles(), fetchMatrix()])
      .finally(() => setLoading(false));
  }, [fetchRoles, fetchMatrix]);

  const toggleRoleExpanded = (roleName: string) => {
    setExpandedRole(expandedRole === roleName ? null : roleName);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${bgColor} flex items-center justify-center`}>
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className={textMuted}>Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <div className={`max-w-6xl mx-auto ${layout?.padding || 'p-6'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${textPrimary}`}>Role Permissions</h1>
            <p className={`mt-1 ${textMuted}`}>View IDP roles and their page access permissions</p>
          </div>
          <a href="/admin" className={`text-sm hover:underline ${textMuted}`}>
            Back to Admin
          </a>
        </div>

        {/* View Toggle */}
        <div className={`flex border-b ${borderColor} mb-6`}>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              viewMode === 'list'
                ? 'border-blue-500 text-blue-500'
                : `border-transparent ${textMuted} hover:text-blue-400`
            }`}
          >
            Role List
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              viewMode === 'matrix'
                ? 'border-blue-500 text-blue-500'
                : `border-transparent ${textMuted} hover:text-blue-400`
            }`}
          >
            Permissions Matrix
          </button>
        </div>

        {/* Role List View */}
        {viewMode === 'list' && (
          <div className={`${cardBg} border ${borderColor} rounded-lg overflow-hidden`}>
            <div className={`px-4 py-3 border-b ${borderColor}`}>
              <p className={`text-sm ${textMuted}`}>
                Click a role to see what pages it grants access to
              </p>
            </div>
            <div className={`divide-y ${borderColor}`}>
              {roles.length === 0 ? (
                <div className={`p-8 text-center ${textMuted}`}>
                  No roles found
                </div>
              ) : (
                roles.map((role) => (
                  <div key={role.role_name}>
                    <button
                      onClick={() => toggleRoleExpanded(role.role_name)}
                      className={`w-full px-4 py-4 flex items-center justify-between ${hoverBg} transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className={`w-5 h-5 ${textMuted} transition-transform ${expandedRole === role.role_name ? 'rotate-90' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="text-left">
                          <div className={`font-medium ${textPrimary}`}>
                            {role.display_name || role.role_name}
                          </div>
                          <div className={`text-sm ${textMuted}`}>
                            {role.role_name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <RoleBadge roleName="IDP" source="idp" size="sm" isDark={isDark} />
                        <span className={`text-sm ${textMuted}`}>
                          {role.permission_count ?? role.permissions?.length ?? 0} pages
                        </span>
                      </div>
                    </button>

                    {expandedRole === role.role_name && (
                      <div className={`px-4 pb-4 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                        <div className="pl-8">
                          {role.permissions && role.permissions.length > 0 ? (
                            <div className="space-y-2 pt-2">
                              {role.permissions.map((perm) => (
                                <div
                                  key={perm.page_permission_id}
                                  className={`flex items-center justify-between py-2 px-3 rounded ${isDark ? 'bg-slate-700/50' : 'bg-white'} border ${borderColor}`}
                                >
                                  <div>
                                    <span className={`font-mono text-sm ${textPrimary}`}>
                                      {perm.route_pattern}
                                    </span>
                                    {perm.display_name && (
                                      <span className={`ml-2 text-sm ${textMuted}`}>
                                        - {perm.display_name}
                                      </span>
                                    )}
                                  </div>
                                  {perm.requires_2fa && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                      2FA Required
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className={`py-4 text-sm ${textMuted}`}>
                              No page permissions assigned to this role
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className={`px-4 py-3 border-t ${borderColor} ${textMuted} text-sm`}>
              {roles.length} roles total
            </div>
          </div>
        )}

        {/* Matrix View */}
        {viewMode === 'matrix' && matrixData && (
          <div className={`${cardBg} border ${borderColor} rounded-lg overflow-hidden`}>
            <div className={`px-4 py-3 border-b ${borderColor}`}>
              <p className={`text-sm ${textMuted}`}>
                Read-only view of which roles have access to which pages
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-slate-700/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${textMuted} sticky left-0 ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      Page
                    </th>
                    {matrixData.roles.map((role) => (
                      <th key={role} className={`px-4 py-3 text-center text-sm font-medium ${textMuted} whitespace-nowrap`}>
                        {role}
                      </th>
                    ))}
                    <th className={`px-4 py-3 text-center text-sm font-medium ${textMuted}`}>2FA</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${borderColor}`}>
                  {matrixData.pages.map((page) => (
                    <tr key={page.page_permission_id} className={hoverBg}>
                      <td className={`px-4 py-3 ${textPrimary} sticky left-0 ${cardBg}`}>
                        <div>
                          <span className="font-mono text-sm">{page.route_pattern}</span>
                          {page.display_name && (
                            <span className={`block text-xs ${textMuted}`}>{page.display_name}</span>
                          )}
                        </div>
                      </td>
                      {matrixData.roles.map((role) => (
                        <td key={role} className="px-4 py-3 text-center">
                          {page.role_access[role] ? (
                            <svg className="w-5 h-5 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className={`w-5 h-5 mx-auto ${textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        {page.requires_2fa && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            2FA
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`px-4 py-3 border-t ${borderColor} ${textMuted} text-sm flex items-center gap-4`}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Access granted
              </span>
              <span className="flex items-center gap-2">
                <svg className={`w-4 h-4 ${textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                No access
              </span>
            </div>
          </div>
        )}

        {viewMode === 'matrix' && !matrixData && (
          <div className={`${cardBg} border ${borderColor} rounded-lg p-8 text-center ${textMuted}`}>
            Unable to load permissions matrix
          </div>
        )}

        {/* Info Banner */}
        <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-start gap-3">
            <svg className={`w-5 h-5 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                Roles are managed by your Identity Provider
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                Role assignments are controlled through your organization&apos;s IDP. Contact your system administrator to request role changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
