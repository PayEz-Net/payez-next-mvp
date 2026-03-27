"use strict";
/**
 * useAuthSettings Hook
 *
 * Client-side hook to access auth settings from the IDP config.
 * Settings are passed through the session from server-side config.
 */
'use client';
/**
 * useAuthSettings Hook
 *
 * Client-side hook to access auth settings from the IDP config.
 * Settings are passed through the session from server-side config.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthSettings = useAuthSettings;
exports.useRequires2FA = useRequires2FA;
exports.useAllowed2FAMethods = useAllowed2FAMethods;
exports.useSessionTimeouts = useSessionTimeouts;
exports.useRememberMeSettings = useRememberMeSettings;
const better_auth_client_1 = require("../client/better-auth-client");
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
function useAuthSettings() {
    const { data: session } = better_auth_client_1.authClient.useSession();
    if (!session) {
        return null;
    }
    // Auth settings are included in the session from server-side config
    const sessionWithSettings = session;
    return sessionWithSettings.authSettings || null;
}
/**
 * Hook to check if 2FA is required based on auth settings.
 *
 * @returns boolean indicating if 2FA is required
 */
function useRequires2FA() {
    const authSettings = useAuthSettings();
    return authSettings?.require2FA ?? true; // Default to true for security
}
/**
 * Hook to get allowed 2FA methods.
 *
 * @returns Array of allowed 2FA method strings (e.g., ['email', 'sms', 'totp'])
 */
function useAllowed2FAMethods() {
    const authSettings = useAuthSettings();
    return authSettings?.allowed2FAMethods ?? ['email', 'sms'];
}
/**
 * Hook to get session timeout settings.
 *
 * @returns Object with session and idle timeout minutes
 */
function useSessionTimeouts() {
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
function useRememberMeSettings() {
    const authSettings = useAuthSettings();
    return {
        allowRememberMe: authSettings?.allowRememberMe ?? true,
        rememberMeDays: authSettings?.rememberMeDays ?? 30,
    };
}
