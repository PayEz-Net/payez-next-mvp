/**
 * Server-side auth utilities for Better Auth (v4.0)
 *
 * Replaces:
 * - getToken() from next-auth/jwt
 * - getServerSession() from next-auth
 *
 * All server-side auth flows go through the Better Auth instance.
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
    authInitPromise = getIDPClientConfig().then(config => {
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
