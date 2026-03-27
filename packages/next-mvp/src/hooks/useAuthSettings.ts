/**
 * useAuthSettings Hook
 *
 * Client-side hook to access auth settings from the IDP config.
 * Settings are passed through the session from server-side config.
 */

'use client';

import { authClient } from '../client/better-auth-client';
import type { AuthSettings } from '../lib/idp-client-config';

/**
 * Extended session type that may include authSettings
 */
interface SessionWithAuthSettings {
    authSettings?: AuthSettings;
}

/**
 * Hook to access auth settings from the session.
 *
 * Auth settings are populated from IDP config on the server side
 * and included in the session for client-side access.
 *
 * @returns AuthSettings or null if not available
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const authSettings = useAuthSettings();
 *
 *   if (authSettings?.require2FA) {
 *     return <TwoFactorPrompt />;
 *   }
 *
 *   return <Dashboard />;
 * }
 * ```
 */
export function useAuthSettings(): AuthSettings | null {
    const { data: session } = authClient.useSession();

    if (!session) {
        return null;
    }

    // Auth settings are included in the session from server-side config
    const sessionWithSettings = session as unknown as SessionWithAuthSettings;
    return sessionWithSettings.authSettings || null;
}

/**
 * Hook to check if 2FA is required based on auth settings.
 *
 * @returns boolean indicating if 2FA is required
 */
export function useRequires2FA(): boolean {
    const authSettings = useAuthSettings();
    return authSettings?.require2FA ?? true; // Default to true for security
}

/**
 * Hook to get allowed 2FA methods.
 *
 * @returns Array of allowed 2FA method strings (e.g., ['email', 'sms', 'totp'])
 */
export function useAllowed2FAMethods(): string[] {
    const authSettings = useAuthSettings();
    return authSettings?.allowed2FAMethods ?? ['email', 'sms'];
}

/**
 * Hook to get session timeout settings.
 *
 * @returns Object with session and idle timeout minutes
 */
export function useSessionTimeouts(): { sessionTimeoutMinutes: number; idleTimeoutMinutes: number } {
    const authSettings = useAuthSettings();
    return {
        sessionTimeoutMinutes: authSettings?.sessionTimeoutMinutes ?? 60,
        idleTimeoutMinutes: authSettings?.idleTimeoutMinutes ?? 15,
    };
}

/**
 * Hook to check if remember me is allowed.
 *
 * @returns Object with allowRememberMe flag and rememberMeDays
 */
export function useRememberMeSettings(): { allowRememberMe: boolean; rememberMeDays: number } {
    const authSettings = useAuthSettings();
    return {
        allowRememberMe: authSettings?.allowRememberMe ?? true,
        rememberMeDays: authSettings?.rememberMeDays ?? 30,
    };
}
