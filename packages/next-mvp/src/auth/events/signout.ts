/**
 * SignOut Event Handler
 *
 * Cleans up Redis session when user signs out.
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */

import type { JWT } from 'next-auth/jwt';
import { deleteSession } from '../../lib/session-store';

// ============================================================================
// SIGNOUT EVENT
// ============================================================================

/**
 * Handle user sign out by deleting Redis session.
 *
 * @param token - The JWT token containing the session ID
 */
export async function handleSignOut({ token }: { token: JWT | null }): Promise<void> {
  // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
  const redisSessionId = (token as any)?.sessionToken || (token as any)?.redisSessionId;

  if (redisSessionId) {
    try {
      await deleteSession(redisSessionId);
    } catch (error) {
      console.error('[SIGNOUT_EVENT] Failed to delete session:', error);
    }
  }
}
