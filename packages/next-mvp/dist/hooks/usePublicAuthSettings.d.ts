/**
 * usePublicAuthSettings Hook
 *
 * Fetches public auth settings for pre-login pages (signup, login).
 * Does NOT require authentication - settings are fetched via API.
 */
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
export declare function usePublicAuthSettings(): UsePublicAuthSettingsResult;
/**
 * Hook to check if social login is enabled.
 */
export declare function useSocialLoginEnabled(): boolean;
/**
 * Hook to check if public registration is enabled.
 */
export declare function usePublicRegistrationEnabled(): boolean;
/**
 * Hook to check if password reset is enabled.
 */
export declare function usePasswordResetEnabled(): boolean;
