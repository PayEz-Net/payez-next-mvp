/**
 * useAuthSettings Hook
 *
 * Client-side hook to access auth settings from the IDP config.
 * Settings are passed through the session from server-side config.
 */
import type { AuthSettings } from '../lib/idp-client-config';
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
export declare function useAuthSettings(): AuthSettings | null;
/**
 * Hook to check if 2FA is required based on auth settings.
 *
 * @returns boolean indicating if 2FA is required
 */
export declare function useRequires2FA(): boolean;
/**
 * Hook to get allowed 2FA methods.
 *
 * @returns Array of allowed 2FA method strings (e.g., ['email', 'sms', 'totp'])
 */
export declare function useAllowed2FAMethods(): string[];
/**
 * Hook to get session timeout settings.
 *
 * @returns Object with session and idle timeout minutes
 */
export declare function useSessionTimeouts(): {
    sessionTimeoutMinutes: number;
    idleTimeoutMinutes: number;
};
/**
 * Hook to check if remember me is allowed.
 *
 * @returns Object with allowRememberMe flag and rememberMeDays
 */
export declare function useRememberMeSettings(): {
    allowRememberMe: boolean;
    rememberMeDays: number;
};
