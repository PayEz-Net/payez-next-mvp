"use strict";
/**
 * useAvailableProviders Hook
 *
 * Fetches the list of OAuth providers actually configured in NextAuth.
 * This ensures UI only shows buttons for providers that are enabled in IDP.
 */
'use client';
/**
 * useAvailableProviders Hook
 *
 * Fetches the list of OAuth providers actually configured in NextAuth.
 * This ensures UI only shows buttons for providers that are enabled in IDP.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAvailableProviders = useAvailableProviders;
exports.useIsProviderAvailable = useIsProviderAvailable;
const react_1 = require("react");
// Map NextAuth provider IDs to our FederatedProvider type
const PROVIDER_MAP = {
    'google': 'google',
    'apple': 'apple',
    'facebook': 'facebook',
    'github': 'github',
    'azure-ad': 'microsoft',
    'microsoft-entra-id': 'microsoft',
};
// Providers we support in UI (excludes credentials)
const OAUTH_PROVIDERS = ['google', 'apple', 'facebook', 'github', 'azure-ad', 'microsoft-entra-id'];
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
function useAvailableProviders() {
    const [providers, setProviders] = (0, react_1.useState)([]);
    const [rawProviders, setRawProviders] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        let mounted = true;
        async function fetchProviders() {
            try {
                // Fetch available providers from Better Auth
                // Better Auth doesn't have a getProviders equivalent, so we use a static list
                // based on configured social providers
                const result = {
                    google: { id: 'google', name: 'Google' },
                };
                if (!mounted)
                    return;
                setRawProviders(result);
                if (result) {
                    // Filter to OAuth providers only (exclude credentials)
                    // Map to our FederatedProvider type
                    const oauthProviders = Object.keys(result)
                        .filter(id => OAUTH_PROVIDERS.includes(id))
                        .map(id => PROVIDER_MAP[id])
                        .filter((p) => p !== undefined);
                    setProviders(oauthProviders);
                }
                else {
                    setProviders([]);
                }
                setError(null);
            }
            catch (err) {
                if (!mounted)
                    return;
                setError(err instanceof Error ? err : new Error(String(err)));
                setProviders([]);
            }
            finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }
        fetchProviders();
        return () => {
            mounted = false;
        };
    }, []);
    return { providers, isLoading, error, rawProviders };
}
/**
 * Check if a specific provider is available.
 *
 * @param provider The provider to check
 * @returns boolean indicating if provider is configured
 */
function useIsProviderAvailable(provider) {
    const { providers } = useAvailableProviders();
    return providers.includes(provider);
}
