'use client';

/**
 * ⚠️ WARNING: This hook cannot be used directly from the @payez/next-mvp package!
 *
 * @deprecated Import this hook from your local app instead
 *
 * **Why?** This hook depends on useAuth, which requires SessionProvider context that cannot cross package boundaries.
 *
 * **Solution:** Create a local version in your app (e.g., src/hooks/useProfile.ts):
 *
 * @example
 * ```typescript
 * // src/hooks/useProfile.ts (YOUR APP)
 * 'use client';
 * import { useQuery } from '@tanstack/react-query';
 * import { useAuth } from './useAuth'; // Your local useAuth
 * import { isApiSuccess } from '@payez/next-mvp/lib/standardized-client-api';
 *
 * export function useProfile() {
 *   const { isAuthenticated, apiCall } = useAuth();
 *   return useQuery({
 *     queryKey: ['account', 'profile'],
 *     enabled: isAuthenticated,
 *     queryFn: async () => {
 *       const result = await apiCall('/api/account/profile', 'GET');
 *       if (isApiSuccess(result)) return result.data;
 *       throw new Error(result.message);
 *     }
 *   });
 * }
 * ```
 *
 * @see {@link https://github.com/payez/next-mvp/blob/main/docs/centralized-auth-api-pattern.md#usage-patterns Complete documentation}
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { isApiSuccess, isApiError } from '../lib/standardized-client-api';

export type ProfileResponse = {
  email: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone_number?: string;
  email_confirmed?: boolean;
  phone_confirmed?: boolean;
  two_factor_enabled?: boolean;
  roles?: string[];
  contact_information?: Record<string, any>;
  [key: string]: any;
};

export function useProfile() {
  const { isAuthenticated, apiCall } = useAuth();

  return useQuery<ProfileResponse, Error>({
    queryKey: ['account', 'profile'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const result = await apiCall<ProfileResponse>('/api/account/profile', 'GET');
      if (isApiSuccess(result)) {
        return result.data;
      }
      // If API returned standardized error
      if (isApiError(result)) {
        throw new Error(result.message || 'Failed to load profile');
      }
      throw new Error('Failed to load profile');
    },
    staleTime: 5 * 60 * 1000,
  });
}
