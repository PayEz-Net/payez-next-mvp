/**
 * Better Auth Client (Phase 3)
 *
 * Drop-in replacement for next-auth/react hooks and functions.
 * Import from '@payez/next-mvp/client/better-auth-client'.
 *
 * Includes useSessionCompat() — returns NextAuth-shaped { data, status }
 * so existing components don't need destructure pattern changes.
 */

import { createAuthClient } from 'better-auth/react';
import { useMemo } from 'react';

export const authClient = createAuthClient({
  // baseURL derived from BETTER_AUTH_URL or window.location.origin
});

// Convenience exports
export const { useSession, signIn, signOut } = authClient;

/**
 * NextAuth-compatible useSession wrapper.
 *
 * Maps Better Auth's { data, error, isPending } to NextAuth's { data, status, update }.
 * Drop-in replacement — no destructure changes needed in consuming components.
 */
export function useSessionCompat() {
  const baSession = authClient.useSession();

  const status = useMemo(() => {
    if (baSession.isPending) return 'loading' as const;
    if (baSession.data) return 'authenticated' as const;
    return 'unauthenticated' as const;
  }, [baSession.isPending, baSession.data]);

  // Map Better Auth session shape to NextAuth session shape
  const data = useMemo(() => {
    if (!baSession.data) return null;
    return {
      ...baSession.data,
      user: baSession.data.user,
      expires: '', // Better Auth handles expiry differently
    };
  }, [baSession.data]);

  return {
    data,
    status,
    update: async () => {
      // Better Auth doesn't have a direct "refresh session" call.
      // Force refetch by invalidating the query.
      // TODO: Wire to proper session refresh when available.
      return data;
    },
  };
}

/**
 * NextAuth-compatible signOut wrapper.
 *
 * Maps NextAuth signOut({ redirect, callbackUrl }) to Better Auth.
 */
export async function signOutCompat(options?: { redirect?: boolean; callbackUrl?: string }) {
  await authClient.signOut();
  if (options?.redirect !== false && options?.callbackUrl) {
    window.location.href = options.callbackUrl;
  }
}
