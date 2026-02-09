"use strict";
/**
 * SignOut Event Handler
 *
 * Cleans up Redis session when user signs out.
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSignOut = handleSignOut;
const session_store_1 = require("../../lib/session-store");
// ============================================================================
// SIGNOUT EVENT
// ============================================================================
/**
 * Handle user sign out by deleting Redis session.
 *
 * @param token - The JWT token containing the session ID
 */
async function handleSignOut({ token }) {
    // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
    const redisSessionId = token?.sessionToken || token?.redisSessionId;
    if (redisSessionId) {
        try {
            await (0, session_store_1.deleteSession)(redisSessionId);
        }
        catch (error) {
            console.error('[SIGNOUT_EVENT] Failed to delete session:', error);
        }
    }
}
