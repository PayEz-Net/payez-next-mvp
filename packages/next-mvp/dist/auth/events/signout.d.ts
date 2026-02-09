/**
 * SignOut Event Handler
 *
 * Cleans up Redis session when user signs out.
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */
import type { JWT } from 'next-auth/jwt';
/**
 * Handle user sign out by deleting Redis session.
 *
 * @param token - The JWT token containing the session ID
 */
export declare function handleSignOut({ token }: {
    token: JWT | null;
}): Promise<void>;
