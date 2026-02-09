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
interface EnhancedSettingsPageProps {
    initialPreferences?: PreferencesData;
    preferencesEndpoint?: string;
    languagesEndpoint?: string;
    timezonesEndpoint?: string;
    onSave?: (preferences: PreferencesData) => Promise<void>;
    onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
}
export default function EnhancedSettingsPage({ initialPreferences, preferencesEndpoint, languagesEndpoint, timezonesEndpoint, onSave, onThemeChange, }: EnhancedSettingsPageProps): import("react/jsx-runtime").JSX.Element;
export {};
