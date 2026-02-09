'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { getProviders } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthConfig, AuthMode, FederatedProvider } from '@/types/auth';

const AuthContext = createContext<AuthConfig | null>(null);

const defaultConfig: AuthConfig = {
  mode: 'traditional',
  providers: [],
  enableRecovery: true,
  enableEmailSignup: true,
  allowPasswordReset: true,
};

// Map NextAuth provider IDs to our FederatedProvider type
const PROVIDER_MAP: Record<string, FederatedProvider> = {
  'google': 'google',
  'apple': 'apple',
  'facebook': 'facebook',
  'github': 'github',
  'azure-ad': 'microsoft',
  'microsoft-entra-id': 'microsoft',
};

// OAuth providers we support in UI (excludes credentials)
const OAUTH_PROVIDER_IDS = ['google', 'apple', 'facebook', 'github', 'azure-ad', 'microsoft-entra-id'];

interface AuthProviderProps {
  children: ReactNode;
  config?: Partial<AuthConfig>;
  /**
   * If true, providers will be fetched dynamically from NextAuth
   * instead of using the static providers array from config.
   * Defaults to true for dynamic provider loading from IDP.
   */
  useDynamicProviders?: boolean;
}

export function AuthProvider({ children, config, useDynamicProviders = true }: AuthProviderProps) {
  const [dynamicProviders, setDynamicProviders] = useState<FederatedProvider[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(!useDynamicProviders);

  // Create QueryClient instance for React Query - used internally by MVP hooks
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  // Fetch dynamic providers from NextAuth on mount
  useEffect(() => {
    if (!useDynamicProviders) return;

    let mounted = true;

    async function fetchDynamicProviders() {
      try {
        const result = await getProviders();

        if (!mounted) return;

        if (result) {
          // Filter to OAuth providers only and map to FederatedProvider type
          const oauthProviders = Object.keys(result)
            .filter(id => OAUTH_PROVIDER_IDS.includes(id))
            .map(id => PROVIDER_MAP[id])
            .filter((p): p is FederatedProvider => p !== undefined);

          setDynamicProviders(oauthProviders);
        }
      } catch (err) {
        // Fall back to static config providers on error
      } finally {
        if (mounted) {
          setProvidersLoaded(true);
        }
      }
    }

    fetchDynamicProviders();

    return () => {
      mounted = false;
    };
  }, [useDynamicProviders]);

  // Determine final providers list
  const providers = useDynamicProviders && providersLoaded
    ? dynamicProviders
    : (config?.providers ?? defaultConfig.providers);

  const authConfig: AuthConfig = {
    ...defaultConfig,
    ...config,
    providers, // Override with dynamic providers if enabled
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authConfig}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export function useAuthConfig(): AuthConfig {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultConfig;
  }
  return context;
}

export function useAuthMode(): AuthMode {
  const config = useAuthConfig();
  return config.mode;
}

export function useFederatedProviders(): FederatedProvider[] {
  const config = useAuthConfig();
  return config.providers;
}

export function useFederatedAuthEnabled(): boolean {
  const config = useAuthConfig();
  return config.mode === 'federated' && config.providers.length > 0;
}

export function useTraditionalAuthEnabled(): boolean {
  const config = useAuthConfig();
  return config.mode === 'traditional';
}
