"use strict";
/**
 * usePublicAuthSettings Hook
 *
 * Fetches public auth settings for pre-login pages (signup, login).
 * Does NOT require authentication - settings are fetched via API.
 */
'use client';
/**
 * usePublicAuthSettings Hook
 *
 * Fetches public auth settings for pre-login pages (signup, login).
 * Does NOT require authentication - settings are fetched via API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePublicAuthSettings = usePublicAuthSettings;
exports.useSocialLoginEnabled = useSocialLoginEnabled;
exports.usePublicRegistrationEnabled = usePublicRegistrationEnabled;
exports.usePasswordResetEnabled = usePasswordResetEnabled;
const react_1 = require("react");
// Map provider strings to FederatedProvider type
const PROVIDER_MAP = {
    'google': 'google',
    'apple': 'apple',
    'facebook': 'facebook',
    'github': 'github',
    'microsoft': 'microsoft',
    'azure-ad': 'microsoft',
};
const DEFAULT_SETTINGS = {
    enabledProviders: [],
    allowPublicRegistration: true,
    allowSocialLogin: false,
    enablePasswordReset: true,
    require2FA: true,
    allowed2FAMethods: ['email', 'sms'],
};
/**
 * Hook to fetch public auth settings for login/signup pages.
 *
 * @example
 * ```tsx
 * function SignupPage() {
 *   const { settings, isLoading } = usePublicAuthSettings();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <>
 *       {settings?.allowSocialLogin && (
 *         <FederatedAuthSection providers={settings.enabledProviders} />
 *       )}
 *       {settings?.allowPublicRegistration && (
 *         <EmailSignupForm />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
function usePublicAuthSettings() {
    const [settings, setSettings] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        let mounted = true;
        async function fetchSettings() {
            try {
                const response = await fetch('/api/auth/settings');
                if (!mounted)
                    return;
                if (!response.ok) {
                    throw new Error(`Failed to fetch auth settings: ${response.status}`);
                }
                const data = await response.json();
                if (data.success && data.data) {
                    // Map provider strings to FederatedProvider type
                    const providers = (data.data.enabledProviders || [])
                        .map((p) => PROVIDER_MAP[p.toLowerCase()])
                        .filter((p) => p !== undefined);
                    setSettings({
                        ...data.data,
                        enabledProviders: providers,
                    });
                }
                else {
                    setSettings(DEFAULT_SETTINGS);
                }
                setError(null);
            }
            catch (err) {
                if (!mounted)
                    return;
                console.warn('[usePublicAuthSettings] Failed to fetch settings:', err);
                setError(err instanceof Error ? err : new Error(String(err)));
                setSettings(DEFAULT_SETTINGS);
            }
            finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }
        fetchSettings();
        return () => {
            mounted = false;
        };
    }, []);
    return { settings, isLoading, error };
}
/**
 * Hook to check if social login is enabled.
 */
function useSocialLoginEnabled() {
    const { settings } = usePublicAuthSettings();
    return settings?.allowSocialLogin ?? false;
}
/**
 * Hook to check if public registration is enabled.
 */
function usePublicRegistrationEnabled() {
    const { settings } = usePublicAuthSettings();
    return settings?.allowPublicRegistration ?? true;
}
/**
 * Hook to check if password reset is enabled.
 */
function usePasswordResetEnabled() {
    const { settings } = usePublicAuthSettings();
    return settings?.enablePasswordReset ?? true;
}
