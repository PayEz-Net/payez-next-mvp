/**
 * Enhanced Settings Page for @payez/next-mvp
 *
 * Implements BAPert's Member Self-Service spec with:
 * - Appearance section (theme, compact mode)
 * - Localization section (language, timezone, date format)
 * - Notifications section (email and SMS preferences)
 * - Privacy section (profile visibility, activity status)
 *
 * @see docs/specs/MEMBER_SELF_SERVICE_SPEC.md
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLayout, useColors } from '../../theme/useTheme';

// Types matching BAPert's spec
interface PreferencesData {
  appearance?: {
    theme?: 'light' | 'dark' | 'system';
    compact_mode?: boolean;
  };
  localization?: {
    language?: string;
    timezone?: string;
    timezone_display?: string;
    date_format?: string;
  };
  notifications?: {
    email_enabled?: boolean;
    email_security_alerts?: boolean;
    email_account_updates?: boolean;
    email_product_news?: boolean;
    email_marketing?: boolean;
    sms_enabled?: boolean;
    sms_security_alerts?: boolean;
  };
  privacy?: {
    profile_visibility?: 'private' | 'team' | 'public';
    show_activity_status?: boolean;
  };
}

interface Language {
  code: string;
  name: string;
}

interface Timezone {
  id: string;
  display: string;
  offset: string;
}

// Props for the settings page
interface EnhancedSettingsPageProps {
  // Optional initial data (for SSR)
  initialPreferences?: PreferencesData;
  // API endpoints
  preferencesEndpoint?: string;
  languagesEndpoint?: string;
  timezonesEndpoint?: string;
  // Callbacks
  onSave?: (preferences: PreferencesData) => Promise<void>;
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
}

// Common languages for fallback
const DEFAULT_LANGUAGES: Language[] = [
  { code: 'en', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese (Simplified)' },
];

// Common timezones for fallback
const DEFAULT_TIMEZONES: Timezone[] = [
  { id: 'America/Los_Angeles', display: 'Pacific Time (US)', offset: '-08:00' },
  { id: 'America/Denver', display: 'Mountain Time (US)', offset: '-07:00' },
  { id: 'America/Chicago', display: 'Central Time (US)', offset: '-06:00' },
  { id: 'America/New_York', display: 'Eastern Time (US)', offset: '-05:00' },
  { id: 'Europe/London', display: 'London', offset: '+00:00' },
  { id: 'Europe/Paris', display: 'Paris', offset: '+01:00' },
  { id: 'Europe/Berlin', display: 'Berlin', offset: '+01:00' },
  { id: 'Asia/Tokyo', display: 'Tokyo', offset: '+09:00' },
  { id: 'Asia/Shanghai', display: 'Shanghai', offset: '+08:00' },
  { id: 'Australia/Sydney', display: 'Sydney', offset: '+11:00' },
];

// Date format options
const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '01/09/2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '09/01/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-01-09' },
];

// Toggle component
function Toggle({
  enabled,
  onChange,
  disabled = false,
  isDark = true,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  isDark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${enabled ? 'bg-blue-600' : isDark ? 'bg-slate-600' : 'bg-gray-300'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

// Section wrapper component
function SettingsSection({
  title,
  children,
  isDark,
}: {
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
  const titleColor = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`border-b ${borderColor} pb-6 mb-6 last:border-b-0`}>
      <h2 className={`text-sm font-semibold uppercase tracking-wider ${titleColor} mb-4`}>
        {title}
      </h2>
      {children}
    </div>
  );
}

// Setting row component
function SettingRow({
  label,
  description,
  children,
  isDark,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <p className={`font-medium ${textPrimary}`}>{label}</p>
        {description && <p className={`text-sm ${textMuted}`}>{description}</p>}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  );
}

// Select dropdown component
function Select({
  value,
  onChange,
  options,
  isDark,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  isDark: boolean;
}) {
  const bgColor = isDark ? 'bg-slate-700' : 'bg-white';
  const borderColor = isDark ? 'border-slate-600' : 'border-gray-300';
  const textColor = isDark ? 'text-white' : 'text-gray-900';

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        px-3 py-2 rounded-md border ${borderColor} ${bgColor} ${textColor}
        focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]
      `}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default function EnhancedSettingsPage({
  initialPreferences,
  preferencesEndpoint = '/api/v1/user/preferences',
  languagesEndpoint = '/api/v1/lookup/languages',
  timezonesEndpoint = '/api/v1/lookup/timezones',
  onSave,
  onThemeChange,
}: EnhancedSettingsPageProps) {
  const layout = useLayout();
  const colors = useColors();

  // Determine dark mode from theme colors
  const isDark = colors?.background?.includes('slate-9') ||
                 colors?.background?.includes('gray-9') ||
                 colors?.card?.includes('slate-8');

  // State
  const [preferences, setPreferences] = useState<PreferencesData>(initialPreferences || {});
  const [languages, setLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [timezones, setTimezones] = useState<Timezone[]>(DEFAULT_TIMEZONES);
  const [loading, setLoading] = useState(!initialPreferences);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Theme colors
  const bgColor = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  // Fetch preferences and lookups
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch preferences
        const prefResponse = await fetch(preferencesEndpoint, { credentials: 'include' });
        if (prefResponse.ok) {
          const prefData = await prefResponse.json();
          setPreferences(prefData);
        }

        // Fetch languages (optional)
        try {
          const langResponse = await fetch(languagesEndpoint, { credentials: 'include' });
          if (langResponse.ok) {
            const langData = await langResponse.json();
            if (langData.languages) setLanguages(langData.languages);
          }
        } catch {
          // Use defaults
        }

        // Fetch timezones (optional)
        try {
          const tzResponse = await fetch(timezonesEndpoint, { credentials: 'include' });
          if (tzResponse.ok) {
            const tzData = await tzResponse.json();
            if (tzData.timezones) setTimezones(tzData.timezones);
          }
        } catch {
          // Use defaults
        }
      } catch (err) {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    if (!initialPreferences) {
      fetchData();
    }
  }, [preferencesEndpoint, languagesEndpoint, timezonesEndpoint, initialPreferences]);

  // Update preference value
  const updatePreference = useCallback(
    <K extends keyof PreferencesData>(
      section: K,
      key: keyof NonNullable<PreferencesData[K]>,
      value: unknown
    ) => {
      setPreferences((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value,
        },
      }));
    },
    []
  );

  // Save preferences
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      if (onSave) {
        await onSave(preferences);
      } else {
        const response = await fetch(preferencesEndpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(preferences),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to save settings');
        }
      }

      setSuccessMessage('Settings saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [preferences, preferencesEndpoint, onSave]);

  // Handle theme change
  const handleThemeChange = useCallback(
    (theme: 'light' | 'dark' | 'system') => {
      updatePreference('appearance', 'theme', theme);
      onThemeChange?.(theme);
    },
    [updatePreference, onThemeChange]
  );

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${bgColor} flex items-center justify-center`}>
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className={textMuted}>Loading settings...</p>
        </div>
      </div>
    );
  }

  const currentTheme = preferences.appearance?.theme || 'system';
  const compactMode = preferences.appearance?.compact_mode || false;
  const currentLanguage = preferences.localization?.language || 'en';
  const currentTimezone = preferences.localization?.timezone || 'America/Los_Angeles';
  const currentDateFormat = preferences.localization?.date_format || 'MM/DD/YYYY';
  const emailEnabled = preferences.notifications?.email_enabled ?? true;
  const smsEnabled = preferences.notifications?.sms_enabled ?? false;
  const profileVisibility = preferences.privacy?.profile_visibility || 'team';
  const showActivityStatus = preferences.privacy?.show_activity_status ?? true;

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <div className={`max-w-2xl mx-auto ${layout?.padding || 'p-6'}`}>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-3xl font-bold ${textPrimary}`}>Settings</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`
              px-4 py-2 rounded-md font-medium transition-colors
              ${saving ? 'opacity-50 cursor-not-allowed' : ''}
              bg-blue-600 text-white hover:bg-blue-700
            `}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-md bg-green-500/10 border border-green-500/50 text-green-500">
            {successMessage}
          </div>
        )}

        {/* Settings Card */}
        <div className={`${cardBg} rounded-lg shadow-lg border ${borderColor} p-6`}>
          {/* Appearance Section */}
          <SettingsSection title="Appearance" isDark={isDark}>
            {/* Theme Selection */}
            <div className="mb-4">
              <label className={`block text-sm font-medium ${textMuted} mb-2`}>Theme</label>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`
                      px-4 py-2 rounded-md capitalize transition-colors
                      ${currentTheme === theme
                        ? 'bg-blue-600 text-white'
                        : isDark
                          ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Mode */}
            <SettingRow
              label="Compact Mode"
              description="Reduce spacing and padding for denser layouts"
              isDark={isDark}
            >
              <Toggle
                enabled={compactMode}
                onChange={(value) => updatePreference('appearance', 'compact_mode', value)}
                isDark={isDark}
              />
            </SettingRow>
          </SettingsSection>

          {/* Localization Section */}
          <SettingsSection title="Localization" isDark={isDark}>
            <div className="space-y-4">
              {/* Language */}
              <div>
                <label className={`block text-sm font-medium ${textMuted} mb-2`}>Language</label>
                <Select
                  value={currentLanguage}
                  onChange={(value) => updatePreference('localization', 'language', value)}
                  options={languages.map((l) => ({ value: l.code, label: l.name }))}
                  isDark={isDark}
                />
              </div>

              {/* Timezone */}
              <div>
                <label className={`block text-sm font-medium ${textMuted} mb-2`}>Timezone</label>
                <Select
                  value={currentTimezone}
                  onChange={(value) => updatePreference('localization', 'timezone', value)}
                  options={timezones.map((tz) => ({ value: tz.id, label: `${tz.display} (${tz.offset})` }))}
                  isDark={isDark}
                />
                {preferences.localization?.timezone_display && (
                  <p className={`mt-1 text-sm ${textMuted}`}>
                    Currently: {preferences.localization.timezone_display}
                  </p>
                )}
              </div>

              {/* Date Format */}
              <div>
                <label className={`block text-sm font-medium ${textMuted} mb-2`}>Date Format</label>
                <Select
                  value={currentDateFormat}
                  onChange={(value) => updatePreference('localization', 'date_format', value)}
                  options={DATE_FORMATS.map((df) => ({ value: df.value, label: df.label }))}
                  isDark={isDark}
                />
                <p className={`mt-1 text-sm ${textMuted}`}>
                  Example: {DATE_FORMATS.find((df) => df.value === currentDateFormat)?.example}
                </p>
              </div>
            </div>
          </SettingsSection>

          {/* Notifications Section */}
          <SettingsSection title="Notifications" isDark={isDark}>
            {/* Email Notifications */}
            <SettingRow
              label="Email Notifications"
              description="Receive updates and alerts via email"
              isDark={isDark}
            >
              <Toggle
                enabled={emailEnabled}
                onChange={(value) => updatePreference('notifications', 'email_enabled', value)}
                isDark={isDark}
              />
            </SettingRow>

            {emailEnabled && (
              <div className={`ml-6 border-l-2 ${borderColor} pl-4 space-y-2`}>
                <SettingRow label="Security alerts" description="Login from new device, etc." isDark={isDark}>
                  <Toggle
                    enabled={preferences.notifications?.email_security_alerts ?? true}
                    onChange={(value) => updatePreference('notifications', 'email_security_alerts', value)}
                    isDark={isDark}
                  />
                </SettingRow>
                <SettingRow label="Account updates" description="Password expiry, etc." isDark={isDark}>
                  <Toggle
                    enabled={preferences.notifications?.email_account_updates ?? true}
                    onChange={(value) => updatePreference('notifications', 'email_account_updates', value)}
                    isDark={isDark}
                  />
                </SettingRow>
                <SettingRow label="Product news and tips" isDark={isDark}>
                  <Toggle
                    enabled={preferences.notifications?.email_product_news ?? false}
                    onChange={(value) => updatePreference('notifications', 'email_product_news', value)}
                    isDark={isDark}
                  />
                </SettingRow>
                <SettingRow label="Marketing and promotions" isDark={isDark}>
                  <Toggle
                    enabled={preferences.notifications?.email_marketing ?? false}
                    onChange={(value) => updatePreference('notifications', 'email_marketing', value)}
                    isDark={isDark}
                  />
                </SettingRow>
              </div>
            )}

            {/* SMS Notifications */}
            <SettingRow
              label="SMS Notifications"
              description="Receive urgent alerts via text message"
              isDark={isDark}
            >
              <Toggle
                enabled={smsEnabled}
                onChange={(value) => updatePreference('notifications', 'sms_enabled', value)}
                isDark={isDark}
              />
            </SettingRow>

            {smsEnabled && (
              <div className={`ml-6 border-l-2 ${borderColor} pl-4`}>
                <SettingRow label="Security alerts only" isDark={isDark}>
                  <Toggle
                    enabled={preferences.notifications?.sms_security_alerts ?? true}
                    onChange={(value) => updatePreference('notifications', 'sms_security_alerts', value)}
                    isDark={isDark}
                  />
                </SettingRow>
              </div>
            )}
          </SettingsSection>

          {/* Privacy Section */}
          <SettingsSection title="Privacy" isDark={isDark}>
            {/* Profile Visibility */}
            <div className="mb-4">
              <label className={`block text-sm font-medium ${textMuted} mb-2`}>Profile Visibility</label>
              <div className="space-y-2">
                {([
                  { value: 'private', label: 'Private', description: 'Only you can see your profile' },
                  { value: 'team', label: 'Team', description: 'Team members can see your profile' },
                  { value: 'public', label: 'Public', description: 'Anyone can see your profile' },
                ] as const).map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                      profileVisibility === option.value
                        ? isDark
                          ? 'bg-blue-600/20 border border-blue-500'
                          : 'bg-blue-50 border border-blue-500'
                        : isDark
                          ? 'bg-slate-700 hover:bg-slate-600'
                          : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="profileVisibility"
                      value={option.value}
                      checked={profileVisibility === option.value}
                      onChange={(e) =>
                        updatePreference('privacy', 'profile_visibility', e.target.value as 'private' | 'team' | 'public')
                      }
                      className="mr-3"
                    />
                    <div>
                      <p className={`font-medium ${textPrimary}`}>{option.label}</p>
                      <p className={`text-sm ${textMuted}`}>{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Activity Status */}
            <SettingRow
              label="Activity Status"
              description="Show when you're active to team members"
              isDark={isDark}
            >
              <Toggle
                enabled={showActivityStatus}
                onChange={(value) => updatePreference('privacy', 'show_activity_status', value)}
                isDark={isDark}
              />
            </SettingRow>
          </SettingsSection>
        </div>

        {/* Navigation Links */}
        <div className="mt-6 flex justify-between">
          <a href="/account/security" className={`text-sm hover:underline ${textMuted}`}>
            &larr; Security Settings
          </a>
          <a href="/account/profile" className={`text-sm hover:underline ${textMuted}`}>
            Back to Profile &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
