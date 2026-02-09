"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProfile = useProfile;
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
const react_query_1 = require("@tanstack/react-query");
const useAuth_1 = require("./useAuth");
const standardized_client_api_1 = require("../lib/standardized-client-api");
function useProfile() {
    const { isAuthenticated, apiCall } = (0, useAuth_1.useAuth)();
    return (0, react_query_1.useQuery)({
        queryKey: ['account', 'profile'],
        enabled: isAuthenticated,
        queryFn: async () => {
            const result = await apiCall('/api/account/profile', 'GET');
            if ((0, standardized_client_api_1.isApiSuccess)(result)) {
                return result.data;
            }
            // If API returned standardized error
            if ((0, standardized_client_api_1.isApiError)(result)) {
                throw new Error(result.message || 'Failed to load profile');
            }
            throw new Error('Failed to load profile');
        },
        staleTime: 5 * 60 * 1000,
    });
}
