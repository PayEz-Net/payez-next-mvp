/**
 * Hook to detect and handle stale/expired sessions during 2FA flow
 *
 * Use this in verify-code pages to automatically redirect to login
 * when the provisional bearer token has expired.
 *
 * @example
 * ```tsx
 * import { useSessionExpiration } from '@payez/next-mvp/hooks/useSessionExpiration';
 *
 * function VerifyCodePage() {
 *   const { data: session } = useSession();
 *   const router = useRouter();
 *   const searchParams = useSearchParams();
 *   const [error, setError] = useState<string | null>(null);
 *
 *   const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
 *
 *   // Automatically handles session expiration
 *   const sessionValid = useSessionExpiration({
 *     session,
 *     router,
 *     callbackUrl,
 *     onExpired: (message) => setError(message)
 *   });
 *
 *   if (!sessionValid) return null; // Will redirect
 *   // ... rest of component
 * }
 * ```
 */

import { useEffect } from 'react';
import { authClient } from '../client/better-auth-client';

export interface UseSessionExpirationOptions {
  /** Session object */
  session: any | null | undefined;
  /** Next.js router for navigation */
  router: {
    push: (url: string) => void;
  };
  /** URL to redirect to after login */
  callbackUrl?: string;
  /** Callback when session expires - use to set error state */
  onExpired?: (message: string) => void;
  /** Delay before redirect in milliseconds (default: 1500) */
  redirectDelay?: number;
  /** Custom redirect URL (default: /account-auth/login) */
  loginUrl?: string;
}

/**
 * Detects stale sessions and redirects to login
 *
 * Returns:
 * - `true` if session is valid (has accessToken)
 * - `false` if session is loading (no session yet)
 * - `null` if session is stale (will trigger redirect)
 */
export function useSessionExpiration({
  session,
  router,
  callbackUrl = '/dashboard',
  onExpired,
  redirectDelay = 1500,
  loginUrl = '/account-auth/login'
}: UseSessionExpirationOptions): boolean | null {
  useEffect(() => {
    // If session exists but no accessToken, the token is stale/expired
    if (session && !(session as any).accessToken) {
      const message = 'Your session has expired. Redirecting to login...';
      if (onExpired) {
        onExpired(message);
      }

      setTimeout(async () => {
        // Clear the session before redirecting
        await authClient.signOut();

        const params = new URLSearchParams({
          callbackUrl,
          error: 'SessionExpired'
        });

        router.push(`${loginUrl}?${params.toString()}`);
      }, redirectDelay);
    }
  }, [session, router, callbackUrl, onExpired, redirectDelay, loginUrl]);

  // Return session validity state
  if (session && !(session as any).accessToken) {
    return null; // Stale session - will redirect
  }

  if ((session as any)?.accessToken) {
    return true; // Valid session
  }

  return false; // No session yet - loading
}
