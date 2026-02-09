"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EnhancedSettingsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const useTheme_1 = require("../../theme/useTheme");
// Common languages for fallback
const DEFAULT_LANGUAGES = [
    { code: 'en', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese (Simplified)' },
];
// Common timezones for fallback
const DEFAULT_TIMEZONES = [
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
function Toggle({ enabled, onChange, disabled = false, isDark = true, }) {
    return ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => !disabled && onChange(!enabled), disabled: disabled, className: `
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${enabled ? 'bg-blue-600' : isDark ? 'bg-slate-600' : 'bg-gray-300'}
      `, children: (0, jsx_runtime_1.jsx)("span", { className: `
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        ` }) }));
}
// Section wrapper component
function SettingsSection({ title, children, isDark, }) {
    const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
    const titleColor = isDark ? 'text-gray-400' : 'text-gray-500';
    return ((0, jsx_runtime_1.jsxs)("div", { className: `border-b ${borderColor} pb-6 mb-6 last:border-b-0`, children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-sm font-semibold uppercase tracking-wider ${titleColor} mb-4`, children: title }), children] }));
}
// Setting row component
function SettingRow({ label, description, children, isDark, }) {
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between py-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("p", { className: `font-medium ${textPrimary}`, children: label }), description && (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMuted}`, children: description })] }), (0, jsx_runtime_1.jsx)("div", { className: "ml-4", children: children })] }));
}
// Select dropdown component
function Select({ value, onChange, options, isDark, }) {
    const bgColor = isDark ? 'bg-slate-700' : 'bg-white';
    const borderColor = isDark ? 'border-slate-600' : 'border-gray-300';
    const textColor = isDark ? 'text-white' : 'text-gray-900';
    return ((0, jsx_runtime_1.jsx)("select", { value: value, onChange: (e) => onChange(e.target.value), className: `
        px-3 py-2 rounded-md border ${borderColor} ${bgColor} ${textColor}
        focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]
      `, children: options.map((opt) => ((0, jsx_runtime_1.jsx)("option", { value: opt.value, children: opt.label }, opt.value))) }));
}
function EnhancedSettingsPage({ initialPreferences, preferencesEndpoint = '/api/v1/user/preferences', languagesEndpoint = '/api/v1/lookup/languages', timezonesEndpoint = '/api/v1/lookup/timezones', onSave, onThemeChange, }) {
    const layout = (0, useTheme_1.useLayout)();
    const colors = (0, useTheme_1.useColors)();
    // Determine dark mode from theme colors
    const isDark = colors?.background?.includes('slate-9') ||
        colors?.background?.includes('gray-9') ||
        colors?.card?.includes('slate-8');
    // State
    const [preferences, setPreferences] = (0, react_1.useState)(initialPreferences || {});
    const [languages, setLanguages] = (0, react_1.useState)(DEFAULT_LANGUAGES);
    const [timezones, setTimezones] = (0, react_1.useState)(DEFAULT_TIMEZONES);
    const [loading, setLoading] = (0, react_1.useState)(!initialPreferences);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [successMessage, setSuccessMessage] = (0, react_1.useState)(null);
    // Theme colors
    const bgColor = isDark ? 'bg-slate-900' : 'bg-gray-50';
    const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
    const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
    // Fetch preferences and lookups
    (0, react_1.useEffect)(() => {
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
                        if (langData.languages)
                            setLanguages(langData.languages);
                    }
                }
                catch {
                    // Use defaults
                }
                // Fetch timezones (optional)
                try {
                    const tzResponse = await fetch(timezonesEndpoint, { credentials: 'include' });
                    if (tzResponse.ok) {
                        const tzData = await tzResponse.json();
                        if (tzData.timezones)
                            setTimezones(tzData.timezones);
                    }
                }
                catch {
                    // Use defaults
                }
            }
            catch (err) {
                setError('Failed to load settings');
            }
            finally {
                setLoading(false);
            }
        }
        if (!initialPreferences) {
            fetchData();
        }
    }, [preferencesEndpoint, languagesEndpoint, timezonesEndpoint, initialPreferences]);
    // Update preference value
    const updatePreference = (0, react_1.useCallback)((section, key, value) => {
        setPreferences((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value,
            },
        }));
    }, []);
    // Save preferences
    const handleSave = (0, react_1.useCallback)(async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);
            if (onSave) {
                await onSave(preferences);
            }
            else {
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save settings');
        }
        finally {
            setSaving(false);
        }
    }, [preferences, preferencesEndpoint, onSave]);
    // Handle theme change
    const handleThemeChange = (0, react_1.useCallback)((theme) => {
        updatePreference('appearance', 'theme', theme);
        onThemeChange?.(theme);
    }, [updatePreference, onThemeChange]);
    // Loading state
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen ${bgColor} flex items-center justify-center`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center space-y-4", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin h-8 w-8 text-blue-500", viewBox: "0 0 24 24", fill: "none", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" })] }), (0, jsx_runtime_1.jsx)("p", { className: textMuted, children: "Loading settings..." })] }) }));
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
    return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen ${bgColor}`, children: (0, jsx_runtime_1.jsxs)("div", { className: `max-w-2xl mx-auto ${layout?.padding || 'p-6'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-6", children: [(0, jsx_runtime_1.jsx)("h1", { className: `text-3xl font-bold ${textPrimary}`, children: "Settings" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleSave, disabled: saving, className: `
              px-4 py-2 rounded-md font-medium transition-colors
              ${saving ? 'opacity-50 cursor-not-allowed' : ''}
              bg-blue-600 text-white hover:bg-blue-700
            `, children: saving ? 'Saving...' : 'Save Changes' })] }), error && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500", children: error })), successMessage && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 p-3 rounded-md bg-green-500/10 border border-green-500/50 text-green-500", children: successMessage })), (0, jsx_runtime_1.jsxs)("div", { className: `${cardBg} rounded-lg shadow-lg border ${borderColor} p-6`, children: [(0, jsx_runtime_1.jsxs)(SettingsSection, { title: "Appearance", isDark: isDark, children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium ${textMuted} mb-2`, children: "Theme" }), (0, jsx_runtime_1.jsx)("div", { className: "flex gap-2", children: ['light', 'dark', 'system'].map((theme) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => handleThemeChange(theme), className: `
                      px-4 py-2 rounded-md capitalize transition-colors
                      ${currentTheme === theme
                                                    ? 'bg-blue-600 text-white'
                                                    : isDark
                                                        ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `, children: theme }, theme))) })] }), (0, jsx_runtime_1.jsx)(SettingRow, { label: "Compact Mode", description: "Reduce spacing and padding for denser layouts", isDark: isDark, children: (0, jsx_runtime_1.jsx)(Toggle, { enabled: compactMode, onChange: (value) => updatePreference('appearance', 'compact_mode', value), isDark: isDark }) })] }), (0, jsx_runtime_1.jsx)(SettingsSection, { title: "Localization", isDark: isDark, children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium ${textMuted} mb-2`, children: "Language" }), (0, jsx_runtime_1.jsx)(Select, { value: currentLanguage, onChange: (value) => updatePreference('localization', 'language', value), options: languages.map((l) => ({ value: l.code, label: l.name })), isDark: isDark })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium ${textMuted} mb-2`, children: "Timezone" }), (0, jsx_runtime_1.jsx)(Select, { value: currentTimezone, onChange: (value) => updatePreference('localization', 'timezone', value), options: timezones.map((tz) => ({ value: tz.id, label: `${tz.display} (${tz.offset})` })), isDark: isDark }), preferences.localization?.timezone_display && ((0, jsx_runtime_1.jsxs)("p", { className: `mt-1 text-sm ${textMuted}`, children: ["Currently: ", preferences.localization.timezone_display] }))] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium ${textMuted} mb-2`, children: "Date Format" }), (0, jsx_runtime_1.jsx)(Select, { value: currentDateFormat, onChange: (value) => updatePreference('localization', 'date_format', value), options: DATE_FORMATS.map((df) => ({ value: df.value, label: df.label })), isDark: isDark }), (0, jsx_runtime_1.jsxs)("p", { className: `mt-1 text-sm ${textMuted}`, children: ["Example: ", DATE_FORMATS.find((df) => df.value === currentDateFormat)?.example] })] })] }) }), (0, jsx_runtime_1.jsxs)(SettingsSection, { title: "Notifications", isDark: isDark, children: [(0, jsx_runtime_1.jsx)(SettingRow, { label: "Email Notifications", description: "Receive updates and alerts via email", isDark: isDark, children: (0, jsx_runtime_1.jsx)(Toggle, { enabled: emailEnabled, onChange: (value) => updatePreference('notifications', 'email_enabled', value), isDark: isDark }) }), emailEnabled && ((0, jsx_runtime_1.jsxs)("div", { className: `ml-6 border-l-2 ${borderColor} pl-4 space-y-2`, children: [(0, jsx_runtime_1.jsx)(SettingRow, { label: "Security alerts", description: "Login from new device, etc.", isDark: isDark, children: (0, jsx_runtime_1.jsx)(Toggle, { enabled: preferences.notifications?.email_security_alerts ?? true, onChange: (value) => updatePreference('notifications', 'email_security_alerts', value), isDark: isDark }) }), (0, jsx_runtime_1.jsx)(SettingRow, { label: "Account updates", description: "Password expiry, etc.", isDark: isDark, children: (0, jsx_runtime_1.jsx)(Toggle, { enabled: preferences.notifications?.email_account_updates ?? true, onChange: (value) => updatePreference('notifications', 'email_account_updates', value), isDark: isDark }) }), (0, jsx_runtime_1.jsx)(SettingRow, { label: "Product news and tips", isDark: isDark, children: (0, jsx_runtime_1.jsx)(Toggle, { enabled: preferences.notifications?.email_product_news ?? false, onChange: (value) => updatePreference('notifications', 'email_product_news', value), isDark: isDark }) }), (0, jsx_runtime_1.jsx)(SettingRow, { label: "Marketing and promotions", isDark: isDark, children: (0, jsx_runtime_1.jsx)(Toggle, { enabled: preferences.notifications?.email_marketing ?? false, onChange: (value) => updatePreference('notifications', 'email_marketing', value), isDark: isDark }) })] })), (0, jsx_runtime_1.jsx)(SettingRow, { label: "SMS Notifications", description: "Receive urgent alerts via text message", isDark: isDark, children: (0, jsx_runtime_1.jsx)(Toggle, { enabled: smsEnabled, onChange: (value) => updatePreference('notifications', 'sms_enabled', value), isDark: isDark }) }), smsEnabled && ((0, jsx_runtime_1.jsx)("div", { className: `ml-6 border-l-2 ${borderColor} pl-4`, children: (0, jsx_runtime_1.jsx)(SettingRow, { label: "Security alerts only", isDark: isDark, children: (0, jsx_runtime_1.jsx)(Toggle, { enabled: preferences.notifications?.sms_security_alerts ?? true, onChange: (value) => updatePreference('notifications', 'sms_security_alerts', value), isDark: isDark }) }) }))] }), (0, jsx_runtime_1.jsxs)(SettingsSection, { title: "Privacy", isDark: isDark, children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium ${textMuted} mb-2`, children: "Profile Visibility" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: [
                                                { value: 'private', label: 'Private', description: 'Only you can see your profile' },
                                                { value: 'team', label: 'Team', description: 'Team members can see your profile' },
                                                { value: 'public', label: 'Public', description: 'Anyone can see your profile' },
                                            ].map((option) => ((0, jsx_runtime_1.jsxs)("label", { className: `flex items-center p-3 rounded-md cursor-pointer transition-colors ${profileVisibility === option.value
                                                    ? isDark
                                                        ? 'bg-blue-600/20 border border-blue-500'
                                                        : 'bg-blue-50 border border-blue-500'
                                                    : isDark
                                                        ? 'bg-slate-700 hover:bg-slate-600'
                                                        : 'bg-gray-50 hover:bg-gray-100'}`, children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "profileVisibility", value: option.value, checked: profileVisibility === option.value, onChange: (e) => updatePreference('privacy', 'profile_visibility', e.target.value), className: "mr-3" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `font-medium ${textPrimary}`, children: option.label }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMuted}`, children: option.description })] })] }, option.value))) })] }), (0, jsx_runtime_1.jsx)(SettingRow, { label: "Activity Status", description: "Show when you're active to team members", isDark: isDark, children: (0, jsx_runtime_1.jsx)(Toggle, { enabled: showActivityStatus, onChange: (value) => updatePreference('privacy', 'show_activity_status', value), isDark: isDark }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 flex justify-between", children: [(0, jsx_runtime_1.jsx)("a", { href: "/account/security", className: `text-sm hover:underline ${textMuted}`, children: "\u2190 Security Settings" }), (0, jsx_runtime_1.jsx)("a", { href: "/account/profile", className: `text-sm hover:underline ${textMuted}`, children: "Back to Profile \u2192" })] })] }) }));
}
