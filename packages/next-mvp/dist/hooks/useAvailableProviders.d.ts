/**
 * useAvailableProviders Hook
 *
 * Returns the list of OAuth providers configured for this client.
 * Ensures UI only shows buttons for providers that are enabled in IDP.
 */
import type { FederatedProvider } from '../types/auth';
export interface UseAvailableProvidersResult {
    providers: FederatedProvider[];
    isLoading: boolean;
    error: Error | null;
    rawProviders: Record<string, any> | null;
}
/**
 * Hook to get available federated OAuth providers.
 *
 * Returns only the providers that are enabled in IDP config.
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
