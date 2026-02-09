/**
 * Themed Profile Page for @payez/next-mvp
 *
 * DEPENDENCIES: Only React, Next.js, next-auth, React Query, and Tailwind CSS
 * NO shadcn/ui or other UI library required!
 *
 * FEATURES:
 * ✅ Displays user profile information
 * ✅ Shows email, phone, roles
 * ✅ 2FA status indicator
 * ✅ Themeable styling via ThemeProvider
 * ✅ Uses React Query for data fetching (matches website-membership pattern)
 *
 * USAGE:
 * 1. Import from @payez/next-mvp/pages/profile
 * 2. Wrap your app with ThemeProvider to customize branding
 * 3. Create API route at: src/app/api/account/profile/route.ts
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '../../hooks/useProfile';
import { useBranding, useColors, useLayout } from '../../theme/useTheme';

export default function ProfilePage() {
  const router = useRouter();
  const { data: profileData, isLoading, error } = useProfile();
  const branding = useBranding();
  const colors = useColors();
  const layout = useLayout();

  // Loading state
  // Note: Auth protection is handled by middleware - no need to check here
  if (isLoading || !profileData) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-default)' }}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <svg className="animate-spin h-8 w-8" style={{ color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12 a 8 8 0 0 1 8 -8 v 4 a 4 4 0 0 0 -4 4 H4 z" />
            </svg>
            <p style={{ color: 'var(--text-muted)' }}>Loading profile...</p>
            {error && (
              <p className="text-red-600 text-sm mt-2">{(error as Error).message}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Get 2FA status from security settings or direct field
  const twoFactorEnabled = profileData.two_factor_enabled ||
    profileData.security_settings?.some(
      (setting: any) => setting.setting_type?.toLowerCase().includes('2fa') && setting.is_enabled
    ) || false;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-default)' }}>
      <div className={`${layout?.spacing || 'space-y-6'} ${layout?.maxWidth || 'max-w-4xl'} mx-auto ${layout?.padding || 'p-6'}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Profile</h1>
        </div>

        {/* Profile Information Card */}
        <div className={`rounded-lg shadow-sm border ${layout?.padding || 'p-6'}`} style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          {/* Profile Avatar */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-700 font-semibold text-2xl">
                {profileData.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {profileData.full_name ||
                 (profileData.first_name || profileData.last_name
                   ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
                   : profileData.email)}
              </h2>
              <p className="text-gray-600 text-sm">
                User ID: {profileData.user_id || profileData.email}
              </p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <div className="flex items-center space-x-2">
              <p style={{ color: 'var(--text-primary)' }}>{profileData.email}</p>
              {profileData.email_confirmed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>

          {/* Phone */}
          {profileData?.phone_number && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Phone</label>
              <div className="flex items-center space-x-2">
                <p style={{ color: 'var(--text-primary)' }}>{profileData.phone_number}</p>
                {profileData.phone_confirmed && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Roles */}
          {profileData?.roles && profileData.roles.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Roles</label>
              <div className="flex flex-wrap gap-2">
                {profileData.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-800"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 2FA Status */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Two-Factor Authentication</label>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                profileData?.two_factor_enabled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {profileData?.two_factor_enabled ? '✓ Enabled' : 'Not Active'}
            </span>
          </div>

          {/* Footer Link */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <a
              href="/account/security"
              className="text-gray-600 hover:text-gray-800 text-sm hover:underline"
            >
              Manage security settings
            </a>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
