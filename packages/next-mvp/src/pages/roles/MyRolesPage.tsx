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

import React, { useState, useEffect, useCallback } from 'react';
import { useLayout, useColors } from '../../theme/useTheme';
import { Role, RoleCard, RoleSourceHeader } from './components';

// API response types
interface MyRolesResponse {
  summary: {
    total_roles: number;
    sources: string[];
  };
  idp_roles: Role[];
  app_roles: Role[];
}

interface MyRolesPageProps {
  // Optional initial data (for SSR)
  initialData?: MyRolesResponse;
  // API endpoint
  rolesEndpoint?: string;
}

export default function MyRolesPage({
  initialData,
  rolesEndpoint = '/api/account/my-roles',
}: MyRolesPageProps) {
  const layout = useLayout();
  const colors = useColors();

  // Determine dark mode
  const isDark = colors?.background?.includes('slate-9') ||
                 colors?.background?.includes('gray-9') ||
                 colors?.card?.includes('slate-8');

  // State
  const [data, setData] = useState<MyRolesResponse | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Theme colors
  const bgColor = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(rolesEndpoint, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to load roles');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [rolesEndpoint]);

  useEffect(() => {
    if (!initialData) {
      fetchRoles();
    }
  }, [initialData, fetchRoles]);

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen ${bgColor} flex items-center justify-center`}>
        <div className={`${cardBg} border ${borderColor} rounded-lg p-8 text-center max-w-md`}>
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className={`text-lg font-semibold ${textPrimary} mb-2`}>Failed to Load Roles</h2>
          <p className={`${textMuted} mb-4`}>{error}</p>
          <button
            onClick={fetchRoles}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const idpRoles = data?.idp_roles || [];
  const appRoles = data?.app_roles || [];
  const totalRoles = idpRoles.length + appRoles.length;

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <div className={`max-w-2xl mx-auto ${layout?.padding || 'p-6'}`}>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${textPrimary}`}>My Roles</h1>
            {totalRoles > 0 && (
              <p className={`mt-1 ${textMuted}`}>
                You have {totalRoles} role{totalRoles !== 1 ? 's' : ''} across {data?.summary?.sources?.length || 0} source{(data?.summary?.sources?.length || 0) !== 1 ? 's' : ''}.
              </p>
            )}
          </div>
          <a
            href="/account/profile"
            className={`text-sm hover:underline ${textMuted}`}
          >
            Back to Profile
          </a>
        </div>

        {/* Empty state */}
        {totalRoles === 0 && (
          <div className={`${cardBg} border ${borderColor} rounded-lg p-8 text-center`}>
            <svg className={`w-12 h-12 mx-auto mb-4 ${textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h2 className={`text-lg font-semibold ${textPrimary} mb-2`}>No Roles Assigned</h2>
            <p className={textMuted}>You don't have any roles assigned yet. Contact your administrator for access.</p>
          </div>
        )}

        {/* IDP Roles */}
        {idpRoles.length > 0 && (
          <div className="mb-6">
            <RoleSourceHeader source="idp" count={idpRoles.length} isDark={isDark} />
            <div className="mt-3 space-y-3">
              {idpRoles.map((role) => (
                <RoleCard
                  key={role.role_name}
                  role={role}
                  source="idp"
                  isDark={isDark}
                />
              ))}
            </div>
          </div>
        )}

        {/* App Roles */}
        {appRoles.length > 0 && (
          <div className="mb-6">
            <RoleSourceHeader source="app" count={appRoles.length} isDark={isDark} />
            <div className="mt-3 space-y-3">
              {appRoles.map((role) => (
                <RoleCard
                  key={role.role_name}
                  role={role}
                  source="app"
                  isDark={isDark}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {totalRoles > 0 && (
          <div className={`border-t ${borderColor} pt-4 mt-6`}>
            <p className={`text-sm ${textMuted}`}>
              Need additional access? Contact your administrator.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <a href="/account/security" className={`text-sm hover:underline ${textMuted}`}>
            &larr; Security Settings
          </a>
          <a href="/account/settings" className={`text-sm hover:underline ${textMuted}`}>
            Settings &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
