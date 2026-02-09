export type MinimalSession = {
  user?: {
    id?: string | null;
    email?: string | null;
  } | null;
  accessToken?: string | null;
  expires?: string;
  [k: string]: any;
};

// AppSession is used by authStore - alias to MinimalSession for compatibility
export type AppSession = MinimalSession;

/**
 * Strict session validation for client-side guards.
 * A session is considered valid when:
 * - a user object exists with non-empty id and email
 * - an accessToken string exists
 */
export function isValidSession(session: MinimalSession | null | undefined): boolean {
  if (!session) return false;
  const u = session.user as any;
  const hasUser = !!u && typeof u.id === 'string' && u.id.length > 0 && typeof u.email === 'string' && u.email.length > 0;
  const hasAccessToken = typeof session.accessToken === 'string' && session.accessToken.length > 0;
  return hasUser && hasAccessToken;
}

/**
 * Sanitize session data - returns null if session is invalid
 */
export function sanitizeSession(session: MinimalSession | null | undefined): MinimalSession | null {
  if (!isValidSession(session)) return null;
  return session as MinimalSession;
}
