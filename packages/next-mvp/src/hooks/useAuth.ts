'use client';

/**
 * ⚠️ WARNING: This hook cannot be used directly from the @payez/next-mvp package!
 *
 * @deprecated Import this hook from your local app instead
 *
 * **Why?** React Context (SessionProvider) cannot cross package boundaries in file:// linked packages.
 *
 * **Solution:** Create a local version in your app (e.g., src/hooks/useAuth.ts) that imports standardizedApi:
 *
 * @example
 * ```typescript
 * // src/hooks/useAuth.ts (YOUR APP)
 * 'use client';
 * import { authClient } from '@payez/next-mvp/client/better-auth-client';
 * import { standardizedApi } from '@payez/next-mvp/lib/standardized-client-api';
 *
 * export function useAuth() {
 *   const { data: session } = useSession(); // Works in your app context
 *   // ... implementation
 * }
 * ```
 *
 * @see {@link https://github.com/payez/next-mvp/blob/main/docs/centralized-auth-api-pattern.md#why-local-hooks-for-auth Complete documentation}
 */

import { authClient } from '../client/better-auth-client';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { standardizedApi, ApiResult } from '../lib/standardized-client-api';

// Custom session type matching NextAuth structure
export interface CustomSession {
  user: {
    id: string;
    email: string;
    roles?: string[];
    twoFactorMethod?: string;
    twoFactorSessionVerified?: boolean;
    requiresTwoFactor?: boolean;
  };
  accessToken?: string;
  refreshToken?: string;
  expires: string;
  error?: string;
}

export interface UseAuthResult {
  session: CustomSession | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isLoading: boolean;
  isAuthenticated: boolean;
  // API helper that automatically includes the auth token
  apiCall: <T>(url: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any) => Promise<ApiResult<T>>;
}

export function useAuth(): UseAuthResult {
  const { data: sessionData, isPending } = authClient.useSession();
  const session = sessionData;
  const status = isPending ? 'loading' : session ? 'authenticated' : 'unauthenticated';
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!(session as any)?.accessToken;

  // Handle sign out with redirect
  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    router.push('/account-auth/login?error=SessionExpired');
  }, [router]);

  // API helper that automatically includes the auth token and uses standardized API
  const apiCall = useCallback(
    async <T>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Promise<ApiResult<T>> => {
      if (!(session as any)?.accessToken) {
        console.error('[useAuth] No access token available');
        throw new Error('Not authenticated');
      }

      try {
        // Use standardized API which handles token refresh and validates response format
        switch (method) {
          case 'GET':
            return await standardizedApi.get<T>(url, (session as any).accessToken!);
          case 'POST':
            return await standardizedApi.post<T>(url, data, (session as any).accessToken!);
          case 'PUT':
            return await standardizedApi.put<T>(url, data);
          case 'DELETE':
            return await standardizedApi.delete<T>(url);
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      } catch (error) {
        console.error('[useAuth] API call failed:', error);

        // standardizedApi handles token refresh internally, but if we still get auth errors, sign out
        if (error instanceof Error && error.message.includes('Authentication failed')) {
          console.warn('[useAuth] Authentication failed, signing out...');
          await handleSignOut();
        }

        throw error;
      }
    },
    [(session as any)?.accessToken, handleSignOut]
  );

  return {
    session: session as CustomSession | null,
    status,
    isLoading,
    isAuthenticated,
    apiCall
  };
}
