/**
 * Server-side auth utilities for Better Auth.
 *
 * All server-side auth flows go through the Better Auth instance returned by
 * getAuthInstance(); use getSession(req) for the request-scoped session.
 */

import 'server-only';
import { createBetterAuthInstance } from '../auth/better-auth';
import { getIDPClientConfig } from '../lib/idp-client-config';

let authInstance: ReturnType<typeof createBetterAuthInstance> | null = null;
let authInitPromise: Promise<ReturnType<typeof createBetterAuthInstance>> | null = null;

/**
 * Get the initialized Better Auth instance (singleton).
 */
export async function getAuthInstance() {
  if (authInstance) return authInstance;
  if (!authInitPromise) {
    authInitPromise = getIDPClientConfig(true).then(config => {
      authInstance = createBetterAuthInstance(config);
      return authInstance;
    });
  }
  return authInitPromise;
}

/**
 * Get the current session from a request.
 * Replaces getToken() and getServerSession().
 *
 * Returns the session object or null if not authenticated.
 */
export async function getSession(request?: Request): Promise<any> {
  const auth = await getAuthInstance();
  if (!request) return null;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.session?.token || !session?.user) return session;

    // Enrich with IDP tokens from Redis (stored by post-login hook)
    try {
      const { getRedis } = await import('../lib/redis');
      const { getAppSlug } = await import('../lib/app-slug');
      const baKey = `ba:${getAppSlug()}:${session.session.token}`;
      const baRaw = await getRedis().get(baKey);
      if (baRaw) {
        const baData = JSON.parse(baRaw);
        if (baData.idpTokens) {
          const u = session.user as any;
          u.roles = baData.idpTokens.roles || [];
          u.userId = baData.idpTokens.userId;
          u.idpAccessToken = baData.idpTokens.idpAccessToken;
          u.idpRefreshToken = baData.idpTokens.idpRefreshToken;
          u.idpAccessTokenExpires = baData.idpTokens.idpAccessTokenExpires;
        }
      }
    } catch { /* Redis unavailable */ }

    return session;
  } catch {
    return null;
  }
}

/**
 * Get the current session, throwing if not authenticated.
 * Use in API handlers that require auth.
 */
export async function requireSession(request: Request) {
  const session = await getSession(request);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
