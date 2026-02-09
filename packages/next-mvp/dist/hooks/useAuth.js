"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = useAuth;
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
 * import { useSession } from 'next-auth/react';
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
const react_1 = require("next-auth/react");
const react_2 = require("react");
const navigation_1 = require("next/navigation");
const standardized_client_api_1 = require("../lib/standardized-client-api");
function useAuth() {
    const { data: session, status } = (0, react_1.useSession)();
    const router = (0, navigation_1.useRouter)();
    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated' && !!session?.accessToken;
    // Handle sign out with redirect
    const handleSignOut = (0, react_2.useCallback)(async () => {
        await (0, react_1.signOut)({ redirect: false });
        router.push('/account-auth/login?error=SessionExpired');
    }, [router]);
    // API helper that automatically includes the auth token and uses standardized API
    const apiCall = (0, react_2.useCallback)(async (url, method = 'GET', data) => {
        if (!session?.accessToken) {
            console.error('[useAuth] No access token available');
            throw new Error('Not authenticated');
        }
        try {
            // Use standardized API which handles token refresh and validates response format
            switch (method) {
                case 'GET':
                    return await standardized_client_api_1.standardizedApi.get(url, session.accessToken);
                case 'POST':
                    return await standardized_client_api_1.standardizedApi.post(url, data, session.accessToken);
                case 'PUT':
                    return await standardized_client_api_1.standardizedApi.put(url, data);
                case 'DELETE':
                    return await standardized_client_api_1.standardizedApi.delete(url);
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }
        }
        catch (error) {
            console.error('[useAuth] API call failed:', error);
            // standardizedApi handles token refresh internally, but if we still get auth errors, sign out
            if (error instanceof Error && error.message.includes('Authentication failed')) {
                console.warn('[useAuth] Authentication failed, signing out...');
                await handleSignOut();
            }
            throw error;
        }
    }, [session?.accessToken, handleSignOut]);
    return {
        session: session,
        status,
        isLoading,
        isAuthenticated,
        apiCall
    };
}
