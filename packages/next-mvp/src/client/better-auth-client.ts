/**
 * Better Auth Client (Phase 3)
 *
 * Drop-in replacement for next-auth/react hooks and functions.
 * Import from '@payez/next-mvp/client/better-auth-client'.
 *
 * Migration map:
 *   useSession()        → authClient.useSession()
 *   signIn('google')    → authClient.signIn.social({ provider: 'google' })
 *   signIn('credentials', {...}) → authClient.signIn.email({...})
 *   signOut()           → authClient.signOut()
 */

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // baseURL is derived from BETTER_AUTH_URL or window.location.origin
});

// Convenience exports matching NextAuth patterns
export const { useSession, signIn, signOut } = authClient;
