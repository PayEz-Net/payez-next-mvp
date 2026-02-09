/**
 * useAvailableProviders Hook
 *
 * Fetches the list of OAuth providers actually configured in NextAuth.
 * This ensures UI only shows buttons for providers that are enabled in IDP.
 */
import { LiteralUnion, ClientSafeProvider } from 'next-auth/react';
import { BuiltInProviderType } from 'next-auth/providers/index';
import type { FederatedProvider } from '../types/auth';
export interface UseAvailableProvidersResult {
    providers: FederatedProvider[];
    isLoading: boolean;
    error: Error | null;
    rawProviders: Record<LiteralUnion<BuiltInProviderType>, ClientSafeProvider> | null;
}
/**
 * Hook to get available OAuth providers from NextAuth.
 *
 * Returns only the providers that are actually configured in auth-options,
 * which reflects what's enabled in IDP config.
 *
 * @example
 * ```tsx
 * function SignupPage() {
 *   const { providers, isLoading } = useAvailableProviders();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <FederatedAuthSection
 *       providers={providers}
 *       onProviderClick={handleClick}
 *     />
 *   );
 * }
 * ```
 */
export declare function useAvailableProviders(): UseAvailableProvidersResult;
/**
 * Check if a specific provider is available.
 *
 * @param provider The provider to check
 * @returns boolean indicating if provider is configured
 */
export declare function useIsProviderAvailable(provider: FederatedProvider): boolean;
