/**
 * usePublicAuthSettings Hook
 *
 * Fetches public auth settings for pre-login pages (signup, login).
 * Does NOT require authentication - settings are fetched via API.
 */

'use client';

import { useState, useEffect } from 'react';
import type { FederatedProvider } from '../types/auth';

export interface PublicAuthSettings {
    enabledProviders: FederatedProvider[];
    allowPublicRegistration: boolean;
    allowSocialLogin: boolean;
    enablePasswordReset: boolean;
    require2FA: boolean;
    allowed2FAMethods: string[];
}

export interface UsePublicAuthSettingsResult {
    settings: PublicAuthSettings | null;
    isLoading: boolean;
    error: Error | null;
}

// Map provider strings to FederatedProvider type
const PROVIDER_MAP: Record<string, FederatedProvider> = {
    'google': 'google',
    'apple': 'apple',
    'facebook': 'facebook',
    'github': 'github',
    'microsoft': 'microsoft',
    'azure-ad': 'microsoft',
};

const DEFAULT_SETTINGS: PublicAuthSettings = {
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
export function usePublicAuthSettings(): UsePublicAuthSettingsResult {
    const [settings, setSettings] = useState<PublicAuthSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;

        async function fetchSettings() {
            try {
                const response = await fetch('/api/auth/settings');

                if (!mounted) return;

                if (!response.ok) {
                    throw new Error(`Failed to fetch auth settings: ${response.status}`);
                }

                const data = await response.json();

                if (data.success && data.data) {
                    // Map provider strings to FederatedProvider type
                    const providers = (data.data.enabledProviders || [])
                        .map((p: string) => PROVIDER_MAP[p.toLowerCase()])
                        .filter((p: FederatedProvider | undefined): p is FederatedProvider => p !== undefined);

                    setSettings({
                        ...data.data,
                        enabledProviders: providers,
                    });
                } else {
                    setSettings(DEFAULT_SETTINGS);
                }

                setError(null);
            } catch (err) {
                if (!mounted) return;
                console.warn('[usePublicAuthSettings] Failed to fetch settings:', err);
                setError(err instanceof Error ? err : new Error(String(err)));
                setSettings(DEFAULT_SETTINGS);
            } finally {
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
export function useSocialLoginEnabled(): boolean {
    const { settings } = usePublicAuthSettings();
    return settings?.allowSocialLogin ?? false;
}

/**
 * Hook to check if public registration is enabled.
 */
export function usePublicRegistrationEnabled(): boolean {
    const { settings } = usePublicAuthSettings();
    return settings?.allowPublicRegistration ?? true;
}

/**
 * Hook to check if password reset is enabled.
 */
export function usePasswordResetEnabled(): boolean {
    const { settings } = usePublicAuthSettings();
    return settings?.enablePasswordReset ?? true;
}
