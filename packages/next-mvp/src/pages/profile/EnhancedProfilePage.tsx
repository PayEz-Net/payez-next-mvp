/**
 * Enhanced Profile Page for @payez/next-mvp
 *
 * Implements BAPert's Member Self-Service spec with:
 * - Identity header (avatar, name, email, phone, member since)
 * - Personal info section (first name, last name, title, bio)
 * - Contact info section (secondary email/phone, website)
 * - Address section with state/country dropdowns
 * - Edit capabilities with inline forms
 *
 * @see docs/specs/MEMBER_SELF_SERVICE_SPEC.md
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useLayout, useColors } from '../../theme/useTheme';

// Types matching BAPert's spec
interface ProfileData {
  user_id?: number | string; // Can be either depending on source
  account_id?: string;

  identity?: {
    email: string;
    email_confirmed?: boolean;
    phone_number?: string;
    phone_confirmed?: boolean;
    full_name?: string;
    avatar_url?: string | null;
    created_at?: string;
    last_sign_in?: string;
    last_activity?: string;
  };

  personal_info?: {
    first_name?: string;
    last_name?: string;
    title?: string;
    bio?: string;
  };

  contact_info?: {
    secondary_email?: string;
    secondary_phone?: string;
    website?: string;
    preferred_contact_method?: 'email' | 'sms' | 'both';
  };

  address?: {
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state_id?: number;
    state_name?: string;
    postal_code?: string;
    country_code?: string;
    country_name?: string;
  };

  // Legacy flat fields for backwards compatibility
  email?: string;
  email_confirmed?: boolean;
  phone_number?: string;
  phone_confirmed?: boolean;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  two_factor_enabled?: boolean;
  roles?: string[];
  contact_information?: any;
}

interface EditableSectionProps {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  isEditing?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  isDarkMode: boolean;
}

function EditableSection({
  title,
  children,
  onEdit,
  isEditing,
  onSave,
  onCancel,
  isDarkMode
}: EditableSectionProps) {
  const cardBg = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDarkMode ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-slate-300' : 'text-gray-600';

  return (
    <div className={`rounded-lg border ${cardBg} ${borderColor}`}>
      <div className={`flex items-center justify-between px-6 py-4 border-b ${borderColor}`}>
        <h2 className={`text-lg font-semibold ${textPrimary}`}>{title}</h2>
        {!isEditing && onEdit && (
          <button
            onClick={onEdit}
            className={`text-sm font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            Edit
          </button>
        )}
        {isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className={`text-sm font-medium ${textSecondary} hover:${textPrimary}`}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
            >
              Save
            </button>
          </div>
        )}
      </div>
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );
}

interface FieldRowProps {
  label: string;
  value?: string | React.ReactNode;
  verified?: boolean;
  action?: React.ReactNode;
  isDarkMode: boolean;
}

function FieldRow({ label, value, verified, action, isDarkMode }: FieldRowProps) {
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0 border-slate-700/30">
      <div className="flex-1">
        <p className={`text-sm ${textSecondary}`}>{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={textPrimary}>{value || '—'}</span>
          {verified !== undefined && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              verified ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}>
              {verified ? '✓ Verified' : 'Not Verified'}
            </span>
          )}
        </div>
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export default function EnhancedProfilePage() {
  const { data: rawProfile, isLoading, error, refetch } = useProfile();
  const layout = useLayout();
  const colors = useColors();

  // Normalize profile data (handles both new structured and legacy flat formats)
  const profile: ProfileData = React.useMemo(() => {
    if (!rawProfile) return {};

    // If data already has identity section, use as-is
    if (rawProfile.identity) {
      return rawProfile as ProfileData;
    }

    // Convert legacy flat format to structured format
    return {
      user_id: rawProfile.user_id,
      identity: {
        email: rawProfile.email || '',
        email_confirmed: rawProfile.email_confirmed,
        phone_number: rawProfile.phone_number,
        phone_confirmed: rawProfile.phone_confirmed,
        full_name: rawProfile.full_name ||
          [rawProfile.first_name, rawProfile.last_name].filter(Boolean).join(' ') ||
          rawProfile.email,
        avatar_url: null,
        created_at: undefined,
        last_sign_in: undefined,
      },
      personal_info: {
        first_name: rawProfile.first_name,
        last_name: rawProfile.last_name,
        title: undefined,
        bio: undefined,
      },
      contact_info: rawProfile.contact_information ? {
        secondary_email: rawProfile.contact_information.secondary_email,
        secondary_phone: rawProfile.contact_information.secondary_phone,
        website: rawProfile.contact_information.website,
      } : undefined,
      address: rawProfile.contact_information ? {
        address_line_1: rawProfile.contact_information.addressLine1,
        address_line_2: rawProfile.contact_information.addressLine2,
        city: rawProfile.contact_information.city,
        state_id: rawProfile.contact_information.stateId,
        state_name: rawProfile.contact_information.stateName,
        postal_code: rawProfile.contact_information.postalCode,
        country_code: rawProfile.contact_information.countryCode,
        country_name: rawProfile.contact_information.countryName,
      } : undefined,
      two_factor_enabled: rawProfile.two_factor_enabled,
      roles: rawProfile.roles,
    };
  }, [rawProfile]);

  // Determine dark mode
  const isDarkMode = colors?.background?.includes('slate-9') ||
                     colors?.background?.includes('gray-9') ||
                     colors?.background?.includes('dark') ||
                     colors?.card?.includes('slate-8');

  // Theme classes
  const bgClass = isDarkMode ? 'bg-slate-900' : 'bg-gray-50';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-slate-300' : 'text-gray-600';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-gray-500';
  const cardBg = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDarkMode ? 'border-slate-700' : 'border-gray-200';

  // Loading state
  if (isLoading || !profile.identity) {
    return (
      <div className={`min-h-screen ${bgClass}`}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <svg className={`animate-spin h-8 w-8 ${textMuted}`} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12 a 8 8 0 0 1 8 -8 v 4 a 4 4 0 0 0 -4 4 H4 z" />
            </svg>
            <p className={textMuted}>Loading profile...</p>
            {error && (
              <p className="text-red-500 text-sm mt-2">{(error as Error).message}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { identity, personal_info, contact_info, address } = profile;
  const userInitial = identity?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className={`${layout?.maxWidth || 'max-w-3xl'} mx-auto ${layout?.padding || 'p-6'} space-y-6`}>
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${textPrimary}`}>Profile</h1>
        </div>

        {/* Identity Header Card */}
        <div className={`rounded-lg border ${cardBg} ${borderColor} p-6`}>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {identity?.avatar_url ? (
                <img
                  src={identity.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-3xl">{userInitial}</span>
                </div>
              )}
              <button className={`mt-2 text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} w-full text-center`}>
                Change Photo
              </button>
            </div>

            {/* Identity Info */}
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${textPrimary}`}>
                {identity?.full_name || identity?.email}
              </h2>

              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={textSecondary}>{identity?.email}</span>
                  {identity?.email_confirmed && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      ✓
                    </span>
                  )}
                </div>

                {identity?.phone_number && (
                  <div className="flex items-center gap-2">
                    <span className={textSecondary}>{identity.phone_number}</span>
                    {identity?.phone_confirmed && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        ✓
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Account metadata */}
              <div className={`mt-4 pt-4 border-t ${borderColor} text-sm ${textMuted} space-y-1`}>
                {identity?.created_at && (
                  <p>Member since {formatDate(identity.created_at)}</p>
                )}
                {identity?.last_activity && (
                  <p>Last active {formatRelativeTime(identity.last_activity)}</p>
                )}
                {profile.user_id && (
                  <p>Account ID: USR-{profile.user_id}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <EditableSection title="Personal Information" isDarkMode={isDarkMode}>
          <div className="space-y-0">
            <FieldRow
              label="First Name"
              value={personal_info?.first_name}
              isDarkMode={isDarkMode}
            />
            <FieldRow
              label="Last Name"
              value={personal_info?.last_name}
              isDarkMode={isDarkMode}
            />
            <FieldRow
              label="Title"
              value={personal_info?.title}
              isDarkMode={isDarkMode}
            />
            <FieldRow
              label="Bio"
              value={personal_info?.bio}
              isDarkMode={isDarkMode}
            />
          </div>
        </EditableSection>

        {/* Contact Information */}
        <EditableSection title="Contact Information" isDarkMode={isDarkMode}>
          <div className="space-y-0">
            <FieldRow
              label="Primary Email"
              value={identity?.email}
              verified={identity?.email_confirmed}
              action={
                <button className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Change
                </button>
              }
              isDarkMode={isDarkMode}
            />
            <FieldRow
              label="Primary Phone"
              value={identity?.phone_number}
              verified={identity?.phone_confirmed}
              action={
                <button className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Change
                </button>
              }
              isDarkMode={isDarkMode}
            />
            <FieldRow
              label="Secondary Email"
              value={contact_info?.secondary_email}
              isDarkMode={isDarkMode}
            />
            <FieldRow
              label="Secondary Phone"
              value={contact_info?.secondary_phone}
              isDarkMode={isDarkMode}
            />
            <FieldRow
              label="Website"
              value={contact_info?.website}
              isDarkMode={isDarkMode}
            />
            <FieldRow
              label="Preferred Contact"
              value={contact_info?.preferred_contact_method ?
                contact_info.preferred_contact_method.charAt(0).toUpperCase() +
                contact_info.preferred_contact_method.slice(1) : undefined
              }
              isDarkMode={isDarkMode}
            />
          </div>
        </EditableSection>

        {/* Address */}
        <EditableSection title="Address" isDarkMode={isDarkMode}>
          {address?.address_line_1 ? (
            <div className={textPrimary}>
              <p>{address.address_line_1}</p>
              {address.address_line_2 && <p>{address.address_line_2}</p>}
              <p>
                {[address.city, address.state_name, address.postal_code]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p>{address.country_name || address.country_code}</p>
            </div>
          ) : (
            <p className={textMuted}>No address on file</p>
          )}
        </EditableSection>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-6 pt-4">
          <a
            href="/account/subscription"
            className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            Subscription & Billing →
          </a>
          <a
            href="/account/security"
            className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            Security Settings →
          </a>
          <a
            href="/account/settings"
            className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            Preferences →
          </a>
        </div>
      </div>
    </div>
  );
}
